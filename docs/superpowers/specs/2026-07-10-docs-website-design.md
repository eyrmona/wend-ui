# wend-ui documentation website — design

## Purpose

Turn the Stencil dev sandbox (`packages/web-components/src/index.html`, currently a single ad-hoc demo page) into a small multi-page documentation website for wend-ui, with a persistent top navigation bar (Get Started, Foundations, Components) and a proper cover page.

## Architecture

Multi-page static HTML, not a single-page app. Four pages, each a plain `.html` file in `packages/web-components/src/`, each loading the same built Stencil JS bundle (for component definitions and the existing `globalStyle` bundle of tokens/reset/base) plus a new shared `docs.css` for site chrome:

```
packages/web-components/src/
  index.html          — cover page (hero + nav only)
  get-started.html    — installation + usage
  foundations.html    — color, spacing, radius, typography
  components.html     — button docs (live examples, props, usage)
  global/
    global.css        — existing (tokens/reset/base) — unchanged, ships to consumers
    docs.css          — NEW: nav bar, page layout, prose styles — docs-site-only, never shipped
```

Rejected alternative: single-page app with client-side routing (stencil-router or hand-rolled hash routing). Rejected because it adds a new dependency/pattern to a project that's otherwise plain static HTML, for a site with only 4 pages where real browser navigation/URLs are simpler and sufficient.

## Nav bar

A small duplicated HTML snippet (wordmark + 3 links) repeated across all 4 pages, sharing `docs.css` classes for styling. Each page marks its own nav link with `aria-current="page"` for active-state highlighting.

Rejected alternative: a dedicated `<wend-docs-nav>` Stencil component. Rejected because introducing an actual custom element for docs-only site chrome blurs the line between real, shippable design-system components and internal site furniture, for very little duplication savings (3 links, 4 pages).

Nav links: `Get Started` → `get-started.html`, `Foundations` → `foundations.html`, `Components` → `components.html`. Wordmark (`wend-ui`) links to `index.html`.

## Page content

### `index.html` (cover page)

- Nav bar
- Wordmark/heading, short tagline
- Two CTAs built with real `<wend-button>` elements (dogfooding): "Get Started" (→ `get-started.html`), "View Components" (→ `components.html`)
- Nothing else — the button-demo and color-ramp content currently on this page moves to their proper homes below.

### `get-started.html`

- Installation: `npm install @wend-ui/web-components` and `npm install @wend-ui/styles` snippets
- Basic usage: minimal HTML snippet showing the loader script tag + a `<wend-button>` element
- Using with React: short note + snippet pointing at `@wend-ui/react`

### `foundations.html`

- Color: today's ramp grid (linen/mist/citron/lilac/indigo/midnight × 50–950) plus the semantic swatches (surface/card/recessed wells), moved verbatim from the current `index.html`
- Spacing: visual reference for `spacing-xs` through `spacing-2xl` (a bar or box per step, labeled with the token name and pixel value)
- Radius: visual reference for `radius-sm` through `radius-full` (a sample box per step, labeled)
- Typography: Funnel Sans specimen — font sizes (`sm`/`md`/`lg`/`xl`), weights (`regular`/`medium`/`bold`), line-heights (`tight`/`base`), each labeled with its token name and value

### `components.html`

- Button section:
  - Live examples: primary, secondary, disabled (today's demo content, moved here)
  - Props table: `variant` (`primary` | `secondary`, default `primary`), `disabled` (boolean, default `false`) — matching the existing Stencil-generated `readme.md`
  - Usage code snippet: `<wend-button variant="primary">Label</wend-button>`

## Styling

`docs.css` is new and separate from `@wend-ui/styles`' `base.css`/`reset.css` — it holds only nav bar, page layout/container, and prose styles for the documentation site itself, and is never published as part of the design system's own CSS output. It's linked directly in each page's `<head>`, alongside the existing `@wend-ui/styles` import that already flows through Stencil's `globalStyle` bundle.

## Open implementation risk

Stencil's `www` output target may only auto-copy a single recognized `index.html` rather than arbitrary additional `.html` files dropped into `src/`. This needs empirical verification during implementation — if extra pages don't appear in `www/` automatically, add explicit entries to the `copy` array in `stencil.config.ts`'s `www` output target config.

## Testing / verification plan

- Run the dev server (`npm run dev:components`)
- Click through all 4 nav links from each page; confirm every page reaches every other page
- Confirm `aria-current="page"` / active-state highlighting is correct on each page
- Confirm the color ramp grid and button demo render correctly in their new locations (Foundations / Components) with no visual regression from their current appearance on `index.html`
- Check browser console for errors on all 4 pages
- Confirm no changes to the actual `wend-button` component, token builds, or any other package — this is sandbox/docs-site-only work
