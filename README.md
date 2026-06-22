# Skills

Reusable agent skills for code review, frontend validation, handoffs, testing,
planning, and project-specific workflows.

This repository is intentionally a clean public snapshot: it contains the
current skill files without the private history of the source workspace.

## Layout

- `skills/` contains installable skills. Each skill is discovered by its
  `SKILL.md` frontmatter `name`.
- `skills/openclaw/` contains OpenClaw-specific skills. They still install by
  skill name, not by their grouped path.
- `external.md` lists third-party skills that have their own installers.
- `tests/skills-test` validates skill frontmatter and helper behavior.
- `impeccable-ui-skill-map.html` is a reference map for the Impeccable UI
  workflow.

## Install

Ask your agent to read `INSTALL.md` from this repository and install the skills
for its harness.

The install model is per-skill symlinks: the harness skills directory remains a
real directory, and each skill gets its own symlink pointing at the directory
that contains its `SKILL.md`.

## Verify

```sh
./tests/skills-test
```
