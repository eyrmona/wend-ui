# wend-ui Documentation Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Stencil dev sandbox into a 4-page documentation website (cover, Get Started, Foundations, Components) with a shared top nav bar.

**Architecture:** Multi-page static HTML. Each page is a plain `.html` file under `packages/web-components/src/`, loading the existing built Stencil JS/CSS bundle (component definitions + `@wend-ui/styles` tokens/reset/base, unchanged) plus a new `global/docs.css` stylesheet scoped to site chrome only. Stencil's `www` output target does not auto-copy arbitrary `.html`/`.css` files placed in `src/` (verified empirically — only `index.html` is handled by default), so `stencil.config.ts` needs explicit `copy` entries for the three new HTML pages and the new CSS file.

**Tech Stack:** Stencil 4.20, plain HTML/CSS (no new dependencies), existing `@wend-ui/tokens`/`@wend-ui/styles` CSS custom properties.

## Global Constraints

- No changes to `wend-button`, any package under `packages/tokens`, `packages/styles`' `dist`/`src` (only the web-components sandbox changes), or any build output format consumed by other packages.
- `docs.css` is never bundled into the shipped component CSS (`wend-ui-web-components.css`) — it's a separately-served static file, referenced only by the sandbox HTML pages.
- All 4 pages must load without console errors and use only existing CSS custom properties already defined by `@wend-ui/tokens`/`@wend-ui/styles` (no new hardcoded colors/spacing).

---

### Task 1: Shared docs stylesheet and stencil.config.ts copy wiring

**Files:**
- Create: `packages/web-components/src/global/docs.css`
- Modify: `packages/web-components/stencil.config.ts`

**Interfaces:**
- Produces: CSS classes `wend-nav`, `wend-nav__brand`, `wend-nav__links`, `wend-page`, `wend-hero`, `wend-hero__ctas`, `wend-section`, `wend-scale-row`, `wend-scale-row__label`, `wend-scale-row__box`, `wend-type-row`, `wend-type-row__label`, `wend-props-table`, `wend-code`, `wend-ramp-grid`, `wend-ramp-step-label`, `wend-ramp-name-label`, `wend-ramp-swatch`, `wend-ramp-swatch--base` — every later task's HTML pages depend on these exact class names existing in `/global/docs.css`.
- Consumes: existing CSS custom properties from `@wend-ui/tokens` (`--spacing-*`, `--radius-*`, `--font-*`, `--color-*`), already loaded globally via Stencil's `globalStyle` bundle — no new tokens needed.

- [ ] **Step 1: Create `packages/web-components/src/global/docs.css`**

```css
body {
  margin: 0;
}

.wend-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-default);
  background-color: var(--color-surface-card);
}

.wend-nav__brand {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  text-decoration: none;
}

.wend-nav__links {
  display: flex;
  gap: var(--spacing-lg);
}

.wend-nav__links a {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) 0;
}

.wend-nav__links a:hover {
  color: var(--color-text-primary);
}

.wend-nav__links a[aria-current='page'] {
  color: var(--color-action-primary);
  font-weight: var(--font-weight-medium);
}

.wend-page {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.wend-hero {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
}

.wend-hero h1 {
  font-size: var(--font-size-xl);
  margin: 0 0 var(--spacing-sm);
}

.wend-hero p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  margin: 0 0 var(--spacing-lg);
}

.wend-hero__ctas {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.wend-section {
  margin-bottom: var(--spacing-2xl);
}

.wend-section h2 {
  font-size: var(--font-size-lg);
  margin: 0 0 var(--spacing-md);
}

.wend-scale-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.wend-scale-row__label {
  width: 160px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.wend-scale-row__box {
  background-color: var(--color-action-primary);
}

.wend-type-row {
  margin-bottom: var(--spacing-md);
}

.wend-type-row__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.wend-props-table {
  border-collapse: collapse;
  width: 100%;
}

.wend-props-table th,
.wend-props-table td {
  text-align: left;
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-default);
  font-size: var(--font-size-sm);
}

.wend-code {
  background-color: var(--color-surface-canvas-recessed);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: monospace;
  font-size: var(--font-size-sm);
  overflow-x: auto;
  display: block;
}

.wend-ramp-grid {
  display: grid;
  grid-template-columns: 90px repeat(11, 1fr);
  gap: 4px;
  align-items: center;
  max-width: 720px;
  margin-bottom: 4px;
}

.wend-ramp-step-label,
.wend-ramp-name-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
}

.wend-ramp-name-label {
  text-align: left;
}

.wend-ramp-swatch {
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-default);
}

.wend-ramp-swatch--base {
  border: 2px solid var(--color-text-primary);
}
```

