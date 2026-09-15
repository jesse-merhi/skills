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

Apply the owner's standards to the target repository with working checks and short, repository-specific guidance. Do not turn the task into building a lint framework. Enforce a principle only where a reliable check exists; record the rest as guidance, partial coverage, an uncovered requirement, or an exception. Use the bundled Node rules as examples. For non-Node repositories, find or build equivalent checks in that repository instead of adding another language package to the shared catalog.

### Workflow

1. Find `catalog.json` beside the entrypoint, or one directory up if you loaded a prompt under `variants/`. Resolve the catalog file's real path before identifying its Git checkout. A materialized `SKILL.md` may be a copy outside that checkout. Record its remote and commit; disclose a dirty source or a commit with no containing remote-tracking branch.
2. Read the catalog's principles and [adoption.md](references/adoption.md). Treat the enforcement entries and presets as candidates. They neither require wholesale installation nor prove coverage of the whole principle.
3. Choose the mode:
   - **Apply:** read [apply.md](references/apply.md), inspect the target stack, and implement its adoption. If the catalog does not represent part of the stack, follow [translate.md](references/translate.md), then resume apply.
   - **Sync:** read [sync.md](references/sync.md). Reconcile both vendored files and the active configuration, while preserving local decisions.
   - **Translate:** read [translate.md](references/translate.md). Map principles to the requested ecosystem's existing tools, not to copies of JavaScript rules. Return the proposed mapping unless application was also requested.
4. Complete the selected mode and report its observed results. Batch independent inspections, give a brief update before lengthy work, and use literal, concise prose. Verify unfamiliar tooling against installed source or current primary documentation; distinguish quoted wording from your own summary.

Done when the requested mode has a result, not merely a list of next steps.

For apply or sync, load [apply.md](references/apply.md) before executing the mode because sync reuses its dependency, wiring, and verification contracts. Load [translate.md](references/translate.md) when the target includes an unrepresented ecosystem or translation is explicitly requested, before using its workflow. For an explicitly requested shared-catalog contribution, also load [catalog-format.md](references/catalog-format.md). References use these loaded contracts rather than sending the agent through another chain of documents.

### Scope and permissions

- Apply and sync modify the target only. Write a reusable catalog translation only when explicitly requested; consult [catalog-format.md](references/catalog-format.md) for its existing shape.
- Use repository-owned or dependency-owned tools first. Ask before any dependency install, replacement, or upgrade. If declined, record the gap and continue the remaining authorized work.
- Preserve existing checks, source, configuration, and explicit exceptions. Do not silently disable current enforcement to adopt this workflow.
- During apply, create a small target-owned check for a selected, reliable mechanical requirement only when existing tooling cannot express it. Follow the shared adoption policy. Leave judgment calls as guidance.
- An existing bundled checker is optional. Use it only after establishing that its actual behavior fits this target and justifies its maintenance cost.

### Completion report

State the source commit, checks active in the target and their results, the local guidance future agents will read, and any gaps or exceptions. Account for every relevant principle without inventing an enforcement requirement for each one. Label standalone translation as a proposal, not installed coverage.
