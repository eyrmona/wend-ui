# wend-ui

Agnostic design system, organized as an npm workspaces monorepo.

## Packages

| Package | Description |
| --- | --- |
| [`packages/tokens`](packages/tokens) | Design tokens (`@wend-ui/tokens`), authored as JSON and built with Style Dictionary into CSS, SCSS, and JS. |
| [`packages/styles`](packages/styles) | Base CSS (`@wend-ui/styles`) — reset and layout utilities built on top of the tokens. |
| [`packages/web-components`](packages/web-components) | Framework-agnostic web components (`@wend-ui/web-components`), built with [Stencil](https://stenciljs.com/). |

Dependency order: `tokens` → `styles` → `web-components`.

## Getting started

```sh
npm install
npm run build
```

`npm run build` builds each package in dependency order. To work on components with live reload:

```sh
npm run dev:components
```
