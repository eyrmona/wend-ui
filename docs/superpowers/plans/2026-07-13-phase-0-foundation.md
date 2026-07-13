# Phase 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Wend UI a real versioned release process and a machine-readable product manifest (tokens + components + skill version) so later phases (client theming docs, the consumer skill, the upstream drift-checking MCP) have something stable to build on.

**Architecture:** A new `@wend-ui/manifest` package reads the existing build artifacts that `packages/tokens` and `packages/web-components` already produce (`build/figma/tokens.json`, `dist/docs.json`) and emits a single `dist/manifest.json` describing the release. Changesets manages fixed/locked versioning across the five publishable packages (`tokens`, `styles`, `web-components`, `react`, `manifest`) so they always share one version number. A GitHub Actions workflow automates the version-bump PR and publish step to GitHub Packages.

**Tech Stack:** `@changesets/cli` for versioning/changelogs, GitHub Packages (`npm.pkg.github.com`) as the private registry, Node's built-in `node:test` runner for the manifest package's tests (no new test framework — matches this repo's existing zero-dependency-test-tooling state), plain Node scripts (no build framework) for the manifest package itself.

## Global Constraints

- Node >= 18, npm >= 8 (from root `package.json` `engines`; `.nvmrc` pins 18).
- No new runtime dependencies beyond what's listed per task — this repo has intentionally stayed low-dependency (e.g. earlier phases in the wider roadmap explicitly rejected an SSG and a router for being overkill at this project's scale).
- `@wend-ui/design-sync-mcp` stays private and unpublished — it is Wend's own internal Figma-sync tool, not part of the client-facing product, and must NOT be added to the Changesets fixed group or published to the registry.
- Registry: private GitHub Packages (`https://npm.pkg.github.com`), scope `@wend-ui`, repo owner `eyrmona` (from `git remote -v`) — not public npm.
- Versioning: locked/fixed across `@wend-ui/tokens`, `@wend-ui/styles`, `@wend-ui/web-components`, `@wend-ui/react`, `@wend-ui/manifest` — all five always share one version number.
- Actually publishing to the registry (`changeset publish` / `npm publish`) is an external, hard-to-reverse action. No task in this plan runs it automatically — the last task verifies everything up to that point and leaves the live publish as a deliberate, separate action for the user (via the Task 5 workflow, triggered by merging to `main`).

---

### Task 1: Create the `@wend-ui/manifest` package

**Files:**
- Create: `packages/manifest/package.json`
- Create: `packages/manifest/src/build-manifest.mjs`
- Create: `packages/manifest/test/build-manifest.test.mjs`
- Create: `packages/manifest/scripts/build.mjs`
- Modify: `.gitignore:146-153` (add `packages/manifest/dist` to the "wend-ui package build output" block)

**Interfaces:**
- Produces: `buildManifest({ version, tokens, components, skill = null, now = () => new Date() })` — exported from `packages/manifest/src/build-manifest.mjs`. Returns `{ version, generatedAt, tokens, components, skill }` where `components` is reshaped from Stencil's raw `docs.json` component records (`{ tag, docs, props, slots }`) into `{ tag, description, props, slots }` (renaming `docs` → `description` on the component, keeping `props`/`slots` as-is with `slots[].name` defaulted to `'(default)'` when empty — this exact reshaping already exists in `packages/design-sync-mcp/src/components.ts`'s `listComponents()`, reused here in spirit but not imported, since `design-sync-mcp` is a private, unpublished package this one must not depend on).
- Later tasks rely on: `packages/manifest/dist/manifest.json` existing after `npm run build -w packages/manifest`, containing the shape above.

- [ ] **Step 1: Write the failing test for `buildManifest`**

