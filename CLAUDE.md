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

## Gamification (quests)

- `src/lib/quests.ts` defines the quests, XP and levels; `unlock(id)` saves to localStorage (`quests`) and fires a `quest:unlock` window event. Level maths is tested in `quests.test.ts`.
- `QuestHud.tsx` (`client:only`, mounted in Layout) shows the level badge, quest log, toasts and confetti. The Konami code, or completing every quest, triggers "party" mode (`.party main` hue-rotate).
- Triggers: add `data-quest="<id>"` to an element to unlock it on scroll (observer in Layout); CV clicks, the theme toggle, the experience filter, a sphere drag and an orb click call `unlock()` directly.
- New quest: add it to `QUESTS`, add its trigger, and keep the top `LEVELS` threshold at or below `MAX_XP` (the test enforces this).
- 100% reward: a pulsing pixel "Sunstone" relic (original, not Triforce) appears above the badge; claiming it opens a `<dialog>` finale with gold confetti and a fanfare (Adventure + sound), and the relic then stays in the badge (localStorage `relic`, cleared by Reset progress). Hearts fill proportionally so they are full exactly at 100%.
- "Character stats" bars (`skillStats` in `resume.ts`) = total months of roles whose text mentions each top skill.

## Adventure mode

- An **original** retro-RPG skin (inspired by classic adventure games, but with no Nintendo/Zelda names, logos, sprites or music, on purpose: this is a public professional site). Keep it that way.
- Off by default (first impressions stay professional). Discovery cues: a "new" dot on the nav sword + one-time callout after 7s (both cleared via localStorage `mode-seen`), and a hero link. `/?mode=adventure` is a shareable link that opens it. Any `[data-mode-toggle]` element toggles it; the `adventure:` Tailwind variant styles content per mode.
- Toggled by the sword button in Nav: sets `data-mode="adventure"` on `<html>` (saved as localStorage `mode`, restored by the head script), with an iris-wipe View Transition.
- Styling is all in `global.css` under `[data-mode='adventure']`: palettes for both themes, Pixelify Sans headings (`--font-display` is a real CSS var for this reason), square corners, notched `.card`/`.adv-frame` borders, pixelated images, sword cursor.
- Islands read the mode via `useRootAttr('mode')` (`src/lib/useRootAttr.ts`): HeroScene swaps palettes; QuestHud shows a pixel-heart life meter (half a heart per quest), a gem/XP counter, typewriter dialogue toasts and an original Web Audio chiptune (localStorage `sound`).

## Page transitions and prefetch

- Native cross-document View Transitions (`@view-transition` in `global.css`, reduced-motion only): no `<ClientRouter />`, so page scripts run normally on every load. Don't add the client router without reworking every inline script for `astro:page-load`.
- `#site-nav` holds still; a post's title morphs from its card (`PostCard.astro`) into the post `h1` via a matching inline `view-transition-name: post-<id>`. Names must be unique per page. They are all disabled during the Adventure-mode iris wipe (`html.iris *`).
- Prefetch is opt-in (`prefetch` in `astro.config.mjs`): blog links carry `data-astro-prefetch` (`hover` by default, `viewport` on post cards and prev/next). Don't prefetch `/cv.pdf`.

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

- Internal page links need a trailing slash (`/blog/`, `/blog/<id>/`, including links inside post Markdown). Netlify serves directory URLs and 301s slashless ones, which slows navigation and wastes prefetches; `trailingSlash: 'always'` makes the dev server 404 on mistakes.
- Astro 7 is newer than most training data. Check `node_modules/astro` types or the docs before assuming an API (content layer: `glob` from `astro/loaders`, `z` from `astro/zod`, `render()` from `astro:content`).
- `@react-three/fiber` 9 pins React `<19.4`; check its peer deps before upgrading React.
- The profile photo is `src/assets/profile.png` (currently a GitHub avatar placeholder; LinkedIn blocks automated downloads, so the user must supply the real photo).
