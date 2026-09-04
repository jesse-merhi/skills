---
name: coding-standards
description: 'Apply personal engineering standards with existing tools and repository-specific guidance, sync an adoption, or translate the principles to a new stack. Use only when explicitly invoked.'
---

# Coding standards

Apply the owner's standards to the target repository with working checks and
short, repository-specific guidance. Do not turn the task into building a lint
framework. Enforce a principle only where a reliable check exists; record the
rest as guidance, partial coverage, an uncovered requirement, or an exception.

## Workflow

1. Find `catalog.json` beside the entrypoint, or one directory up if you loaded
   a prompt under `variants/`. Resolve the catalog file's real path before
   identifying its Git checkout. A materialized `SKILL.md` may be a copy outside
   that checkout. Record its remote and commit; disclose a dirty source or a
   commit with no containing remote-tracking branch.
2. Read the catalog's principles and [adoption.md](references/adoption.md).
   Treat the enforcement entries and presets as candidates. They neither
   require wholesale installation nor prove coverage of the whole principle.
3. Choose the mode:
   - **Apply:** read [apply.md](references/apply.md), inspect the target stack,
     and implement its adoption. If the catalog does not represent part of the
     stack, follow [translate.md](references/translate.md), then resume apply.
   - **Sync:** read [sync.md](references/sync.md). Reconcile both vendored files
     and the active configuration, while preserving local decisions.
   - **Translate:** read [translate.md](references/translate.md). Map principles
     to the requested ecosystem's existing tools, not to copies of JavaScript
     rules. Return the proposed mapping unless application was also requested.
4. Complete the selected mode and report its observed results. Batch independent
   inspections, give a brief update before lengthy work, and use literal,
   concise prose. Verify unfamiliar tooling against installed source or current
   primary documentation; distinguish quoted wording from your own summary.

Done when the requested mode has a result, not merely a list of next steps.

For apply or sync, load [apply.md](references/apply.md) and
[translate.md](references/translate.md) before executing the mode. For an
explicitly requested shared-catalog contribution, also load
[catalog-format.md](references/catalog-format.md). References use these loaded
contracts rather than sending the agent through another chain of documents.

## Scope and permissions

- Apply and sync modify the target only. Write a reusable catalog translation
  only when explicitly requested; consult
  [catalog-format.md](references/catalog-format.md) for its existing shape.
- Use repository-owned or dependency-owned tools first. Ask before any
  dependency install, replacement, or upgrade. If declined, record the gap and
  continue the remaining authorized work.
- Preserve existing checks, source, configuration, and explicit exceptions.
  Do not silently disable current enforcement to adopt this workflow.
- Missing native coverage is not a request for a new checker. Leave guidance
  or an honest gap instead. Creating or porting a checker requires a separate,
  bounded implementation request.
- An existing bundled checker is optional. Use it only after establishing that
  its actual behavior fits this target and justifies its maintenance cost.

## Completion report

State the source commit, checks active in the target and their results, the
local guidance future agents will read, and any gaps or exceptions. Account
for every relevant principle without inventing an enforcement requirement for
each one. Label standalone translation as a proposal, not installed coverage.
