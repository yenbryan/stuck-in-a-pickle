import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const comics = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/comics' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    summary: z.string(),
    absurdity: z.string(),
    category: z.enum(['AI', 'Technology', 'Politics', 'Business', 'Work', 'Internet', 'Life', 'Humanity']),
    tags: z.array(z.string()),
    comicImage: z.string(),
    comicImageAlt: z.string(),
    comicPanels: z.array(z.string()).min(3).max(4),
    sourceName: z.string(),
    sourceUrl: z.url(),
    featured: z.boolean().default(false),
    evergreen: z.boolean().default(false),
    author: z.string(),
    fictional: z.boolean().default(false),
  }),
});

export const collections = { comics };
