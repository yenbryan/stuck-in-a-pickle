#!/usr/bin/env node
/**
 * Turn a supplied logo into the site's brand assets.
 *
 * Drop the artwork at src/assets/brand/logo.png (or .webp/.jpg) and run
 * `npm run brand`. This script:
 *
 *   1. knocks out a flat white background, flood-filling inward from the edges
 *      so that white *inside* the drawing — eyes, glass highlights — survives;
 *   2. trims to the artwork, so the logo sits flush in the masthead lockup
 *      rather than floating in a box of its own padding;
 *   3. writes the favicon and touch icon, matted on the site's paper colour
 *      with the same corner radius, since a transparent favicon disappears
 *      against a dark browser tab.
 *
 * It is idempotent: an already-transparent, already-trimmed logo passes through
 * with only the icons regenerated.
 */
import { readdir, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const BRAND_DIR = 'src/assets/brand';
const PAPER = { r: 0xf4, g: 0xef, b: 0xe1 };
const WHITE_CUTOFF = 232; // channel value at or above which a pixel counts as background
const PAD = 4; // breathing room kept around the artwork, in source pixels

if (!existsSync(BRAND_DIR)) {
  console.error(`No ${BRAND_DIR}/ — create it and add logo.png, then run this again.`);
  process.exit(1);
}

const found = (await readdir(BRAND_DIR)).find((f) => /^logo\.(png|webp|jpe?g|avif)$/i.test(f));
if (!found) {
  console.error(`No logo found. Save the artwork as ${BRAND_DIR}/logo.png and run this again.`);
  process.exit(1);
}

const src = path.join(BRAND_DIR, found);
const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: W, height: H } = info;
const at = (x, y) => (y * W + x) * 4;

// --- 1. knock out the background, reaching in only from the edges ---------
const isBackgroundish = (i) =>
  data[i + 3] > 8 &&
  data[i] >= WHITE_CUTOFF &&
  data[i + 1] >= WHITE_CUTOFF &&
  data[i + 2] >= WHITE_CUTOFF;

const seen = new Uint8Array(W * H);
const queue = [];
for (let x = 0; x < W; x++) {
  queue.push([x, 0], [x, H - 1]);
}
for (let y = 0; y < H; y++) {
  queue.push([0, y], [W - 1, y]);
}

let cleared = 0;
while (queue.length) {
  const [x, y] = queue.pop();
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const p = y * W + x;
  if (seen[p]) continue;
  seen[p] = 1;
  const i = p * 4;
  if (!isBackgroundish(i)) continue;
  data[i + 3] = 0;
  cleared++;
  queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

// --- 2. trim to what is actually drawn ------------------------------------
let top = H;
let left = W;
let bottom = -1;
let right = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (data[at(x, y)] !== undefined && data[at(x, y) + 3] > 16) {
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
}
if (bottom < 0) {
  console.error('The logo appears to be entirely background. Nothing written.');
  process.exit(1);
}

left = Math.max(0, left - PAD);
top = Math.max(0, top - PAD);
right = Math.min(W - 1, right + PAD);
bottom = Math.min(H - 1, bottom + PAD);
const cropW = right - left + 1;
const cropH = bottom - top + 1;

const logo = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left, top, width: cropW, height: cropH })
  .png({ compressionLevel: 9 })
  .toBuffer();

const outLogo = path.join(BRAND_DIR, 'logo.png');
await writeFile(outLogo, logo);
if (found !== 'logo.png') await unlink(src);

console.log(`logo    ${W}x${H} → ${cropW}x${cropH}  (${cleared.toLocaleString()} background px knocked out)`);

// --- 3. icons, matted on paper so they survive a dark tab bar -------------
async function icon(size, out, radiusRatio = 0.2) {
  const r = Math.round(size * radiusRatio);
  const inset = Math.round(size * 0.055);
  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <rect width="${size}" height="${size}" rx="${r}" fill="rgb(${PAPER.r},${PAPER.g},${PAPER.b})"/>
     </svg>`,
  );
  const art = await sharp(logo)
    .resize(size - inset * 2, size - inset * 2, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp(tile).composite([{ input: art, gravity: 'center' }]).png().toFile(out);
  console.log(`icon    ${out} (${size}px)`);
}

await icon(64, 'public/favicon.png');
await icon(180, 'public/apple-touch-icon.png');

// An SVG favicon keeps the crisp-at-any-size link in BaseLayout working; the
// artwork is raster, so it rides along as a data URI.
const embedded = await sharp(logo).resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
await writeFile(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Stuck in a Pickle">
  <rect width="64" height="64" rx="13" fill="#F4EFE1"/>
  <image x="3.5" y="3.5" width="57" height="57" href="data:image/png;base64,${embedded.toString('base64')}"/>
</svg>\n`,
);
console.log('icon    public/favicon.svg');
console.log('\nDone. The masthead picks the logo up automatically — run `npm run build`.');
