// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { sites } from '@openai/sites-vite-plugin';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://thepickle.example',
  output: 'static',
  outDir: './dist/client',
  integrations: [sitemap()],
  compressHTML: true,
  vite: { plugins: [sites()] },
});
