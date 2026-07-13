# Wend UI product roadmap — design

## Purpose

This is a strategic product plan, not a technical implementation spec. It decomposes "turn Wend UI into a product businesses can install, theme, extend, and stay in sync with" into ordered, independently-specable phases. Each phase gets its own detailed design doc + implementation plan when it's actually picked up — this document exists to sequence the work and define what "done" means for each piece before that happens.

## Vision & goals

Wend UI becomes a product that business clients — often needing to align products across a legacy codebase — can install self-serve, re-theme via design tokens, extend via composition, and keep in sync with. Paid support is a safety net for anything self-serve doesn't cover, not the primary path.

**What "done" looks like at a high level:**

- A client can `npm install` Wend UI, apply their own token overrides, and ship a themed product without forking source.
- A client can compose new variants/components on top of Wend's primitives without touching Wend's internals.
- A client's Claude Code (or similar agent) session can install/theme/extend Wend UI correctly using a shipped skill, without the client needing deep design-system expertise.
- A client can generate and host their own themed docs site, reflecting their customizations, without manual upkeep.
- A client (or their agent) can check whether their customized copy has drifted from the latest Wend UI release, and see what changed.

## Target customer & delivery model

- **Audience:** business clients needing a design system to align products, frequently with legacy codebases — not open-source/public discovery.
- **Delivery model:** self-serve with a paid support tier as an upsell, not a requirement. The tooling (skill, docs, MCP) needs to stand on its own without Wend's team in the loop per client.
- **Distribution:** private/scoped registry — GitHub Packages — for the development phase. Not public npm.

## Why foundation-first sequencing

Three of the five subsystems (skill, docs template, MCP) all depend on the client customization format and a real versioned release process existing first:

- The skill teaches theming/extension correctly — it needs the format to teach to be stable.
- The docs template renders themed examples — it needs the override format to run against.
- The MCP diffs a client's copy against upstream — it needs real versioned releases with changelog data to diff against.

Building any of these before Phase 0/1 are settled means reworking them once the format changes. Sequencing below reflects that dependency order.

## Phase 0 — Foundation

**Goal:** produce the stable, machine-readable substrate everything else reads from.

**Scope:**
- **Structured source-of-truth exports.** Tokens already export machine-readable JSON (Style Dictionary + Figma DTCG); components already get a Stencil-generated `docs.json`. Phase 0 adds a manifest format for the skill (once Phase 3 exists) and a top-level "product manifest" tying tokens + components + skill version together per release — the shared input for Phase 4 (docs) and Phase 5 (MCP).
- **Versioning & release process.** Adopt a real changeset/semver workflow (e.g. Changesets) across the monorepo, producing a real `CHANGELOG.md` per package plus a rolled-up "what changed in Wend UI vX" summary. This changelog data is what Phase 5's MCP diffs a client's pinned version against.
- **Distribution.** Packages publish to a private registry — GitHub Packages — for the development phase (decided; revisit later if the audience or model changes).

**Explicitly out of scope:** any client-facing theming, extension, or docs work — this phase only produces the internal substrate.

**Current state (as of this writing):** no changesets/versioning tooling exists; all packages sit at `0.1.0`; no CHANGELOG; no publish workflow. This is greenfield work, not already solved.

**Done when:** a real versioned release exists with a published changelog + manifest in the private registry.

## Phase 1 — Theming/customization architecture

**Goal:** clients override brand tokens (colors, spacing, radius, typography) without forking Wend's source, and can adopt Wend UI into one part of a legacy app without clobbering existing global styles.

**Key architectural decision:** reuse the existing token pipeline rather than building a second theming system. Wend's tokens already compile via Style Dictionary into CSS custom properties (`build/css/variables.css` / `variables-dark.css`), and components read from those variables. Phase 1 formalizes this as a first-class, supported workflow:

- **Client override format:** clients author a small token file following the same global/semantic JSON schema Wend uses internally (`packages/tokens/tokens/global/**`, `semantic/**`), containing only the values they want to change. This compiles — via the same Style Dictionary pipeline, exposed as a small CLI/build step — into an override CSS file the client loads after Wend's base CSS.
- **Scoping strategy for legacy adoption:** support overrides at two levels — `:root` (whole-app rebrand) or a scoping selector/attribute (e.g. `[data-wend-theme]`) — so a client can adopt Wend UI into one section of a legacy app without touching global styles elsewhere.
- **Partial overrides are first-class:** overriding just brand colors and leaving spacing/radius/typography at Wend defaults is the common case, not the exception.

**Explicitly out of scope:** component extension/composition (Phase 2); drift detection between a client's override file and new Wend tokens (Phase 5).

**Done when:** a test override file changing 3 tokens reflects correctly with zero edits to Wend source.

## Phase 2 — Extension/composition patterns

**Goal:** clients add new variants/behavior by composing on top of Wend's components, not by forking them.

**Context worth noting:** `wend-button` uses Stencil's `shadow: false, scoped: true` (scoped-CSS emulation, not real Shadow DOM), and `variant` is a closed TS union (`'primary' | 'secondary'`). This means `::part()` isn't available as an extension mechanism (it requires real shadow roots), and a client cannot add their own `variant="tertiary"` today without Wend adding it upstream — a real gap, not just a documentation gap.

