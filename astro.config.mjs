// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { sites } from '@openai/sites-vite-plugin';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://stuckinapickle.example',
  output: 'static',
  outDir: './dist/client',
  integrations: [sitemap({ filter: (page) => !page.includes('/shop') && !page.includes('/random') })],
  compressHTML: true,
  vite: { plugins: [sites()] },
});
