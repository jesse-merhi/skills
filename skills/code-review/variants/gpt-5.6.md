---
name: code-review
description: 'Simplify changed code, then independently review standards and requirements/correctness.'
metadata:
  source: https://github.com/mattpocock/skills
  source-path: skills/engineering/code-review
  source-revision: c55ee46073ed923f86ce59a5eb3b6d895095d1b7
---

# Code review

Make the change easier to understand, establish whether it works, and finish the authorized repairs. The coordinator owns integration, findings decisions, validation and delivery. Use the model policy in `AGENTS.md`.

## 1. Establish the change

Use the requested PR, branch, commit or working changes. Resolve the PR's actual or planned base; use a commit's parent only for a single-commit review. Include the whole intended change and preserve unrelated work. Record the base and reviewed commit or patch with the results.

Find requirements in the task, issue, spec, documentation and callers. Resolve ordinary questions from repository evidence; ask only when an intended behavior or authority needs the user. Without a formal spec, state the inferred contract and still review correctness.

Read [coding-standards](../coding-standards/SKILL.md) in Read expectations mode and [reducing-cognitive-load](../reducing-cognitive-load/SKILL.md). Identify relevant existing checks and reusable evidence. Honor narrower requests: findings-only means no edits; a requested single reviewer or native-only pass runs only that review and reports its coverage limits. For a specifically requested native review, use the harness's native command directly. Separately requested bot review uses [ClawSweeper](references/clawsweeper.md).

## 2. Simplify first

Give one implementation agent the target, requirements, owned files, repair authority and checks, with this goal:

> Simplify the changed code and directly affected code while preserving required behavior. Remove unnecessary abstractions, indirection, duplication and speculative flexibility. Prefer existing repository or dependency capabilities. Make the flow easier to explain and change. Verify meaningful edits. Finish when no further simplification is justified by the current requirements; leave useful complexity alone.

Use `spawn_agent` for this owned implementation task, selecting the configured `implementer` role when the launcher supports it. The agent edits code and returns the patch, a concrete before/after explanation, checks and unresolved concerns. For findings-only work, it reports proposed simplifications instead. Keep other writers off its files until integration.

Follow [writing-good-tests](../writing-good-tests/SKILL.md) for coverage and verification. Inspect callers before deleting guards, cleanup, error handling, public contracts or tests. Preserve required safety and failure behavior. Fewer lines alone is not success, and unfamiliar code is not proof of unnecessary complexity. Stop for actual authority gaps such as breaking changes, dependencies or unrelated scope.

Integrate the patch and resolve verification failures before independent review. If no independent implementation agent is available, report it and simplify locally; the later reviews must still be independent.

## 3. Review the result in parallel

Use `spawn_agent` with `fork_turns="none"` for two fresh findings-only reviewers against the same stable result. Select the configured `findings_reviewer` role when supported; otherwise use fresh agents under the AGENTS.md model policy. Supply the target, base, diff, requirements, standards, relevant validation evidence and each assignment below. Exclude implementation rationale, simplifier conclusions and prior findings. Reviewers can inspect callers and dependencies to establish behavior; they do not edit or manage the workflow. Record the commit or patch each reviewer receives and check it again on return. If it changed, keep the report tied to the version reviewed and reassess the affected conclusions before completion. If independent dispatch is unavailable, disclose the missing review instead of counting self-review as independent.

- **Standards:** assess the repository's actual standards and remaining unnecessary complexity. Use reducing-cognitive-load and report the required standards assessment, including relevant standard IDs and exceptions. Show the confusing code and a simpler alternative for a maintenance finding; skip preferences and checks already settled by tooling.
- **Requirements and correctness:** check missing, partial, incorrect or unrequested behavior, including regressions, failure and recovery through actual callers. Run this review even without a spec. Use writing-good-tests for changed behavior or test infrastructure, typescript-discipline for TypeScript, and reuse frontend-ui-validation evidence for UI changes; other domain lenses follow the affected contract.

Each returns supported findings with location, expected behavior, reachable trigger, consequence and evidence, plus unresolved concerns and verification limits. Distinguish source inspection from executed proof. An empty findings report is valid. Neither a clean report nor a finding count proves coverage.

## 4. Resolve and finish

Keep the two assessments visible and confirm their findings before editing. Reproduce bugs or establish the failure through real callers and supported inputs; type-permitted or invented states are insufficient. Check counterevidence. For complexity findings, establish a present reading or change cost and a simpler behavior-preserving alternative.

Fix confirmed in-scope problems, grouping shared causes. Preserve user-owned decisions about scope, contracts, dependencies and publication. Verify repaired and preserved behavior using relevant checks; stop at the first failure and diagnose. Reuse applicable passing results. Request focused independent follow-up only where repairs invalidate a review conclusion or leave a concrete coverage gap. Do not chase a pass count or keep searching for new objections after the required evidence is established.

Keep findings, decisions and check evidence with the task so interrupted work can resume. Findings-only work ends with its report; a single-review request needs only its requested assessment. For the full workflow, finish when scoped simplification is complete, both assessments apply to the resulting code, confirmed in-scope problems are resolved, and required checks pass. Otherwise report exactly what remains and why. Summarize the useful simplifications, each review's findings and fixes, proof, final target and remaining limits. Publication follows existing user or calling-workflow authority; this skill grants no automatic push.
