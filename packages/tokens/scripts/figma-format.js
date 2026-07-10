const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const NUMERIC = /^-?\d+(\.\d+)?(px)?$/;

/**
 * Infers the Figma variable type from the token's *resolved* value shape,
 * rather than its source category — needed because component tokens (e.g.
 * `button.background.primary`) don't live under `color`/`spacing`/`font`
 * themselves, they just resolve (via references) to values that do.
 *
 * Shared between style-dictionary.config.js (light) and
 * style-dictionary.dark.config.js (dark) — both must produce identically
 * named/typed entries so the merge step can line them up by name.
 */
function toFigmaEntry(token) {
  const name = token.path.join('-');
  const value = String(token.value);

  if (HEX_COLOR.test(value)) {
    return { name, type: 'COLOR', value };
  }

  if (NUMERIC.test(value)) {
    return { name, type: 'FLOAT', value: parseFloat(value) };
  }

  return { name, type: 'STRING', value };
}

function figmaFlatTokensFormat({ dictionary }) {
  const entries = dictionary.allTokens.map(toFigmaEntry);
  return JSON.stringify(entries, null, 2) + '\n';
}

module.exports = { toFigmaEntry, figmaFlatTokensFormat };
