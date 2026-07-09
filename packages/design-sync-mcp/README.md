# @wend-ui/design-sync-mcp

A local [MCP](https://modelcontextprotocol.io/) server that gives an AI agent (e.g. Claude Code) grounded, always-fresh context about this specific project — design tokens and web component metadata — for keeping Figma in sync.

## Why this doesn't push to Figma directly

Figma's REST Variables API — the only way to push variable changes to Figma headlessly, without an agent or a human in Figma — is **available only on the Enterprise plan**. On Professional/Organization plans, the way to write to Figma (variables, components, anything) is Figma's own official Dev Mode MCP server's `use_figma` tool, driven by an agent that writes and validates Plugin API code live in the session.

So this server stays intentionally read/diff-only and never talks to Figma itself. It does the part that's fully deterministic and automatable — keeping the **project side** (tokens, component metadata) authoritative and fresh, and diffing it against whatever Figma state an agent fetches via Figma's own MCP server — while the actual write to Figma happens through `use_figma` in the same Claude Code session, informed by that diff.

## Tools

- **`get_tokens`** — the wend-ui design tokens as a flat `{ name, type, value }` list. Rebuilds `packages/tokens` automatically first if the source JSON has changed since the last build, so it never returns a stale snapshot.
- **`diff_tokens`** — given a snapshot of Figma's current variables (same shape), returns `{ onlyInProject, onlyInFigma, changed }`.
- **`list_components`** — the web components' tags, descriptions, props, and slots, read from Stencil's generated `dist/docs.json`. Read-only: component → Figma-component mapping isn't automated, since there's no automatic way to derive Figma variants/auto-layout from a web component's API.
- **`diff_component`** — given a component tag and a snapshot of its Figma component's `componentPropertyDefinitions`, returns `{ onlyInCode, onlyInFigma, matched }`. Matching is name-based only (case-insensitive) — it won't guess that, say, a code `disabled` prop corresponds to a Figma `State` variant axis; differently-named things just show up as unmatched on both sides so a human/agent judges the mapping instead of the tool silently guessing.

## Pushing to Figma

There's no dedicated push tool or plugin — tokens and components are pushed into Figma from within a Claude Code session, using Figma's official Dev Mode MCP server's `use_figma` tool (see the `figma-use`/`figma-generate-library` skills that ship with it). The typical flow: `get_tokens`/`list_components` here for the project's current state, Figma's own MCP read tools for Figma's current state, `diff_tokens`/`diff_component` to see what's actually different, then `use_figma` to apply the change.

## Setup

```sh
npm install
npm run build -w packages/design-sync-mcp
```

This project's root [`.mcp.json`](../../.mcp.json) already registers the server for Claude Code. **Restart Claude Code (or reconnect MCP servers)** after building for the first time — MCP servers are loaded at session start.
