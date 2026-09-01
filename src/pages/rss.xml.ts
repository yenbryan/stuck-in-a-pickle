import rss from '@astrojs/rss';
import { getAllStories } from '../utils/stories';

export async function GET(context: { site?: URL }) {
  const stories = await getAllStories();
  return rss({
    title: 'Stuck in a Pickle', description: 'The news, explained by making fun of it.', site: context.site ?? 'https://stuckinapickle.example',
    items: stories.map((story) => ({ title: story.title, description: `${story.summary} The pickle: ${story.absurdity}`, pubDate: story.publishedAt, link: `/comic/${story.slug}`, categories: [story.category, ...story.tags], author: story.author })),
    customData: '<language>en-us</language>',
  });
}
