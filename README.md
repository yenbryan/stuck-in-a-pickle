# Stuck in a Pickle

Stuck in a Pickle is a static satirical news-comic publication built with Astro and TypeScript. It explains a story in one sentence, identifies the contradiction in one sentence, and turns that contradiction into a short comic.

Published stories in this repository are based on linked reporting or primary sources. Factual summaries should be checked against those sources before publication, while the comic dialogue and visual situations are satirical extrapolations.

## Requirements

- Node.js 22.12 or newer
- npm

## Local development

```sh
npm install
npm run dev
```

Build the static site with:

```sh
npm run build
```

The static deployable output is written to `dist/client/`. Set `SITE_URL` to the production origin during the build so canonical URLs, RSS links, robots.txt, and the sitemap use the correct domain. `dist/server/` contains only the tiny static-asset handoff used by OpenAI Sites hosting; it does not add application logic, a database, or a backend.

## Publish a new comic

1. Add final artwork to `src/assets/comics/` as a WebP, AVIF, PNG, or JPEG. Do not hand-optimize it — `astro:assets` generates the per-context sizes at build time, so commit the full-resolution file.
2. Run `npm run trim`. The generated art arrives with an uneven 6–14px band of paper around the drawn panel frame; on the site that band shows up as a second, wobbly border just outside the comic's own black frame. Trimming crops to the ink so the drawn frame *is* the image edge and the comic needs no border of its own. It also burns `stuckinapickle.com` into the bottom-right corner, because comics get screenshotted far more than they get linked and the credit has to survive in the pixels. `scripts/.credited.json` records what has been stamped, so running it again is harmless — delete that file to re-stamp everything.
3. Copy `examples/comic.example.md` into `src/content/comics/` and give it a descriptive filename.
4. Fill in the title, one-sentence summary, absurdity, image alt text, real reporting source, category, tags, dates, and author.
5. Change `comicImage` from `placeholder://...` to `/comics/my-comic.webp`. That path stays public-style; `getComicAsset()` in `src/utils/stories.ts` maps the filename onto the processed asset in `src/assets/comics/`. Verify the factual summary and source before publication.
6. Run `npm run build` and preview the generated site.
7. Deploy the contents of `dist/client/` to any static host.

While `comicImage` is still `placeholder://...`, `ComicStage` renders `comicPanels` as a plain script list. Once a real path is present the same component renders the artwork, with responsive sizes, a full-bleed mobile layout, and the CSS-only enlarge view.

The markdown body of each entry is rendered under the comic as the satire / accuracy note, so it is reader-facing — write it accordingly.

## Content model

The `comics` collection is defined in `src/content.config.ts`. Presentation components consume the typed `Story` interface from `src/types/story.ts`, not raw collection entries. All filesystem-specific access lives in `src/utils/stories.ts`.

This boundary is intentional: a future editorial API can replace the functions in `src/utils/stories.ts` while routes and components continue receiving the same `Story` objects.

## Important paths

```text
src/
  assets/comics/    Finished comic artwork (processed by astro:assets)
  components/       Reusable editorial and comic components
  content/comics/   Markdown content collection entries
  layouts/          Shared metadata and document shell
  pages/            Static routes and dynamic comic/category routes
  styles/           Design tokens, type roles, and layout helpers
  types/            Framework-independent content types
  utils/            Content access and story selection logic
public/
  fonts/            Self-hosted Fraunces and Nunito
  images/           Mascot and social assets
examples/
  comic.example.md  Copyable publishing template
```

Comic artwork is presented with **no frame of its own** — the drawn panel border is
the frame, which is why trimming matters. Each comic also keeps its true aspect
ratio in lists rather than being forced into a fixed tile: a 4:1 strip sits short
and wide, a panel grid sits tall, and that is what gives the feed its rhythm.

## Newsletter

The signup box posts straight to a list provider — a plain HTML POST, no
JavaScript, no CORS. Copy `.env.example` to `.env` and set:

```
PUBLIC_NEWSLETTER_ACTION="https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME"
```

Leave it unset and the box stays visibly disabled and says the list is not
connected, rather than silently swallowing addresses.

Providers differ on the field name — Buttondown and most others use `email`,
Kit uses `email_address`. Override with `PUBLIC_NEWSLETTER_FIELD`.

Both Buttondown and Kit can send each new comic automatically from
`/rss.xml`, so publishing stays a single step.

## Sharing

No social icon row — those are dead and each one costs a third-party tracker.
Instead:

