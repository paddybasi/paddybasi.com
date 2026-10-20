# paddybasi.com

Personal site and CV for Pardeep Singh Basi, aimed at recruiters. Static Astro 7 site with React 19 islands and Tailwind v4, deployed on Netlify.

## Commands

```sh
npm run dev      # http://localhost:4321 (drafts visible)
npm run build    # astro check (types) + static build to dist/ — run before calling work done
npm test         # node --test on src/lib/*.test.ts (pure helpers only)
npm run preview  # serve dist/
```

Node >= 22.22 (Astro 7 requirement; see `.nvmrc`, `netlify.toml`).

## Data flow — the important bit

- **All CV content comes from a JSON Resume gist**, fetched once at build time by `src/lib/resume.ts` (top-level await). Never hard-code resume facts in components; read `resume` / `derived` / `topTags`.
- Gist: https://gist.github.com/paddybasi/e2140aa3e8278ad9b65145f49b4f92d4 (override with `RESUME_URL` env). The build fails loudly if it can't be fetched.
- Content changes in the gist only go live after a rebuild (Netlify build hook or a new deploy).
- `/cv.pdf` is generated at build time by `src/pages/cv.pdf.ts` rendering `src/pdf/CvDocument.tsx` with `@react-pdf/renderer` from the same data. Built-in Helvetica only (no font downloads).
- Blog posts are Markdown in `src/content/blog/`, schema in `src/content.config.ts`. `draft: true` hides a post from production builds.

## Layout

- `src/lib/format.ts`: pure date/name/keyword helpers + tests in `format.test.ts`. Keep it free of Astro/React imports so `node --test` can run it.
- `src/lib/resume.ts`: fetch, types, derived stats (years, availability badge, testimonials, top tags).
- `src/lib/blog.ts`: `getPosts()`, reading time, date formatting.
- `src/layouts/Layout.astro`: head/SEO/JSON-LD, the no-flash theme script, Nav + Footer, scroll-reveal and card glow/tilt script.
- `src/pages/index.astro`: home page sections. `src/pages/blog/`: list and post pages. `rss.xml.ts`, `404.astro`.
- React islands: `Experience.tsx` (tech filter, `client:visible`), `SkillSphere.tsx` (DOM-projected 3D tag sphere, `client:visible`), `HeroScene.tsx` (three.js / R3F, `client:only="react"` — it uses `document` and WebGL).

## Conventions

- **Theming:** colours are CSS variables in `src/styles/global.css`, switched by `data-theme` on `<html>`. Use the tokens (`bg-ink`, `text-fg`, `text-muted`, `border-line`, `text-violet/cyan/lime`, `bg-fg/5` for tints). Never use `white/…` or hard-coded hex in components, or light mode breaks. Use the `dark:` variant for theme-specific tweaks.
- Reusable visual utilities: `card`, `eyebrow`, `text-gradient`. Add `data-reveal` (optionally `style="--d:N"` for stagger) for scroll-in animation.
- Anything animated must respect `prefers-reduced-motion`; 3D components pause when off-screen and render nothing without WebGL.
- Accessibility basics are non-negotiable: decorative 3D is `aria-hidden`, and the same information must exist as real content (e.g. skill cards next to the sphere).
- Privacy: don't show the street address; the phone number appears only in the PDF.
- Keep the client JS small: only use an island when it needs interactivity. `HeroScene` is the heaviest bundle (~260 KB gzipped).

## Deployment (Netlify)

- `netlify.toml`: build command, publish `dist`, Node 22, security headers, immutable caching for `/_astro/*`, no-cache for `/cv.pdf`.
- `site` in `astro.config.mjs` is `https://paddybasi.com`, used for canonical URLs, sitemap and RSS.

## Gotchas

- Astro 7 is newer than most training data. Check `node_modules/astro` types or the docs before assuming an API (content layer: `glob` from `astro/loaders`, `z` from `astro/zod`, `render()` from `astro:content`).
- `@react-three/fiber` 9 pins React `<19.4`; check its peer deps before upgrading React.
- The profile photo is `src/assets/profile.png` (currently a GitHub avatar placeholder; LinkedIn blocks automated downloads, so the user must supply the real photo).
