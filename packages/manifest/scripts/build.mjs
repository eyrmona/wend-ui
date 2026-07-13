#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildManifest } from '../src/build-manifest.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(here, '..');
const repoRoot = path.resolve(packageDir, '../..');

const tokensFile = path.join(repoRoot, 'packages/tokens/build/figma/tokens.json');
const docsFile = path.join(repoRoot, 'packages/web-components/dist/docs.json');

if (!existsSync(tokensFile)) {
  throw new Error(`${tokensFile} not found. Run \`npm run build -w packages/tokens\` first.`);
}
if (!existsSync(docsFile)) {
  throw new Error(`${docsFile} not found. Run \`npm run build -w packages/web-components\` first.`);
}

const version = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8')).version;
const tokens = JSON.parse(readFileSync(tokensFile, 'utf8'));
const docs = JSON.parse(readFileSync(docsFile, 'utf8'));

const manifest = buildManifest({ version, tokens, components: docs.components, skill: null });

mkdirSync(path.join(packageDir, 'dist'), { recursive: true });
writeFileSync(path.join(packageDir, 'dist/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(
  `Wrote packages/manifest/dist/manifest.json (version ${version}, ${manifest.tokens.length} tokens, ${manifest.components.length} components)`
);
