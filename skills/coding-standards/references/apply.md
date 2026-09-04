# Apply to a repository

Leave working checks using existing tools, short local agent guidance, and an
honest adoption record. The current repository is the target unless the user
names another. An existing adoption belongs on the sync path.

## Steps

1. **Inspect the target, including unrepresented stacks.**

   Read manifests, source directories, subprojects, existing agent guidance,
   tool configuration, dependency versions, normal check commands, and CI.
   Identify generated and vendored paths that are not target source.

   The catalog's `ecosystems.*.detect` entries are hints, not an exhaustive
   language detector. Use repository evidence to identify other stacks. For
   each unrepresented ecosystem, follow the translation workflow loaded by the entrypoint and bring
   its proposed mapping back here. Do not stop at a missing catalog column or
   modify the catalog as a prerequisite. If there is genuinely no code or
   identifiable target, report that limitation instead of inventing a stack.

   Done when the actual stack and existing checks are understood, including
   their scope and any local decisions the adoption must preserve.

2. **Choose checks and guidance by principle.**

   Read the shared adoption policy loaded by the entrypoint. Build the mapping from the catalog principles
   to this target's tools and local guidance. Prefer a native check already
   provided by the repository or its dependencies. Treat broad architectural
   and test-quality judgments as guidance rather than syntax prohibitions.

   Bundled presets are optional candidates. Their `applies` fields suggest
   relevance; they do not select an entire preset on the user's behalf. Inspect
   every rule a proposed preset enables. Use the whole preset only when its
   rules fit the adoption; otherwise configure selected dependency-owned rules
   directly. Do not write a preset-filtering framework or load a custom checker
   just because it exists. Keep already-active checks unless the user chooses
   to change them.

   Show the proposed checks, guidance, partial coverage, gaps, and exceptions.
   Done when every relevant principle has a disposition and proposed changes
   are grounded in the target rather than a default toolchain.

3. **Get permission for dependency changes.**

   Inspect installed versions first. Ask before installing, upgrading, or
   replacing any tool, with exact packages and versions, why they are needed,
   and their important maintenance, security, licensing, runtime, and size
   trade-offs. Use the target's package manager and dependency layout.

   For a selected bundle, its catalog package pins describe the supported
   versions; include runtime tooling it needs, such as ESLint itself. Do not
   install packages belonging to unselected presets. For an existing native
   integration, use that version's supported settings rather than forcing a
   catalog pin. No dependency change means no installation question is needed.

   If a proposal is declined, leave dependent config inactive and record the
   gap. Continue with the checks and guidance that can be applied safely.

   Done when every dependency change has a decision and no proposed active
   config imports an unavailable package.

4. **Wire only the selected checks.**

   Extend the active configuration; do not create a competing config that
   shadows it. Scope checks to real source, excluding generated output and
   vendored files. Reuse the target's task runner and existing lint/check
   command, including its CI invocation when present. Do not refactor target
   source or change runtime dependencies. Implement a selected target-owned
   check here when the shared adoption policy supports it; reuse the target's
   extension or scripting approach instead of building a lint framework.

   For ordinary native tools, follow their installed configuration mechanism.
   When selecting bundled assets, use the implementation notes below. Copy
   only tracked catalog content needed at runtime, not tests or tool caches.
   Source files or configs written by translation are target-owned, not
   upstream catalog copies.

   Done when selected tools are resolvable, their config reaches the intended
   source, and the target's normal command runs them. A guidance-only adoption
   can legitimately add no tool or runnable check; state that explicitly.

5. **Leave the guidance and records.**

   Write `lint/standards/ADOPTION.md` and the scoped agent-instruction pointer
   described in the shared adoption policy loaded by the entrypoint. Record proposed checks as unverified
   until the next step establishes coverage. Write the provenance manifest
   defined by the shared adoption policy, even when no catalog files were copied. Preserve existing guidance
   and user decisions rather than replacing them with the entire catalog.

   Done when future agents can discover the judgment guidance and the record
   separates active tools, proposed checks, gaps, and exceptions.

6. **Verify behavior and report.**

   Inspect effective settings for representative real source files and run each
   selected command. Use the tool's own config/reporting support, such as
   `eslint --print-config <source>` or the target tool's equivalent command.
   Confirm the normal task command and CI actually invoke the selected checks.
   A successful command alone does not prove a particular rule is enabled.

   Where effective settings do not establish the claimed behavior, use a
   bounded clean/violating example through the real tool, without changing
   target source or committing a fixture suite. Do not write tests of skill
   prose or add custom-linter test infrastructure as part of adoption.

   Report baseline violation counts from tool output. Existing source
   violations are a baseline, not permission to auto-fix, add suppressions, or
   weaken selected rules. Diagnose tool, parse, or configuration errors before
   continuing; leave affected coverage unverified rather than claiming success.
   Update the record from observed results. If the target has no CI, say so.

   Done when selected checks run with observed coverage, or are explicitly
   blocked; local guidance is discoverable; and every partial, uncovered, or
   excepted requirement remains visible. Offer source cleanup separately.

## Optional bundled implementations

These are wiring notes for assets selected in step 2, not a list to install.
If the target's own tool already supplies the needed behavior, configure that
tool instead. Do not add ESLint alongside another linter merely to reproduce
every catalog rule.

### ESLint

Bundled factories use flat config. Ask before migrating a legacy configuration
or changing the installed ESLint version. Add imports and entries to the
existing flat config rather than creating another one. Each factory's own
options are the authoritative interface; there is no preset index.

Use a standalone global `ignores` entry for generated output and
`lint/standards/**`. Scope each selected factory with `files`. Supply compiling
tsconfigs to the base resolver, not a solution-only config with `files: []`.
Keep type-aware parsing opt-in and configure its project scope when selected.
Use the preset's existing token-module exemptions where the target defines
its design tokens. Do not replace context-sensitive guidance with custom
syntax checks merely to make the preset count complete.

Factories import shared rules and `standards-plugin.mjs`. When using a bundled
JavaScript factory, vendor the tracked `eslint/` runtime tree under
`lint/standards/eslint/`, excluding `*.test.mjs`. Unused files are inert, not
enforced coverage; only imported factories belong in `manifest.presets`.

### Baselines and scripts

Catalog baselines and `enforcement.script` files are also optional. Copy a
selected baseline only when the target has no equivalent active configuration;
check alternate filenames and embedded package settings first. Never install
a tool just to adopt its baseline. Extend compiling tsconfigs when choosing
the strict baseline, preserving their local options and comments.

A selected script needs its interpreter, source scope, runnable command, and
observed behavior recorded just like any other check. Copy and wire it rather
than treating its presence in the catalog as enforcement.
