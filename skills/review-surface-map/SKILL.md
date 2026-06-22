---
name: review-surface-map
description: 'Map changed runtime surfaces for a PR, branch, commit, or large diff: entrypoints, flows, callers, contracts, side effects, risk, and validation.'
---

# Review Surface Map

Use this skill before writing findings. The goal is to build a review map: what changed, where execution starts, what contracts move between files, and which checks would actually prove the change.

## Workflow

1. Resolve the review target.
   Prefer a PR number/URL or explicit git range. If absent, use the current branch against the default base.

   ```sh
   gh pr view <pr> --json title,body,files,commits,changedFiles,additions,deletions
   gh pr diff <pr> --name-only
   gh pr diff <pr> --patch
   ```

   ```sh
   git diff --name-only <base>...HEAD
   git diff --stat <base>...HEAD
   git diff <base>...HEAD
   ```

2. Classify changed files by review surface.
   Use surfaces that match behavior, not directory order:
   - entrypoint: route, CLI command, job, handler, workflow, screen, public API
   - contract: schema, type, protocol, config, permission, env var, API response
   - state: persistence, cache, query key, reducer, lifecycle, migration
   - side effect: network, file system, subprocess, queue, notification, telemetry
   - presentation: UI component, copy, styles, generated output
     For rendered frontend UI, include viewport/state proof in validation
     targets with `frontend-ui-validation`.
   - validation: tests, fixtures, mocks, docs that define expected behavior
   - supply chain: workflow, package manifest, lockfile, install/build/release script

3. Trace each changed flow end to end.
   For every meaningful flow, identify:
   - first executable entrypoint
   - changed symbols in the diff
   - callers and callees affected by those symbols
   - data/state/control that crosses file boundaries
   - runtime boundary where external input or side effects enter
   - tests or checks that should cover the path
   - for rendered frontend UI, screenshots, layout audit, console check,
     or trace needed to prove the changed viewport/state

4. Read context selectively.
   Read full files only when the diff hunk is not enough. Prefer targeted context:

   ```sh
   rg -n "<changed symbol|route|query key|env var>" .
   git log --oneline --follow -- <file>
   git log -S"<changed symbol>" -- <file-or-dir>
   git show <base>:<file>
   ```

5. Produce the map before findings.
   Do not call something a bug until the relevant surface has been traced enough to know the intended contract.

## Output Shape

Use short sections:

- `Review Order`: the best sequence to read the PR.
- `Flow Map`: changed flows with entrypoints, important symbols, and downstream consumers.
- `Contracts`: schemas, types, env vars, permissions, APIs, or persistence rules touched.
- `Risk Surfaces`: places likely to hide bugs, including stale state, permissions, concurrency, migrations, retries, cleanup, or external IO.
- `Validation Targets`: focused commands, tests, UI validation proof, or manual checks that would prove the important flows.
- `Finding Leads`: suspected issues to inspect next, clearly marked as unproven until checked.

## Review Discipline

- Start from behavior and contracts, not file count.
- Do not review all files equally; small contract files can matter more than large generated diffs.
- Keep suspected issues separate from confirmed findings.
- When a file is only a leaf test, fixture, generated artifact, or style change, say what upstream behavior it validates or mirrors.
- If the diff includes supply-chain or CI surfaces, hand off that portion to `supply-chain-security-pass`.
