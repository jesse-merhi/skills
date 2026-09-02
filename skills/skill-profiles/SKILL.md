---
name: skill-profiles
description: "Generate, check, and install Codex role agents that load only an allowed subset of skills, such as the cold-reviewer agent."
---

# Skill profiles

A profile is one role, defined by two files in [profiles/](profiles): a JSON
file naming the agent, its description, model reasoning effort, sandbox mode,
its instructions file, and the `allow` list of skill names; and a Markdown file
holding that agent's developer instructions. `scripts/skills-profile <role>`
turns a profile into the `~/.codex/agents/<name>.toml` that Codex reads.

Codex can disable only exact `SKILL.md` paths, so the CLI walks every installed
skill root and emits an opt-out entry for each skill the `allow` list leaves
out. That list describes the skills and plugins present when it was generated,
so it goes stale as soon as either set changes.

`cold-reviewer` is the shipped role: a read-only reviewer whose instructions
carry the cold-review checklist, finding gates, rating table, and report format
inline, so a brief can name the target and the changed flows without pointing
the agent at skill files. Use
[dispatch.md](../cold-pr-review/references/dispatch.md) when spawning it.

## Regenerate

Run `skills-profile <role> --check`, and reinstall when it reports a missing or
stale agent file:

- after installing, adding, or removing any skill or Codex plugin;
- after editing a profile's JSON or its instructions;
- on every reinstall of this repository.

Show the user the diff and get an answer before writing the agent file.

Read `scripts/skills-profile --help` for the flags: output modes, install and
check behaviour, extra repositories, and the Codex home override.

## Add a role

1. Copy `profiles/cold-reviewer.json` and `profiles/cold-reviewer.md` under the
   new role name, and point the JSON `instructions` field at the new Markdown
   file. Done when both files exist and no field still says `cold-reviewer`.
2. Set `allow` to the skill names the role genuinely loads, and rewrite the
   instructions so the role carries its own checklist, gates, and output
   contract. Done when the instructions stand alone without the allowed skills.
3. Run `skills-profile <role> --check`, then `--install` once the printed diff
   is what you want. Done when `--check` exits 0.

## Limits

- The opt-out list is path-exact. A checkout at another path, such as a git
  worktree, still exposes that checkout's `.agents/skills`, including skills the
  profile does not allow. Regenerate with `--repo <path>` for each checkout the
  agent works in.
- Codex `.system` skills cannot be disabled. Every role keeps them.
