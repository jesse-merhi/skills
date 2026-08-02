# External skills refresh — 2026-07-31

## Recommendation

Update three things:

1. Move the external `teach` pin from release `v1.0.1` to upstream commit
   `697d4ce9742da558fd1ba6697c8e9775e2e302dd`. The only change to Teach between
   those revisions is its Codex `agents/openai.yaml` metadata.
2. Adapt Emil Kowalski's new `find-animation-opportunities` workflow. It fills
   the read-only discovery gap before `design-engineering` implementation and
   `review-animations` review.
3. Adapt Emil's new explicit-only `prototype` workflow. It gives UI exploration
   a repeatable divergence-and-picker loop without letting prototype code leak
   into production before the user chooses.

Do not import the other two new Emil workflows as standalone skills:

- `improve-animations` overlaps the repo's existing review, planning, and
  implementation skills. Its strongest ideas already belong in
  `review-animations` and `design-engineering`.
- `pick-ui-library` is a hand-maintained package list. It will age quickly and
  conflicts with this repo's dependency-first rule, which requires checking
  installed versions, current primary documentation, and project conventions
  at decision time.

Do not import Thariq Shafi's eleven new `unknowns/` HTML files. Absorb their
reasoning ideas into a smaller repo-owned pattern library instead. See
[`html-explanation-patterns.md`](html-explanation-patterns.md).

## Source-by-source audit

| Local use | Upstream inspected | External change | Decision |
| --- | --- | --- | --- |
| External `teach` install | `mattpocock/skills` at `2ab9580` | Codex metadata added after `v1.0.1`; Teach's functional files are unchanged through `v1.1.0` | Pin the exact metadata commit; keep `skills@1.5.20` |
| Adapted `tdd` | `mattpocock/skills` at `2ab9580` | Upstream added minimal Codex metadata | Keep the richer local metadata |
| Adapted writing guidance | `mattpocock/skills` at `2ab9580` | Upstream added minimal Codex metadata | Keep the richer local metadata |
| `design-engineering` | `emilkowalski/skills` at `70744e3` | Library wording changed from Radix UI to Base UI | No content change: the local adaptation is already library-neutral |
| `review-animations` | `emilkowalski/skills` at `70744e3` | Reviewer role wording changed; Base UI wording updated | No content change: local standards already express the portable rule |
| New Emil workflows | `emilkowalski/skills` at `70744e3` | Four skills added: opportunity finding, animation improvement, UI-library selection, prototyping | Adapt opportunity finding and prototyping only |
| HTML examples | `ThariqS/html-effectiveness` at `1787245` | Eleven `unknowns/` pages added | Do not vendor; replace the default gallery with smaller reasoning patterns |

## Why these two Emil workflows fit

### `find-animation-opportunities`

This is a discovery filter, not an implementation skill. It requires each
candidate to pass four gates:

- how often the user sees it;
- what purpose the motion serves;
- whether it fits the speed budget;
- whether movement helps or hinders the task.

It also requires rejected candidates. That restraint is the useful difference:
the output explains both where motion belongs and where it should stay absent.

### `prototype`

This workflow creates three to five genuinely different versions of one UI
piece behind a fixed picker. Each version must differ on a named axis such as
layout, density, personality, motion, or interaction model. Exploration stays
isolated from production code; promotion happens only after the user chooses.

The local adaptation should remain explicit-only because it intentionally
creates multiple implementations and pauses for a human selection.

## Why the other Emil workflows stay upstream-only

### `improve-animations`

The upstream skill performs a broad audit, writes plans, and routes fixes.
Locally, those responsibilities are already split more clearly:

- `review-animations` finds actionable motion defects;
- `design-engineering` implements or refines interaction;
- planning and review-loop skills own durable plans and fixed-point review.

Adding another orchestrator would create competing paths and duplicated motion
standards.

### `pick-ui-library`

The upstream curation is thoughtful, but the list is time-sensitive. A static
skill can silently recommend a package whose maintenance status, bundle cost,
license, platform support, or installed version changed. The repo's global
dependency-first instructions are safer: inspect the current project and
current primary sources when the choice is real.

## Install and metadata notes

- Keep the installer pinned to `skills@1.5.20`. A newer installer exists, but
  updating a dependency was not needed to pull the requested Codex metadata.
- `skills@1.5.20` passes a GitHub tree ref to `git clone --branch`, so a raw
  commit SHA is not installable. The documented command uses upstream's
  `codex-skill-metadata` branch only after `git ls-remote` proves it still
  resolves to the reviewed commit.
- Teach's selected source commit adds only:
  `skills/productivity/teach/agents/openai.yaml`.
- The selected metadata keeps Teach explicit-only in Codex.
- TruffleHog redaction or secret-scanning changes were intentionally excluded
  from this audit at the user's request.

## Primary sources

- [Teach Codex metadata commit](https://github.com/mattpocock/skills/commit/697d4ce9742da558fd1ba6697c8e9775e2e302dd)
- [Emil Kowalski skills repository](https://github.com/emilkowalski/skills/tree/70744e3816f1d93eafb697161a8b880a7384c5ff)
- [ThariqS/html-effectiveness `unknowns` gallery](https://github.com/ThariqS/html-effectiveness/tree/1787245d94aa680edf18b52027e3f859032776ba/unknowns)
