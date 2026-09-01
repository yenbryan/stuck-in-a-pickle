import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Story } from '../../types/story';
import { getAllStories, hasComicArtwork } from '../../utils/stories';

/**
 * The social card for a comic.
 *
 * Shrinking a whole four-panel grid into a 1.91:1 preview produces unreadable
 * grey mush in a feed, which is the difference between a shared link getting
 * clicked and getting scrolled past. So the card shows the *opening* of the
 * comic at a size where the lettering still reads: the top band for a panel
 * grid, the left end for a wide strip. The platform renders the headline as
 * text beside it, so the image does not need to repeat it.
 *
 * Built statically, one JPEG per comic — social crawlers are least fussy about
 * JPEG, and several still refuse WebP.
 */

const CARD_W = 1200;
const CARD_H = 630;
const CARD_ASPECT = CARD_W / CARD_H;
const COMICS_DIR = 'src/assets/comics';
const LOGO = 'src/assets/brand/logo.png';
const PAPER = { r: 0xf4, g: 0xef, b: 0xe1, alpha: 1 };

export async function getStaticPaths() {
  const stories = await getAllStories();
  return stories
    .filter((story) => hasComicArtwork(story))
    .map((story) => ({ params: { slug: story.slug }, props: { story } }));
}

export async function GET({ props }: { props: { story: Story } }) {
  const { story } = props;
  const file = path.join(COMICS_DIR, story.comicImage.split('/').pop() ?? '');

  if (!existsSync(file)) {
    return new Response('Not found', { status: 404 });
  }

  const source = sharp(await fs.readFile(file));
  const { width = 0, height = 0 } = await source.metadata();

  // Take the widest crop the comic can give at card proportions, anchored on
  // the beginning of the joke rather than its middle.
  const wide = width / height > CARD_ASPECT;
  const cropW = wide ? Math.round(height * CARD_ASPECT) : width;
  const cropH = wide ? height : Math.round(width / CARD_ASPECT);

  const card = sharp(await fs.readFile(file))
    .extract({ left: 0, top: 0, width: Math.min(cropW, width), height: Math.min(cropH, height) })
    .resize(CARD_W, CARD_H, { fit: 'cover', background: PAPER });

  // A corner chip carries the brand even when the crop misses the burnt-in
  // address in the artwork's bottom corner.
  if (existsSync(LOGO)) {
    const mark = await sharp(await fs.readFile(LOGO))
      .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    const chip = await sharp(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="132" height="132">
           <rect width="132" height="132" rx="26" fill="rgb(244,239,225)" fill-opacity="0.94"/>
         </svg>`,
      ),
    )
      .composite([{ input: mark, gravity: 'center' }])
      .png()
      .toBuffer();

    card.composite([{ input: chip, top: CARD_H - 132 - 28, left: CARD_W - 132 - 28 }]);
  }

  return new Response(new Uint8Array(await card.jpeg({ quality: 86, mozjpeg: true }).toBuffer()), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
