const { figmaFlatTokensFormat } = require('./scripts/figma-format.js');

module.exports = {
  source: ['tokens/global/**/*.json', 'tokens/semantic/color.json', 'tokens/component/**/*.json'],
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
          destination: 'variables.css',
          format: 'css/variables',
          options: {
            selector: ':root',
            outputReferences: true
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
          destination: 'tokens-light.json',
          format: 'figma/flat-tokens'
        }
      ]
    }
  }
};
