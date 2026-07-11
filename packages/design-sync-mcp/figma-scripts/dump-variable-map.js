// Regenerates the ID map for figma-sync-state.json.
//
// Paste this verbatim into a use_figma call's `code` parameter (read-only). Run it whenever
// collections/variables are created, renamed, or deleted in Figma, then copy the returned
// JSON's "collections" value into figma-sync-state.json's "collections" key by hand (update
// "lastVerified" too). Variables detached from a collection's variableIds but still
// resolvable via getVariableByIdAsync (see fetch-current-state.js) won't appear here --
// check figma-sync-state.json's "_orphaned" entries for known cases of that.

const collections = await figma.variables.getLocalVariableCollectionsAsync();
const result = {};

for (const c of collections) {
  const modes = {};
  for (const m of c.modes) modes[m.name] = m.modeId;

  const variables = {};
  for (const varId of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(varId);
    variables[v.name] = v.id;
  }

  result[c.name] = { collectionId: c.id, modes, variables };
}

return result;
