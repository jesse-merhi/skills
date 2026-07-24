# Third-party skills

No third-party skill installs are currently required.

Keep externally owned skills out of this repository unless their license and
update model are intentionally adopted. Prefer a small repo-owned adapter when
only part of an external workflow earns a permanent place in the skill loop.

## Retired third-party skills

Retired entries remain here as cleanup tombstones. Run the removal command for
the current harness on every reinstall, even when the skill is already absent.
Do not reinstall a retired skill unless the user explicitly asks for it.

### impeccable

Impeccable was replaced by the repo-owned frontend design skills. Remove all
installer-owned copies so agent skill discovery cannot load the retired skill.

| Harness | Removal command |
| --- | --- |
| Claude Code | `rm -rf ~/.claude/skills/impeccable` |
| Codex | `rm -f ~/.codex/skills/impeccable && rm -rf ~/.agents/skills/impeccable` |
| opencode | `rm -rf ~/.config/opencode/skills/impeccable ~/.config/opencode/.opencode/skills/impeccable` |
| Pi | `rm -rf ~/.pi/agent/skills/impeccable ~/.pi/skills/impeccable` |

For Claude Code, also remove hook entries whose command targets
`skills/impeccable/scripts/hook.mjs` from `~/.claude/settings.local.json`.
Preserve unrelated settings and delete the file only when nothing remains.
