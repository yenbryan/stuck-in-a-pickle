#!/usr/bin/env node
/**
 * Trim the blank margin off comic artwork.
 *
 * The generated art arrives with an uneven 6-14px band of paper around the
 * drawn panel frame. Presented on the site that band shows up as a second,
 * wobbly border sitting just outside the comic's own black frame — and since
 * each comic's paper is a slightly different cream, it also reads as a colour
 * patch that changes from story to story.
 *
 * Cropping to the ink means the drawn frame *is* the image edge, so the comic
 * needs no border of its own and sits flush at every size.
 *
 * It also normalises artwork to WebP, so a PNG dropped in here comes out as a
 * WebP that astro:assets can work from.
 *
 * Finally it burns the site's address into the bottom-right corner. Comics get
 * screenshotted and reposted far more than they get linked, so the credit has
 * to live in the pixels or the traffic goes to whoever reposted it. A manifest
 * records which files have been credited so re-running never double-stamps.
 *
 * Run it after adding artwork:  npm run trim
 * It is idempotent — already-prepared files are skipped.
 */
import { readdir, rename, unlink, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIR = 'src/assets/comics';
const MANIFEST = 'scripts/.credited.json';
const CREDIT = 'stuckinapickle.com';
const INK_LUMA = 110; // anything darker than this counts as drawn line work
const KEEP = 2; // leave a hairline so we never shave the frame itself
const TOLERANCE = 3; // margins this small are already flush

async function inkBounds(file) {
  const image = sharp(file);
  const { width, height } = await image.metadata();
  const { data, info } = await image
    .clone()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const dark = (x, y) => data[y * w + x] < INK_LUMA;
  const rowHasInk = (y) => {
    for (let x = 0; x < w; x += 2) if (dark(x, y)) return true;
    return false;
  };
  const colHasInk = (x) => {
    for (let y = 0; y < h; y += 2) if (dark(x, y)) return true;
    return false;
  };

  let top = 0;
  while (top < h && !rowHasInk(top)) top++;
  let bottom = h - 1;
  while (bottom > top && !rowHasInk(bottom)) bottom--;
  let left = 0;
  while (left < w && !colHasInk(left)) left++;
  let right = w - 1;
  while (right > left && !colHasInk(right)) right--;

  return { width, height, top, left, bottom: h - 1 - bottom, right: w - 1 - right, w, h };
}

/** Burn the site address into the bottom-right corner of the artwork. */
async function credit(buffer) {
  const { width, height } = await sharp(buffer).metadata();
  // Scale with the art so it looks the same on a 600px strip and a 1400px grid.
  const size = Math.max(15, Math.round(width * 0.0155));
  const pad = Math.round(size * 1.15);
  const label = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
       <text x="${width - pad}" y="${height - pad}" text-anchor="end"
             font-family="Helvetica, Arial, sans-serif" font-size="${size}"
             font-weight="700" letter-spacing="${size * 0.02}"
             fill="#15180E" fill-opacity="0.62"
             stroke="#FFFDF5" stroke-opacity="0.75" stroke-width="${size * 0.28}"
             paint-order="stroke">${CREDIT}</text>
     </svg>`,
  );
  return sharp(buffer).composite([{ input: label, top: 0, left: 0 }]).webp({ quality: 92, effort: 6 }).toBuffer();
}

const credited = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};

const files = (await readdir(DIR)).filter((f) => /\.(webp|png|jpe?g|avif)$/i.test(f));
let trimmed = 0;
let stamped = 0;

for (const name of files) {
  const file = path.join(DIR, name);
  const isWebp = /\.webp$/i.test(name);
  const b = await inkBounds(file);
  const margin = Math.max(b.top, b.right, b.bottom, b.left);

  const outNameEarly = name.replace(/\.[^.]+$/, '.webp');

  if (margin <= TOLERANCE && isWebp && credited[outNameEarly]) {
    console.log(`  skip  ${name} — already prepared`);
    continue;
  }

  // Nothing to trim, but the credit has not been burned in yet.
  if (margin <= TOLERANCE && isWebp) {
    await writeFile(file, await credit(await readFile(file)));
    credited[name] = true;
    stamped++;
    console.log(`  credit ${name} — flush already, address added`);
    continue;
  }

  const left = Math.max(0, b.left - KEEP);
  const top = Math.max(0, b.top - KEEP);
  const width = Math.min(b.w - left, b.w - left - Math.max(0, b.right - KEEP));
  const height = Math.min(b.h - top, b.h - top - Math.max(0, b.bottom - KEEP));

  // Always emit WebP, whatever came in. Writing WebP bytes into a .png name
  // would leave a file whose extension lies about its contents.
  const outName = name.replace(/\.[^.]+$/, '.webp');
  const out = path.join(DIR, outName);
  const tmp = `${out}.trimming`;

  const cropped = await sharp(file).extract({ left, top, width, height }).webp({ quality: 92, effort: 6 }).toBuffer();
  await writeFile(tmp, credited[outName] ? cropped : await credit(cropped));
  await rename(tmp, out);
  if (out !== file) await unlink(file);
  if (!credited[outName]) stamped++;
  credited[outName] = true;

  trimmed++;
  const converted = out === file ? '' : `  [${path.extname(name)} → .webp]`;
  console.log(
    `  trim  ${outName} — ${b.w}x${b.h} → ${width}x${height}  (T${b.top} R${b.right} B${b.bottom} L${b.left})${converted}`,
  );
}

await writeFile(MANIFEST, JSON.stringify(credited, null, 2) + '\n');
console.log(`\n${trimmed} trimmed, ${stamped} credited, ${files.length - trimmed} already prepared.`);
