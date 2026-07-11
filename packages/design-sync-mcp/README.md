# @wend-ui/design-sync-mcp

A local [MCP](https://modelcontextprotocol.io/) server that gives an AI agent (e.g. Claude Code) grounded, always-fresh context about this specific project — design tokens and web component metadata — for keeping Figma in sync.

## Why this doesn't push to Figma directly

Figma's REST Variables API — the only way to push variable changes to Figma headlessly, without an agent or a human in Figma — is **available only on the Enterprise plan**. On Professional/Organization plans, the way to write to Figma (variables, components, anything) is Figma's own official Dev Mode MCP server's `use_figma` tool, driven by an agent that writes and validates Plugin API code live in the session.

So this server stays intentionally read/diff-only and never talks to Figma itself. It does the part that's fully deterministic and automatable — keeping the **project side** (tokens, component metadata) authoritative and fresh, and diffing it against whatever Figma state an agent fetches via Figma's own MCP server — while the actual write to Figma happens through `use_figma` in the same Claude Code session, informed by that diff.

## Tools

- **`get_tokens`** — the wend-ui design tokens as a flat `{ name, type, values: { light, dark } }` list — mode-aware, matching Figma's native per-collection modes. Tokens with no dark override just have `light === dark`. Rebuilds `packages/tokens` automatically first if the source JSON has changed since the last build, so it never returns a stale snapshot.
- **`diff_tokens`** — given a snapshot of Figma's current variables (same shape — read each variable's value for both the Light and Dark mode IDs), returns `{ onlyInProject, onlyInFigma, changed }`. Light and dark are diffed independently: `changed` entries carry a `mode: 'light' | 'dark'` field, so a token that's only wrong in one mode doesn't get reported as if the whole thing were broken.
- **`list_components`** — the web components' tags, descriptions, props, and slots, read from Stencil's generated `dist/docs.json`. Read-only: component → Figma-component mapping isn't automated, since there's no automatic way to derive Figma variants/auto-layout from a web component's API.
- **`diff_component`** — given a component tag and a snapshot of its Figma component's `componentPropertyDefinitions`, returns `{ onlyInCode, onlyInFigma, matched }`. Matching is name-based only (case-insensitive) — it won't guess that, say, a code `disabled` prop corresponds to a Figma `State` variant axis; differently-named things just show up as unmatched on both sides so a human/agent judges the mapping instead of the tool silently guessing.

## Pushing to Figma

There's no dedicated push tool or plugin — tokens and components are pushed into Figma from within a Claude Code session, using Figma's official Dev Mode MCP server's `use_figma` tool (see the `figma-use`/`figma-generate-library` skills that ship with it). The typical flow: `get_tokens`/`list_components` here for the project's current state, Figma's own MCP read tools for Figma's current state, `diff_tokens`/`diff_component` to see what's actually different, then `use_figma` to apply the change.

### Variable collection structure in Figma

Tokens push into **two** Figma variable collections, not one flat collection — mirroring the project's own token tiers (`packages/tokens/tokens/global/**` and `semantic/**` + `component/**`, the latter folded into "semantic" on the Figma side):

- **`global`** — the primitive scale (`linen-*`/`mist-*`/`citron-*`/`lilac-*`/`indigo-*`/`midnight-*` ramps, plus `radius-*`, `spacing-*`, `font-*`). Single mode (`Value`) — primitives don't change with theme, so there's no Light/Dark split here.
- **`semantic`** — everything else: `color-text-*`/`color-surface-*`/`color-border-*`/`color-action-*`/`color-feedback-*` and the component-tier `button-*` tokens. Has **Light** and **Dark** modes. Each variable's value is a `VARIABLE_ALIAS` pointing at the `global` collection (or, for `button-*`, at another `semantic` variable) rather than a resolved literal — matching how the source JSON itself references tokens (e.g. `button.background.primary` → `{color.action.primary}` → `{color.midnight.500}`). This means changing a global primitive in Figma propagates to every semantic/component token that references it, the same as the build pipeline.

When reconciling `diff_tokens` output against this structure, resolve each Figma variable's alias chain down to a literal value before comparing — the diff tool works on flat resolved values, and aliasing is purely a Figma-side authoring convenience. **Use [`figma-scripts/fetch-current-state.js`](figma-scripts/fetch-current-state.js) for this** (see below) rather than writing the resolver by hand — a hand-rolled version of it had a real bug (see next section) that produced false-positive drift.

## Efficient syncing: `figma-sync-state.json` + `figma-scripts/`

Every Figma-side push or check in a fresh session otherwise starts from zero: rediscover every collection/variable/node ID via a `use_figma` read, then hand-write the alias-resolution logic again. Two things here cut that out:

- **[`figma-sync-state.json`](figma-sync-state.json)** — a checked-in map of `{ collectionId, modes, variables: { name: id } }` per collection, plus the canvas node IDs bound to button variants. Variable IDs are stable in Figma once created, so a `use_figma` push can reference a known ID directly instead of re-fetching it first. Regenerate the `collections` value with [`figma-scripts/dump-variable-map.js`](figma-scripts/dump-variable-map.js) whenever collections/variables change, and bump `lastVerified`.
- **[`figma-scripts/fetch-current-state.js`](figma-scripts/fetch-current-state.js)** — the canonical, mode-correct resolver for fetching Figma's current variable state in the exact shape `diff_tokens` expects. Paste it verbatim into a `use_figma` call rather than re-deriving the resolution logic — see the comment at the top of that file for the specific bug this avoids repeating (nested aliases into another multi-mode variable resolving via the wrong mode).

**Trust but verify**: `figma-sync-state.json` goes stale the moment someone renames or deletes a variable/node directly in Figma outside this workflow. Before relying on an ID that's more than a session or two old, spot-check a handful with `getVariableByIdAsync` (returns `undefined` if gone) rather than assuming the file is current — the same way you'd treat any cached snapshot of external state.

## Setup

```sh
npm install
npm run build -w packages/design-sync-mcp
```

This project's root [`.mcp.json`](../../.mcp.json) already registers the server for Claude Code. **Restart Claude Code (or reconnect MCP servers)** after building for the first time — MCP servers are loaded at session start.
