export const STORY_CATEGORIES = ['AI', 'Technology', 'Politics', 'Business', 'Work', 'Internet', 'Life', 'Science', 'Humanity'] as const;

export type StoryCategory = (typeof STORY_CATEGORIES)[number];

export interface ComicVariant {
  title: string;
  image: string;
  imageAlt: string;
  panels: string[];
}

export interface Story {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date;
  updatedAt?: Date;
  summary: string;
  absurdity: string;
  category: StoryCategory;
  tags: string[];
  comicImage: string;
  comicImageAlt: string;
  comicLayout: 'standard' | 'panoramic';
  comicPanels: string[];
  comicVariants: ComicVariant[];
  sourceName: string;
  sourceUrl: string;
  featured: boolean;
  evergreen: boolean;
  author: string;
  fictional: boolean;
}
