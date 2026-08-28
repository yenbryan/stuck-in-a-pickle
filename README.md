# The Pickle

The Pickle is a static satirical news-comic publication built with Astro and TypeScript. It explains a story in one sentence, identifies the contradiction in one sentence, and turns that contradiction into a short comic.

All sample stories in this repository are fictional and labeled as such. Real published summaries should be checked against credible reporting and include a direct source link.

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

1. Add final artwork to `public/comics/` as an optimized WebP, AVIF, PNG, or JPEG.
2. Copy `examples/comic.example.md` into `src/content/comics/` and give it a descriptive filename.
3. Fill in the title, one-sentence summary, absurdity, image alt text, real reporting source, category, tags, dates, and author.
4. Change `comicImage` from `placeholder://...` to a public path such as `/comics/my-comic.webp`. Set `fictional: false` only after the summary and source are verified.
5. Run `npm run build` and preview the generated site.
6. Deploy the contents of `dist/client/` to any static host.

The CSS placeholder renderer uses `comicPanels` while artwork is in progress. Once a real image path is present, the same component renders the finished artwork automatically.

## Content model

The `comics` collection is defined in `src/content.config.ts`. Presentation components consume the typed `Story` interface from `src/types/story.ts`, not raw collection entries. All filesystem-specific access lives in `src/utils/stories.ts`.

This boundary is intentional: a future editorial API can replace the functions in `src/utils/stories.ts` while routes and components continue receiving the same `Story` objects.

## Important paths

```text
src/
  components/       Reusable editorial and comic components
  content/comics/   Markdown content collection entries
  layouts/          Shared metadata and document shell
  pages/            Static routes and dynamic comic/category routes
  styles/           Global design tokens and base styles
  types/            Framework-independent content types
  utils/            Content access and story selection logic
public/
  comics/           Finished comic artwork
  images/           Publication images and social assets
examples/
  comic.example.md  Copyable publishing template
```

## Design system

- Warm paper: `#f4efe3`
- Ink: `#202219`
- Pickle olive: `#667a36`
- Pale brine: `#dfe5c5`
- Tomato accent: `#bd563e`
- Editorial type: system old-style serif stack
- Interface type: system humanist sans stack

The layout uses narrow reading measures, thin newspaper rules, no component framework, and minimal client JavaScript (only random routing and link copying).
