---
name: code-review
description: 'Simplify changed code, then independently review standards, correctness and test value.'
metadata:
  source: https://github.com/mattpocock/skills
  source-path: skills/engineering/code-review
  source-revision: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
---

# Code review

Simplify the change, review it independently, and finish authorized repairs. The coordinator owns integration, findings decisions, validation and delivery. Follow the model policy in `AGENTS.md`.

## 1. Establish the change

Identify the target and its actual or planned PR base. Use a commit's parent only for a single-commit review. Include the whole intended change, preserve unrelated work, and record the base and reviewed commit or patch.

Establish requirements from the task, docs and callers. Without a spec, state the inferred contract and still review correctness. Resolve routine questions from evidence; ask about unclear intended behavior or authority.

Read [coding-standards](../coding-standards/SKILL.md) in Read expectations mode and identify reusable checks. For code or test changes, the coordinator, simplifier and reviewers also load [writing-good-tests](../writing-good-tests/SKILL.md) before choosing proof or recommending coverage.

Honor narrower requests. Findings-only means no edits; a single-review request runs only that assessment. For native review, use the harness's native command directly. Run [ClawSweeper](references/clawsweeper.md) only when separately requested. Report coverage limits.

## 2. Simplify

Give one implementation agent the target, requirements, owned files, repair authority and checks. Use the native `Agent` tool with `subagent_type: "implementer"` when available. Run this pass even after implementation; if independent dispatch is unavailable, simplify locally and disclose it. Keep other writers off its files until integration.

Inspect changed and directly affected code, callers, tests and fixtures. Remove unnecessary abstractions, duplication, speculative flexibility, unrelated additions and accidental generated-file changes. Prefer existing repository or dependency capabilities. Preserve required behavior; inspect callers before deleting guards, cleanup, error handling, public contracts or tests.

Apply [reducing-cognitive-load](../reducing-cognitive-load/SKILL.md) to names, boundaries and statements. Trace each branch's result, including fields it adds, moves or omits. Check whether named steps or explicit return fields make changed expressions easier to follow. A clean readability report from the simplifier or standards reviewer must show a nontrivial changed block and explain why its steps and result are clear, or state what remains unassessed.

Use writing-good-tests to decide which tests to keep, change, add or remove. Justify keepers and distinguish consolidation from retirement without replacement. Stop for breaking changes, new dependencies or unrelated scope that need user authority.

The simplifier returns its patch, a concrete before/after explanation, checks and unresolved concerns. For findings-only work, it proposes changes instead. Integrate and resolve verification failures before review.

## 3. Review independently

Dispatch two fresh native `Agent` invocations against the same stable result, using `subagent_type: "findings-reviewer"` when available. Otherwise use fresh findings-only agents under the AGENTS.md model policy. Do not resume the simplifier as a reviewer. Give them the target, base, diff, requirements, standards, reusable proof and their assignment below. Exclude implementation rationale, simplifier conclusions and prior findings. Reviewers may inspect callers and dependencies; they do not edit or manage repairs.

Record each reviewer's revision and check it again on return. If it changed, reassess the affected conclusions. If independent dispatch is unavailable, disclose the missing review. Each reviewer completes its assignment in one pass and returns all supported findings.

- **Standards:** assess standards, readability, diff waste and unnecessary complexity. Apply the readability check in step 2. Report relevant standard IDs and exceptions. For a maintenance finding, show confusing code and a simpler alternative. Skip preferences and checks settled by tooling.
- **Requirements and correctness:** trace the affected flow from a real entry point. Look for missing, incorrect or unrequested behavior, including failure and recovery. Ask what consequential defect could leave existing tests green and what runtime or persisted-state evidence would expose it. When data formats change, identify every reader, including tools and UIs, and exercise each with pre-change state. Reuse supplied results; run targeted probes and fault checks in scratch copies. Apply typescript-discipline for TypeScript, reuse frontend-ui-validation proof for UI changes, and use other domain lenses as needed.

Both reviewers apply writing-good-tests to test additions, keepers and deletions. Findings include location, expected behavior, reachable trigger, consequence and evidence. Report unresolved concerns and verification limits; distinguish source inspection from executed proof. An empty findings list is valid and does not prove coverage.

## 4. Resolve and finish

Keep both assessments visible. Check the concrete readability evidence before accepting a clean conclusion. Confirm bug findings through real callers and supported inputs, checking counterevidence; type-permitted or invented states are insufficient. Complexity findings need a present reading or change cost and a simpler behavior-preserving alternative.

Fix confirmed in-scope problems, grouping shared causes. Preserve user decisions about scope, contracts, dependencies and publication. Verify repaired and preserved behavior with relevant checks, reusing applicable passing results. Stop at the first failure and diagnose.

The coordinator finishes repairs without restarting the simplifier or broad review. Request a focused independent check only for a concrete unresolved question. Do not add automatic review loops or clean-pass quotas.

Keep findings, decisions and proof with the task. Finish when simplification is complete, both reviews cover the result, confirmed in-scope problems are resolved, and required checks pass. Narrower requests end with their requested assessment. Otherwise say what remains and why.

Give brief progress updates during long work. Report useful simplifications and net line change, review findings and fixes, proof, final target and remaining limits. Publication needs existing user or calling-workflow authority; this skill grants no automatic push.

Use [feedback-hardening](../feedback-hardening/SKILL.md) to decide whether observed workflow problems warrant separate work; it does not gate delivery.
