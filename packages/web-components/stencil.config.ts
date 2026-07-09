import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'wend-ui-web-components',
  globalStyle: 'src/global/global.css',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader'
    },
    {
      type: 'dist-custom-elements'
    },
    {
      type: 'docs-readme'
    },
    {
      type: 'docs-json',
      file: 'dist/docs.json'
    },
    {
      type: 'www',
      serviceWorker: null
    }
  ]
};
