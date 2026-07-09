import { build } from 'esbuild';

// ESM-only: @wend-ui/web-components' per-component files (from Stencil's
// dist-custom-elements output target) are ESM-only, so a CJS build here
// would declare a require() path that throws at runtime.
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2019',
  jsx: 'automatic',
  external: ['react', 'react-dom', '@wend-ui/web-components', '@stencil/react-output-target/runtime']
});
