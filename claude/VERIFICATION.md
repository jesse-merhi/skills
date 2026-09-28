# Native delegation evidence

Exercised with Claude Code 2.1.269 on 2026-09-14 (Australia/Sydney), using temporary projects under `/tmp/claude-named-proof`. Each project contained copies of these native `.claude/agents/*.md` definitions. The coordinator ran with `--setting-sources project --model fable --effort medium`; prompts supplied a role name and bounded assignment. No global agent files or settings were installed or changed.

| Role selected through `Agent.subagent_type` | Observed child model | Observed result |
| --- | --- | --- |
| `investigator` | `claude-fable-5-1` | Read a fixture and returned `427` with file evidence; no edits |
| `implementer` | `claude-fable-5-1` | Changed owned `message.txt` from `Hello, worl!` to exact bytes `Hello, world!\n`; coordinator did not edit |
| `findings-reviewer` | `claude-opus-5` | Identified subtraction in a required addition function; returned findings and verification limits without edits |

Streamed JSON records showed the configured `subagent_type`, child model, one completed agent, maximum depth one, no child spawning, and a successful result for each exercise. The implementer session used `--permission-mode acceptEdits` for its temporary fixture only. The reviewer retained normal permissions: two Node execution attempts were denied, and its report disclosed static verification. The coordinator separately ran the fixture and observed `-1` instead of the required `5`.

These exercises prove native named loading, model selection and simple delegated behavior. They do not prove every workflow route, effective provider effort, domain-skill loading, persistent-memory isolation, hostile-input resistance or filesystem sandboxing. Effort remains explicitly configured in frontmatter. The reviewer fixture had no prior findings in project instructions; contamination handling is a prompt obligation, not a proven isolation mechanism. This evidence does not replace the exact-head `code-review` gate for publication readiness.

Supporting local records: `/tmp/claude-named-proof/{investigator,implementer,reviewer}.jsonl`. The repository materializer suite passed all 17 tests; skill layout lint passed. No deterministic tests of instruction prose were added.

An independent reviewer inspected the definitions and installation guidance, then all five workflow BASE files, 20 variants and both review references. No supported issues were found. Instruction-tracing exercises covered ambiguous implementation scope with concurrent edits, an investigator asked to fix a defect, a reviewer assigned until-clean work, and prior findings in project instructions. Expected boundaries were preserved; these scenarios were inspected, not executed in Claude.

## Prompt cleanup follow-up

Removed coordinator-brief narration and generic process advice from all three roles in both harnesses. Required skill references, role boundaries, review evidence and configuration settings remain. Independent inspection and reasoned exercises found no supported regressions for ambiguity, concurrent edits, failed checks, read-only investigation, until-clean misassignment, prior findings or unreachable corrupted fixtures. Configuration outside the instruction bodies was unchanged.

Fresh Claude runs with the shortened prompts again returned `427`, corrected the assigned greeting, and identified the subtraction defect without reviewer edits. Child models remained Fable 5.1 for investigation and implementation and Opus 5 for review. Each run completed one named agent successfully. The reviewer again disclosed permission-blocked Node execution. Records are in `/tmp/claude-lean-proof/`; these runs do not establish effective effort, memory isolation or the full native review gate. The final explicit test-infrastructure skill clause was checked independently after these fixtures were copied; the fixtures exercise ordinary behavior, not test infrastructure. Both harness configurations were reviewed, but the shortened prompts were executed only in Claude.

The materializer suite passed 17 tests again, role TOML parsed through Bun, and skill layout lint passed.

## Direct variant instructions

All 32 variants across the five delegation workflows plus frontend-ui-validation, cleanup-and-archive and wait-efficiently now give their own applicable tool instructions. Shared BASE files remain neutral. Waiting procedures moved unchanged into the applicable variants, removing the two cross-harness reference files. Independent inspection and reasoned exercises found no lost delegation, review-independence, cleanup, UI or waiting contracts; final waiting inspection confirmed no mixed reference remained. Layout validation and all 17 materializer tests passed. These edits were checked by instruction exercises, not live workflow executions; previous native role fixtures remain evidence for role loading only.

