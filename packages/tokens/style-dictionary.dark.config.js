const { figmaFlatTokensFormat } = require('./scripts/figma-format.js');

// Separate config (rather than a second platform in style-dictionary.config.js) because
// light and dark need genuinely different merged token trees — Style Dictionary's `source`
// isn't safely overridable per-platform, and if both light+dark semantic files were merged
// into one tree, dark values would just clobber light ones for every overlapping token path.
//
// Both `semantic/color.json` (light/base) AND `semantic/color.dark.json` (overrides) are
// included here, in that order — Style Dictionary merges by path with later files winning,
// so overridden tokens (e.g. surface.canvas) resolve to their dark value, while tokens
// color.dark.json doesn't mention (e.g. text.on-primary) still resolve via the light file.
// This is required for `component/**` to resolve at all: button.text.primary references
// `{color.text.on-primary}`, which would be an unresolved reference if only color.dark.json
// were in source.
module.exports = {
  // Both the token-path collisions (color.json vs color.dark.json intentionally defining
  // the same paths — that's the override mechanism) and the css platform's "filtered
  // token references" notice (referenced globals live in variables.css's :root, not this
  // filtered file, resolved via normal CSS cascade at runtime) are expected here — verified
  // the actual build output is correct in both cases, so silencing the noise rather than
  // leaving a warning every build that has nothing actionable behind it.
  log: { warnings: 'disabled' },
  source: [
    'tokens/global/**/*.json',
    'tokens/semantic/color.json',
    'tokens/semantic/color.dark.json',
    'tokens/component/**/*.json'
  ],
  hooks: {
    formats: {
      'figma/flat-tokens': figmaFlatTokensFormat
    }
  },
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/css/',
      files: [
        {
          destination: 'variables-dark.css',
          format: 'css/variables',
          filter: (token) => token.filePath.endsWith('color.dark.json'),
          options: {
            selector: '[data-theme="dark"]',
            outputReferences: true
          }
        }
      ]
    },
    figma: {
      transforms: ['name/kebab'],
      buildPath: 'build/figma/',
      files: [
        {
          // No filter here (unlike the css platform above) — this needs every token
          // fully resolved in the dark context, including ones whose dark value is
          // identical to light (e.g. spacing) or only *transitively* different via a
          // component-tier reference (e.g. button.background.primary), so the merge
          // script can zip it 1:1 against tokens-light.json by name.
          destination: 'tokens-dark.json',
          format: 'figma/flat-tokens'
        }
      ]
    }
  }
};
