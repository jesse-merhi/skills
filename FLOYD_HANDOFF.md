# Floyd handoff: coding standards

Captured on 2026-09-04 from checkpoint `3ece639`. This branch preserves the
session's local state without rewriting either existing PR branch.

## Goal and current design

The work turns the owner's reusable coding standards into an explicit catalog,
vendored ESLint presets and rules, an apply/sync workflow, and a Python worked
translation. The catalog is intended to be the source of truth; applying it to
a repository vendors the relevant enforcement and records what was installed.

The work is a stack:

- PR [#127](https://github.com/jesse-merhi/skills/pull/127),
  `coding-standards-catalog`, is open and not a draft. Its remote checkpoint is
  `e7f9f0c`; the last recorded CI run was green.
- PR [#128](https://github.com/jesse-merhi/skills/pull/128),
  `coding-standards-skill`, is a draft based on PR #127. Its remote checkpoint
  is `e13fd1e`; Floyd's later local work reached `3ece639`.

Before this handoff branch was created, the PR #128 remote and local histories
had diverged by 10 remote-only and 31 local-only commits. Do not force-push the
PR branch or assume a fast-forward. Reconcile the histories explicitly after
reviewing both sides.

## Latest owner direction

The point is not to hand-author exhaustive adaptations for every framework in
every language. When initialization targets a language not yet represented in
the catalog, the agent should attempt to translate the standards for that
ecosystem, then apply the result. The session stopped before changing the apply
routing to express that behavior.

That clarification makes the remaining Django-specific reviewer suggestions
poor candidates for this PR unless they expose a general flaw in the translation
model. Review them against the stated product goal before doing more Python
polish.

## Preserved local changes

Review fixes through `3ece639` include catalog-driven apply/sync behavior,
Python enforcement wiring, safer source matching, ruff configuration handling,
false-positive reductions, and ecosystem-specific enforcement schemas. The
last committed change makes each catalog column accept only enforcement kinds
that its ecosystem can actually run.

The review scope gate stopped after that commit: measured growth was 612 lines
against an allowed 559, 53 lines over. No later routing decision or patch was
made.

## Validation at the checkpoint

On the exact checkpoint, `bun run lint`, `bun run check`, and the 17 catalog
tests passed. An immediately preceding candidate with the same Python behavior
also passed the Python chain (ruff, format, mypy, 64 pytest cases, and the
Semgrep fixture), diagnostics, and `skills-test`. Run the full repository
validation again on the final reconciled head; do not treat the earlier result
as exact-head proof.

## Recommended continuation

1. Compare this handoff branch with both PR #128's remote branch and PR #127's
   current head. Choose a non-destructive reconciliation; do not force-push by
   default.
2. Update apply/translate routing so an unsupported target ecosystem triggers a
   translation attempt before apply continues.
3. Re-triage open Python findings against the general translation goal, keeping
   only general or reachable defects.
4. Re-establish the review scope on the reconciled base, run full validation,
   and restart the exact-head review workflow before changing draft/readiness
   state.

No local session transcript or machine-specific path is required to continue.