- [ ] **Step 2: Add `copy` entries to `stencil.config.ts`'s `www` output target**

Modify `packages/web-components/stencil.config.ts` — replace the `www` output target block:

```typescript
    {
      type: 'www',
      serviceWorker: null
    }
```

with:

```typescript
    {
      type: 'www',
      serviceWorker: null,
      copy: [
        { src: '*.html' },
        { src: 'global/docs.css' }
      ]
    }
```

**Correction found during implementation:** an earlier draft of this task specified four explicit `copy` entries (one named file per new page) instead of the `*.html` glob above. That was based on an untested assumption that Stencil's copy task silently skips a missing source file. Verified empirically (twice, independently) that Stencil v4.43.5 actually throws `ENOENT` and fails the build when a named `copy` source doesn't exist yet — which it doesn't, for `get-started.html`/`foundations.html`/`components.html`, until Tasks 2-4 create them. The glob is not just a workaround: it's also correct at the finished state, since `index.html` (rewritten as the cover page in Task 5) needs to be in the output alongside the other three pages, and the glob picks all of them up with no further `stencil.config.ts` changes needed in Tasks 2-5.

- [ ] **Step 3: Verify the copy config builds without error**

Run: `npm run build -w packages/web-components`
Expected: build succeeds. Confirm in the output: `copy finished (1 file)` (only `docs.css` exists yet, since `get-started.html`/`foundations.html`/`components.html` don't exist until later tasks and the glob simply doesn't match them yet) and confirm `packages/web-components/www/global/docs.css` exists:

Run: `ls packages/web-components/www/global/docs.css`
Expected: file exists

- [ ] **Step 4: Commit**

```bash
git add packages/web-components/src/global/docs.css packages/web-components/stencil.config.ts
git commit -m "add shared docs.css and stencil copy config for docs site pages"
```

---

### Task 2: Get Started page

**Files:**
- Create: `packages/web-components/src/get-started.html`

**Interfaces:**
- Consumes: `/global/docs.css` classes from Task 1 (`wend-nav`, `wend-nav__brand`, `wend-nav__links`, `wend-page`, `wend-section`, `wend-code`).

- [ ] **Step 1: Create `packages/web-components/src/get-started.html`**

