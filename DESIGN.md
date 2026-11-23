# Design system: paddybasi.com

The source of truth is `src/styles/global.css`. This file explains the decisions behind it.
`docs/design-tokens.json` and `docs/design-preview.html` are snapshots of it (2026-11-23): if they disagree with the CSS, the CSS wins.

**Audience:** recruiters and hiring managers skimming a CV. Every choice below serves "credible engineer, quickly scannable", with personality kept in Adventure mode and the quests rather than in the default chrome.

## Colour

Seven semantic tokens per palette, switched by `data-theme` (and `data-mode="adventure"`) on `<html>`. Components only ever use the Tailwind aliases (`bg-ink`, `text-fg`, `text-muted`, `border-line`, `text-violet/cyan/lime`, `bg-fg/5`), never hex or `white`/`black`.

| Token | Role | Light | Dark | Adventure light | Adventure dark |
|---|---|---|---|---|---|
| `--ink` | Page background | `#f6f5fb` | `#06060a` | `#efe3bf` | `#0b1610` |
| `--ink-2` | Raised surface (cards, panels) | `#ffffff` | `#0d0d16` | `#fbf3dc` | `#12251a` |
| `--fg` | Body text, primary button fill | `#15141d` | `#ecebf3` | `#2b1d0e` | `#f4ecd0` |
| `--muted` | Secondary text | `#5a596c` | `#9b9ab0` | `#6e5b3c` | `#a9b79a` |
| `--violet` | Brand accent: icons, selection, card shadow | `#7c3aed` | `#a78bfa` | `#8a5a12` | `#f6c744` |
| `--cyan` | Interactive accent: eyebrows, dates, progress, focus ring, hover | `#0e7490` | `#22d3ee` | `#22693f` | `#4ade80` |
| `--lime` | Status accent: available, completed, levels | `#4d7c0f` | `#a3e635` | `#234f8a` | `#7dd3fc` |
| `--line` | Hairlines (`fg` at 10%) | derived | derived | derived | derived |
| `--gold` | 100% reward relic only | `#fbbf24` in every palette | | | |

**Contrast (measured, text on `--ink` / `--ink-2`):** every text token clears WCAG AA 4.5:1 on both surfaces in all four palettes. The tightest are light `--lime` (4.6 / 5.0) and Adventure-light `--violet` (4.6 / 5.3); don't lighten those. In a browser sweep of about 410 text elements per palette, none failed.

**Rules**
- **Cyan means "you can interact with this or it's progress"; lime means "status/achievement"; violet is brand flavour.** Keep the roles: a cyan badge reads as clickable.
- **The three-stop gradient (`text-gradient`) is reserved for the hero surname and the contact heading.** Using it everywhere made nothing stand out, and violet-to-cyan gradients read as a generic template. Progress bars, timeline dots and the quest ring are solid `cyan`.
- Tints are `bg-fg/5` (hover, chips) and `bg-fg/10` (pressed, tracks), so they work in every palette for free.

## Typography

| Role | Font | Usage |
|---|---|---|
| Display (`font-display`) | Bricolage Grotesque; **Pixelify Sans in Adventure** | Headings, stats, nav logo. A real CSS var so Adventure mode can swap it. |
| Body (`font-sans`) | Inter | Everything readable. |
| Mono (`font-mono`) | JetBrains Mono | Metadata: dates, tags, eyebrows, XP. Signals "data", not prose. |

| Level | Classes |
|---|---|
| h1 (hero) | `text-6xl sm:text-7xl lg:text-8xl font-extrabold leading-[0.9] tracking-tight` |
| h1 (page/post) | `text-4xl sm:text-6xl` to `text-6xl sm:text-7xl`, `font-extrabold` |
| h2 (section) | `text-4xl sm:text-5xl font-bold tracking-tight`; contact finale goes up to `sm:text-7xl` |
| h3 (card) | `text-2xl font-bold` (`text-xl` for secondary cards) |
| Lead | `text-lg leading-relaxed text-muted` |
| Body | `text-base` |
| Meta | `font-mono text-xs` |
| Micro | `text-2xs` (11px): tags, HUD captions. **The only size below `xs`; never `text-[10px]`/`[11px]`.** |
| Eyebrow | `eyebrow` utility: mono, xs, 0.25em tracking, uppercase, cyan |

Every section opens the same way: eyebrow, then h2, then an optional lead. That repetition is deliberate scanning rhythm; vary the copy, not the structure.

## Space and layout

