---
name: coding-standards
description: 'Apply personal engineering standards with existing tools and repository-specific guidance, sync an adoption, or translate the principles to a new stack. Use only when explicitly invoked.'
---

# Coding standards

Apply the owner's engineering standards to the repository. Enforce what can be
checked reliably, leave judgment calls as concise agent guidance, and state
what remains unenforced. The deliverable is a usable repository, not a new
cross-language lint framework.

`catalog.json` supplies the standards' ids, titles, and principles. Its
enforcement entries and bundled presets are implementation candidates, not a
requirement to install everything or proof of equivalent coverage. Translate
the principle, not the syntax of its JavaScript checker.

## Start

Locate `catalog.json` beside the skill entrypoint, or one directory up when
loading a file under `variants/`. In a materialized harness view, resolve the
catalog file's real path; the copied `SKILL.md` need not live in its source
checkout. Record that checkout's remote URL and commit. Report a dirty source
or a commit with no containing remote-tracking branch rather than presenting
it as a reproducible published source.

Read [adoption.md](references/adoption.md) to choose enforcement, guidance,
partial coverage, gaps, and exceptions. Then take the requested path:

- **Apply:** inspect the target stack and leave working checks, local guidance,
  and an adoption record. Read [apply.md](references/apply.md).
- **Sync:** reconcile that adoption with current standards and the target's
  choices, including active configuration. Read [sync.md](references/sync.md).
- **Translate:** adapt principles to a requested ecosystem using its existing
  tools. Read [translate.md](references/translate.md). During apply, do this
  automatically for stacks the catalog does not represent, then resume apply.
  A standalone translation returns a proposed mapping unless installation was
  also requested.

For apply or sync, load [apply.md](references/apply.md) and
[translate.md](references/translate.md) before executing the mode. For an
explicitly requested shared-catalog contribution, also load
[catalog-format.md](references/catalog-format.md). References use these loaded
contracts rather than sending the agent through another chain of documents.

Apply and sync change the target, not the shared catalog. Adding a reusable
catalog translation is separate work, done only when explicitly requested;
[catalog-format.md](references/catalog-format.md) describes its existing shape.

## Boundaries

- Prefer repository-owned and dependency-owned tools. Ask before installing,
  replacing, or upgrading dependencies. Declined tools become recorded gaps.
- Preserve existing checks, source code, configuration, and user exceptions.
  Do not silently weaken enforcement to fit the new adoption model.
- Do not write or port a custom checker merely because native coverage is
  missing. Guidance or an explicit gap is a valid outcome. A new checker needs
  a separately requested, bounded implementation task.
- Existing bundled checkers are optional: use one only when its actual
  behavior fits the target and adds reliable coverage worth maintaining.

## Done

Report the source commit, active checks and observed results, where future
agents read the local guidance, and remaining gaps or exceptions. Every
relevant principle must have a recorded disposition, but need not have a
linter. A standalone translation reports a proposal, never installed coverage.
