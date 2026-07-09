# wend-ui

Agnostic design system, organized as an npm workspaces monorepo.

## Packages

| Package | Description |
| --- | --- |
| [`packages/tokens`](packages/tokens) | Design tokens (`@wend-ui/tokens`), authored as JSON and built with Style Dictionary into CSS, SCSS, and JS. |
| [`packages/styles`](packages/styles) | Base CSS (`@wend-ui/styles`) — reset and layout utilities built on top of the tokens. |
| [`packages/web-components`](packages/web-components) | Framework-agnostic web components (`@wend-ui/web-components`), built with [Stencil](https://stenciljs.com/). |
| [`packages/design-sync-mcp`](packages/design-sync-mcp) | Local MCP server (`@wend-ui/design-sync-mcp`) giving an AI agent live project context (tokens, component metadata) and Figma-diffing tools (`diff_tokens`, `diff_component`). Registered in [`.mcp.json`](.mcp.json). |

Dependency order: `tokens` → `styles` → `web-components`. `design-sync-mcp` consumes the tokens' Figma-flat JSON output but builds independently.

Tokens and components are pushed into Figma through Claude Code, using Figma's official Dev Mode MCP server's `use_figma` tool alongside `design-sync-mcp` — see [`packages/design-sync-mcp`](packages/design-sync-mcp) for how the two work together.

## Getting started

```sh
npm install
npm run build
```

`npm run build` builds each package in dependency order. To work on components with live reload:

```sh
npm run dev:components
```
