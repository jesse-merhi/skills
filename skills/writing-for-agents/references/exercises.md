# Exercising instructions

Use this when running or comparing agent exercises for changed instructions from [writing-for-agents](../SKILL.md).

Before an exercise, record realistic task inputs, the intended result, success criteria and failure checks. Keep the criteria fixed while judging; record later corrections separately. Give an ordinary task request without revealing the measured behavior or grading criteria. Exercise rules that run against a model's defaults. For example, give it a small edit to see whether it delegates when told to delegate every edit.

Use a fresh agent in an isolated workspace with normal task context, tools and the authored skill. Existing model and permission policy still applies.

Judge the resulting files, interface or command output. Use the exercise's own tool calls and transcript to verify which instruction files and references the candidate actually opened. Check claims against that record and the result. Record missing tools, transcripts and model coverage as limits.

For comparisons, keep inputs, model settings and tools equivalent. Give an independent reviewer the criteria and outputs without author, model or revision labels; retain their mapping separately. Inspect the outputs yourself and resolve disagreements from evidence. One run can expose a failure or demonstrate the requested result. Claims of general improvement need repeated matched trials.