## Opus 5.5 workers

On 2026-09-27, `implementer` and `investigator` moved from Fable 5.1 to `claude-opus-5-5`, keeping their effort settings. Claude Code 2.1.281 ran each role definition from a temporary project with the coordinator on a different model, `--setting-sources project --model claude-fable-5-1 --effort medium`, so a child on Opus 5.5 shows the pin rather than an inherited parent model. Streamed JSON showed parent `claude-fable-5-1`, one `Agent` call with the configured `subagent_type`, and child `claude-opus-5-5` for all three roles, including `findings-reviewer`, whose pin had not previously run under a different parent. The investigator returned `427` with file evidence and no edits. The implementer changed `message.txt` from `Hello, worl!` to the exact bytes `Hello, world!\n`; the coordinator did not edit. The reviewer reported the subtraction at `add.js:3` and left the fixture unchanged. These runs prove model selection and simple delegation only, as above.

## Initial Sonnet implementation default (superseded)

On 2026-09-28, Claude Code 2.1.284 exercised `implementer` and `investigator` from temporary projects with copies of the native definitions and all 29 skills materialized through the exact `claude-sonnet-5-5` profile. Each parent ran with `--setting-sources project --model claude-opus-5-5 --effort xhigh`. Streamed JSON recorded that parent model, one named `Agent` call without a model override, and child messages from `claude-sonnet-5-5`.

The implementer loaded `coding-standards` and `writing-good-tests` through `Skill`, read the standards catalog, and corrected an order-total function to multiply each price by its quantity. The actual total changed from `170` to `460` for three items at 120 and two at 50. It added a test for that order and preserved the empty-order test. `node --test total.test.mjs` passed both tests; the coordinator performed no edits. The investigator read a separate order fixture and reported order ID `427` and total `460` without writing files.

The implementation exercise allowed edits only as part of the temporary fixture session and permitted the focused test command. Broader shell commands were denied; the agents used file tools and the permitted test command to complete the task. The outer coordinator independently reran the tests and computed `460` from the changed function. No global settings or workers were installed. Records and fixtures are in `/tmp/skills-sonnet-proof.U4tAWw/`.

This proves native role selection, Sonnet skill loading and a bounded implementation with verification. It does not establish effective provider effort, every skill workflow, or isolation beyond the observed permissions. The reviewer definition remains on Opus 5.5; its earlier model-selection evidence still applies.

## Opus implementation default with selective Sonnet use

The revised policy restores `implementer` to Opus 5.5/high and adds `bounded-implementer` on Sonnet 5.5/high for small assignments with a clear contract and existing validation. The coordinator selects the role under `AGENTS.md`; the Sonnet worker returns decisions outside its agreed contract for reassignment. Sonnet profiles and installer support remain available.

Claude Code 2.1.284 exercised both definitions on 2026-09-28 with the Opus skill profile installed in isolated temporary projects. A Sonnet parent invoked `implementer` and the streamed child messages identified `claude-opus-5-5`. An Opus parent invoked `bounded-implementer` and child messages identified `claude-sonnet-5-5`. Each parent made one named `Agent` call with no model override, and only the children edited files. Both corrected the same order-total fixture to return `460`, preserved the empty-order result of `0`, and passed two tests. The default implementer also temporarily restored the old implementation and observed the new test fail with `170 !== 460` before restoring the fix. Records are in `/tmp/skills-sonnet-proof.U4tAWw/revision-opus-default/`.

These exercises prove the configured model pins and basic execution, not comparative quality, savings, or autonomous task classification. Both workers loaded the requested skills but incorrectly reported that the linked standards catalog was absent; it was present. Full standards adherence and effective provider effort were not established. No global configuration or installation changed. Earlier installer and repository check results remain applicable to unchanged inputs; the revised skill-review apply fixture separately passed its Sonnet rejection, apply and rollback checks.
