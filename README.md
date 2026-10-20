# paddybasi.com

Personal site built with Astro + React + Tailwind v4. Every detail comes from the
[JSON Resume gist](https://gist.github.com/paddybasi/e2140aa3e8278ad9b65145f49b4f92d4), fetched at build time.
The downloadable CV (`/cv.pdf`) is rendered from the same data with `@react-pdf/renderer`.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # astro check + static build to dist/
npm test         # unit tests for the resume helpers
```

- Update the gist and rebuild to refresh both the site and the PDF. To build from another source, set `RESUME_URL`.
- Profile photo: replace `src/assets/profile.png` (any size, square works best).
- Blog: add a Markdown file to `src/content/blog/` (frontmatter: `title`, `description`, `pubDate`, `tags`, optional `draft: true`, which shows in dev only).
