---
name: feedback-hardening
description: "User corrections or self-detected recurring agent mistakes: delegate one systemic-fix recommendation, get approval, then implement the approved repair."
---

# Feedback hardening

Turn a user correction or an agent's self-detected mistake that reveals a
reusable failure into one separate durable repair while the current
conversation keeps moving.

## 1. Frame the intervention

Use this workflow for either trigger:

- The user corrects or criticizes how the agent worked, identifies a recurring
  failure, or expresses frustration that points to avoidable agent behavior.
- The agent independently recognizes that its own action violated a reusable
  invariant or is likely to recur across tasks, sessions, repositories, or
  users.

A self-detected mistake qualifies only when concrete evidence shows a missing
reusable guard or a failure likely to recur beyond the immediate occurrence.
Handle a trivial typo, expected review finding, ordinary debugging discovery,
changed objective, factual clarification, or one-deliverable preference in the
current task unless it exposes that reusable invariant.

Acknowledge a user correction briefly. For either trigger, repair the immediate
user-facing result only when existing task authority allows it, and capture:

- the observed agent behavior;
- the desired invariant;
- the evidence and affected surface;
- the current task state and authorization boundary.

Redact secrets and unnecessary personal data. This step is complete when the
immediate task is safe to continue and the failure is stated as an observable
invariant rather than as an insult, example, or proposed fix.

## 2. Assign a fresh recommendation owner

Before creating a handoff, check the current conversation and available session
records for an active or completed repair that owns the same invariant. Send
new evidence to that owner; do not create another session.

Inside a hardening session, route a genuinely distinct qualifying invariant to
the source conversation instead of launching a nested hardening session. This
skill never hands off to itself recursively.

Otherwise, start one cold native subagent or equivalent independent agent
session with no conversation fork. Classify it as an aside when the current
user task can continue independently; classify it as a continuation when the
repair is required to complete that task. Give the receiver the triggering
correction or self-detected mistake, evidence, desired invariant, affected
systems, current permissions, and read-only context. Ask it to investigate
independently rather than assuming the suggested mechanism is the root fix.

The first phase is recommendation-only. Tell the receiver to inspect and reason
without editing files, creating or updating pull requests, posting externally,
or making other stateful changes before the user approves a path. Prepare a
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
hardcoding the user's wording, the reported example, or an insult.

When an already-used skill caused or failed to prevent the behavior, recommend
inspecting and patching that skill through Skill Workshop instead of adding a
competing skill. If only one credible option exists, still present it as a
recommendation and request explicit approval.

This step is complete when the user receives the ranked decision brief and can
approve the recommendation, choose an alternative, or redirect the
investigation.

## 4. Implement the approved path

A qualifying trigger authorizes one read-only recommendation phase; it does not
authorize systemic implementation. Existing task authority governs any
immediate correction. Begin implementation only after the user explicitly
approves a named option. That approval covers the selected reversible local
changes in the same workspace; it does not bypass existing gates for public or
external writes, publication, merges, deployment, destructive actions,
protected schema or protocol changes, spending, or access expansion.

Use the same session to implement the approved path unless the user chooses
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
invalidates the existing fix. This step is complete when the user can verify
what changed and why the same intervention should no longer be necessary.
