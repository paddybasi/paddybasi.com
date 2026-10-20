import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPosts } from '../lib/blog';
import { resume } from '../lib/resume';

export const GET: APIRoute = async ({ site }) =>
  rss({
    title: `${resume.basics.name} · Blog`,
    description: `Writing by ${resume.basics.name}, ${resume.basics.label}.`,
    site: site!,
    items: (await getPosts()).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: post.data.tags,
      link: `/blog/${post.id}/`,
    })),
  });
