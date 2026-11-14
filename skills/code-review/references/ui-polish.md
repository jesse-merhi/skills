# UI polish

Use this mode when the user asks to polish the UI or names a score. It lifts the taste-level limit and may restyle the affected or user-named screens without changing their content; the other [code-review](../SKILL.md) rules still apply. Without a pending change, round one scores the baseline and the simplify pass covers polish edits once they exist.

Before round one, turn the criteria into scoring categories such as hierarchy, typography, spacing, colour and contrast, iconography and consistency. Use the user’s score target and round limit, or state that you are using the defaults of 9 out of 10 in every category and five rounds. Gating rounds count toward the limit.

References are the product’s strongest screen, design-system examples of the components in use or public apps with the same layout pattern; without any, the unchanged baseline is the reference.

Give reviewers the categories, a 1–10 scale and captures of the current revision and references, including the baseline, but never the score target or earlier scores, even inside the requirements. Each reviewer scores every category per capture, tying each current-revision score below 10 to a screenshot region and a proposed change. Unchanged references expose drift: when a member scores any reference category a point or more from its own previous score, its raw scores that round cannot meet the target, and the coordinator judges its progress by the gap between the current revision and the references.

Each round, apply the supported proposals for the lowest-scoring categories. Watch for regressions scores miss, such as colour drained to greys, flattened contrast or lost product character; a confirmed regression against the baseline blocks finishing.

A gating member, the latest full-council round’s lowest scorer if any, may score and review each revision until it reaches the target; the full council then scores that revision, and gating resumes if any member falls short. The final round within the limit always uses the full council. Polish finishes when every member scores every category at or above the target on one revision with no confirmed regression or step 4 blocking issue. If the round limit comes first, report the scores reached as partial; if the user raises a met target, keep the met revision mergeable and propose stacking further polish. Record scores as supplied, never invented, averaged or rounded, and report every member’s scores per category and round, references included, in one table.
