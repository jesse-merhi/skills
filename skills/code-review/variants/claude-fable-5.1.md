---
name: code-review
description: 'Use when asked to review code or a PR, before marking a PR ready, or to polish UI to a target score.'
metadata:
  source: https://github.com/mattpocock/skills
  source-path: skills/engineering/code-review
  source-revision: abeeaf95660ba9e8b7c753eb38f441ca707a8823
  sources: |
    - Council approach inspired by Theo’s [tstack council](https://github.com/t3dotgg/tstack/blob/1085050f3baed1ac724caa4a8166145fb2ac88af/skills/council/SKILL.md). Adapted with Jesse's reviewer lineup and round, evidence and authority rules.
    - UI polish mode informed by Theo’s [Agents Sucked At UI (Until Today)](https://www.youtube.com/watch?v=xq0eB8vxeqk), reviewed 2026-11-13.
---

# Code review

Simplify the change, then have one independent reviewer or a five-model council assess it and any affected UI. Never start a second council through another skill.

## 1. Establish the change

Identify the target and its actual or planned PR base, using a commit's parent only for a single-commit review. Review the whole intended change, preserve unrelated work, and record the base. Derive requirements from the task, docs and callers, stating the inferred contract when there is no spec.

Honor narrower requests and report their limits. Findings-only permits inspection and proposals. A request for just one assessment limits work to that assessment. Use the harness's native command for native review. Run [ClawSweeper](references/clawsweeper.md) only when separately requested.

## 2. Simplify

Give one implementation agent the target, requirements, owned files, repair authority and checks. Run this pass even after implementation. Claude and Gemini coordinators use the [Codex handoff](references/codex-implementation.md) for every edit. A Codex coordinator may simplify directly when dispatch is unavailable and disclose that.

- **Remove waste.** Limit the pass to changed and directly affected code, tests and fixtures, including accidental generated-file changes. Check callers before deleting guards, cleanup, error handling, public contracts or tests. Apply [writing-good-tests](../writing-good-tests/SKILL.md) and distinguish test consolidation from retirement without replacement.
- **Name things from their uses.** Read definitions and callers together. Prefer `sendNotification` to `executeNotificationDispatch`. Keep meaningful units such as `expiresAtMs` and use domain terms when they are clearer. Update definitions and uses together. Change public contracts only when authorized.
- **Make the flow readable on the first pass.** Keep related work together and trace each branch's result, including fields added, moved or omitted. Extract a function if its name clarifies a step. Keep it inline if the jump makes reading harder. Skip changes based only on taste.
- **Check React prop contracts.** Use [typescript-discipline](../typescript-discipline/SKILL.md#react-prop-contracts) to establish supported caller states before removing optionality or fallbacks.

The simplifier returns its patch, a concrete before/after explanation, checks and unresolved concerns, or proposals for findings-only work. Integrate and resolve verification failures before review.

## 3. Choose a review mode

**Decide the review mode yourself. Never ask the user whether to run one reviewer or five.** Honor the mode the user explicitly requested. Otherwise, apply the rules below and proceed. State which mode ran in the report.

- **Single reviewer (default).** Use one fresh findings-only **GPT-6.2 Sol** reviewer at **high** for ordinary features, bug fixes, tests, docs, clean rebases and small follow-ups. If Sol is unavailable at high in fresh context, use **Claude Opus 5.5** at **high**.
- **Five-model council.** Launch all five fresh findings-only reviewers at **high** when the user asks for a council or any trigger below applies. The lineup is **GPT-6.2 Sol, GPT-6.2 Astra, Claude Opus 5.5, Claude Fable 5.2 and Gemini 4 Neon**.
  - **High-risk boundary.** The change touches authentication, permissions, security or privacy, billing or payments, database migrations, persisted-data formats, or release or CI deployment pipelines.
  - **Broad structural change.** The change refactors multiple packages or subsystems, or changes a public API or contract.
  - **Substantial UI or UI polish.** The change adds or reworks a user-facing screen, or the user asks to polish or score the UI.
  - **Post-round escalation.** A single-reviewer round raises a severe, disputed or hard-to-diagnose blocker and a council can help verify the fix or settle the finding. Run that council before asking the user to resolve an inconclusive finding under Step 4.

For a small follow-up or clean rebase after a council, apply the triggers to what changed since the council. Verify an unchanged patch with matching `git patch-id --stable` output or by verifying that a conflict-only merge preserved the intended patch. Review the new revision.

For affected UI, set fixed criteria and gather proof before launch using the [affected UI rules](references/affected-ui.md). When the user asks for polish or names a score, follow [UI polish](references/ui-polish.md).

### Launch independent reviewers

Follow [reviewer dispatch](references/reviewer-dispatch.md) to launch fresh reviewers. Use [wait-efficiently](../wait-efficiently/SKILL.md) for pending results.

Count only fresh assessments from the selected models at high on that revision. Disclose context contamination and record missing models with reasons. Continue with any qualifying assessments, even one from a council. If none qualify, report the review incomplete and stop.

### Apply both lenses

Each reviewer uses both lenses and reports every supported finding, including minor ones.

- **Standards:** [coding-standards](../coding-standards/SKILL.md), step 2's readability rules, diff waste, unnecessary complexity, and [writing-good-tests](../writing-good-tests/SKILL.md) for test additions, keepers and deletions. Cite relevant standard IDs and exceptions. A maintenance finding shows the confusing code, its present reading or change cost, and a simpler behavior-preserving alternative.
- **Requirements and correctness:** trace real entry points through failure and recovery to the consumer-visible result. Look for missing, incorrect or unrequested behavior. Ask what consequential defect could pass existing tests and what runtime or persisted-state evidence would expose it. Exercise every reader, including tools and UIs, with pre-change state when data formats change. Apply typescript-discipline and relevant domain lenses.

For each finding, give its location, expected behavior, reachable trigger and likelihood in supported use, consequence, evidence and proposed Step 4 severity. Separate source inspection from executed proof. An empty findings list is valid and proves no coverage. State confidence in the reviewed revision, why, and what remains unverified. Supported findings take precedence over confidence.

## 4. Repeat rounds until only minor findings remain

Keep one round record across resumes with each reviewed revision, actual models and efforts, findings, confidence, decisions and severities with reasons, fixes and resulting revision. Stop retrying repeated dispatch failures and report the gap. Skip another simplification pass between rounds.

### Confirm findings and assign severity

Confirm bugs through real callers and supported inputs and check counterevidence. Type-permitted or invented states are insufficient. Resolve duplicates and disagreements from evidence. Give supported minority findings a disposition. Record rejected findings repeated without new evidence as disagreements and keep them rejected.

The coordinator sets severity for all confirmed findings, including its own. Consider the reviewer's proposed severity.

- **Blocking:** the change introduces it or makes it reachable in supported use, and the result is wrong output, lost or corrupted data, a security or permission failure, a broken requirement or contract, a UI failure that stops or misleads the user in the affected journey, or substantial unnecessary complexity with a simpler behavior-preserving alternative.
- **Minor:** supported use reaches it, but the consequence is cosmetic, easily recovered or confined to unusual use. Fix it when the fix is small; otherwise defer it with a reason. On its own it does not justify another round.
- **Not actionable:** a preference, a check tooling already settles, a non-blocking finding whose fix would add unrequested behavior or options, or a trigger that needs several independent unlikely conditions for a recoverable consequence. Reject it.

Settle unclear triggers from callers, deployment and targeted probes. To act on a race, timing or ordering finding, show which actors run concurrently in supported deployments, the interleaving and what breaks. A rare trigger still blocks when its consequence is severe and hard to recover from, such as corrupted persisted data, a security breach or lost user work. Report other serious defects in affected behavior as non-blocking concerns with evidence.

### Decide whether to repeat

Route authorized fixes and selected UI improvements through Step 2's implementation policy. Verify repaired and preserved behavior and recapture changed UI. A contained fix stays within its finding, preserves other behavior, contracts, persisted data, security and permissions, and passes relevant checks.

- **Run another round** after a blocking fix, a selected UI improvement or an uncontained fix. Fresh reviewers assess the full resulting change under the same criteria.
- **Finish** when the reviewed revision has no blocking findings and no other round trigger applies. Report any contained fixes the coordinator verified by checks after the round.
- **Stop and ask the user** if fixes keep producing new blockers in touched code, a blocker survives repeated repairs, or evidence cannot settle whether a finding blocks. Also stop if missing evidence, tools or authority blocks further work. Report the pattern, evidence and decision needed. For read-only advice, prefer GPT-6.2 Astra at high. Use Claude Fable 5.2 at high for a harder decision or through the native Claude `oracle` role.

## 5. Report and finish

Report the final round against the revision it assessed.

- **Single-reviewer review** when single-reviewer mode ran. Name the actual model and effort, including the reason if it used the fallback.
- **Full council** when all five members assessed that revision.
- **Restricted council** when some of the five assessed it. Name each missing model and why it did not qualify, even if only one member completed the council round.

Any of these completes `code-review` when simplification is done, the reviewed revision has no blocking issues, only contained fixes follow, applicable UI criteria have capture and interaction proof, and required checks pass. UI polish also has its own completion criteria. Report an incomplete result if any condition fails. A stop for non-convergence or missing evidence does not approve the change.

Give brief progress updates during long work. Report useful simplifications and a concise account of each round from the round record: why another round did or did not run, each reviewer’s confidence with its evidence basis and limits, missing models and reasons, which fixes received later review, the final target, unresolved disagreements and residual concerns. Never carry confidence onto later edits or call unreviewed repairs approved.

Put the report in chat, or in an existing PR description when updating that PR is authorized, and leave readiness and the check-in to the caller. Include any [show-video](../show-video/SKILL.md) recording; a clean or findings-only review needs no new one by itself.

