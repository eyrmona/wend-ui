/**
 * Builds the Wend UI product manifest — the machine-readable record of a
 * release's tokens, components, and (once it exists) shipped skill version.
 * Consumed by the docs generator (Phase 4) and the client-facing
 * update-check MCP (Phase 5).
 */
export function buildManifest({ version, tokens, components, skill = null, now = () => new Date() }) {
  return {
    version,
    generatedAt: now().toISOString(),
    tokens,
    components: components.map(({ tag, docs, props, slots }) => ({
      tag,
      description: docs,
      props: props.map(({ name, type, default: defaultValue, docs: propDocs }) => ({
        name,
        type,
        default: defaultValue,
        docs: propDocs
      })),
      slots: slots.map(({ name, docs: slotDocs }) => ({ name: name || '(default)', docs: slotDocs }))
    })),
    skill
  };
}
