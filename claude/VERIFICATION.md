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
