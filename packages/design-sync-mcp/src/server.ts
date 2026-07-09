import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadTokens, diffTokens } from './tokens.js';
import { listComponents, diffComponent } from './components.js';

const server = new McpServer({
  name: 'wend-ui-design-sync',
  version: '0.1.0'
});

function jsonResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

server.registerTool(
  'get_tokens',
  {
    title: 'Get wend-ui design tokens',
    description:
      'Returns the wend-ui design tokens as a flat list of { name, type, value }, always freshly rebuilt from packages/tokens/tokens/*.json if the source has changed since the last build.'
  },
  () => jsonResult(loadTokens())
);

server.registerTool(
  'diff_tokens',
  {
    title: 'Diff wend-ui tokens against Figma variables',
    description:
      "Compares wend-ui's current tokens against a caller-supplied snapshot of Figma's variables (same { name, type, value } shape — normalize Figma colors to hex and dimensions to plain numbers before calling). Typically the caller fetches Figma's current variables via Figma's own MCP server first. Returns { onlyInProject, onlyInFigma, changed }.",
    inputSchema: {
      figmaVariables: z
        .array(
          z.object({
            name: z.string(),
            type: z.enum(['COLOR', 'FLOAT', 'STRING', 'BOOLEAN']),
            value: z.union([z.string(), z.number(), z.boolean()])
          })
        )
        .describe("Figma's current variables, normalized to wend-ui's flat token shape")
    }
  },
  ({ figmaVariables }) => jsonResult(diffTokens(figmaVariables))
);

server.registerTool(
  'list_components',
  {
    title: 'List wend-ui web components',
    description:
      "Returns wend-ui's web components (tag, description, props, slots) from packages/web-components' generated docs. Requires `npm run build -w packages/web-components` to have been run at least once. There is no automated push to Figma for components — use this for grounding when building or updating matching Figma components by hand."
  },
  () => jsonResult(listComponents())
);

server.registerTool(
  'diff_component',
  {
    title: 'Diff a wend-ui component against its Figma component',
    description:
      "Compares one wend-ui web component's props/slots (from packages/web-components' generated docs) against a caller-supplied snapshot of its Figma component's properties (typically read via the Figma MCP server's get_metadata/use_figma, e.g. componentPropertyDefinitions on a COMPONENT_SET). Matching is name-based only (case-insensitive, Figma's #id:id suffix stripped) — it will NOT guess that e.g. a code `disabled` prop corresponds to a Figma `State` variant axis; differently-named things surface as unmatched on both sides so the caller can judge the mapping. Returns { onlyInCode, onlyInFigma, matched }, where matched entries include an optionsMatch flag when both sides look enum-like.",
    inputSchema: {
      tag: z.string().describe('The web component tag, e.g. "wend-button"'),
      figmaProperties: z
        .array(
          z.object({
            name: z.string(),
            type: z.enum(['VARIANT', 'BOOLEAN', 'TEXT', 'INSTANCE_SWAP']),
            variantOptions: z.array(z.string()).optional(),
            defaultValue: z.union([z.string(), z.boolean()]).optional()
          })
        )
        .describe(
          "The Figma component's componentPropertyDefinitions, normalized to {name, type, variantOptions?, defaultValue?}"
        )
    }
  },
  ({ tag, figmaProperties }) => jsonResult(diffComponent(tag, figmaProperties))
);

const transport = new StdioServerTransport();
await server.connect(transport);
