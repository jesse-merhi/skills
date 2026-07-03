# Engine Selection

Pick the review engine before the first iteration:

1. If the user names an engine (codex or claude), use that engine.
2. Otherwise use the engine that matches the running harness:
   - Codex CLI -> the codex engine (bare `codex review`).
   - Claude Code -> the claude engine (built-in `code-review` workflow).
3. Cross-harness requests need a fallback:
   - Claude engine requested from Codex: the built-in workflow only exists
     inside Claude Code. Use the helper's structured Claude reviewer
     (`scripts/codex-review --structured --engine claude`) and tell the user
     the bare built-in reviewer was unreachable from this harness.
   - Codex engine requested from Claude Code: run the codex engine normally; the
     helper shells out to the `codex` CLI either way.

Use one engine for the whole loop. If a task-specific override requires
multiple clean passes, a clean streak only means something when the same
reviewer saw the same tree every time.
