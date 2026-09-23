---
name: coding-standards
description: 'Read engineering expectations before implementation or review. Apply, sync, or translate repository enforcement only when explicitly requested.'
---

# Coding standards

Read expectations by default. Apply, sync or translate enforcement only when explicitly requested. The `catalog.json` principles govern; enforcement entries and presets are candidates, not proof of coverage or a mandate to install everything. For non-Node targets, find equivalent checks rather than copying JavaScript syntax or adding language packages to the catalog.

## Read expectations

Find `catalog.json` beside the entrypoint, or one directory up under `variants/`. Read every standard's `id`, `title`, `scope` and `principle`, including unenforced standards. Apply relevant principles and read the target's scoped agent guidance and `lint/standards/ADOPTION.md` if present. Preserve project exceptions; a missing adoption record does not block this mode.

Use relevant expectations during implementation. During review, including cold review, assess changed behavior and report relevant ids, evidence, exceptions and verification gaps. Apply the review workflow's findings criteria to supported violations; a missing linter or style preference alone is not a finding. Do not claim unassessed compliance.

Read expectations does not install tools, change configuration, create adoption records, sync files or authorize unrelated repairs. Return to the calling task. Load the adoption references only for an explicit enforcement request; shared-catalog edits use [catalog-format.md](references/catalog-format.md).

## Apply, sync, or translate

For the `tailwind-v4` preset, read [design-system integration guidance](README.md#tailwind-v4-design-system-checks) before deciding compatibility, component ownership, configuration and verification limits.

Resolve `catalog.json`'s real path to its Git checkout; a materialized `SKILL.md` may be a copy. Record the source remote URL and commit. Disclose a dirty source or a commit with no containing remote-tracking branch.

Read [adoption.md](references/adoption.md) for enforcement, guidance, partial coverage, gaps and exceptions. Resolve routine choices from the target; ask only about decisions requiring user authority or materially changing the result, and continue independent work meanwhile. Then follow the requested mode:

- **Apply:** inspect the stack; leave working checks, local guidance and an adoption record. Read [apply.md](references/apply.md).
- **Sync:** reconcile the adoption, vendored files, target choices and active configuration. Read [sync.md](references/sync.md).
- **Translate:** map principles to existing tools in the requested ecosystem. Read [translate.md](references/translate.md). During apply, translate unrepresented stacks then resume. Standalone translation proposes a mapping unless application was also requested.

Load [apply.md](references/apply.md) for apply **and** sync; sync reuses its dependency, wiring and verification contracts. Load [translate.md](references/translate.md) for translation or an unrepresented ecosystem. An explicitly requested catalog contribution also needs [catalog-format.md](references/catalog-format.md).

Apply and sync change the target, not the catalog. A reusable catalog contribution requires a separate explicit request.

## Boundaries

- Prefer repository- or dependency-owned tools. Ask before installing, replacing or upgrading dependencies; record declined tools as gaps.
- Preserve existing checks, source code, configuration, and user exceptions. Do not silently weaken enforcement to fit the new adoption model.
- During apply, create a small target-owned check only for a selected reliable mechanical requirement existing tools cannot express. Follow adoption policy; judgment calls stay guidance.
- Existing bundled checkers are optional: use one only when its actual behavior fits the target and adds reliable coverage worth maintaining.

Keep optional investigation and delegation bounded. Verify active checks and wiring per the chosen mode's reference. Ground unfamiliar tooling in installed source or current primary documentation; do not expand into unrelated audits or a lint framework.

## Done

Report the source commit, active checks and results, local guidance location, and gaps or exceptions. Distinguish active enforcement, partial checks, guidance and uncovered requirements; a green command alone is not full coverage. Record every relevant principle's disposition, not necessarily a linter. Label standalone translation as a proposal, not installed coverage. Keep the adoption record actionable, without catalog dumps or repeated summaries.
