import { readFileSync, writeFileSync } from 'node:fs';

// Both inputs are now fully-resolved sets covering every token (tokens-dark.json
// resolves the whole tree — global + component included — in the dark context, not
// just the tokens semantic/color.dark.json explicitly overrides). Zipping by name
// is enough; tokens that don't actually differ between modes just end up with
// identical light/dark values.
const light = JSON.parse(readFileSync('build/figma/tokens-light.json', 'utf8'));
const dark = JSON.parse(readFileSync('build/figma/tokens-dark.json', 'utf8'));
const darkByName = new Map(dark.map((token) => [token.name, token.value]));

const merged = light.map((token) => ({
  name: token.name,
  type: token.type,
  values: {
    light: token.value,
    dark: darkByName.get(token.name) ?? token.value
  }
}));

writeFileSync('build/figma/tokens.json', JSON.stringify(merged, null, 2) + '\n');
const differing = merged.filter((token) => token.values.light !== token.values.dark).length;
console.log(`figma tokens.json: merged ${merged.length} tokens (${differing} differ between light and dark)`);
