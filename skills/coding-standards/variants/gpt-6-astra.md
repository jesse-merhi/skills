---
name: coding-standards
description: 'Apply personal engineering standards with existing tools and repository-specific guidance, sync an adoption, or translate the principles to a new stack. Use only when explicitly invoked.'
---

# Coding standards

Bring the owner's engineering standards into the target repository through
reliable existing checks, concise local guidance, and an honest coverage
record. The catalog defines principles; its implementation entries are
candidates, not proof that a preset enforces every principle. Use the bundled
Node checks as examples for finding or building equivalent checks in non-Node
targets, not for expanding this catalog with language-specific packages.

## Establish the target and source

Locate `catalog.json` beside the loaded entrypoint, or one directory up when
reading a prompt under `variants/`. Resolve the catalog file's real path to
find its Git checkout; a materialized `SKILL.md` may be a copy elsewhere.
Record the source remote and commit. Disclose uncommitted source changes or a
commit with no containing remote-tracking branch.

Read the principles and [adoption.md](references/adoption.md). Resolve routine
choices from the target's actual stack, configuration, and user instructions.
Explicit user decisions take precedence over skill defaults. Ask only when
the choice needs the user's authority or materially changes the requested
result; continue independent authorized work while a decision is outstanding.

## Complete the requested mode

- **Apply:** follow [apply.md](references/apply.md) to adopt standards in the
  target. For a stack missing from the catalog, use
  [translate.md](references/translate.md) on demand, then continue apply.
- **Sync:** follow [sync.md](references/sync.md) to reconcile the adoption,
  vendored files, and active configuration while preserving local decisions.
- **Translate:** follow [translate.md](references/translate.md) to propose a
  mapping to the requested ecosystem's own tools. Do not install the proposal
  unless application was also requested.

For apply or sync, load [apply.md](references/apply.md) and
[translate.md](references/translate.md) before executing the mode. For an
explicitly requested shared-catalog contribution, also load
[catalog-format.md](references/catalog-format.md). References use these loaded
contracts rather than sending the agent through another chain of documents.

Apply and sync modify the target, not the shared catalog. A reusable catalog
contribution needs its own explicit request; consult
[catalog-format.md](references/catalog-format.md) for that work.

## Keep the boundaries

- Prefer repository-owned and dependency-owned tools. Ask before installing,
  replacing, or upgrading dependencies. Record declined tools as gaps.
- Preserve existing checks, source, configuration, and user exceptions. Do not
  silently weaken enforcement to fit this adoption model.
- During apply, implement a small check in the target when existing tooling
  cannot express a selected, reliable mechanical requirement. Use the shared
  adoption policy to bound that work; keep judgment calls as guidance.
- Existing bundled checkers are optional. Establish that their actual behavior
  fits the target and adds reliable coverage worth maintaining before use.

## Evidence and completion

Consult installed source or current primary documentation for uncertain tool
behavior. Verify the selected mode's active checks and target wiring as its
reference requires; broaden checks only for a relevant change, failure, or
unresolved concern. Do not start unrelated audits or optional agent work.

Report the source commit, active checks and observed results, the local
guidance future agents read, and remaining gaps or exceptions. Account for
every relevant principle without requiring a linter for each. Label a
standalone translation as a proposal. Keep chat and saved guidance concise;
name the exact unmet requirement if the requested work cannot be completed.
