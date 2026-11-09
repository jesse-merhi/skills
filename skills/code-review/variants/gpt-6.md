---
name: code-review
description: 'Simplify changes, then run a four-model council for code review and UI refinement until only minor findings remain.'
metadata:
  source: https://github.com/mattpocock/skills
  source-path: skills/engineering/code-review
  source-revision: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
  sources: |
    - Council approach inspired by Theo’s [tstack council](https://github.com/t3dotgg/tstack/blob/1085050f3baed1ac724caa4a8166145fb2ac88af/skills/council/SKILL.md). This adaptation uses the user-selected reviewers and the round, evidence and authority rules below.
---

# Code review

Simplify the change, then use an independent council to review code and refine affected UI. The coordinator owns integration, findings decisions, authorized repairs, validation and delivery. Follow the model policy in `AGENTS.md`, including its council exception. Existing callers use this workflow directly; do not start a second council through another skill.

## 1. Establish the change

Identify the target and its actual or planned PR base. Use a commit's parent only for a single-commit review. Include the whole intended change, preserve unrelated work, and record the base and reviewed commit or patch.

Establish requirements from the task, docs and callers. Without a spec, state the inferred contract and still review correctness. Resolve routine questions from evidence; ask about unclear intended behavior or authority.

Read [coding-standards](../coding-standards/SKILL.md) in Read expectations mode and identify reusable checks. For code or test changes, the coordinator, simplifier and reviewers also load [writing-good-tests](../writing-good-tests/SKILL.md) before choosing proof or recommending coverage.

Honor narrower requests. Findings-only means no edits; a single-review request runs only that assessment. For native review, use the harness's native command directly. Run [ClawSweeper](references/clawsweeper.md) only when separately requested. Report coverage limits. Findings-only reviewers perform their assigned assessment and return; they do not orchestrate this workflow.

## 2. Simplify

Give one implementation agent the target, requirements, owned files, repair authority and checks. Use `spawn_agent`, selecting the configured `implementer` role when supported. Run this pass even after implementation; if independent dispatch is unavailable, simplify locally and disclose it. Keep other writers off its files until integration.

Inspect changed and directly affected code, callers, tests and fixtures. Remove unnecessary abstractions, duplication, speculative flexibility, unrelated additions and accidental generated-file changes. Prefer existing repository or dependency capabilities. Preserve required behavior; inspect callers before deleting guards, cleanup, error handling, public contracts or tests.

Apply [reducing-cognitive-load](../reducing-cognitive-load/SKILL.md) to names, boundaries, statements and expressions. Trace each branch's result, including fields added, moved or omitted. Consider named steps or explicit return fields to clarify dense expressions. The simplifier and each council reviewer must support a clean readability conclusion with a nontrivial changed block and explain why its steps and result are clear. Report unassessed code.

Use writing-good-tests to decide which tests to keep, change, add or remove. Justify keepers and distinguish consolidation from retirement without replacement. Stop for breaking changes, new dependencies or unrelated scope that need user authority.

The simplifier returns its patch, a concrete before/after explanation, checks and unresolved concerns. For findings-only work, it proposes changes instead. Integrate and resolve verification failures before review.

## 3. Review with the council

Use four fresh findings-only reviewers: **GPT-6 Astra, Claude Fable 5.2, Claude Opus 5.5 and GPT-6.1 Sol**, each at **high** reasoning effort. This council uses the `AGENTS.md` exception to Astra’s oracle-only assignment; all members remain findings-only.

Resolve actual model and effort settings through the available launcher. In T3 Code, use `orchestrator_capabilities`, then `delegate_task` for the selected members with settings in `target.options`. Elsewhere, use `spawn_agent` with `fork_turns="none"` only for models and settings it supports. Prefer a configured findings-only role when its pinned model and effort match; a prompt cannot override a role’s settings. If a member or setting is unavailable, report which one and the resulting coverage gap. Do not silently substitute, count the coordinator as a member, or claim a complete council. Continue useful authorized work with available coverage; any change to membership needs the user’s decision.

Dispatch the four assessments in parallel when supported, against the same stable commit or recorded patch. Give each reviewer the target, base, full diff, requirements, standards, reusable proof and both lenses below. Exclude implementation rationale, simplifier conclusions and prior findings; do not resume an implementer or previous reviewer. Reviewers may inspect callers and dependencies and run permitted read-only probes; they do not edit, spawn reviewers or manage repairs. Use [wait-efficiently](../wait-efficiently/SKILL.md) for pending results.

Record each reviewer’s actual model, effort, revision and evidence. Check the revision on return; changed code invalidates affected conclusions. A stale assessment cannot establish agreement on the current result. Disclose context contamination or unavailable independent dispatch.

Each reviewer reports every supported finding in one pass, including minor ones, since a missed finding can cost another council round. Breadth does not relax the evidence requirements below. Assess each candidate under both lenses:

- **Standards:** assess standards, readability, diff waste and unnecessary complexity. Apply the readability check in step 2 and reducing-cognitive-load to proposed fixes. Report relevant standard IDs and exceptions. For a maintenance finding, show confusing code, its present reading or change cost, and a simpler behavior-preserving alternative. Skip preferences and checks settled by tooling.
- **Requirements and correctness:** trace the affected flow from a real entry point through the consumer-visible result, including failure and recovery. Look for missing, incorrect or unrequested behavior. Ask what consequential defect could leave existing tests green and what runtime or persisted-state evidence would expose it. When data formats change, identify every reader, including tools and UIs, and exercise each with pre-change state. Reuse supplied results; run targeted probes and fault checks in scratch copies. Apply typescript-discipline for TypeScript, frontend-ui-validation evidence for UI, and other domain lenses as needed.

Every reviewer applies writing-good-tests to test additions, keepers and deletions. Findings include location, expected behavior, reachable trigger, consequence, evidence and a proposed severity under step 4, stating how likely the trigger is in supported use. Return unresolved concerns and verification limits, distinguishing source inspection from executed proof. An empty findings list is valid and does not prove coverage.

Ask each reviewer to state its confidence in the reviewed result and fixes visible in that revision, with reasons tied to the evidence it inspected and what remains unverified. Preserve its wording and any supplied scale; if absent, report “not supplied.” Report confidence as the reviewer’s judgment. Do not treat it as proof, let it override supported findings, or invent or average scores.

### UI hill climbing

For affected UI, include visual and interaction assessment in these same council rounds. Before round one, establish product criteria from the user’s goal, affected journey and existing design system: task clarity, hierarchy, spacing, typography, accessibility, responsive behavior and relevant loading, empty and error states. Record which apply, the baseline screenshots and any available reference screenshots, with their provenance. If no reference exists, say so and use the product criteria; do not invent a reference or require a redesign.

Keep criteria, comparison states and viewports fixed across rounds. Record any later user change explicitly. Have the implementation owner use [frontend-ui-validation](../frontend-ui-validation/SKILL.md) to capture the actual UI and exercise relevant interactions; reuse its revision, environment, capture paths and coverage notes. Give all reviewers that evidence. Missing browser access, captures or interaction proof is a visible limit; source inspection alone cannot establish visual improvement.

Ask for concrete feedback tied to a screenshot region or observed interaction, the unmet criterion, its user impact, and a small proposed improvement. Separate observed defects from design judgment. Each applied improvement needs another council round, so the coordinator selects supported, in-scope improvements only when an unmet criterion has clear user impact and leaves taste-level refinements as minor. It preserves the product direction and functionality and captures comparable evidence after changes. Compare before and after against the same criteria, including regressions. No whole-product redesign, extra feature work or separate visual-review loop follows from this branch.

## 4. Repeat rounds until only minor findings remain

Keep one round record with the task: round number, reviewed revision, evidence, each reviewer’s findings and confidence, coordinator decisions and severities, fixes, checks and resulting revision. Each round assesses one stable revision of code and UI. Filling a missing member’s assessment on the same revision stays in that round; repeated dispatch failures remain a reported gap, not an automatic retry loop. Reuse the record across resumes, retries, code/UI work and Council entry points. Do not restart simplification between rounds.

Keep all four assessments visible. Check concrete readability evidence before accepting a clean conclusion. Confirm bug findings through real callers and supported inputs, checking counterevidence; type-permitted or invented states are insufficient. Complexity findings need a present reading or change cost and a simpler behavior-preserving alternative. Resolve duplicate causes and disagreements from evidence; a supported minority finding still needs a disposition. Record accepted, rejected, deferred and unresolved items with reasons.

The coordinator assigns each confirmed finding a severity, including findings it discovers itself, and treats a reviewer’s proposed severity as evidence:

- **Blocking:** the change introduces it or makes it reachable in supported use, and the result is wrong output, lost or corrupted data, a security or permission failure, a broken requirement or contract, a UI failure that stops or misleads the user in the affected journey, or substantial unnecessary complexity with a simpler behavior-preserving alternative.
- **Minor:** supported use reaches it, but the consequence is cosmetic, easily recovered or confined to unusual use. Fix it when the fix is small; otherwise defer it with a reason. On its own it does not justify another round.
- **Not actionable:** a preference, a check tooling already settles, or a trigger that needs several independent unlikely conditions for a recoverable consequence. Record it as rejected with the reason.

Weigh how likely the trigger is in supported use against how severe and recoverable the consequence is. For race, timing and ordering findings, identify which actors actually run concurrently in supported deployments, the interleaving, and what breaks; without a real concurrent actor, the finding is not actionable. A rare trigger remains blocking when its consequence is severe and hard to recover from, such as corrupted persisted data, a security breach or lost user work. Settle an unclear trigger from callers, deployment and targeted probes rather than assuming the worst case. Report other serious defects in affected behavior as residual concerns with their evidence; they do not block finishing.

After each round, fix blocking issues, minor issues with small fixes and selected UI improvements when authorized. Preserve user decisions about scope, contracts, dependencies and publication. Verify repaired and preserved behavior with relevant checks, reusing applicable passing results. Stop at the first failure and diagnose before rerunning. Capture fresh UI evidence where behavior or appearance changed. A fix is contained when it stays within its finding, leaves other behavior, contracts, persisted data, security and permissions unchanged, and passes relevant checks. Then decide what follows:

- **Run another round** when the round fixed a blocking issue, applied a selected UI improvement or made a fix that is not contained. The next round assesses the full resulting change under the same criteria; reviewers remain fresh and independent of prior reports.
- **Finish** when the reviewed revision has no blocking findings and no trigger for another round applies. Report those fixes as coordinator fixes verified by checks; they need no further council review.
- **Stop and ask the user** when rounds stop converging: fixes keep producing new blocking findings in the code they touched, the same blocking issue survives repeated repairs, or the coordinator cannot settle whether a finding is blocking from available evidence. Also stop when evidence, tools or authority are unavailable. Report the pattern, its evidence and the decision needed rather than running another round.

A reviewer repeating a rejected finding without new evidence does not reopen it; record the disagreement in the report. A missing member or failed assessment cannot count as a clean result. Never carry approval or confidence from an earlier revision onto later edits.

## 5. Report and finish

Keep findings, decisions and proof with the task. A complete code-review has simplification done, all four assessments of the final council-reviewed revision, no blocking issues on it, only contained fixes after it, applicable UI criteria supported by captures and interaction evidence, and required checks passing. Otherwise report a partial assessment, residual issues or blocked repairs plainly. A stop for non-convergence or missing evidence is not approval. Narrower requests end with their requested assessment.

Report useful simplifications and net lines added/removed, then give a concise round-by-round account of what was reviewed, fixed and verified, including each finding’s severity, rounds with no fixes and why another round was or was not run. Show each reviewer’s stated confidence for each reviewed revision, its evidence basis and verification limits. Identify which fixes received subsequent review, the final target, unresolved disagreements and residual concerns. Never transfer an earlier confidence statement to later edits or describe unreviewed repairs as approved.

Publication needs existing user or calling-workflow authority; this skill grants no automatic push, PR update or merge. Put the report in chat; include it in an existing PR description only when updating that PR is authorized. Do not post a prose PR comment. Preserve the caller’s readiness and sign-off gates.

Use [feedback-hardening](../feedback-hardening/SKILL.md) to decide whether observed workflow problems warrant separate work; it does not gate delivery.
