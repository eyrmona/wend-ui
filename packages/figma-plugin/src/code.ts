import type { FlatToken, ImportTokensMessage } from './tokenTypes';

const COLLECTION_NAME = 'wend-ui tokens';
const MODE_NAME = 'Value';

figma.showUI(__html__, { width: 360, height: 480 });

function hexToRgba(hex: string): RGBA {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.substring(0, 2), 16) / 255;
  const g = parseInt(normalized.substring(2, 4), 16) / 255;
  const b = parseInt(normalized.substring(4, 6), 16) / 255;
  const a = normalized.length === 8 ? parseInt(normalized.substring(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

async function getOrCreateCollection(name: string): Promise<VariableCollection> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  return collections.find((collection) => collection.name === name) ?? figma.variables.createVariableCollection(name);
}

async function syncTokens(tokens: FlatToken[]) {
  const collection = await getOrCreateCollection(COLLECTION_NAME);
  const modeId = collection.modes[0].modeId;
  if (collection.modes[0].name !== MODE_NAME) {
    collection.renameMode(modeId, MODE_NAME);
  }

  const existingVariables = await figma.variables.getLocalVariablesAsync();
  const existingByName = new Map(
    existingVariables.filter((variable) => variable.variableCollectionId === collection.id).map((variable) => [variable.name, variable])
  );

  let created = 0;
  let updated = 0;

  for (const token of tokens) {
    let variable = existingByName.get(token.name);
    if (variable) {
      updated += 1;
    } else {
      variable = figma.variables.createVariable(token.name, collection, token.type);
      created += 1;
    }

    const value = token.type === 'COLOR' ? hexToRgba(String(token.value)) : token.value;
    variable.setValueForMode(modeId, value);
  }

  return { created, updated, total: tokens.length };
}

figma.ui.onmessage = async (message: ImportTokensMessage) => {
  if (message.type !== 'import-tokens') {
    return;
  }

  try {
    const result = await syncTokens(message.tokens);
    figma.ui.postMessage({ type: 'import-result', ...result });
  } catch (error) {
    figma.ui.postMessage({
      type: 'import-error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
