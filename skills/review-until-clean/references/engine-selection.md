# Engine selection

Pick the review engine before the first iteration:

1. If the user names an engine (codex or claude), use that engine. Treat an
   explicit request for a Claude model as selecting the claude engine.
2. Otherwise use the engine that matches the running harness:
   - Codex CLI -> the codex engine (bare `codex review`).
   - Claude Code -> the claude engine (built-in `code-review` workflow).
3. Cross-harness requests need a fallback:
   - Claude engine requested from Codex: the built-in workflow only exists
     inside Claude Code. Stop and explain that the requested native reviewer is
     unavailable in this harness; do not substitute a home-grown prompt
     runner.
   - Codex engine requested from Claude Code: run the codex engine normally; the
     helper shells out to the `codex` CLI either way.

Use one engine for the whole loop. The clean streak only means something when
the same reviewer saw the same tree every time.
