# @wend-ui/web-components

Framework-agnostic web components for the wend-ui design system, built with [Stencil](https://stenciljs.com/). Components are styled with CSS custom properties from [`@wend-ui/tokens`](../tokens), and the dev preview loads [`@wend-ui/styles`](../styles) as a global stylesheet.

## Develop

```sh
npm run dev:components
```

Starts the Stencil dev server against `src/index.html`, rebuilding on change.

## Build

```sh
npm run build -w packages/web-components
```

Outputs a `dist` custom elements bundle, an ESM/CJS loader, generated component docs, and (via `reactOutputTarget` in `stencil.config.ts`) regenerates the React wrappers in [`packages/react`](../react).

## Components

- `<wend-button variant="primary" | "secondary" disabled>` — see [`src/components/wend-button`](src/components/wend-button).
