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

Bring the owner's engineering standards into the target repository through reliable existing checks, concise local guidance, and an honest coverage record. The catalog defines principles; its implementation entries are candidates, not proof that a preset enforces every principle. Use the bundled Node checks as examples for finding or building equivalent checks in non-Node targets, not for expanding this catalog with language-specific packages.

### Establish the target and source

Locate `catalog.json` beside the loaded entrypoint, or one directory up when reading a prompt under `variants/`. Resolve the catalog file's real path to find its Git checkout; a materialized `SKILL.md` may be a copy elsewhere. Record the source remote and commit. Disclose uncommitted source changes or a commit with no containing remote-tracking branch.

Read the principles and [adoption.md](references/adoption.md). Resolve routine choices from the target's actual stack, configuration, and user instructions. Explicit user decisions take precedence over skill defaults. Ask only when the choice needs the user's authority or materially changes the requested result; continue independent authorized work while a decision is outstanding.

### Complete the requested mode

- **Apply:** follow [apply.md](references/apply.md) to adopt standards in the target. For a stack missing from the catalog, use [translate.md](references/translate.md) on demand, then continue apply.
- **Sync:** follow [sync.md](references/sync.md) to reconcile the adoption, vendored files, and active configuration while preserving local decisions.
- **Translate:** follow [translate.md](references/translate.md) to propose a mapping to the requested ecosystem's own tools. Do not install the proposal unless application was also requested.

For apply or sync, load [apply.md](references/apply.md) before executing the mode because sync reuses its dependency, wiring, and verification contracts. Load [translate.md](references/translate.md) when the target includes an unrepresented ecosystem or translation is explicitly requested, before using its workflow. For an explicitly requested shared-catalog contribution, also load [catalog-format.md](references/catalog-format.md). References use these loaded contracts rather than sending the agent through another chain of documents.

Apply and sync modify the target, not the shared catalog. A reusable catalog contribution needs its own explicit request; consult [catalog-format.md](references/catalog-format.md) for that work.

### Keep the boundaries

- Prefer repository-owned and dependency-owned tools. Ask before installing, replacing, or upgrading dependencies. Record declined tools as gaps.
- Preserve existing checks, source, configuration, and user exceptions. Do not silently weaken enforcement to fit this adoption model.
- During apply, implement a small check in the target when existing tooling cannot express a selected, reliable mechanical requirement. Use the shared adoption policy to bound that work; keep judgment calls as guidance.
- Existing bundled checkers are optional. Establish that their actual behavior fits the target and adds reliable coverage worth maintaining before use.

### Evidence and completion

Consult installed source or current primary documentation for uncertain tool behavior. Verify the selected mode's active checks and target wiring as its reference requires; broaden checks only for a relevant change, failure, or unresolved concern. Do not start unrelated audits or optional agent work.

Report the source commit, active checks and observed results, the local guidance future agents read, and remaining gaps or exceptions. Account for every relevant principle without requiring a linter for each. Label a standalone translation as a proposal. Keep chat and saved guidance concise; name the exact unmet requirement if the requested work cannot be completed.