**Scope:**
- **Open the variant escape hatch.** Components accept their typed enum as a convenience, but also accept an arbitrary string that maps to a client-defined CSS class/custom-property set — so a client can define a `"tertiary"` look using the same component-tier token pattern Wend uses internally (e.g. `button-background-tertiary`), without Wend's source needing to know about it.
- **Slots stay the primary composition surface** for content — Phase 2 documents this pattern and extends it to future components as they're built, rather than introducing a new mechanism.
- **Wrapper-component pattern documented as the standard way to compose** (e.g. a client's own `<acme-cta-button>` wrapping `<wend-button>`) — a documentation/pattern deliverable, not new library code.

**Explicitly out of scope:** the deep "eject and own a forked copy" path — this is the rare exception, not a first-class supported path, and isn't part of this roadmap unless real client demand surfaces later.

**Done when:** a wrapper component demonstrates the variant escape hatch + slot composition, with unmodified Wend source.

## Phase 3 — Consumer-facing Claude Code skill

**Goal:** a client's agent session can install, theme, and extend Wend UI correctly without the client needing deep design-system expertise — and the skill never goes stale as components/tokens change.

**Scope:**
- **Skill teaches the Phase 0–2 workflows:** installing from the private registry (incl. auth setup), scaffolding a client token-override file, applying the legacy-adoption scoping strategy, and using the variant-escape-hatch/wrapper-component pattern — mirroring the SKILL.md pattern already used internally in this repo.
- **Key decision: the skill reads live structured data instead of hardcoding a component/token list into prose.** A static "here are Wend UI's components" section goes stale the moment a new component ships. Since Phase 0 produces structured, versioned metadata, the skill queries that data at use-time (current component list, current props, current token names) rather than embedding a list that needs manual updates.
- **Distribution:** bundled with the npm install — a postinstall/setup step copies the SKILL.md into the client's `.claude/skills/`, tied to the exact package version installed. No separate distribution channel.
- **Versioned alongside the rest of the product**, tracked in Phase 0's release manifest, so Phase 5's drift-checker can tell a client "your skill is 2 versions behind."

**Done when:** a fresh agent session installs, themes, and extends Wend UI end-to-end in a sample project using only the skill.

## Phase 4 — Themeable docs site template

**Goal:** Wend's own docs site (currently hand-authored per [`2026-07-10-docs-website-design.md`](2026-07-10-docs-website-design.md)) becomes generated from Phase 0's structured data, and that same generator becomes a template a client can run against their own token overrides to get their own branded, hostable docs site.

**Scope:**
- **Wend's own site converts from hand-authored HTML to generated output:** Foundations' token tables and Components' props tables generate from the same structured data (token JSON, `docs.json`) Phase 0 established, so the site can't drift from the actual source.
- **The generator becomes a reusable template:** a client runs it against their own token-override file to get a version of the docs site reflecting their brand's actual values, optionally including their own wrapper components alongside Wend's base component docs.
- **Output stays plain static HTML** (no server dependency), deploying the same way Wend's own site does today — GitHub Pages, Vercel, an internal server, wherever the client wants.
- **Tooling stays hand-rolled:** a small Node build script + simple templates, no new framework/SSG dependency — consistent with the existing docs-site philosophy of rejecting a router and a dedicated nav component for being overkill at this scale.

**Done when:** running the generator against a themed override produces a correctly branded, deployable static site.

## Phase 5 — Client-facing MCP (upstream drift/update checker)

**Goal:** a client (or their agent) can ask "is my copy of Wend UI behind, and what changed?" — modeled on the same `get_*`/`diff_*` tool pattern the internal `design-sync-mcp` already established, but pointed at upstream releases instead of Figma.

**Scope:**
- **Reads the client's local state:** installed package versions and their token-override file (Phase 1 format).
- **Reads Wend's published release manifest** (Phase 0's changelog/manifest data) from the private registry.
- **Tools:** `check_for_updates` (is a newer version published), `diff_against_upstream` (what tokens/components/skill changed since the client's pinned version), and breaking-change detection — flagging a token the client's override file references that got renamed or removed upstream, which would otherwise silently break their build.
- **Distribution:** bundled the same way as the skill — installed as an npm dependency, client registers it in their own `.mcp.json`, same integration pattern as the internal tool.

**Why this is last:** it's meaningless until Phase 0's versioned release/changelog process exists and there's at least one real prior release to diff against.

**Done when:** the MCP correctly reports "N versions behind, here's what changed" against a real two-release history.

## Cross-cutting concerns

- **Legacy codebase interop (risk, not a phase):** components use Stencil's `scoped: true` (not real Shadow DOM), so CSS isolation is emulated via generated class scoping, not a true shadow boundary — a legacy app's global resets/`!important` rules could still bleed in. Needs documented guidance and real testing against at least one messy legacy stylesheet during Phase 1/2.
- **Paid support tier:** not a phase in this technical roadmap — it's a services/business offering layered on top of the self-serve product. Revisit once Phases 0–5 exist and there's data on what actually generates support requests.
- **Release cadence:** Phase 0 establishes *how* releases work (versioning, changelog); *how often* to cut them is an operational decision better made once there's a real pilot client pulling updates.

## Success criteria summary

| Phase | Done when... |
|---|---|
| 0 — Foundation | A real versioned release exists with a published changelog + manifest in the private registry |
| 1 — Theming | A test override file changing 3 tokens reflects correctly with zero edits to Wend source |
| 2 — Extension | A wrapper component demonstrates the variant escape hatch + slot composition, unmodified Wend source |
| 3 — Skill | A fresh agent session installs, themes, and extends Wend UI end-to-end in a sample project using only the skill |
| 4 — Docs template | Running the generator against a themed override produces a correctly branded, deployable static site |
| 5 — MCP | The MCP correctly reports "N versions behind, here's what changed" against a real two-release history |

## Next steps

This document sequences the work; it does not implement any of it. When a phase is picked up, it goes through its own brainstorming → design → implementation-plan cycle, scoped to just that phase. Recommended order: Phase 0 first (nothing else can be built correctly without it), then Phase 1, then 2 through 5 in order.
