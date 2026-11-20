---
name: code-review
description: 'Use when asked to review code or a PR, before marking a PR ready, or to polish UI to a target score.'
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

Give one implementation agent the target, requirements, owned files, repair authority and checks. Run this pass even after implementation. For Claude or Gemini coordinators, every edit goes to GPT-6.2 Sol at `xhigh` through Codex signed in with ChatGPT. Follow `AGENTS.md` for launch details. If the handoff is unavailable or the host bars it, leave the edit pending and report the blocker. A Codex coordinator may simplify directly when dispatch is unavailable and disclose that.

Remove what the requirement does not need from changed and directly affected code, tests and fixtures, including accidental generated-file changes, but check callers before deleting guards, cleanup, error handling, public contracts or tests. Make the code understandable on the first read, even when the implementation is sophisticated. Read definitions with their usages and choose the simplest accurate name in ordinary words: `executeNotificationDispatch` can be `sendNotification`, while `expiresAtMs` keeps its unit and a domain term may beat a generic one. Update definitions and usages together; change public contracts only when authorized. Keep related work together and branches readable, tracing each branch's result including fields added, moved or omitted. Extract a function when its name makes a step clearer; keep it inline when another jump would cost the reader more. For React prop contracts, use [typescript-discipline](../typescript-discipline/SKILL.md#react-prop-contracts) to establish supported caller states before removing optionality or fallbacks. Avoid changes based only on taste.

Apply [writing-good-tests](../writing-good-tests/SKILL.md), distinguishing test consolidation from retirement without replacement.

The simplifier returns its patch, a concrete before/after explanation, checks and unresolved concerns, or proposals for findings-only work. Integrate and resolve verification failures before review.

## 3. Review with the council

The full council has five fresh findings-only reviewers: **GPT-6.2 Astra, Claude Fable 5.2, Claude Opus 5.5, GPT-6.2 Sol and Gemini 4 Neon**, each at **high** reasoning effort. This membership takes precedence over harness reviewer defaults.

In T3 Code, get provider and model IDs and supported options from `orchestrator_capabilities`, then launch with `delegate_task` and pass the effort in `target.options`. For Gemini 4 Neon, use an authenticated Antigravity provider and select its High thinking setting. Elsewhere, use native subagent tools only for models and settings they support. Prefer a findings-only role with the matching model and effort. Skip any member you cannot launch at high effort with its named model.

Dispatch every available member in parallel when supported, on the same stable commit or recorded patch. Give each the target, base, full diff, requirements, standards, reusable proof and both lenses below, without implementation rationale, simplifier conclusions or prior findings; never resume an implementer or previous reviewer. Reviewers may run permitted read-only probes and fault checks in scratch copies but do not spawn reviewers. Use [wait-efficiently](../wait-efficiently/SKILL.md) for pending results, checking each as it arrives, and leave the reviewed revision unedited until the round is complete. Disclose context contamination.

Count only assessments from the named reviewers at high effort on the round’s revision. Record each missing model and why it is missing. Continue automatically with any qualifying assessments, even one. If none qualify, report the review incomplete and stop.

Each reviewer applies both lenses and reports every supported finding, minor ones included:

- **Standards:** [coding-standards](../coding-standards/SKILL.md), step 2's readability rules, diff waste, unnecessary complexity, and [writing-good-tests](../writing-good-tests/SKILL.md) for test additions, keepers and deletions. Cite relevant standard IDs and exceptions. A maintenance finding shows the confusing code, its present reading or change cost, and a simpler behavior-preserving alternative.
- **Requirements and correctness:** trace the affected flow from a real entry point to the consumer-visible result, including failure and recovery, for missing, incorrect or unrequested behavior. Ask what consequential defect could leave existing tests green and what runtime or persisted-state evidence would expose it. When data formats change, exercise every reader, including tools and UIs, with pre-change state. Apply typescript-discipline and other relevant domain lenses.

Each finding gives location, expected behavior, reachable trigger and its likelihood in supported use, consequence, evidence and a proposed step 4 severity. Verification limits separate source inspection from executed proof; an empty findings list is valid but proves no coverage. Each reviewer states its confidence in the reviewed revision with reasons and what remains unverified; confidence is judgment, not proof, and never overrides supported findings.

### Affected UI