- **`/share/<slug>.jpg`** — the whole comic as a JPEG. The Share button hands
  this to the OS share sheet via the Web Share API, so it arrives in Messages or
  Instagram as a picture rather than a link. The button stays hidden unless
  `navigator.share` actually exists, and Copy link covers everywhere else.
- **`/og/<slug>.jpg`** — the social card. It shows the *opening* of the comic at
  readable size rather than the whole grid shrunk to mush, since the platform
  renders the headline as text alongside it.

Both are generated statically at build time from the source artwork.

## Brand assets

The masthead mark and the favicons come from `src/components/Wordmark.astro`,
which draws the jar in inline SVG. To use supplied artwork instead:

1. Save it as `src/assets/brand/logo.png` (`.webp`/`.jpg` also work).
2. Run `npm run brand`.

That knocks out a flat white background — flood-filling inward from the edges,
so white *inside* the drawing survives — trims to the artwork, and regenerates
`favicon.png`, `apple-touch-icon.png` and `favicon.svg`, matted on the paper
colour so they hold up against a dark browser tab. The masthead then picks the
file up on its own.

Remove `src/assets/brand/logo.png` and the drawn mark comes back; the lookup is
a glob, so a missing file falls back rather than failing the build.

## Design system

`src/styles/global.css` holds the whole system: ten colour tokens, seven named
type roles (`.headline`, `.title`, `.punchline`, `.lede`, `.label`, `.meta`), one
spacing scale, and four content widths. Components should use those roles rather
than declaring their own font sizes.

Two rules worth keeping:

- **`--tomato` is rationed** to the "Today's pickle" flag and the "Why this is
  ridiculous" label. Spending it anywhere else costs both of them their meaning.
- **The mascot appears three times** site-wide: the newsletter, the footer, and
  empty states. The header uses the simplified jar mark in `Wordmark.astro`,
  which is also the favicon.

Comic artwork is presented with **no frame of its own** — the drawn panel border is
the frame, which is why trimming matters. Each comic also keeps its true aspect
ratio in lists rather than being forced into a fixed tile: a 4:1 strip sits short
and wide, a panel grid sits tall, and that is what gives the feed its rhythm.

## Newsletter

The signup box posts straight to a list provider — a plain HTML POST, no
JavaScript, no CORS. Copy `.env.example` to `.env` and set:

```
PUBLIC_NEWSLETTER_ACTION="https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME"
```

Leave it unset and the box stays visibly disabled and says the list is not
connected, rather than silently swallowing addresses.

Providers differ on the field name — Buttondown and most others use `email`,
Kit uses `email_address`. Override with `PUBLIC_NEWSLETTER_FIELD`.

Both Buttondown and Kit can send each new comic automatically from
`/rss.xml`, so publishing stays a single step.

## Sharing

No social icon row — those are dead and each one costs a third-party tracker.
Instead:

- **`/share/<slug>.jpg`** — the whole comic as a JPEG. The Share button hands
  this to the OS share sheet via the Web Share API, so it arrives in Messages or
  Instagram as a picture rather than a link. The button stays hidden unless
  `navigator.share` actually exists, and Copy link covers everywhere else.
- **`/og/<slug>.jpg`** — the social card. It shows the *opening* of the comic at
  readable size rather than the whole grid shrunk to mush, since the platform
  renders the headline as text alongside it.

Both are generated statically at build time from the source artwork.

## Brand assets

The masthead mark and the favicons come from `src/components/Wordmark.astro`,
which draws the jar in inline SVG. To use supplied artwork instead:

1. Save it as `src/assets/brand/logo.png` (`.webp`/`.jpg` also work).
2. Run `npm run brand`.

That knocks out a flat white background — flood-filling inward from the edges,
so white *inside* the drawing survives — trims to the artwork, and regenerates
`favicon.png`, `apple-touch-icon.png` and `favicon.svg`, matted on the paper
colour so they hold up against a dark browser tab. The masthead then picks the
file up on its own.

Remove `src/assets/brand/logo.png` and the drawn mark comes back; the lookup is
a glob, so a missing file falls back rather than failing the build.

## Design system

- Warm paper: `#f3eddf`
- Soft surface: `#faf7ef`
- Ink: `#1d2118`
- Pickle olive: `#697b38`
- Pale brine: `#dfe5c7`
- Rust accent: `#b9573f`
- Editorial type: system old-style serif stack
- Interface type: self-hosted Nunito variable font, licensed under SIL OFL 1.1 (`public/fonts/Nunito-OFL.txt`)

The layout uses narrow reading measures, thin newspaper rules, no component framework, and minimal client JavaScript (only random routing and link copying).
