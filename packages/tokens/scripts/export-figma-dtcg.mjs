// Exports Figma-importable JSON files in the W3C Design Tokens Community Group (DTCG)
// format -- the schema Figma's native Variables panel "Import mode" action reads
// (right-click a mode > Import mode > select file). Import is per collection+mode, so
// this produces one file per mode: global/Value, semantic/Light, semantic/Dark.
//
// Values here are literal resolved hex, not DTCG alias syntax ({color.linen.500}) --
// each file targets a single mode in a single collection, and cross-collection aliasing
// isn't reliably preserved through this import path. If you want semantic variables to
// stay live-aliased to global ones (as they are when pushed via use_figma), that still
// needs the use_figma push, not this file import.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const tokens = JSON.parse(readFileSync(new URL('../build/figma/tokens.json', import.meta.url), 'utf8'));
const byName = new Map(tokens.map((t) => [t.name, t]));

function colorEntry(hex) {
  return { $type: 'color', $value: hex };
}

// global/Value -- the six named ramps (50-950) plus the two feedback-only exceptions.
const rampNames = ['linen', 'mist', 'citron', 'lilac', 'indigo', 'midnight'];
const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const global = { color: {} };
for (const name of rampNames) {
  global.color[name] = {};
  for (const step of steps) {
    const token = byName.get(`color-${name}-${step}`);
    global.color[name][step] = colorEntry(token.values.light);
  }
}
global.color.green = { 600: colorEntry(byName.get('color-green-600').values.light) };
global.color.red = { 600: colorEntry(byName.get('color-red-600').values.light) };

// semantic/Light and semantic/Dark -- same group shape as tokens/semantic/color*.json,
// one file per mode with that mode's resolved literal value.
const semanticNames = [
  ['text', 'primary'],
  ['text', 'secondary'],
  ['text', 'on-primary'],
  ['text', 'on-secondary'],
  ['surface', 'canvas'],
  ['surface', 'canvas-recessed'],
  ['surface', 'card'],
  ['surface', 'card-recessed'],
  ['border', 'default'],
  ['action', 'primary'],
  ['action', 'primary-hover'],
  ['action', 'secondary'],
  ['feedback', 'success'],
  ['feedback', 'warning'],
  ['feedback', 'danger']
];

function buildSemantic(mode) {
  const out = { color: {} };
  for (const [group, key] of semanticNames) {
    const token = byName.get(`color-${group}-${key}`);
    if (!token) continue;
    out.color[group] ??= {};
    out.color[group][key] = colorEntry(token.values[mode]);
  }
  return out;
}

const outDir = new URL('../build/figma/', import.meta.url);
mkdirSync(outDir, { recursive: true });
writeFileSync(new URL('dtcg-global.json', outDir), JSON.stringify(global, null, 2) + '\n');
writeFileSync(new URL('dtcg-semantic-light.json', outDir), JSON.stringify(buildSemantic('light'), null, 2) + '\n');
writeFileSync(new URL('dtcg-semantic-dark.json', outDir), JSON.stringify(buildSemantic('dark'), null, 2) + '\n');

console.log('Wrote build/figma/dtcg-global.json, dtcg-semantic-light.json, dtcg-semantic-dark.json');
