# Reporting

While looping, narrate one short line per iteration so the user can follow the
trajectory:

```text
iter 1: triggered /clawsweeper re-review @ sha abc123 -> 4 findings -> fixed -> pushed def456
iter 2: triggered re-review @ sha def456 -> 1 finding -> fixed inline -> pushed ghi789
iter 3: triggered re-review @ sha ghi789 -> clean (1/3)
iter 4: triggered re-review @ sha ghi789 -> clean (2/3)
iter 5: triggered re-review @ sha ghi789 -> 1 finding -> counter reset -> pushed jkl012
iter 8: triggered re-review @ sha xyz999 -> clean (3/3)
```

On termination, report:

- total iteration count and iterations in each clean-convergence phase
- whether the stop reason was `already-diamond-or-better`,
  `diamond-achieved`, `platinum-with-explanation`, `safety-cap-hit`, or
  `wall-clock-cap-hit`
- the last Clawsweeper verdict, with a link to the comment/review
- which platinum-or-better label was present on the unchanged final head
- the rank-up attempt count and each distinct move applied, or the concrete
  reason the workflow stopped before using all three
- for `platinum-with-explanation`, the specific evidence, environment, scope,
  residual-risk, or owner-decision ceiling that kept the result from diamond
- any findings that needed a repo-specific fix workflow rather than direct edits
- the PR head SHA at the moment of the final clean re-review

## Hard rules

- Always re-trigger via comment. The body must be exactly
  `/clawsweeper re-review`.
- Do not paraphrase, bundle other text, or mention humans in the trigger
  comment.
- Never claim success at fewer than 3 consecutive clean re-reviews or without
  a platinum-or-better label on that unchanged head.
- Never edit or push between consecutive clean re-reviews. Pushes invalidate the
  streak.
- Always reset the counter on any actionable finding, even on re-review 3.
- Always validate head SHA before counting a response.
- Respect the safety and wall-clock caps.
- Do not silence findings by reclassifying them as nits to keep the streak
  alive. If Clawsweeper says it is actionable, it is actionable.
- Do not impersonate Clawsweeper by writing your own "looks clean" comment. The
  verdict must come from the bot.
- Never add or preserve a rating label yourself. Its value is that ClawSweeper
  awarded it.
- Never start diamond work before the first clean platinum-or-better baseline,
  and never run a fourth rank-up cycle after three attempts.

## Common mistakes

| Mistake | Why it breaks the skill |
|---|---|
| Stopping at the first clean re-review | The point of the skill is the streak, not a single green run |
| Pushing a commit between two clean re-reviews | Clawsweeper is now reviewing a different tree; streak invalidated |
| Reading an old Clawsweeper review as the response | That verdict is from before your trigger; not valid |
| Counting an in-progress "working on it" comment as clean | A placeholder is not a verdict |
| Counting 2 clean + 1 dirty + 1 clean as "close enough" | Counter resets on dirty; that is 1 consecutive, not 3 |
| Skipping the trigger because "the last fix was tiny" | The skill requires Clawsweeper to confirm every time |
| Using a different reviewer | The stop condition is defined against Clawsweeper specifically |
| Bundling unrelated cleanup into a fix step | Introduces new diff that the next re-review may flag |
| Re-triggering with extra text in the body | The bot may not parse the command; trigger gets ignored |
