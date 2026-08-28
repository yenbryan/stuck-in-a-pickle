import { getCollection, type CollectionEntry } from 'astro:content';
import type { Story, StoryCategory } from '../types/story';

function toStory(entry: CollectionEntry<'comics'>): Story {
  return { id: entry.id, ...entry.data };
}

export async function getAllStories(): Promise<Story[]> {
  const entries = await getCollection('comics');
  return entries.map(toStory).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

export async function getFeaturedStory(): Promise<Story> {
  const stories = await getAllStories();
  return stories.find((story) => story.featured) ?? stories[0];
}

export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
  const stories = await getAllStories();
  return stories.find((story) => story.slug === slug);
}

export async function getStoriesByCategory(category: StoryCategory): Promise<Story[]> {
  const stories = await getAllStories();
  return stories.filter((story) => story.category === category);
}

export function getRelatedStories(story: Story, stories: Story[], limit = 3): Story[] {
  return stories
    .filter((candidate) => candidate.slug !== story.slug)
    .map((candidate) => ({
      story: candidate,
      score: Number(candidate.category === story.category) * 3 + candidate.tags.filter((tag) => story.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || b.story.publishedAt.getTime() - a.story.publishedAt.getTime())
    .slice(0, limit)
    .map(({ story: related }) => related);
}

export function getAdjacentStories(story: Story, stories: Story[]) {
  const index = stories.findIndex((candidate) => candidate.slug === story.slug);
  return {
    previous: index < stories.length - 1 ? stories[index + 1] : undefined,
    next: index > 0 ? stories[index - 1] : undefined,
  };
}

export function categorySlug(category: string): string {
  return category.toLowerCase().replaceAll(' ', '-');
}

export function formatStoryDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}
