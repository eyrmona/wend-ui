/**
 * Maps a token's category (its top-level path segment) to a Figma variable
 * resolved type, and normalizes the value to match — hex strings stay as-is
 * (Figma color conversion happens in the plugin), unit strings like "16px"
 * or "1.5" are parsed down to plain numbers.
 */
function toFigmaEntry(token) {
  const [category, sub] = token.path;
  const name = token.path.join('-');

  if (category === 'color') {
    return { name, type: 'COLOR', value: token.value };
  }

  if (category === 'spacing' || category === 'radius') {
    return { name, type: 'FLOAT', value: parseFloat(token.value) };
  }

  if (category === 'font' && sub !== 'family') {
    return { name, type: 'FLOAT', value: parseFloat(token.value) };
  }

  return { name, type: 'STRING', value: String(token.value) };
}

module.exports = {
  source: ['tokens/**/*.json'],
  hooks: {
    formats: {
      'figma/flat-tokens': ({ dictionary }) => {
        const entries = dictionary.allTokens.map(toFigmaEntry);
        return JSON.stringify(entries, null, 2) + '\n';
      }
    }
  },
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/css/',
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables',
          options: {
            selector: ':root'
          }
        }
      ]
    },
    scss: {
      transformGroup: 'scss',
      buildPath: 'build/scss/',
      files: [
        {
          destination: '_variables.scss',
          format: 'scss/variables'
        }
      ]
    },
    js: {
      transformGroup: 'js',
      buildPath: 'build/js/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/module'
        }
      ]
    },
    figma: {
      transforms: ['name/kebab'],
      buildPath: 'build/figma/',
      files: [
        {
          destination: 'tokens.json',
          format: 'figma/flat-tokens'
        }
      ]
    }
  }
};
