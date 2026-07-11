// Canonical, mode-correct Figma state fetcher for use with design-sync-mcp's diff_tokens.
//
// Paste this verbatim into a use_figma call's `code` parameter (read-only, no `figma-use`
// pitfalls to worry about beyond the standard ones). Returns a flat array shaped exactly
// like diff_tokens expects: { name, type, values: { light, dark } }.
//
// WHY THIS EXISTS: a hand-rolled version of this resolver was rewritten from memory twice
// in one session and both times had the same bug -- when a variable's value is itself an
// alias into ANOTHER multi-mode variable (e.g. button-background-primary -> action.primary,
// both in the "semantic" collection), the nested lookup used that target's first mode
// (modes[0], "Light") unconditionally instead of following whichever mode the outer call
// was actually resolving. That silently produced wrong "dark" values for every variable
// that chains through another multi-mode variable, showing up as false-positive drift in
// diff_tokens. This version threads the mode name through every recursive hop so it can't
// happen again -- use this file instead of re-deriving the resolver.

function rgbToHex(c) {
  const h = (n) => Math.round(n * 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

const collectionCache = new Map();
async function getCollection(id) {
  if (!collectionCache.has(id)) collectionCache.set(id, await figma.variables.getVariableCollectionByIdAsync(id));
  return collectionCache.get(id);
}

async function resolveValue(value, modeName) {
  if (value && value.type === 'VARIABLE_ALIAS') {
    const target = await figma.variables.getVariableByIdAsync(value.id);
    const targetCollection = await getCollection(target.variableCollectionId);
    const targetMode = targetCollection.modes.find((m) => m.name === modeName) ?? targetCollection.modes[0];
    return resolveValue(target.valuesByMode[targetMode.modeId], modeName);
  }
  return value;
}

const collections = await figma.variables.getLocalVariableCollectionsAsync();
const result = [];

for (const c of collections) {
  for (const varId of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(varId);
    const modes = c.modes;
    const lightMode = modes.find((m) => m.name === 'Light') ?? modes[0];
    const darkMode = modes.find((m) => m.name === 'Dark') ?? lightMode;

    let lightVal = await resolveValue(v.valuesByMode[lightMode.modeId], 'Light');
    let darkVal = await resolveValue(v.valuesByMode[darkMode.modeId], 'Dark');

    if (v.resolvedType === 'COLOR') {
      lightVal = rgbToHex(lightVal);
      darkVal = rgbToHex(darkVal);
    }

    result.push({ name: v.name, type: v.resolvedType, values: { light: lightVal, dark: darkVal } });
  }
}

return result;