Create `packages/manifest/test/build-manifest.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildManifest } from '../src/build-manifest.mjs';

test('buildManifest passes through version and tokens, reshapes components, defaults skill to null', () => {
  const result = buildManifest({
    version: '1.2.3',
    tokens: [{ name: 'color-text-primary', type: 'COLOR', values: { light: '#111111', dark: '#eeeeee' } }],
    components: [
      {
        tag: 'wend-button',
        docs: 'A clickable button.',
        props: [
          { name: 'variant', type: '"primary" | "secondary"', default: '"primary"', docs: 'Visual style.' }
        ],
        slots: [{ name: '', docs: 'Button label content.' }]
      }
    ],
    now: () => new Date('2026-07-13T00:00:00.000Z')
  });

  assert.equal(result.version, '1.2.3');
  assert.equal(result.generatedAt, '2026-07-13T00:00:00.000Z');
  assert.equal(result.skill, null);
  assert.deepEqual(result.tokens, [
    { name: 'color-text-primary', type: 'COLOR', values: { light: '#111111', dark: '#eeeeee' } }
  ]);
  assert.deepEqual(result.components, [
    {
      tag: 'wend-button',
      description: 'A clickable button.',
      props: [{ name: 'variant', type: '"primary" | "secondary"', default: '"primary"', docs: 'Visual style.' }],
      slots: [{ name: '(default)', docs: 'Button label content.' }]
    }
  ]);
});

test('buildManifest defaults skill to null when not provided and handles multiple components', () => {
  const result = buildManifest({
    version: '0.1.0',
    tokens: [],
    components: [
      { tag: 'wend-button', docs: 'A button.', props: [], slots: [] },
      { tag: 'wend-card', docs: 'A card.', props: [], slots: [] }
    ]
  });

  assert.equal(result.skill, null);
  assert.equal(result.components.length, 2);
  assert.equal(result.components[1].tag, 'wend-card');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test packages/manifest/test/`
Expected: FAIL — `Cannot find module '../src/build-manifest.mjs'` (the module doesn't exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `packages/manifest/src/build-manifest.mjs`:

```js
/**
 * Builds the Wend UI product manifest — the machine-readable record of a
 * release's tokens, components, and (once it exists) shipped skill version.
 * Consumed by the docs generator (Phase 4) and the client-facing
 * update-check MCP (Phase 5).
 */
export function buildManifest({ version, tokens, components, skill = null, now = () => new Date() }) {
  return {
    version,
    generatedAt: now().toISOString(),
    tokens,
    components: components.map(({ tag, docs, props, slots }) => ({
      tag,
      description: docs,
      props: props.map(({ name, type, default: defaultValue, docs: propDocs }) => ({
        name,
        type,
        default: defaultValue,
        docs: propDocs
      })),
      slots: slots.map(({ name, docs: slotDocs }) => ({ name: name || '(default)', docs: slotDocs }))
    })),
    skill
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test packages/manifest/test/`
Expected: PASS — both tests green.

- [ ] **Step 5: Create the package manifest and build script**

Create `packages/manifest/package.json`:

```json
{
  "name": "@wend-ui/manifest",
  "version": "0.1.0",
  "description": "Machine-readable manifest of a Wend UI release (tokens, components, skill version) consumed by the docs generator and the client-facing update-check MCP",
  "license": "MIT",
  "type": "module",
  "main": "dist/manifest.json",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "node scripts/build.mjs",
    "test": "node --test test/",
    "clean": "rimraf dist"
  },
  "devDependencies": {
    "rimraf": "^5.0.5"
  }
}
```

Create `packages/manifest/scripts/build.mjs`:

```js
#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildManifest } from '../src/build-manifest.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(here, '..');
const repoRoot = path.resolve(packageDir, '../..');

const tokensFile = path.join(repoRoot, 'packages/tokens/build/figma/tokens.json');
const docsFile = path.join(repoRoot, 'packages/web-components/dist/docs.json');

if (!existsSync(tokensFile)) {
  throw new Error(`${tokensFile} not found. Run \`npm run build -w packages/tokens\` first.`);
}
if (!existsSync(docsFile)) {
  throw new Error(`${docsFile} not found. Run \`npm run build -w packages/web-components\` first.`);
}

const version = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8')).version;
const tokens = JSON.parse(readFileSync(tokensFile, 'utf8'));
const docs = JSON.parse(readFileSync(docsFile, 'utf8'));

const manifest = buildManifest({ version, tokens, components: docs.components, skill: null });

