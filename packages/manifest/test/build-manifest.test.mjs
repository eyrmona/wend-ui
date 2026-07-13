import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildManifest } from '../src/build-manifest.mjs';

test('buildManifest passes through version and tokens, reshapes components, defaults skill to null', () => {
  const result = buildManifest({
    version: '1.2.3',
    tokens: [{ name: 'color-text-primary', type: 'COLOR', values: { light: '#111111', dark: '#eeeeee' } }],
    components: [
      {
        tag: 'wend-button',
        docs: 'A clickable button.',
        props: [
          { name: 'variant', type: '"primary" | "secondary"', default: '"primary"', docs: 'Visual style.' }
        ],
        slots: [{ name: '', docs: 'Button label content.' }]
      }
    ],
    now: () => new Date('2026-07-13T00:00:00.000Z')
  });

  assert.equal(result.version, '1.2.3');
  assert.equal(result.generatedAt, '2026-07-13T00:00:00.000Z');
  assert.equal(result.skill, null);
  assert.deepEqual(result.tokens, [
    { name: 'color-text-primary', type: 'COLOR', values: { light: '#111111', dark: '#eeeeee' } }
  ]);
  assert.deepEqual(result.components, [
    {
      tag: 'wend-button',
      description: 'A clickable button.',
      props: [{ name: 'variant', type: '"primary" | "secondary"', default: '"primary"', docs: 'Visual style.' }],
      slots: [{ name: '(default)', docs: 'Button label content.' }]
    }
  ]);
});

test('buildManifest defaults skill to null when not provided and handles multiple components', () => {
  const result = buildManifest({
    version: '0.1.0',
    tokens: [],
    components: [
      { tag: 'wend-button', docs: 'A button.', props: [], slots: [] },
      { tag: 'wend-card', docs: 'A card.', props: [], slots: [] }
    ]
  });

  assert.equal(result.skill, null);
  assert.equal(result.components.length, 2);
  assert.equal(result.components[1].tag, 'wend-card');
});
