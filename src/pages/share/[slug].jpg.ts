import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Story } from '../../types/story';
import { getAllStories, hasComicArtwork } from '../../utils/stories';

/**
 * The whole comic as a JPEG, for the share sheet and for anyone who wants to
 * repost it.
 *
 * The site serves WebP, which several messaging and social apps still handle
 * badly when they receive it as a file, so the share copy is JPEG. The site's
 * address is already burnt into the artwork by scripts/trim-comics.mjs, so a
 * repost carries its attribution with it.
 */

const COMICS_DIR = 'src/assets/comics';
const MAX_WIDTH = 1400;

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

  const buffer = await sharp(await fs.readFile(file))
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .flatten({ background: { r: 0xfc, g: 0xfa, b: 0xf2 } })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
