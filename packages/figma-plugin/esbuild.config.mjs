import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });

await build({
  entryPoints: ['src/code.ts'],
  outfile: 'dist/code.js',
  bundle: true,
  format: 'iife',
  target: 'es2017'
});

const uiBundle = await build({
  entryPoints: ['src/ui.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2017',
  write: false
});

const uiScript = uiBundle.outputFiles[0].text;
const template = await readFile('src/ui.template.html', 'utf8');
await writeFile('dist/ui.html', template.replace('__UI_SCRIPT__', uiScript));
