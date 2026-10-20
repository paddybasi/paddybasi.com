// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://paddybasi.com',
  integrations: [react(), sitemap()],
  markdown: {
    // Both palettes are emitted; global.css switches to the dark one under [data-theme='dark'].
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark-dimmed' } },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