```html
<!doctype html>
<html dir="ltr" lang="en">
  <head>
    <meta charset="utf-8" />
    <title>wend-ui — Get Started</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Funnel+Sans:wght@300;400;500;600;700;800&display=swap"
    />
    <link rel="stylesheet" href="/build/wend-ui-web-components.css" />
    <link rel="stylesheet" href="/global/docs.css" />
    <script type="module" src="/build/wend-ui-web-components.esm.js"></script>
    <script nomodule src="/build/wend-ui-web-components.js"></script>
  </head>
  <body>
    <nav class="wend-nav">
      <a class="wend-nav__brand" href="index.html">wend-ui</a>
      <div class="wend-nav__links">
        <a href="get-started.html" aria-current="page">Get Started</a>
        <a href="foundations.html">Foundations</a>
        <a href="components.html">Components</a>
      </div>
    </nav>

    <div class="wend-page">
      <div class="wend-section">
        <h2>Installation</h2>
        <p>Install the web components package, plus the base styles package for tokens/reset/utilities:</p>
        <code class="wend-code">npm install @wend-ui/web-components @wend-ui/styles</code>
      </div>

      <div class="wend-section">
        <h2>Basic usage</h2>
        <p>Load the component loader script and the base stylesheet, then use any wend-ui element directly in HTML:</p>
        <code class="wend-code"
          >&lt;link rel="stylesheet" href="node_modules/@wend-ui/styles/dist/index.css" /&gt;<br />
          &lt;script type="module" src="node_modules/@wend-ui/web-components/loader/index.js"&gt;&lt;/script&gt;<br
        /><br />
          &lt;wend-button variant="primary"&gt;Click me&lt;/wend-button&gt;</code
        >
      </div>

      <div class="wend-section">
        <h2>Using with React</h2>
        <p>
          A generated set of React wrapper components ships from <code>@wend-ui/react</code>, so components can be
          used the same way as any other React component, with full prop typing:
        </p>
        <code class="wend-code"
          >import { WendButton } from '@wend-ui/react';<br /><br />
          function App() {<br />
          &nbsp;&nbsp;return &lt;WendButton variant="primary"&gt;Click me&lt;/WendButton&gt;;<br />
          }</code
        >
      </div>
    </div>
  </body>
</html>
```

- [ ] **Step 2: Verify the page structure is well-formed**

Run: `grep -c "wend-nav__links" packages/web-components/src/get-started.html`
Expected: `1`

