---
name: coding-standards
description: 'Read engineering expectations before implementation or review. Apply, sync, or translate repository enforcement only when explicitly requested.'
---

# Coding standards

Use the owner's engineering standards while implementing and reviewing code. Read expectations by default; applying, syncing, or translating enforcement is a separate, explicitly requested mode.

## Read expectations

Locate `catalog.json` beside the loaded skill entrypoint, or one directory up when reading a prompt under `variants/`. Read every standard's `id`, `title`, `scope`, and `principle`. Use the principles relevant to the changed behavior, including standards without bundled enforcement. Read the target's scoped agent guidance and existing `lint/standards/ADOPTION.md`, if present, and preserve explicit project exceptions. A missing adoption record does not prevent reading or using the standards.

During implementation, use those expectations in the authorized change. During review, including cold review, compare the changed behavior with them and include a concise standards assessment in the report: the relevant standard ids, evidence for the assessment, and any applicable exceptions or verification gaps. Report supported violations through the review workflow's findings criteria; a missing linter or a style preference alone is not a finding. Do not claim compliance for behavior you did not assess.

This mode reads expectations only. It does not install tools, change configuration, create adoption records, sync files, or authorize unrelated repairs. Return to the calling task after reading and applying the relevant guidance. Load the adoption references below only for an explicitly requested enforcement mode; shared-catalog edits use [catalog-format.md](references/catalog-format.md).

## Apply, sync, or translate

Adopt the owner's standards through reliable checks already suited to the target, short local agent guidance, and a record of actual coverage. Complete the requested adoption work without turning it into a lint framework project. The bundled Node checks are examples for equivalent enforcement in other stacks. Find or build checks in the target repository; do not add a shared language package to make that adoption work.

### Source and mode

1. Find `catalog.json` beside the loaded entrypoint, or one directory up if reading a prompt under `variants/`. Resolve that file's real path to locate its Git checkout; a materialized entrypoint may be a copy outside it. Record the remote and commit, including whether the source is dirty or the commit has no containing remote-tracking branch.
2. Read the principles and [adoption.md](references/adoption.md). Consider all relevant principles, then choose their disposition from actual tool behavior and local needs. Catalog implementation entries and presets are candidates, not a requirement to install everything or a coverage guarantee.
3. Complete the requested mode:
   - **Apply:** use [apply.md](references/apply.md). When the target includes a stack absent from the catalog, use [translate.md](references/translate.md) on demand and resume apply with that mapping.
   - **Sync:** use [sync.md](references/sync.md). Reconcile vendored files, active configuration, and the adoption record while preserving local choices.
   - **Translate:** use [translate.md](references/translate.md). Return a proposed mapping to the ecosystem's own tools unless application was also requested.

For apply or sync, load [apply.md](references/apply.md) before executing the mode because sync reuses its dependency, wiring, and verification contracts. Load [translate.md](references/translate.md) when the target includes an unrepresented ecosystem or translation is explicitly requested, before using its workflow. For an explicitly requested shared-catalog contribution, also load [catalog-format.md](references/catalog-format.md). References use these loaded contracts rather than sending the agent through another chain of documents.

Apply and sync change the target only. A shared catalog contribution is separate, explicitly requested work governed by [catalog-format.md](references/catalog-format.md).

### Scope and authority

- Prefer repository-owned or dependency-owned tools. Ask before installing, replacing, or upgrading a dependency. A declined tool leaves a recorded gap; continue other authorized work.
- Preserve existing checks, source, configuration, and explicit exceptions. Do not silently remove enforcement to adopt this workflow.
- During apply, create a small target-owned check when existing tools cannot express a selected, reliable mechanical requirement. Bound that work with the shared adoption policy; retain guidance for judgment-dependent standards.
- Existing bundled checkers are optional. Select one only when its observed behavior fits the target and justifies maintaining it.
- Keep optional investigation and delegation out of this bounded task. Resolve routine choices from repository evidence; raise decisions that need the user's authority without expanding the work or stopping unrelated progress.

### Completion

Ground unfamiliar tools in installed source or current primary documentation. Complete the mode's required configuration and behavioral verification. Its result must distinguish active enforcement, partial checks, local judgment, uncovered requirements, and explicit exceptions; a green command alone does not establish coverage.

Report the source commit, active checks and observed results, the local guidance future agents read, and gaps or exceptions. A standalone translation reports a proposal, never installed coverage. Keep the adoption document compact enough to use while working: actionable guidance and one coverage record, without catalog dumps or repeated summaries. Give brief progress only for meaningful changes and lead the final response with the outcome.
