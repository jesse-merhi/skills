# Third-party skills

Third-party skills that have their own install methods. **Do not symlink these
into the repo** — each has its own installer. The `INSTALL.md` agent runs the
commands below per harness.

Each entry has a per-harness install table. If a command isn't
listed for your harness, that install path isn't known to work
there — skip and note in the summary.

These commands execute third-party npm packages. Review the command and pin a
newer version deliberately before updating the version numbers below.

## impeccable

- **Source:** <https://github.com/pbakaus/impeccable>
- **Docs:** <https://impeccable.style/>
- **What it is:** Design skills, commands, and anti-pattern detection
  for frontend work. Use it for UI shaping, visual system capture,
  critique, audit, polish, typography, layout, motion, UX copy,
  onboarding, responsive adaptation, and live browser iteration.
- **What it replaces:** Anthropic's `frontend-design` skill. Do not
  install `frontend-design`; Impeccable carries the design workflow and
  adds command routing plus deterministic detection.
- **What it does not replace:** `frontend-ui-validation`, because
  rendered UI still needs browser proof: screenshots, console checks,
  bounding boxes, layout audits, and `impeccable detect` results.
  For native Expo / React Native screens, pair Impeccable's design
  shaping with the relevant mobile testing skill and local Expo MCP
  simulator proof. Do not treat remote EAS build, update, workflow, or
  account-log tools as part of ordinary visual design validation unless
  the user explicitly asks for remote Expo work.

### Useful commands

| Intent | Command |
|--------|---------|
| Set up project design context | `$impeccable init` |
| Build a feature with design discovery first | `$impeccable craft <feature>` |
| Plan UX/UI before code | `$impeccable shape <surface>` |
| Capture the current visual system | `$impeccable document` |
| Extract reusable tokens/components | `$impeccable extract <target>` |
| Review a design | `$impeccable critique <target>` |
| Run technical UI quality checks | `$impeccable audit <target>` |
| Final UI quality pass | `$impeccable polish <target>` |
| Fix typography | `$impeccable typeset <target>` |
| Fix spacing, rhythm, and hierarchy | `$impeccable layout <target>` |
| Add or rebalance color | `$impeccable colorize <target>` |
| Make a loud design calmer | `$impeccable quieter <target>` |
| Make a bland design stronger | `$impeccable bolder <target>` |
| Remove noise and simplify | `$impeccable distill <target>` |
| Add purposeful motion | `$impeccable animate <target>` |
| Improve UX copy | `$impeccable clarify <target>` |
| Handle mobile/responsive behavior | `$impeccable adapt <target>` |
| Harden edge cases, errors, overflow, i18n | `$impeccable harden <target>` |
| Improve first-run/empty states | `$impeccable onboard <target>` |
| Improve UI performance | `$impeccable optimize <target>` |
| Add ambitious effects | `$impeccable overdrive <target>` |
| Iterate visually in a running app | `$impeccable live` |

The CLI detector is also part of frontend validation:

```sh
npx --yes impeccable@3.0.3 detect <changed-ui-path-or-url> --json
```

### Install

Run these from the harness-level parent directory so Impeccable writes
into the normal global skills folder for that harness.

| Harness     | Method |
|-------------|--------|
| Claude Code | `(cd ~ && npx --yes impeccable@3.0.3 skills install --providers=.claude -y)` |
| Codex       | `(cd ~ && npx --yes impeccable@3.0.3 skills install --providers=.agents -y && ln -sfn ~/.agents/skills/impeccable ~/.codex/skills/impeccable)` |
| opencode    | `(cd ~/.config/opencode && npx --yes impeccable@3.0.3 skills install --providers=.opencode -y && mkdir -p ~/.config/opencode/skills && rm -rf ~/.config/opencode/skills/impeccable && cp -R ~/.config/opencode/.opencode/skills/impeccable ~/.config/opencode/skills/impeccable)` |
| Pi          | `(cd ~ && npx --yes impeccable@3.0.3 skills install --providers=.pi -y && mkdir -p ~/.pi/agent/skills && rm -rf ~/.pi/agent/skills/impeccable && cp -R ~/.pi/skills/impeccable ~/.pi/agent/skills/impeccable)` |

The installer owns the external skill files. Do not symlink `impeccable`
from this repo.
