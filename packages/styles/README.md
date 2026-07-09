# @wend-ui/styles

Base CSS (reset + a handful of layout utilities) for the wend-ui design system, built on top of [`@wend-ui/tokens`](../tokens).

## Build

```sh
npm run build -w packages/styles
```

Bundles `src/index.css` (tokens + reset + base utilities) into `dist/index.css` via PostCSS (`postcss-import`, `autoprefixer`, `cssnano`).

## Usage

```css
@import '@wend-ui/styles';
```