- **Base unit:** Tailwind's 4px scale. No arbitrary spacing.
- **Sections:** `px-6 py-28` (contact: `py-36`). The gutter is `px-6` at every width.
- **Containers:** `max-w-6xl` (default), `max-w-4xl` (experience, contact), `max-w-3xl` (long-form posts), `max-w-5xl` (nav).
- **Grids:** `gap-5` between cards, `gap-10`/`gap-12` between columns.
- **Card padding:** `p-8` (`p-6 sm:p-8` in dense lists, `p-7` post cards).
- **Breakpoints:** Tailwind defaults. `md` (768px) is the main switch: nav links inline, stats in 4 columns, card grids in 2. `lg` (1024px) splits the hero and about sections.

## Shape

| Element | Radius | Why |
|---|---|---|
| Cards | 1.5rem (`card`) | Soft, large surfaces. |
| Buttons, nav pills, icon buttons | `rounded-full` | Clearly tappable. |
| Tags, chips | `rounded-md` (`tag`, or for bigger chips `rounded-md border`) | Data, not actions: deliberately *not* pill-shaped like buttons. |
| Floating panels (toasts, callout) | `rounded-2xl` / `rounded-3xl` | |
| Adventure mode | **0 everywhere** | Pixel aesthetic. Squared by the `[class*='rounded']` rule plus an explicit rule for `btn`, `btn-ghost` and `tag`. Any new utility that sets a radius must be added to that rule. |

## Components (utilities in `global.css`)

| Utility | What | Notes |
|---|---|---|
| `btn` | Primary action: `fg` fill, `ink` text, cyan on hover | One per view region (Download CV). Size tweaks override it: `btn px-4 py-2 text-sm`. |
| `btn-ghost` | Secondary action: `fg/5` tint + hairline | Get in touch, LinkedIn, All posts, Show more. |
| `tag` | Mono micro chip | Active state: add `bg-cyan/20 text-cyan`. |
| `card` | Raised surface with hairline gradient border and cursor glow | Add `data-tilt` **only if the whole card is a link**; tilt implies clickability. |
| `eyebrow` | Section label | |
| `text-gradient` | Brand gradient text | Two uses only (see Colour). |

Utilities are emitted before Tailwind's single-purpose classes, so `btn px-4` reliably overrides padding.

## Elevation

Mostly flat: surfaces separate by `ink` vs `ink-2` and hairlines, not shadows. Shadows are reserved for things that float: the nav, toasts and the quest badge (`shadow-xl`/`2xl` tinted violet), plus the card hover lift. Backdrop blur is used only where content scrolls underneath (nav, toasts, quest log).

## Motion

- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` (fast out, soft land) everywhere; springy `(0.2, 0.9, 0.3, 1.3)` only for celebratory toasts.
- **Durations:** 0.12s (tilt tracking) · 0.35–0.5s (UI state) · 0.9s (reveals) · 1.4s (XP bar fill).
- **Scroll reveal (`data-reveal`)** is applied to section headings only, plus the hero load-in and the stats card, which needs the `.in` class to fill its bars. Content is never hidden waiting for a scroll.
- **Ambient motion budget:** one aurora blob in the hero, one at contact, the orb, and the availability ping. Nothing else loops. There is no marquee (WCAG 2.2.2).
- **`prefers-reduced-motion`:** a global rule zeroes animations and transitions, reveals show immediately, tilt and confetti are off, and 3D components freeze.

## Accessibility baseline

- AA contrast for all text tokens in all four palettes (see Colour).
- `:focus-visible` is a 2px cyan outline with 3px offset, global.
- Touch targets are at least 24px (icon buttons 40–44px).

## CV PDF

`src/pdf/CvDocument.tsx` uses the same system in print: the light palette (with `line` and tints pre-mixed onto white, since PDFs have no alpha), Bricolage headings, Inter body, mono eyebrows, dates and `tag` chips, cyan highlight dashes and a lime status badge. The gradient surname becomes flat violet. Every role is printed in full, as on the site, where the experience timeline has no collapsed roles or highlights.
- Decorative 3D and the sphere are `aria-hidden`, and the same information is real content alongside them.

## What was deliberately not done

- **No competitor research.** This system was extracted from the existing site and tuned by an audit, not designed fresh. Revisit for a full redesign.
- **No token build pipeline.** `global.css` is hand-written and small; the JSON is documentation, not an input. Add Style Dictionary only if a second consumer (an app, a PDF theme) needs the tokens.
