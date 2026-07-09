import { readFileSync, existsSync } from 'node:fs';
import { componentsDocsFile } from './paths.js';

export interface ComponentSummary {
  tag: string;
  description: string;
  props: Array<{ name: string; type: string; default?: string; docs?: string }>;
  slots: Array<{ name: string; docs?: string }>;
}

interface StencilDocsJson {
  components: Array<{
    tag: string;
    docs: string;
    props: Array<{ name: string; type: string; default?: string; docs?: string }>;
    slots: Array<{ name: string; docs?: string }>;
  }>;
}

/**
 * Reads Stencil's generated docs-json manifest (packages/web-components/dist/docs.json).
 * Requires `npm run build -w packages/web-components` to have been run at least once.
 */
export function listComponents(): ComponentSummary[] {
  if (!existsSync(componentsDocsFile)) {
    throw new Error(
      'packages/web-components/dist/docs.json not found. Run `npm run build -w packages/web-components` first.'
    );
  }

  const docs = JSON.parse(readFileSync(componentsDocsFile, 'utf8')) as StencilDocsJson;

  return docs.components.map((component) => ({
    tag: component.tag,
    description: component.docs,
    props: component.props.map(({ name, type, default: defaultValue, docs }) => ({
      name,
      type,
      default: defaultValue,
      docs
    })),
    slots: component.slots.map(({ name, docs }) => ({ name: name || '(default)', docs }))
  }));
}

export interface FigmaComponentProperty {
  name: string;
  type: 'VARIANT' | 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP';
  variantOptions?: string[];
  defaultValue?: string | boolean;
}

interface NamedEntity {
  kind: 'prop' | 'slot';
  name: string;
  type?: string;
  default?: string;
  docs?: string;
}

export interface ComponentDiff {
  tag: string;
  onlyInCode: NamedEntity[];
  onlyInFigma: FigmaComponentProperty[];
  matched: Array<{
    name: string;
    code: NamedEntity;
    figma: FigmaComponentProperty;
    optionsMatch?: boolean;
    codeOptions?: string[];
    figmaOptions?: string[];
  }>;
}

/** Strips Figma's `#id:id` suffix from a component property key, e.g. "Label#10:1" -> "Label". */
function normalizeName(name: string): string {
  return name.replace(/#.*$/, '').trim().toLowerCase();
}

/** Extracts literal values from a TS string-union type, e.g. `"primary" | "secondary"` -> ['primary', 'secondary']. Returns null if the type isn't a plain string-literal union. */
function parseUnionLiteral(type: string): string[] | null {
  const parts = type.split('|').map((part) => part.trim());
  const literals = parts.map((part) => {
    const match = part.match(/^"([^"]*)"$/) ?? part.match(/^'([^']*)'$/);
    return match ? match[1] : null;
  });
  return literals.every((literal) => literal !== null) ? literals : null;
}

/**
 * Compares a wend-ui component's code-side props/slots against a caller-supplied
 * snapshot of its Figma component properties. Matching is name-based only (case-insensitive,
 * Figma's `#id:id` suffix stripped) — it does not guess semantic equivalence between
 * differently-named things (e.g. a code `disabled` prop and a Figma `State` variant axis
 * both surface as unmatched, since that mapping is a design decision, not something to infer).
 */
export function diffComponent(tag: string, figmaProperties: FigmaComponentProperty[]): ComponentDiff {
  const component = listComponents().find((c) => c.tag === tag);
  if (!component) {
    throw new Error(`No component with tag "${tag}" found in packages/web-components' docs.json.`);
  }

  const codeEntities = new Map<string, NamedEntity>();
  for (const prop of component.props) {
    codeEntities.set(normalizeName(prop.name), {
      kind: 'prop',
      name: prop.name,
      type: prop.type,
      default: prop.default,
      docs: prop.docs
    });
  }
  for (const slot of component.slots) {
    codeEntities.set(normalizeName(slot.name), { kind: 'slot', name: slot.name, docs: slot.docs });
  }

  const figmaEntities = new Map<string, FigmaComponentProperty>();
  for (const prop of figmaProperties) {
    figmaEntities.set(normalizeName(prop.name), prop);
  }

  const onlyInCode = [...codeEntities.entries()].filter(([key]) => !figmaEntities.has(key)).map(([, entity]) => entity);
  const onlyInFigma = [...figmaEntities.entries()]
    .filter(([key]) => !codeEntities.has(key))
    .map(([, entity]) => entity);

  const matched = [...codeEntities.entries()]
    .filter(([key]) => figmaEntities.has(key))
    .map(([key, code]) => {
      const figma = figmaEntities.get(key)!;
      const codeOptions = code.type ? parseUnionLiteral(code.type) : null;
      const figmaOptions = figma.variantOptions ?? null;
      const hasOptions = codeOptions !== null && figmaOptions !== null;

      return {
        name: code.name,
        code,
        figma,
        ...(hasOptions
          ? {
              codeOptions,
              figmaOptions,
              optionsMatch:
                codeOptions.length === figmaOptions.length &&
                codeOptions.every((option) =>
                  figmaOptions.some((figmaOption) => figmaOption.toLowerCase() === option.toLowerCase())
                )
            }
          : {})
      };
    });

  return { tag, onlyInCode, onlyInFigma, matched };
}
