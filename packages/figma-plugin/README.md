# @wend-ui/figma-plugin

A Figma plugin that syncs [`@wend-ui/tokens`](../tokens) into [Figma Variables](https://help.figma.com/hc/en-us/articles/15339657135383-Overview-of-variables-collections-and-modes) — one variable collection (`wend-ui tokens`), one variable per token, re-run any time to update in place.

> Figma Variables require a Professional/Organization/Enterprise plan — they aren't available on the Starter (free) plan.

## Build

```sh
npm run build -w packages/tokens        # produces build/figma/tokens.json
npm run build -w packages/figma-plugin  # bundles dist/code.js and dist/ui.html
```

## Load into Figma

1. Open the Figma desktop app → menu → **Plugins → Development → Import plugin from manifest…**
2. Select `packages/figma-plugin/manifest.json`.
3. Run the plugin from **Plugins → Development → wend-ui Tokens**.
4. Paste the contents of `packages/tokens/build/figma/tokens.json` into the textarea and click **Import into Figma Variables**.

Colors are converted from hex to Figma's RGBA format; spacing/radius/font-size/line-height/font-weight are parsed to plain numbers (unit stripped); everything else (e.g. font family) is imported as a string. Re-running the import updates existing variables by name rather than duplicating them.

## How it works

- `src/code.ts` — the plugin's sandboxed main-thread code. Uses `figma.variables` to find-or-create the `wend-ui tokens` collection and its variables, and to set values on the collection's default mode.
- `src/ui.ts` / `src/ui.template.html` — the plugin UI (an iframe): a textarea for pasting token JSON, and status reporting. Communicates with `code.ts` via `postMessage`.
- `esbuild.config.mjs` — bundles both scripts with esbuild (`iife` format, since Figma's plugin runtime doesn't support ES module entry points) and inlines the UI bundle into `dist/ui.html`, since Figma plugin UIs must be a single self-contained HTML file.

This is manual/paste-based rather than a live network fetch, since Figma plugin `manifest.json` requires allowlisting specific domains for network access — pasting keeps the plugin usable without any hosting infrastructure. If you later want live sync, add a `networkAccess` block to `manifest.json` and fetch the JSON from the UI iframe instead.