mkdirSync(path.join(packageDir, 'dist'), { recursive: true });
writeFileSync(path.join(packageDir, 'dist/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(
  `Wrote packages/manifest/dist/manifest.json (version ${version}, ${manifest.tokens.length} tokens, ${manifest.components.length} components)`
);
```

- [ ] **Step 6: Add `packages/manifest/dist` to `.gitignore`**

In `.gitignore`, in the "wend-ui package build output" block (around line 146-153), add a line so it reads:

```
packages/tokens/build
packages/styles/dist
packages/web-components/dist
packages/manifest/dist
packages/design-sync-mcp/dist
packages/react/dist
```

- [ ] **Step 7: Install dependencies and verify the build script runs against real artifacts**

Run: `npm install`
Run: `npm run build -w packages/tokens && npm run build -w packages/web-components`
Run: `npm run build -w packages/manifest`
Expected: prints `Wrote packages/manifest/dist/manifest.json (version 0.1.0, N tokens, M components)` with `N` and `M` greater than 0. Inspect `packages/manifest/dist/manifest.json` and confirm it contains real token names (e.g. `color-text-primary`) and the `wend-button` component with its `variant`/`disabled` props.

- [ ] **Step 8: Commit**

```bash
git add packages/manifest .gitignore
git commit -m "$(cat <<'EOF'
Add @wend-ui/manifest package for release-level product metadata

Reads the existing tokens and component build artifacts and emits a
single dist/manifest.json (version, tokens, components, skill) that
later phases (docs generator, client-facing MCP) will consume.
EOF
)"
```

---

### Task 2: Wire the manifest build into the root build pipeline

**Files:**
- Modify: `package.json:12` (root `build` script)

**Interfaces:**
- Consumes: `npm run build -w packages/manifest` from Task 1.
- Produces: running root `npm run build` always produces an up-to-date `packages/manifest/dist/manifest.json` as the last step.

- [ ] **Step 1: Update the root build script**

In root `package.json`, change:

```json
"build": "npm run build -w packages/tokens && npm run build -w packages/styles && npm run build -w packages/web-components && npm run build -w packages/react && npm run build -w packages/design-sync-mcp",
```

to:

```json
"build": "npm run build -w packages/tokens && npm run build -w packages/styles && npm run build -w packages/web-components && npm run build -w packages/react && npm run build -w packages/design-sync-mcp && npm run build -w packages/manifest",
```

- [ ] **Step 2: Verify a clean full build produces the manifest**

Run: `npm run clean && npm run build`
Expected: build completes with no errors; final log line is the manifest package's `Wrote packages/manifest/dist/manifest.json ...` message. Run `cat packages/manifest/dist/manifest.json | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.version, d.tokens.length, d.components.length, d.skill)"` and confirm it prints something like `0.1.0 <number> <number> null`.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "$(cat <<'EOF'
Build @wend-ui/manifest as the last step of the root build pipeline

Ensures a full `npm run build` always produces an up-to-date release
manifest reflecting the current tokens and components.
EOF
)"
```

---

### Task 3: Add Changesets with fixed/locked versioning

**Files:**
- Modify: root `package.json` (devDependencies, scripts)
- Create: `.changeset/config.json`
- Create: `.changeset/README.md` (generated by `changeset init`)

**Interfaces:**
- Produces: `npm run changeset` (create a changeset), `npm run version-packages` (apply pending changesets — bump versions + write CHANGELOGs), `npm run release` (build then publish) — these three scripts are what Task 5's CI workflow and Task 6's manual release both call.

- [ ] **Step 1: Install Changesets and initialize**

Run: `npm install -D @changesets/cli`
Run: `npx changeset init`
Expected: creates `.changeset/config.json` and `.changeset/README.md`.

- [ ] **Step 2: Configure fixed versioning and ignore the private package**

Replace the generated `.changeset/config.json` with:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [
    ["@wend-ui/tokens", "@wend-ui/styles", "@wend-ui/web-components", "@wend-ui/react", "@wend-ui/manifest"]
  ],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@wend-ui/design-sync-mcp"]
}
```

This locks all five publishable packages to one shared version number, keeps `design-sync-mcp` (private, internal-only) out of Changesets entirely, and sets `access: restricted` (the correct setting for a scoped private-registry package — GitHub Packages inherits visibility from repo permissions, but Changesets still needs an explicit `access` value to publish scoped packages without erroring).

