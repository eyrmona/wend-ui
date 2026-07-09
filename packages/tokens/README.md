# @wend-ui/tokens

Design tokens for the wend-ui design system, defined once as JSON and built with [Style Dictionary](https://styledictionary.com/) into multiple output formats.

## Source

Token source files live in [`tokens/`](tokens), grouped by category (`color`, `spacing`, `radius`, `typography`).

## Build

```sh
npm run build -w packages/tokens
```

Outputs to `build/`:

- `build/css/variables.css` — CSS custom properties on `:root`
- `build/scss/_variables.scss` — Sass variables
- `build/js/tokens.js` — CommonJS module exporting the token tree

## Usage

```css
@import '@wend-ui/tokens/css';
```

```js
import tokens from '@wend-ui/tokens/js';
```

```scss
@import '@wend-ui/tokens/scss';
```
