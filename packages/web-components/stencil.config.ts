import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';

export const config: Config = {
  namespace: 'wend-ui-web-components',
  globalStyle: 'src/global/global.css',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader'
    },
    {
      type: 'dist-custom-elements',
      externalRuntime: false
    },
    reactOutputTarget({
      outDir: '../react/src/',
      esModules: true
    }),
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