Assess affected UI’s visuals and interactions in the same rounds. Before round one, set product criteria from the user’s goal, affected journey and design system, such as task clarity, hierarchy, spacing, typography, accessibility, responsiveness and loading, empty and error states. Record baseline and any reference screenshots with provenance, noting when none exists; never invent one. Keep criteria, states and viewports fixed across rounds unless the user changes them.

The implementation owner captures the UI and exercises interactions with [frontend-ui-validation](../frontend-ui-validation/SKILL.md) for every reviewer. Report missing captures or interaction proof as a limit; source inspection alone cannot show visual improvement.

UI feedback ties a screenshot region or interaction to an unmet criterion, its user impact and a small proposed fix, separating observed defects from design judgment. Each applied improvement costs a round, so apply only supported, in-scope improvements with clear user impact; taste-level refinements stay minor. Preserve product direction and functionality, with no redesign, feature work or separate visual-review loop, and compare before and after captures against the same criteria, including regressions.

When the user asks to polish the UI or names a score, read [ui-polish.md](references/ui-polish.md).

## 4. Repeat rounds until only minor findings remain

Keep one round record with the task across resumes: each round’s revision, reviewers’ actual models and efforts, findings, confidence, decisions and severities with reasons, fixes and resulting revision. Repeated dispatch failures are a reported gap, not a retry loop. Do not restart simplification between rounds.

Confirm bug findings through real callers and supported inputs, checking counterevidence; type-permitted or invented states are insufficient. Resolve duplicates and disagreements from evidence; a supported minority finding still needs a disposition. A rejected finding repeated without new evidence stays rejected and is reported as a disagreement.

The coordinator assigns each confirmed finding a severity, including findings it discovers itself, and treats a reviewer’s proposed severity as evidence:

- **Blocking:** the change introduces it or makes it reachable in supported use, and the result is wrong output, lost or corrupted data, a security or permission failure, a broken requirement or contract, a UI failure that stops or misleads the user in the affected journey, or substantial unnecessary complexity with a simpler behavior-preserving alternative.
- **Minor:** supported use reaches it, but the consequence is cosmetic, easily recovered or confined to unusual use. Fix it when the fix is small; otherwise defer it with a reason. On its own it does not justify another round.
- **Not actionable:** a preference, a check tooling already settles, a non-blocking finding whose fix would add unrequested behavior or options, or a trigger that needs several independent unlikely conditions for a recoverable consequence. Reject it.

Settle unclear triggers from callers, deployment and targeted probes, not the worst case. A race, timing or ordering finding needs actors that actually run concurrently in supported deployments, the interleaving and what breaks, or it is not actionable. A rare trigger stays blocking when its consequence is severe and hard to recover from, such as corrupted persisted data, a security breach or lost user work. Report other serious defects in affected behavior as non-blocking residual concerns with evidence.

After each round, route authorized fixes and selected UI improvements through the implementation policy above. Verify repaired and preserved behavior and recapture changed UI. A fix is contained when it stays within its finding, leaves other behavior, contracts, persisted data, security and permissions unchanged, and passes relevant checks. Then decide:

- **Run another round** when the round fixed a blocking issue, applied a selected UI improvement or made an uncontained fix; fresh reviewers assess the full resulting change under the same criteria.
- **Finish** when the reviewed revision has no blocking findings and no other round trigger applies. Report any contained fixes the coordinator verified by checks after the round.
- **Stop and ask the user** when rounds stop converging (fixes keep producing new blocking findings in touched code, a blocking issue survives repeated repairs, or evidence cannot settle whether a finding blocks) or a lack of evidence, tools or authority blocks further work. Report the pattern, evidence and decision needed instead of another round. The oracle guidance in `AGENTS.md` applies if a decision merits a second opinion.

## 5. Report and finish

Report the final round as a full council if all members assessed that revision, or a restricted council if only some did. Either review can finish with simplification done, no blocking issues on it, only contained fixes after it, applicable UI criteria supported by captures and interaction evidence, and required checks passing. Otherwise report a partial result plainly; a stop for non-convergence or missing evidence is not approval.

Report useful simplifications and a concise account of each round from the round record: why another round did or did not run, each reviewer’s confidence with its evidence basis and limits, missing models and reasons, which fixes received later review, the final target, unresolved disagreements and residual concerns. Never carry confidence onto later edits or call unreviewed repairs approved.

Put the report in chat, or in an existing PR description when updating that PR is authorized, and leave readiness and the check-in to the caller. Include any [show-video](../show-video/SKILL.md) recording; a clean or findings-only review needs no new one by itself.