- [ ] **Step 3: Add root package.json scripts**

In root `package.json`, add to `scripts`:

```json
"changeset": "changeset",
"version-packages": "changeset version",
"release": "npm run build && changeset publish"
```

- [ ] **Step 4: Verify the config is valid and Changesets recognizes the workspace**

Run: `node -e "JSON.parse(require('fs').readFileSync('.changeset/config.json', 'utf8')); console.log('config valid JSON')"`
Expected: prints `config valid JSON`.

Run: `npx changeset status`
Expected: exits without crashing (message will be something like "No changesets present" or similar — the important thing is it does not error trying to resolve the five workspace package names).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .changeset
git commit -m "$(cat <<'EOF'
Add Changesets with fixed/locked versioning across public packages

Locks tokens, styles, web-components, react, and manifest to one
shared version number ("Wend UI vX"). design-sync-mcp stays private
and unmanaged by Changesets — it's Wend's internal tool, not part of
the client-facing product.
EOF
)"
```

---

### Task 4: Configure GitHub Packages as the publish registry

**Files:**
- Modify: `packages/tokens/package.json`
- Modify: `packages/styles/package.json`
- Modify: `packages/web-components/package.json`
- Modify: `packages/react/package.json`
- Modify: `packages/manifest/package.json`
- Create: `.npmrc`

**Interfaces:**
- Produces: every publishable package now resolves to `https://npm.pkg.github.com` when published; root `.npmrc` scopes `@wend-ui` package resolution (install and publish) to that registry.

- [ ] **Step 1: Add `publishConfig` to each of the five publishable packages**

In each of `packages/tokens/package.json`, `packages/styles/package.json`, `packages/web-components/package.json`, `packages/react/package.json`, and `packages/manifest/package.json`, add (after `"license"`):

```json
"publishConfig": {
  "registry": "https://npm.pkg.github.com"
},
```

- [ ] **Step 2: Create the root `.npmrc`**

Create `.npmrc`:

```
@wend-ui:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

This scopes any `@wend-ui/*` package resolution (install or publish) to GitHub Packages, and reads the auth token from the `GITHUB_TOKEN` environment variable rather than committing a real token. Note for later: clients installing these packages will need their own `.npmrc` with the same `@wend-ui:registry` line and a personal access token (`read:packages` scope) in place of `GITHUB_TOKEN` — that goes in the Phase 3 skill's install instructions, not here.

- [ ] **Step 3: Verify each package.json is valid and the registry is wired correctly**

Run: `for f in packages/tokens packages/styles packages/web-components packages/react packages/manifest; do node -e "const p=require('./$f/package.json'); if (p.publishConfig?.registry !== 'https://npm.pkg.github.com') { console.error('MISSING registry in $f'); process.exit(1); } console.log('$f OK');"; done`
Expected: prints `... OK` five times, no `MISSING registry` lines.

- [ ] **Step 4: Commit**

```bash
git add packages/tokens/package.json packages/styles/package.json packages/web-components/package.json packages/react/package.json packages/manifest/package.json .npmrc
git commit -m "$(cat <<'EOF'
Point publishable packages at GitHub Packages as the private registry

publishConfig.registry on each of the five public packages plus a
root .npmrc scoping @wend-ui resolution to npm.pkg.github.com. Chosen
per the product roadmap: private/scoped registry during the
development phase, not public npm.
EOF
)"
```

---

### Task 5: Add the GitHub Actions release workflow

**Files:**
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: `npm run build`, `npm run version-packages`, `npm run release` (all from Tasks 2–3).
- Produces: on push to `main`, either opens/updates a "Version Packages" PR (when unreleased changesets exist) or publishes to GitHub Packages (when a version-bump PR was just merged) — the standard `changesets/action` behavior.

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches:
      - main

permissions:
  contents: write
  packages: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@wend-ui'

      - name: Install dependencies
        run: npm install

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: npm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Verify the workflow YAML is well-formed**

Run: `node -e "console.log(require('js-yaml') ? '' : '')" 2>/dev/null; python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml')); print('YAML valid')"`
Expected: prints `YAML valid`. (If `python3`/`pyyaml` isn't available, instead open the file and visually confirm indentation matches the block above exactly — GitHub Actions will reject malformed YAML at the next push regardless.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "$(cat <<'EOF'
Add Changesets-based GitHub Actions release workflow

On push to main: opens/updates a Version Packages PR when changesets
are pending, or runs npm run release (build + changeset publish) to
GitHub Packages once that PR is merged.
EOF
)"
```

**Note:** this workflow's actual publish step has not run yet — it activates the first time this is pushed and a changeset exists (Task 6 creates one). No package has been published to GitHub Packages by this task alone.

---

### Task 6: Cut the first real versioned release

**Files:**
- Create: `.changeset/foundation-release.md`
- Modify: (generated by `changeset version`) `packages/tokens/package.json`, `packages/styles/package.json`, `packages/web-components/package.json`, `packages/react/package.json`, `packages/manifest/package.json`, plus a `CHANGELOG.md` created in each of those five package directories.

**Interfaces:**
- Consumes: everything from Tasks 1–4 (`changeset version`, root `build`).
- Produces: the first real, non-`0.1.0` locked version number across all five packages, with a real `CHANGELOG.md` per package and a manifest reflecting that version — the concrete artifact every later phase (skill, docs template, MCP) can finally point at as "the current release."

- [ ] **Step 1: Write the changeset**

Create `.changeset/foundation-release.md`:

```md
---
"@wend-ui/tokens": minor
"@wend-ui/styles": minor
"@wend-ui/web-components": minor
"@wend-ui/react": minor
"@wend-ui/manifest": minor
---

Add the @wend-ui/manifest package and Changesets-based fixed versioning,
GitHub Packages publishing, and a release automation workflow across the
client-facing packages. This is the first real versioned release of Wend
UI as a product — establishes the foundation later phases (theming,
extension patterns, the consumer skill, the docs template, and the
upstream drift-checking MCP) build on.
```

- [ ] **Step 2: Apply the version bump**

Run: `npm run version-packages`
Expected: `.changeset/foundation-release.md` is deleted; each of the five package's `package.json` version bumps from `0.1.0` to `0.2.0` (a `minor` bump per Changesets' fixed-group rules); each of the five package directories gets a `CHANGELOG.md` containing the changeset's text.

- [ ] **Step 3: Rebuild and verify the manifest reflects the new version**

Run: `npm run clean && npm run build`
Run: `node -e "const m=require('./packages/manifest/dist/manifest.json'); console.log(m.version, m.tokens.length, m.components.length, m.skill)"`
Expected: prints `0.2.0 <N> <M> null` where `N` and `M` match Task 1's counts.

- [ ] **Step 4: Commit the version bump**

```bash
git add packages/tokens/package.json packages/styles/package.json packages/web-components/package.json packages/react/package.json packages/manifest/package.json packages/tokens/CHANGELOG.md packages/styles/CHANGELOG.md packages/web-components/CHANGELOG.md packages/react/CHANGELOG.md packages/manifest/CHANGELOG.md
git commit -m "$(cat <<'EOF'
Version Packages: 0.2.0

First locked release across the five client-facing packages —
establishes the foundation (manifest, versioning, registry, release
workflow) the rest of the product roadmap builds on.
EOF
)"
```

- [ ] **Step 5: Leave the live publish as a deliberate follow-up**

Do NOT run `npm run release` / `changeset publish` as part of this task. Publishing to GitHub Packages is an external, effectively one-way action (the package becomes installable by anyone with registry read access). Once this commit is pushed and merged to `main`, the Task 5 workflow handles the actual publish automatically — that push is the point at which the user should decide to go ahead, not this plan.

---

## Phase 0 done-check

Per the roadmap's success criteria: "A real versioned release exists with a published changelog + manifest in the private registry." After Task 6, everything up to *publishing* is true and verified locally (version 0.2.0, real CHANGELOGs, a manifest reflecting that version). The remaining step — pushing to `main` and letting GitHub Actions actually publish — is an explicit action for the user to take when ready, not something this plan executes on its own.
