---
name: code-review
description: 'Simplify changes, then run a four-model council for code review and UI refinement until only minor findings remain, or polish UI to a target score.'
metadata:
  source: https://github.com/mattpocock/skills
  source-path: skills/engineering/code-review
  source-revision: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
  sources: |
    - Council approach inspired by Theo’s [tstack council](https://github.com/t3dotgg/tstack/blob/1085050f3baed1ac724caa4a8166145fb2ac88af/skills/council/SKILL.md). This adaptation uses the user-selected reviewers and the round, evidence and authority rules below.
    - UI polish mode informed by Theo’s [Agents Sucked At UI (Until Today)](https://www.youtube.com/watch?v=xq0eB8vxeqk), reviewed 2026-11-13.
---

# Code review

Simplify the change, then have an independent council review it and refine affected UI. Never start a second council through another skill.

## 1. Establish the change

Identify the target and its actual or planned PR base, using a commit's parent only for a single-commit review. Review the whole intended change, preserve unrelated work, and record the base. Derive requirements from the task, docs and callers, stating the inferred contract when there is no spec.

Honor narrower requests and report their coverage limits: findings-only means no edits, a single-review request runs only that assessment, and native review uses the harness's native command. Run [ClawSweeper](references/clawsweeper.md) only when separately requested.

## 2. Simplify

Give one implementation agent the target, requirements, owned files, repair authority and checks. Use `spawn_agent`, selecting the configured `implementer` role when supported. Run this pass even after implementation; without independent dispatch, simplify locally and disclose it.

Remove what the requirement does not need from changed and directly affected code, tests and fixtures, including accidental generated-file changes, but check callers before deleting guards, cleanup, error handling, public contracts or tests. Make the code understandable on the first read, even when the implementation is sophisticated. Read definitions with their usages and choose the simplest accurate name in ordinary words: `executeNotificationDispatch` can be `sendNotification`, while `expiresAtMs` keeps its unit and a domain term may beat a generic one. Update definitions and usages together; change public contracts only when authorized. Keep related work together and branches readable, tracing each branch's result including fields added, moved or omitted. Extract a function when its name makes a step clearer; keep it inline when another jump would cost the reader more. For React prop contracts, use [typescript-discipline](../typescript-discipline/SKILL.md#react-prop-contracts) to establish supported caller states before removing optionality or fallbacks. Avoid changes based only on taste.

Apply [writing-good-tests](../writing-good-tests/SKILL.md), distinguishing test consolidation from retirement without replacement.

The simplifier and every council reviewer back a clean readability conclusion by citing a nontrivial changed block and explaining why its steps and result are clear, and report code they did not assess.

The simplifier returns its patch, a concrete before/after explanation, checks and unresolved concerns, or proposals for findings-only work. Integrate and resolve verification failures before review.

## 3. Review with the council

Use four fresh findings-only reviewers: **GPT-6 Astra, Claude Fable 5.2, Claude Opus 5.5 and GPT-6.1 Sol**, each at **high** reasoning effort.

In T3 Code, use `orchestrator_capabilities`, then `delegate_task` for the selected members with settings in `target.options`. Elsewhere, use `spawn_agent` with `fork_turns="none"` only for models and settings it supports. Prefer a findings-only role whose pinned model and effort match; a prompt cannot override them. Report any unavailable member or setting and the coverage gap; never silently substitute, count the coordinator as a member or claim a complete council. Changing membership is the user’s decision.

Dispatch all members in parallel when supported, on the same stable commit or recorded patch. Give each the target, base, full diff, requirements, standards, reusable proof and both lenses below, without implementation rationale, simplifier conclusions or prior findings; never resume an implementer or previous reviewer. Reviewers may run permitted read-only probes and fault checks in scratch copies but do not spawn reviewers. Use [wait-efficiently](../wait-efficiently/SKILL.md) for pending results, checking each as it arrives, and leave the reviewed revision unedited until the round is complete. Check each result’s revision; disclose context contamination.

Each reviewer applies both lenses and reports every supported finding, minor ones included:

- **Standards:** [coding-standards](../coding-standards/SKILL.md), step 2's readability rules, diff waste, unnecessary complexity, and [writing-good-tests](../writing-good-tests/SKILL.md) for test additions, keepers and deletions. Cite relevant standard IDs and exceptions. A maintenance finding shows the confusing code, its present reading or change cost, and a simpler behavior-preserving alternative.
- **Requirements and correctness:** trace the affected flow from a real entry point to the consumer-visible result, including failure and recovery, for missing, incorrect or unrequested behavior. Ask what consequential defect could leave existing tests green and what runtime or persisted-state evidence would expose it. When data formats change, exercise every reader, including tools and UIs, with pre-change state. Apply typescript-discipline and other relevant domain lenses.

Each finding gives location, expected behavior, reachable trigger and its likelihood in supported use, consequence, evidence and a proposed step 4 severity. Verification limits separate source inspection from executed proof; an empty findings list is valid but proves no coverage. Each reviewer states its confidence in the reviewed revision with reasons and what remains unverified; confidence is judgment, not proof, and never overrides supported findings.

### Affected UI

Assess affected UI’s visuals and interactions in the same rounds. Before round one, set product criteria from the user’s goal, affected journey and design system, such as task clarity, hierarchy, spacing, typography, accessibility, responsiveness and loading, empty and error states. Record baseline and any reference screenshots with provenance, noting when none exists; never invent one. Keep criteria, states and viewports fixed across rounds unless the user changes them.

The implementation owner captures the UI and exercises interactions with [frontend-ui-validation](../frontend-ui-validation/SKILL.md) for every reviewer. Report missing captures or interaction proof as a limit; source inspection alone cannot show visual improvement.

UI feedback ties a screenshot region or interaction to an unmet criterion, its user impact and a small proposed fix, separating observed defects from design judgment. Each applied improvement costs a round, so apply only supported, in-scope improvements with clear user impact; taste-level refinements stay minor. Preserve product direction and functionality, with no redesign, feature work or separate visual-review loop, and compare before and after captures against the same criteria, including regressions.

#### UI polish

Use this mode when the user asks to polish the UI or names a score. It lifts the taste-level limit and may restyle the affected or user-named screens without changing their content; the other rules still apply. Without a pending change, round one scores the baseline and the simplify pass covers polish edits once they exist.

Before round one, turn the criteria into scoring categories such as hierarchy, typography, spacing, colour and contrast, iconography and consistency. Use the user’s score target and round limit, or state that you are using the defaults of 9 out of 10 in every category and five rounds. Gating rounds count toward the limit.

References are the product’s strongest screen, design-system examples of the components in use or public apps with the same layout pattern; without any, the unchanged baseline is the reference.

Give reviewers the categories, a 1–10 scale and captures of the current revision and references, including the baseline, but never the score target or earlier scores, even inside the requirements. Each reviewer scores every category per capture, tying each current-revision score below 10 to a screenshot region and a proposed change. Unchanged references expose drift: when a member scores any reference category a point or more from its own previous score, its raw scores that round cannot meet the target, and the coordinator judges its progress by the gap between the current revision and the references.

Each round, apply the supported proposals for the lowest-scoring categories. Watch for regressions scores miss, such as colour drained to greys, flattened contrast or lost product character; a confirmed regression against the baseline blocks finishing.

A gating member, the latest full-council round’s lowest scorer if any, may score and review each revision until it reaches the target; the full council then scores that revision, and gating resumes if any member falls short. The final round within the limit always uses the full council. Polish finishes when every member scores every category at or above the target on one revision with no confirmed regression or step 4 blocking issue. If the round limit comes first, report the scores reached as partial; if the user raises a met target, keep the met revision mergeable and propose stacking further polish. Report every member’s scores per category and round, references included, in one table.

## 4. Repeat rounds until only minor findings remain

Keep one round record with the task across resumes, retries and code/UI work: each round’s revision, evidence, reviewers’ actual models and efforts, findings, scores, confidence, decisions and severities with reasons, fixes, checks and resulting revision. Record scores and confidence as supplied (“not supplied” when absent), never invented, averaged or rounded. Filling a missing member’s assessment on the same revision stays in that round, and repeated dispatch failures are a reported gap, not a retry loop. Do not restart simplification between rounds.

Confirm bug findings through real callers and supported inputs, checking counterevidence; type-permitted or invented states are insufficient. Resolve duplicates and disagreements from evidence; a supported minority finding still needs a disposition. A rejected finding repeated without new evidence stays rejected and is reported as a disagreement.

The coordinator assigns each confirmed finding a severity, including findings it discovers itself, and treats a reviewer’s proposed severity as evidence:

- **Blocking:** the change introduces it or makes it reachable in supported use, and the result is wrong output, lost or corrupted data, a security or permission failure, a broken requirement or contract, a UI failure that stops or misleads the user in the affected journey, or substantial unnecessary complexity with a simpler behavior-preserving alternative.
- **Minor:** supported use reaches it, but the consequence is cosmetic, easily recovered or confined to unusual use. Fix it when the fix is small; otherwise defer it with a reason. On its own it does not justify another round.
- **Not actionable:** a preference, a check tooling already settles, a non-blocking finding whose fix would add unrequested behavior or options, or a trigger that needs several independent unlikely conditions for a recoverable consequence. Reject it.

Settle unclear triggers from callers, deployment and targeted probes, not the worst case. A race, timing or ordering finding needs actors that actually run concurrently in supported deployments, the interleaving and what breaks, or it is not actionable. A rare trigger stays blocking when its consequence is severe and hard to recover from, such as corrupted persisted data, a security breach or lost user work. Report other serious defects in affected behavior as non-blocking residual concerns with evidence.

After each round, fix blocking issues, small minor ones and selected UI improvements when authorized, verify repaired and preserved behavior, and recapture changed UI. A fix is contained when it stays within its finding, leaves other behavior, contracts, persisted data, security and permissions unchanged, and passes relevant checks. Then decide:

- **Run another round** when the round fixed a blocking issue, applied a selected UI improvement or made an uncontained fix; fresh reviewers assess the full resulting change under the same criteria.
- **Finish** when the reviewed revision has no blocking findings and no other round trigger applies; its fixes are reported as coordinator fixes verified by checks and need no further council review.
- **Stop and ask the user** when rounds stop converging (fixes keep producing new blocking findings in touched code, a blocking issue survives repeated repairs, or evidence cannot settle whether a finding blocks) or evidence, tools or authority are unavailable. Report the pattern, evidence and decision needed instead of another round; you may first consult the `oracle` role on whether the remaining findings block merging.

## 5. Report and finish

A complete code-review has simplification done, every member’s assessment of the final council-reviewed revision, no blocking issues on it, only contained fixes after it, applicable UI criteria supported by captures and interaction evidence, and required checks passing. Otherwise report a partial result plainly; a stop for non-convergence or missing evidence is not approval.

Report useful simplifications and a concise account of each round from the round record: why another round did or did not run, each reviewer’s confidence with its evidence basis and limits, which fixes received later review, the final target, unresolved disagreements and residual concerns. Never carry confidence onto later edits or call unreviewed repairs approved.

Put the report in chat, or in an existing PR description when updating that PR is authorized, and leave readiness and the check-in to the caller. Include any [show-video](../show-video/SKILL.md) recording; a clean or findings-only review needs no new one by itself.

Consider [feedback-hardening](../feedback-hardening/SKILL.md) for observed workflow problems; it does not gate delivery.
