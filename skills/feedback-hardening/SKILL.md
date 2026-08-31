---
name: feedback-hardening
description: "Corrections about agent work: delegate a systemic-fix recommendation, get Jesse's approval, then implement it."
---

# Feedback hardening

Turn Jesse's correction of agent behavior into a separate durable repair while
the current conversation keeps moving.

## 1. Frame the intervention

Use this workflow when Jesse corrects or criticizes how the agent worked,
identifies a recurring failure, or expresses frustration that points to
avoidable agent behavior. Infer the concrete behavior from the transcript
before asking for clarification. Treat a changed objective, a factual
clarification, or a one-deliverable preference as part of the current task
unless it exposes a reusable invariant.

Acknowledge the correction briefly, repair the immediate user-facing result
when authorized, and capture:

- the observed agent behavior;
- the desired invariant;
- the evidence and affected surface;
- the current task state and authorization boundary.

Redact secrets and unnecessary personal data. This step is complete when the
immediate task is safe to continue and the failure is stated as an observable
invariant rather than as an insult, example, or proposed fix.

## 2. Assign a fresh recommendation owner

Check for an existing repair session that owns the same invariant. Send new
evidence to that owner when one exists.

Otherwise, use the `handoff` skill to start a fresh full agent session for the
hardening work. Classify it as an aside when the current user task can continue
independently; classify it as a continuation when the repair is required to
complete that task. Give the receiver the feedback, evidence, desired
invariant, affected systems, current permissions, and read-only context. Ask it
to investigate independently rather than assuming the user's suggested
mechanism is the root fix.

The first phase is recommendation-only. Tell the receiver to inspect and reason
without editing files, creating or updating pull requests, posting externally,
or making other stateful changes before Jesse approves a path. Prepare a
dedicated worktree before launch when the same session may later implement the
approved repair.

A failed launch must remain visible: preserve the handoff artifact, report the
exact blocker, and continue the immediate correction when safe. This step is
complete when one verified independent session owns a read-only recommendation
phase, or the user has an actionable launch blocker and handoff artifact.

## 3. Recommend the systemic fix

Have the repair owner reconstruct the failure and locate the producer or
lifecycle owner. Develop credible prevention options and rank them in this
order:

1. eliminate the invalid choice through architecture, data structures, types,
   schemas, APIs, ownership, or lifecycle design;
2. enforce the invariant automatically with a focused test, lint rule, type
   check, schema check, CI gate, or deterministic verifier;
3. encode reusable judgment in the narrowest existing skill or scoped agent
   instruction;
4. rely on human review only when stronger enforcement is genuinely unsuitable.

Lead with one recommended option. Combine layers when they protect different
boundaries, but keep one canonical owner. For each credible option, state the
mechanism, affected owner and surfaces, recurrence it prevents, proof plan,
implementation scope, material risks, and why stronger layers are unsuitable.
Prefer an existing abstraction or skill over a parallel mechanism. Avoid
hardcoding Jesse's wording, the reported example, or an insult.

When an already-used skill caused or failed to prevent the behavior, recommend
inspecting and patching that skill through Skill Workshop instead of adding a
competing skill. If only one credible option exists, still present it as a
recommendation and request explicit approval.

This step is complete when Jesse receives the ranked decision brief and can
approve the recommendation, choose an alternative, or redirect the
investigation.

## 4. Implement the approved path

Treat Jesse's initial correction as authority to create the recommendation
session and conduct read-only investigation. Begin implementation only after
Jesse explicitly approves an option. That approval covers the selected
reversible local changes in the same workspace; it does not bypass existing
gates for public or external writes, publication, merges, deployment,
destructive actions, protected schema or protocol changes, spending, or access
expansion.

Use the same session to implement the approved path unless Jesse chooses
another owner. Follow the target repository's instructions and applicable
skills. Reproduce confirmed defects before editing. Add automated proof at the
owning boundary when credible, and verify instruction-only changes with a
realistic forward test. Keep the current conversation responsive while the
independent owner works.

This step is complete when the approved durable change is implemented and
verified, or the owner has identified the exact permission or product decision
that still blocks it.

## 5. Close the loop

Return the repair result to the source conversation. Report:

- the original behavior and root cause;
- the approved option, architectural owner, and prevention layer;
- the files, checks, skills, or rules changed;
- before-and-after evidence;
- any remaining authorization request or recurrence risk;
- the independent session link or handoff location.

Do not create a second repair for the same root cause unless new evidence
invalidates the existing fix. This step is complete when Jesse can verify what
changed and why the same intervention should no longer be necessary.