Run: `npx tidy -q -e packages/web-components/src/get-started.html 2>&1 || true`
(Informational only — `tidy` may not be installed; if it isn't, skip this check and rely on the browser verification in Task 6.)

- [ ] **Step 3: Commit**

```bash
git add packages/web-components/src/get-started.html
git commit -m "add Get Started docs page"
```

---

### Task 3: Foundations page

**Files:**
- Create: `packages/web-components/src/foundations.html`

**Interfaces:**
- Consumes: `/global/docs.css` classes from Task 1, including `wend-ramp-grid`/`wend-ramp-step-label`/`wend-ramp-name-label`/`wend-ramp-swatch`/`wend-ramp-swatch--base` (moved verbatim from the old `index.html`) and `wend-scale-row`/`wend-type-row`.
- Consumes: token CSS custom properties — ramp colors (`--color-{linen,mist,citron,lilac,indigo,midnight}-{50..950}`), `--spacing-{xs,sm,md,lg,xl,2xl}`, `--radius-{sm,md,lg,full}`, `--font-size-{sm,md,lg,xl}`, `--font-weight-{regular,medium,bold}`, `--font-line-height-{tight,base}` — all already defined by `@wend-ui/tokens`' built CSS, loaded via the existing Stencil `globalStyle` bundle.
- Consumes: `.wend-surface` class from `@wend-ui/styles`' existing `base.css` (already loaded via the same `globalStyle` bundle, not part of the new `docs.css`).

- [ ] **Step 1: Create `packages/web-components/src/foundations.html`**

```html
<!doctype html>
<html dir="ltr" lang="en">
  <head>
    <meta charset="utf-8" />
    <title>wend-ui — Foundations</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Funnel+Sans:wght@300;400;500;600;700;800&display=swap"
    />
    <link rel="stylesheet" href="/build/wend-ui-web-components.css" />
    <link rel="stylesheet" href="/global/docs.css" />
    <script type="module" src="/build/wend-ui-web-components.esm.js"></script>
    <script nomodule src="/build/wend-ui-web-components.js"></script>
  </head>
  <body>
    <nav class="wend-nav">
      <a class="wend-nav__brand" href="index.html">wend-ui</a>
      <div class="wend-nav__links">
        <a href="get-started.html">Get Started</a>
        <a href="foundations.html" aria-current="page">Foundations</a>
        <a href="components.html">Components</a>
      </div>
    </nav>

    <div class="wend-page">
      <div class="wend-section">
        <h2>Color</h2>
        <p style="margin: 0 0 var(--spacing-sm)">Color ramps (global/color.json)</p>
        <div class="wend-ramp-grid">
          <span></span>
          <span class="wend-ramp-step-label">50</span>
          <span class="wend-ramp-step-label">100</span>
          <span class="wend-ramp-step-label">200</span>
          <span class="wend-ramp-step-label">300</span>
          <span class="wend-ramp-step-label">400</span>
          <span class="wend-ramp-step-label">500</span>
          <span class="wend-ramp-step-label">600</span>
          <span class="wend-ramp-step-label">700</span>
          <span class="wend-ramp-step-label">800</span>
          <span class="wend-ramp-step-label">900</span>
          <span class="wend-ramp-step-label">950</span>
        </div>
        <div id="ramp-rows"></div>

        <div style="max-width: 360px; margin-top: var(--spacing-lg)">
          <div class="wend-surface" style="padding: var(--spacing-md)">
            <p style="margin: 0 0 var(--spacing-sm)">Card (color-surface-card)</p>
            <div
              style="
                background-color: var(--color-surface-card-recessed);
                border-radius: var(--radius-sm);
                padding: var(--spacing-sm);
              "
            >
              Recessed well (color-surface-card-recessed)
            </div>
          </div>

          <div
            style="
              margin-top: var(--spacing-md);
              background-color: var(--color-surface-canvas-recessed);
              border-radius: var(--radius-sm);
              padding: var(--spacing-sm);
            "
          >
            Recessed well on the page itself (color-surface-canvas-recessed)
          </div>
        </div>
      </div>

      <div class="wend-section">
        <h2>Spacing</h2>
        <div class="wend-scale-row">
          <span class="wend-scale-row__label">spacing-xs (4px)</span>
          <div class="wend-scale-row__box" style="width: var(--spacing-xs); height: 24px"></div>
        </div>
        <div class="wend-scale-row">
          <span class="wend-scale-row__label">spacing-sm (8px)</span>
          <div class="wend-scale-row__box" style="width: var(--spacing-sm); height: 24px"></div>
        </div>
        <div class="wend-scale-row">
          <span class="wend-scale-row__label">spacing-md (16px)</span>
          <div class="wend-scale-row__box" style="width: var(--spacing-md); height: 24px"></div>
        </div>
        <div class="wend-scale-row">
          <span class="wend-scale-row__label">spacing-lg (24px)</span>
          <div class="wend-scale-row__box" style="width: var(--spacing-lg); height: 24px"></div>
        </div>
        <div class="wend-scale-row">
          <span class="wend-scale-row__label">spacing-xl (32px)</span>
          <div class="wend-scale-row__box" style="width: var(--spacing-xl); height: 24px"></div>
        </div>
        <div class="wend-scale-row">
          <span class="wend-scale-row__label">spacing-2xl (48px)</span>
          <div class="wend-scale-row__box" style="width: var(--spacing-2xl); height: 24px"></div>
        </div>
      </div>

      <div class="wend-section">
        <h2>Radius</h2>
        <div class="wend-scale-row">
          <span class="wend-scale-row__label">radius-sm (4px)</span>
          <div class="wend-scale-row__box" style="width: 48px; height: 48px; border-radius: var(--radius-sm)"></div>
        </div>
        <div class="wend-scale-row">
          <span class="wend-scale-row__label">radius-md (8px)</span>
          <div class="wend-scale-row__box" style="width: 48px; height: 48px; border-radius: var(--radius-md)"></div>
        </div>
        <div class="wend-scale-row">
          <span class="wend-scale-row__label">radius-lg (16px)</span>
          <div class="wend-scale-row__box" style="width: 48px; height: 48px; border-radius: var(--radius-lg)"></div>
        </div>
        <div class="wend-scale-row">
          <span class="wend-scale-row__label">radius-full (9999px)</span>
          <div
            class="wend-scale-row__box"
            style="width: 48px; height: 48px; border-radius: var(--radius-full)"
          ></div>
        </div>
      </div>

      <div class="wend-section">
        <h2>Typography</h2>
        <p style="margin: 0 0 var(--spacing-md)">
          Font family: <code class="wend-code" style="display: inline">'Funnel Sans', sans-serif</code>
        </p>

        <div class="wend-type-row">
          <div class="wend-type-row__label">font-size-sm (14px)</div>
          <div style="font-size: var(--font-size-sm)">The quick brown fox jumps over the lazy dog</div>
        </div>
        <div class="wend-type-row">
          <div class="wend-type-row__label">font-size-md (16px)</div>
          <div style="font-size: var(--font-size-md)">The quick brown fox jumps over the lazy dog</div>
        </div>
        <div class="wend-type-row">
          <div class="wend-type-row__label">font-size-lg (20px)</div>
          <div style="font-size: var(--font-size-lg)">The quick brown fox jumps over the lazy dog</div>
        </div>
        <div class="wend-type-row">
          <div class="wend-type-row__label">font-size-xl (28px)</div>
          <div style="font-size: var(--font-size-xl)">The quick brown fox jumps over the lazy dog</div>
        </div>

        <div class="wend-type-row">
          <div class="wend-type-row__label">font-weight-regular (400)</div>
          <div style="font-weight: var(--font-weight-regular); font-size: var(--font-size-md)">
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
        <div class="wend-type-row">
          <div class="wend-type-row__label">font-weight-medium (500)</div>
          <div style="font-weight: var(--font-weight-medium); font-size: var(--font-size-md)">
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
        <div class="wend-type-row">
          <div class="wend-type-row__label">font-weight-bold (700)</div>
          <div style="font-weight: var(--font-weight-bold); font-size: var(--font-size-md)">
            The quick brown fox jumps over the lazy dog
          </div>
        </div>

        <div class="wend-type-row">
          <div class="wend-type-row__label">font-line-height-tight (1.2)</div>
          <div style="line-height: var(--font-line-height-tight); font-size: var(--font-size-md); max-width: 320px">
            The quick brown fox jumps over the lazy dog and keeps running past the fence line into the field beyond
          </div>
        </div>
        <div class="wend-type-row">
          <div class="wend-type-row__label">font-line-height-base (1.5)</div>
          <div style="line-height: var(--font-line-height-base); font-size: var(--font-size-md); max-width: 320px">
            The quick brown fox jumps over the lazy dog and keeps running past the fence line into the field beyond
          </div>
        </div>
      </div>
    </div>

    <script>
      const ramps = ['linen', 'mist', 'citron', 'lilac', 'indigo', 'midnight'];
      const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      const rows = document.getElementById('ramp-rows');
      for (const name of ramps) {
        const row = document.createElement('div');
        row.className = 'wend-ramp-grid';
        const label = document.createElement('span');
        label.textContent = name;
        label.className = 'wend-ramp-name-label';
        row.appendChild(label);
        for (const step of steps) {
          const swatch = document.createElement('div');
          swatch.className = 'wend-ramp-swatch';
          swatch.style.backgroundColor = `var(--color-${name}-${step})`;
          if (step === '500') swatch.classList.add('wend-ramp-swatch--base');
          row.appendChild(swatch);
        }
        rows.appendChild(row);
      }
    </script>
  </body>
</html>
```

- [ ] **Step 2: Verify the ramp-generating script and structure are intact**

Run: `grep -c "ramp-rows" packages/web-components/src/foundations.html`
Expected: `2` (one `id="ramp-rows"` div, one `getElementById('ramp-rows')` reference)

- [ ] **Step 3: Commit**

```bash
git add packages/web-components/src/foundations.html
git commit -m "add Foundations docs page (color, spacing, radius, typography)"
```

---

### Task 4: Components page

**Files:**
- Create: `packages/web-components/src/components.html`

**Interfaces:**
- Consumes: `/global/docs.css` classes from Task 1 (`wend-nav`, `wend-page`, `wend-section`, `wend-props-table`, `wend-code`).
- Consumes: `wend-button`'s actual props (`variant`: `"primary" | "secondary"`, default `'primary'`; `disabled`: `boolean`, default `false`) — copied from `packages/web-components/src/components/wend-button/readme.md`'s auto-generated properties table. If `wend-button`'s props ever change, update this table to match the regenerated `readme.md`.
- Consumes: `.wend-stack` class from `@wend-ui/styles`' existing `base.css` (already loaded via the existing Stencil `globalStyle` bundle, not part of the new `docs.css`).

- [ ] **Step 1: Create `packages/web-components/src/components.html`**

```html
<!doctype html>
<html dir="ltr" lang="en">
  <head>
    <meta charset="utf-8" />
    <title>wend-ui — Components</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Funnel+Sans:wght@300;400;500;600;700;800&display=swap"
    />
    <link rel="stylesheet" href="/build/wend-ui-web-components.css" />
    <link rel="stylesheet" href="/global/docs.css" />
    <script type="module" src="/build/wend-ui-web-components.esm.js"></script>
    <script nomodule src="/build/wend-ui-web-components.js"></script>
  </head>
  <body>
    <nav class="wend-nav">
      <a class="wend-nav__brand" href="index.html">wend-ui</a>
      <div class="wend-nav__links">
        <a href="get-started.html">Get Started</a>
        <a href="foundations.html">Foundations</a>
        <a href="components.html" aria-current="page">Components</a>
      </div>
    </nav>

    <div class="wend-page">
      <div class="wend-section">
        <h2>Button</h2>

        <p style="margin: 0 0 var(--spacing-sm)">Examples</p>
        <div class="wend-stack" style="margin-bottom: var(--spacing-lg)">
          <wend-button variant="primary">Primary button</wend-button>
          <wend-button variant="secondary">Secondary button</wend-button>
          <wend-button variant="primary" disabled>Disabled button</wend-button>
        </div>

        <p style="margin: 0 0 var(--spacing-sm)">Usage</p>
        <code class="wend-code" style="margin-bottom: var(--spacing-lg)"
          >&lt;wend-button variant="primary"&gt;Label&lt;/wend-button&gt;</code
        >

        <p style="margin: 0 0 var(--spacing-sm)">Props</p>
        <table class="wend-props-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Attribute</th>
              <th>Description</th>
              <th>Type</th>
              <th>Default</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>disabled</code></td>
              <td><code>disabled</code></td>
              <td>Disables the button.</td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
            </tr>
            <tr>
              <td><code>variant</code></td>
              <td><code>variant</code></td>
              <td>Visual style of the button.</td>
              <td><code>"primary" | "secondary"</code></td>
              <td><code>'primary'</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </body>
</html>
```

- [ ] **Step 2: Verify all three button examples and the props table are present**

Run: `grep -c "wend-button" packages/web-components/src/components.html`
Expected: `4` (3 usage examples + 1 in the usage code snippet)

Run: `grep -c "<tr>" packages/web-components/src/components.html`
Expected: `3` (1 header row + 2 prop rows)

- [ ] **Step 3: Commit**

```bash
git add packages/web-components/src/components.html
git commit -m "add Components docs page (button examples, props, usage)"
```

---

### Task 5: Cover page (rewrite index.html)

**Files:**
- Modify: `packages/web-components/src/index.html` (full rewrite — the existing button-demo and color-ramp content moved to Tasks 3/4 already covers that content elsewhere, so it's removed here, not duplicated)

**Interfaces:**
- Consumes: `/global/docs.css` classes from Task 1 (`wend-nav`, `wend-hero`, `wend-hero__ctas`).
- Consumes: `wend-button`'s `variant` prop (same as Task 4) for the two CTA buttons.

- [ ] **Step 1: Replace the full contents of `packages/web-components/src/index.html`**

```html
<!doctype html>
<html dir="ltr" lang="en">
  <head>
    <meta charset="utf-8" />
    <title>wend-ui</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Funnel+Sans:wght@300;400;500;600;700;800&display=swap"
    />
    <link rel="stylesheet" href="/build/wend-ui-web-components.css" />
    <link rel="stylesheet" href="/global/docs.css" />
    <script type="module" src="/build/wend-ui-web-components.esm.js"></script>
    <script nomodule src="/build/wend-ui-web-components.js"></script>
  </head>
  <body>
    <nav class="wend-nav">
      <a class="wend-nav__brand" href="index.html">wend-ui</a>
      <div class="wend-nav__links">
        <a href="get-started.html">Get Started</a>
        <a href="foundations.html">Foundations</a>
        <a href="components.html">Components</a>
      </div>
    </nav>

    <div class="wend-hero">
      <h1>wend-ui</h1>
      <p>A calm, considered design system.</p>
      <div class="wend-hero__ctas">
        <wend-button variant="primary" onclick="location.href = 'get-started.html'">Get Started</wend-button>
        <wend-button variant="secondary" onclick="location.href = 'components.html'">View Components</wend-button>
      </div>
    </div>
  </body>
</html>
```

- [ ] **Step 2: Verify the old demo content is gone and the hero is present**

Run: `grep -c "ramp-rows" packages/web-components/src/index.html`
Expected: `0` (moved to `foundations.html` in Task 3)

Run: `grep -c "wend-hero" packages/web-components/src/index.html`
Expected: `3` (the class on the container, plus `wend-hero__ctas`, so 2 occurrences of the string "wend-hero" as a prefix match — confirm at least 1 exact `class="wend-hero"` match)

- [ ] **Step 3: Commit**

```bash
git add packages/web-components/src/index.html
git commit -m "rewrite index.html as the wend-ui cover page"
```

---

### Task 6: Full build and browser verification

**Files:** none created/modified — this task only verifies Tasks 1-5 together.

**Interfaces:** none (integration verification only).

- [ ] **Step 1: Full clean build**

```bash
npm run build -w packages/tokens
npm run build -w packages/styles
npm run build -w packages/web-components
```

Expected: all three succeed with no errors.

- [ ] **Step 2: Confirm all 4 pages and docs.css exist in the build output**

```bash
ls packages/web-components/www/index.html \
   packages/web-components/www/get-started.html \
   packages/web-components/www/foundations.html \
   packages/web-components/www/components.html \
   packages/web-components/www/global/docs.css
```

Expected: all 5 files listed, no "No such file" errors.

- [ ] **Step 3: Start the dev server and verify in browser**

Use the `preview_start` tool with the `web-components-dev` launch config (or run `npm run dev:components` if working outside the harness).

For each of the 4 pages (`/`, `/get-started.html`, `/foundations.html`, `/components.html`):
- Load the page and take a screenshot.
- Confirm the nav bar renders with `wend-ui` on the left and the 3 links on the right.
- Confirm the correct nav link shows the active-state color/weight for that page (no active link on the cover page).
- Click each of the 3 nav links and confirm navigation lands on the correct page.
- Check the browser console for errors (`preview_console_logs` with `level: "error"`).

Expected: no console errors on any page; nav highlighting and navigation both correct; Foundations page shows the color ramp grid, spacing/radius scale rows, and typography specimens; Components page shows the 3 button examples plus the props table; cover page shows the hero and both CTAs, and clicking each CTA navigates correctly.

- [ ] **Step 4: Final commit (only if Step 3 surfaced fixes)**

If Step 3 required any fixes to files from Tasks 1-5, stage and commit them:

```bash
git add packages/web-components
git commit -m "fix docs site issues found during browser verification"
```

If no fixes were needed, skip this step — nothing to commit.
