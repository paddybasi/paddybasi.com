// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://paddybasi.com',
  // Matches the URLs Netlify serves (/blog/ not /blog), so links don't 301.
  trailingSlash: 'always',
  integrations: [react(), sitemap()],
  // Opt-in per link with data-astro-prefetch (used on blog links only).
  prefetch: { defaultStrategy: 'hover' },
  markdown: {
    // Both palettes are emitted; global.css switches to the dark one under [data-theme='dark'].
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark-dimmed' } },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
