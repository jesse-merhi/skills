# Effect ecosystem architecture research — 2026-08-12

## Recommendation

Use Effect deeply, but selectively.

For this repository, the valuable Effect stack is:

- Effect core for typed errors, structured concurrency, scopes, schedules,
  logging, tracing, configuration, clocks, and dependency injection;
- Schema for every untrusted boundary: CLI input, subprocess JSON, persisted
  rows, configuration, and event/checkpoint formats;
- the Node platform for filesystem, paths, terminal I/O, and child processes;
- Effect CLI for typed commands, flags, subcommands, help, and testable parsing;
- Effect SQL plus SQLite for the findings ledger, if the supported runtime is
  raised to Node 24 LTS;
- `@effect/vitest` and Effect's test services for deterministic process,
  filesystem, clock, retry, interruption, and layer tests;
- TypeScript 5.9 plus `@effect/language-service` for compiler checking and
  Effect-aware correctness diagnostics.

Do **not** interpret “use Effect fully” as “import every Effect subsystem.”
Cluster, workflow, RPC, HTTP servers, persistence, event log, browser atoms,
AI providers, and OpenTelemetry export do not solve current repository
requirements. Adding them would create architecture rather than remove it.

For a new implementation, target **Effect v4**, pin every Effect package to
the same exact beta version, and isolate all `effect/unstable/*` use behind
small internal modules. This avoids writing a new v3 system that immediately
needs a major migration. It also accepts a real cost: v4 is still beta and its
CLI, process, SQL, and observability modules may break between beta releases.
Do not start the production rewrite until that prerelease trade-off and the
Node 24 runtime floor are explicitly accepted.

The rollout should be deletion-first and stacked. Begin with one small vertical
slice that proves the runtime, packaging, and process cleanup. Do not translate
the five existing scripts line for line.

## Research boundary

This audit covers the current official Effect organization and the parts of its
ecosystem relevant to local developer tools:

- the v4 monorepo at commit
  `06b2aba8d71b03677ce2db012efb4d982a3c5967` (`4.0.0-beta.107`);
- the v3 branch at tag `effect@3.22.1`;
- the official language service, `tsgo`, ESLint plugin, examples, and agent
  skills repositories;
- current npm metadata for the proposed direct dependencies;
- the repository's current scripts, CI, and symlink-based install contract.

“Entire ecosystem” here means every official package family and official
development tool was considered. It does not mean every provider-specific SQL,
AI, frontend, or cloud package was read line by line when the repository has no
corresponding use case.

## Why Effect fits the bugs we actually have

The current failures are lifecycle and boundary failures, not a shortage of
algorithms:

- child reviewers can outlive a failed parent;
- temporary worktrees and files require cleanup on success, failure, timeout,
  and interruption;
- shell strings and ad hoc environment handling blur executable arguments;
- JSON, CLI output, and database rows are decoded in several different ways;
- retry and timeout policy is distributed through large scripts;
- one monolith mixes target selection, execution, persistence, policy, and
  presentation;
- tests reproduce whole scripts instead of replacing narrow services.

Effect directly addresses those seams:

| Current failure mode | Effect capability | Observable result |
| --- | --- | --- |
| Orphaned reviewers | scoped child processes, fibers, interruption, finalizers | cancelling or failing the parent terminates its child process group |
| Leaked temp worktrees/files | `Scope`, `acquireRelease`, scoped filesystem helpers | cleanup runs on success, failure, timeout, and Ctrl-C |
| Shell quoting and command drift | structured child-process command plus argument arrays | paths and user values are never interpolated into shell programs |
| Stale or malformed JSON | Schema decode at the boundary | invalid output becomes one typed parse error, never a half-valid object |
| Accidental endless retry | typed errors plus explicit `Schedule` | only named transient failures retry, with a bounded policy |
| Parallel task leaks | structured concurrency and scoped forks | sibling work is interrupted and awaited when one branch fails |
| Unclear cross-module dependencies | services and Layers at real I/O seams | tests replace Git, process, filesystem, clock, and ledger independently |
| Unhelpful failure strings | tagged errors, `Cause`, log annotations, spans | errors retain operation, command, target identity, and root cause |

One unusually direct fit is Effect v4's Node child-process implementation. On
Unix it starts commands as detached process groups, scope-finalizes them, and
attempts group termination with a configurable `SIGTERM` to `SIGKILL`
fallback. That is the library-owned version of lifecycle code the review helper
has repeatedly implemented imperfectly.

## What “full Effect” should mean here

### Adopt as the default vocabulary

#### Effect, typed errors, and Cause

- Model expected failures as small `Schema.TaggedError` types.
- Keep defects for invariant violations and programmer errors.
- Preserve causes instead of converting everything to a string at the first
  catch site.
- Handle errors at command boundaries, where an exit code and concise message
  can be selected once.

Do not create dozens of nearly identical errors. Prefer one error per recovery
decision. For example, `ReviewTargetChanged`, `ReviewProcessFailed`, and
`ReviewOutputInvalid` deserve different types because their remedies differ.

#### Schema

Use Schema as the single definition for:

- command configuration loaded from environment or files;
- review request and result envelopes;
- findings, resolutions, checks, and run checkpoints;
- subprocess JSON and JSON Lines;
- database read/write models;
- versioned persisted documents.

Derive TypeScript types from schemas. Do not maintain a type, a manual parser,
and a database decoder for the same value.

#### Context and Layer

Create services only at replaceable boundaries with meaningful live and test
implementations:

- `Git`;
- `ReviewEngine`;
- `ChildProcesses` only if the platform service needs a domain adapter;
- `ReviewStore`;
- `FileSystem` and `Clock` via Effect's existing services;
- `ModelCatalog` where model discovery differs by provider;
- `Terminal` or a small reporter interface where output is contractually
  important.

Keep pure target comparison, finding transitions, retry classification, and
report formatting as ordinary functions. A service per function would make the
code harder to follow and the Layer graph harder to prove.

#### Scope and structured concurrency

- Acquire every temp directory, lock, child process, and database connection
  in a scope.
- Use scoped fibers for parallel reviewers and validation commands.
- Give concurrency an explicit bound.
- On the first failure, interrupt siblings and wait for their finalizers.
- Use `ensuring` only for local invariants; prefer resource acquisition APIs
  when something has a lifecycle.

This is the strongest architectural reason to adopt Effect in this repo.

#### Child process, FileSystem, Path, Terminal, and Config

- Build commands from executable plus argument arrays, never shell strings.
- Make inherited versus replaced environment behavior explicit.
- Stream long output; collect only bounded output that is genuinely needed as a
  value.
- Use scoped temp helpers.
- Use Effect `Config`, including redacted values for secrets.
- Test through platform services rather than patching Node globals.

#### Schedule, Clock, DateTime, Duration, and Random

- Express retry and polling policy as named schedules.
- Retry only errors classified as transient.
- Use `Clock` and `TestClock` for timeouts and waiting tests.
- Use `DateTime` for persisted timestamps.
- Use injected randomness for generated run identifiers when randomness is
  actually required.

Do not add retries to deterministic failures such as invalid flags, schema
errors, unsupported models, or a target identity mismatch.

#### Stream, Queue, Semaphore, Ref, and Deferred

Use these where the data is genuinely incremental or concurrent:

- JSON Lines from review engines;
- long-running child output;
- bounded fan-out of review slices or validation commands;
- cancellation-safe coordination;
- run progress observed by more than one fiber.

Use arrays and local variables for small, finite, single-owner values. Effect
data structures are not a requirement for ordinary in-memory transformations.

#### Logging, tracing, and metrics

- Attach run ID, target identity, engine, model, command name, and finding ID as
  log/span annotations.
- Span the major phases: resolve target, execute review, decode output, persist
  result, and validate identity.
- Keep human CLI output separate from diagnostic logs.
- Do not enable network telemetry by default.

Effect's core observability is useful immediately. Add the lightweight OTLP
exporter only if a real debugging workflow consumes it. Metrics export for a
local CLI would currently be unused infrastructure.

#### Effect CLI

Use it for typed arguments, flags, subcommands, descriptions, examples, help,
completion generation, and testable parsing. Avoid fallback prompts in agent
automation: a missing required input should fail rather than hang waiting for a
TTY.

#### Effect SQL and SQLite

For the findings ledger:

- use one `ReviewStore` interface;
- use migrations and transactions;
- use SQL schemas to decode requests and rows;
- store durable facts, not orchestration policy;
- keep one serialized SQLite connection unless measured concurrency requires
  more;
- delete unused full-text/vector machinery rather than porting it.

The v4 Node SQLite driver uses built-in `node:sqlite`, so it removes the native
`better-sqlite3` dependency used by the stable v3 driver. It also executes
synchronously and documents that busy waits block the Node event loop. The
ledger should therefore keep transactions short and never perform model or Git
work inside a transaction.

#### `@effect/vitest` and test services

- Use `it.effect` and `it.scoped` for Effect programs.
- Use shared test Layers for domain services.
- Use `TestClock` for timeouts, retries, polling, and process escalation.
- Property-test schemas and pure state transitions where generated examples
  reveal boundary mistakes.
- Verify interruption by starting a child, failing a sibling, and observing
  that the child process group is gone.
- Verify every CLI's old exit codes, stdout/stderr split, and important output
  strings as compatibility contracts.

### Adopt as development guardrails

#### `@effect/language-service`

Use the Effect language service with the TypeScript 5.9 compiler version used
by the current Effect v4 repository. It supplies type-aware diagnostics and
refactors for both Effect v3 and v4. Particularly relevant checks include:

- floating or nested Effects;
- missing error or service requirements;
- leaking service implementation requirements;
- multiple `provide` lifecycle hazards;
- unsafe Effect type assertions;
- promises accidentally placed in an Effect success channel;
- raw `process.env`, timers, dates, console, fetch, and Node APIs where an
  Effect service exists;
- duplicated Effect package versions;
- outdated v4 APIs.

Run its diagnostics explicitly in CI. Do not rely only on an editor plugin.
Re-evaluate `@effect/tsgo` when the repository adopts TypeScript 7; its official
guidance requires a native TypeScript 7 installation and says it must replace,
not run alongside, ordinary `tsgo`.

#### Published Effect agent guidance

Install the exact Effect version at the workspace root so agents and engineers
can inspect its shipped source and `AGENTS.md`. Add a short repository
instruction requiring that file to be read before Effect code is written. This
is the Effect team's own current setup recommendation and reduces invented API
usage during the beta.

#### ESLint plugin

Do not add `@effect/eslint-plugin` for Effect correctness. Its current public
surface is old and small: Dprint integration and a barrel-import rule. The
language service/`tsgo` owns the meaningful Effect-aware diagnostics. General
formatting and non-Effect linting can be chosen separately if the repo needs
them.

## Explicitly do not adopt yet

| Ecosystem area | Decision | Reason |
| --- | --- | --- |
| Effect AI/provider packages | No | direct API calls would change Codex/Claude CLI authentication, review semantics, and user configuration |
| Cluster | No | these are local tools, not distributed stateful services |
| Workflow/durable activities | No | the findings ledger plus explicit resume state is enough; a workflow engine would duplicate policy |
| RPC/workers | No | subprocess boundaries are existing executable contracts, not typed network services |
| HTTP/HttpApi/socket | No | no server or remote API is required |
| Persistence/event log/cache packages | No | the ledger is a small SQLite store; adding a second persistence abstraction creates two sources of truth |
| Drizzle or Kysely | No | Effect SQL already supplies the needed typed request/row boundary; an ORM would duplicate it |
| Atom/reactivity/frontend packages | No | this repo has no application state UI |
| OpenTelemetry SDK/export by default | No | local CLI users have no collector; core spans and structured logs are sufficient initially |
| Request batching | No | current external work is Git and long-running reviewers, not high-volume request/response calls |
| PubSub | No | one producer/many-consumer event distribution is not a current requirement |
| STM | No | current state transitions fit transactions, `Ref`, queues, and semaphores |

This exclusion list is part of using the ecosystem well. It prevents an
Effect-shaped rewrite from becoming a second runaway architecture project.

## Proposed architecture

```text
CLI entrypoints
  -> typed command inputs
  -> application use cases
       -> pure domain rules
       -> Git service
       -> ReviewEngine service
       -> ReviewStore service
       -> Effect platform services
  -> one command-boundary renderer / exit-code mapper

Live layer
  Node filesystem + path + terminal + child process
  Git executable adapter
  Codex / Claude executable adapters
  SQLite ReviewStore

Test layer
  in-memory filesystem or focused fake
  scripted Git adapter
  scripted review engine
  in-memory ReviewStore
  TestClock
```

The central design rule is that Effect owns lifecycles and boundaries; domain
policy remains small and explicit.

## Tool-by-tool adoption map

### `codex-review`

Use Effect CLI, Schema, child processes, scopes, structured concurrency,
Schedule, Clock, Stream, and structured logs.

Delete custom work that native tools already own:

- call `codex exec review` for Codex-native target selection and review;
- use Git only to capture identity before and after the review;
- if the target changes while review is running, discard the stale result and
  review the new identity under a bounded policy;
- do not preserve bespoke large-diff slicing or synthetic snapshot machinery
  unless a failing compatibility test proves the native command cannot cover a
  required behavior.

Keep provider-specific execution behind `ReviewEngine`, with separate Codex
and Claude adapters. Schema-decode their outputs into one domain result.

### Findings ledger

Replace the Rust monolith only after the store contract is specified and its
existing CLI behavior is captured by tests. The Effect implementation should
own migrations, transactions, row schemas, and storage errors. It should not
own the review loop's phase machine.

A narrow interface is enough:

```text
startRun / resumeRun
recordFinding / resolveFinding / rejectFinding
recordCheck
checkpointIdentity
finishRun / blockRun
readSummary
```

Whether a finding is actionable, whether another review pass is allowed, and
whether two clean passes are required belongs in application policy, not SQL.

### PR review checkout

This is the best first production slice. Replace shell orchestration with
Effect CLI plus structured `gh pr checkout` and `git worktree`
commands. It is small enough to prove:

- packaging and startup;
- path and argument safety;
- worktree cleanup under interruption;
- compatibility of output and exit codes;
- test Layers for Git/GitHub commands.

### Skill cleaner

Retain pure scan/analyse/report functions. Use Effect for CLI input,
filesystem traversal, bounded session-log streams, configuration, and output.
Schema-decode every external metadata file. Do not turn every rule into a
service.

### ClawHub and OpenClaw local-test launchers

Long term, these launchers belong with the applications whose runtime and
configuration they control. Their skill directories should contain thin
launchers and instructions, not a second application-specific process manager.

Moving them requires separate PRs in the ClawHub/OpenClaw repositories, then a
small skills-repo update. Until that scope is approved, only extract shared
process/config behavior that is genuinely repository-generic.

## Version decision

### Recommended: exact-pinned v4 beta, staged behind compatibility tests

Reasons:

- the official Effect setup skill now recommends `effect@beta`;
- v4 contains the current CLI, process, SQL, and observability architecture;
- packages are version-aligned instead of requiring a compatibility matrix;
- starting a greenfield rewrite on v3 creates an avoidable second migration;
- v4's Node SQLite driver uses built-in SQLite instead of a native addon;
- TypeScript 5.9 plus the Effect language service matches the compiler path
  currently used by Effect v4 while retaining Effect-aware diagnostics.

Costs:

- v4 is beta;
- the APIs needed most by this repository live under `effect/unstable/*`;
- beta upgrades can require source changes;
- the current published `effect` package is a large install even though used
  modules tree-shake well;
- the SQLite package's declared Node engine is less strict than its real API
  requirement.

Controls:

- pin exact versions, never `^` or a moving `beta` range in the lockfile;
- align every Effect package on the identical version;
- isolate unstable imports in `platform`, `cli`, and `store` modules;
- upgrade Effect only in dedicated PRs with all compatibility tests;
- add a dependency/version-alignment check to CI;
- build the first vertical slice before approving the rest of the stack.

### Fallback: v3 stable

Effect `3.22.1` is current and mature. It can deliver most of the same domain
benefits with separate `@effect/cli`, `@effect/platform`, and `@effect/sql`
packages. Its Node SQLite driver uses `better-sqlite3`, which adds a native
dependency and binary-install surface. Choose v3 only if prerelease APIs are
unacceptable and a later v4 migration is knowingly accepted.

### Do not wait without a spike

Waiting for v4 stable avoids API churn but leaves the current shell/Python/Rust
orchestration in place. A bounded PR-review-checkout spike can validate Effect
now without committing the most critical review workflow to a beta design.

## Runtime and distribution

### Runtime

Recommend Node 24 LTS as the documented minimum for the Effect rewrite.

The v4 Node SQLite driver imports `node:sqlite`, including its backup API.
`node:sqlite` first appeared in Node 22.5, lost its flag in 22.13, and backup
arrived in 22.16. In addition, the current `@effect/platform-node` dependency
on `undici@8.7.0` requires Node 22.19 or newer. The proposed stack therefore
cannot truthfully run on the Node 18 minimum advertised by the platform
package. Node 24 also gives a release-candidate SQLite API rather than the
earlier experimental status.

Raising the runtime floor is a compatibility change and needs user approval.
If Node 22 support must remain, pin at least Node 22.19 and add a startup version
check; Node 18/20 cannot support the proposed v4 stack.

### Package and install shape

Use a root pnpm workspace and lockfile for development. Build each public CLI
to a checked release artifact or a package-local `dist` entrypoint; do not
download dependencies at command runtime.

The current repository is cloned once and each skill directory is symlinked
individually. That means a root `node_modules` is discoverable through the real
symlink target, but `INSTALL.md` must explicitly install locked Node
dependencies. Relying on an undeclared global Bun, `tsx`, or TypeScript would
break the current boring clone-and-link install experience.

Before choosing a bundler, build the first CLI both ways:

1. Node ESM plus root `pnpm install --frozen-lockfile`;
2. one bundled ESM file with source map and legal notices.

Measure cold start, artifact size, install size, stack traces, and cross-platform
execution. Prefer the simpler root-install model unless the standalone skill
contract requires copying one skill without its repository root.

Do not use Bun standalone binaries as the primary distribution: they require a
platform/architecture release matrix and complicate public installation. Bun
may remain a local development runtime where an owning application already
requires it.

## Dependency assessment

Proposed direct production dependencies for the v4 spike:

| Package | Exact researched version | License | Important trade-off |
| --- | --- | --- | --- |
| `effect` | `4.0.0-beta.107` | MIT | beta; unstable modules can break; broad installed source but tree-shakeable |
| `@effect/platform-node` | `4.0.0-beta.107` | MIT | brings Node implementations plus `undici` and `mime`; current `undici` makes the effective floor Node 22.19 despite the package advertising Node 18 |
| `@effect/sql-sqlite-node` | `4.0.0-beta.107` | MIT | no native addon; synchronous SQLite and effective Node 22.16+ floor |

Proposed direct development dependencies:

| Package | Exact researched version | License | Purpose |
| --- | --- | --- | --- |
| `@effect/vitest` | `4.0.0-beta.107` | MIT | Effect-aware scoped/layer tests |
| `vitest` | `4.1.10` | MIT | test runner required by `@effect/vitest` |
| `@effect/language-service` | `0.87.2` | MIT | Effect diagnostics/refactors for the selected TypeScript compiler |
| `typescript` | `5.9.3` | Apache-2.0 | compiler line currently used by Effect v4 itself |

All Effect packages publish with npm provenance enabled. The selected pnpm
lockfile resolved 94 total dependency entries and reported zero known
vulnerabilities on 2026-08-12. This is a point-in-time registry check, not a
guarantee of safety. The stable-v3 comparison also audited clean after
selecting patched `vitest@3.2.7`; an older `3.2.4` selection was affected by
`GHSA-5xrq-8626-4rwp`, which is why exact dependency selection and routine
auditing matter.

## Proposed stacked delivery

Each PR must preserve the old executable contract until the user explicitly
approves a breaking change.

1. **Foundation plus PR checkout vertical slice**
   - pnpm workspace, exact pins, TypeScript/language service, Vitest;
   - small shared platform/test modules;
   - PR checkout rewritten end to end;
   - old shell implementation retained only as a comparison oracle during the
     PR, then deleted before merge.
2. **Skill cleaner**
   - typed CLI and schemas;
   - filesystem/log streaming;
   - pure analysis preserved.
3. **Local-test launcher strategy**
   - generic skills-repo pieces only;
   - separate owning-repo PRs if moving ClawHub/OpenClaw orchestration is
     approved.
4. **Findings store**
   - specify the store contract;
   - capture Rust CLI compatibility;
   - migrate data and commands to Effect SQL;
   - remove the Rust toolchain only after parity and migration tests pass.
5. **Review orchestrator**
   - reduce scope around native `codex exec review` and Git identity checks;
   - add provider adapters, structured concurrency, interruption, and bounded
     retry;
   - remove legacy slicing/snapshot/process machinery;
   - prove resume and compaction behavior through persisted checkpoints.
6. **Repository cleanup**
   - delete obsolete language runtimes, wrappers, tests, and install steps;
   - update skills and agent instructions;
   - measure final code, dependency, startup, and install deltas.

The critical rule is one working product after every PR. The highest-risk
review rewrite stays at the top of the stack, after the process and persistence
patterns have been proven on smaller tools.

## Proof required before calling the rewrite complete

- every old documented CLI invocation has a compatibility test;
- stdout, stderr, and exit codes match or an approved migration is documented;
- subprocess arguments containing spaces, quotes, newlines, and leading dashes
  are safe;
- cancellation, timeout, Ctrl-C, and sibling failure leave no child process
  group behind;
- temp files and worktrees are removed after every exit path;
- a review target that changes mid-run is re-read and reviewed at its new
  identity; stale results are not accepted;
- malformed or partial engine output fails with a typed schema error;
- findings survive process restart and conversation compaction;
- migrations are atomic and tested from every shipped schema version;
- retries are bounded and limited to named transient errors;
- Effect diagnostics, strict TypeScript, targeted tests, and the repository's
  existing validation all pass;
- dependency alignment and security audit pass from the lockfile;
- the first and final PRs report code size, install size, artifact size, and
  cold-start time so “more robust” is measurable rather than assumed.

## Accepted implementation decisions

The user accepted these constraints on 2026-08-12:

1. Target Effect v4 beta with exact package pins, isolated unstable imports,
   and dedicated upgrade PRs.
2. Raise the rewritten tools' public runtime floor to Node 24 LTS.
3. Keep the ClawHub/OpenClaw local-test process managers in this skills
   repository. Preserve app-specific modules rather than forcing their policy
   through a misleading shared abstraction.

## First-slice evidence

The PR-checkout vertical slice tested the proposed foundation before the larger
rewrite began:

- `effect`, `@effect/platform-node`, and `@effect/vitest` are exactly pinned to
  `4.0.0-beta.107`;
- TypeScript `5.9.3` plus `@effect/language-service@0.87.2` produced a clean
  application typecheck and zero Effect diagnostics;
- the published beta declarations contain two internal inconsistencies, and
  the Effect, language-service, and tsgo repositories all use
  `skipLibCheck: true`; the workspace matches that upstream compiler setting
  while retaining strict checks for its own source;
- pnpm's optional native `msgpackr-extract` accelerator is excluded because
  these tools do not use MessagePack, avoiding an unnecessary install script;
- the first Effect CLI preserved the old missing-argument exit code and usage,
  added typed help, and passed four focused tests;
- the implementation delegates PR resolution to a named `gh pr checkout` so
  VS Code can recognize the active pull request, uses structured subprocess
  arguments, and removes a newly created worktree if checkout fails.

This evidence supports continuing the stack, but it also narrows “fullest
extent”: TypeScript-Go should wait until the Effect codebase itself adopts the
TypeScript 7 compiler path.

## Primary sources

- [Effect v4 repository and beta status](https://github.com/Effect-TS/effect/tree/06b2aba8d71b03677ce2db012efb4d982a3c5967)
- [Effect v4 package requirements and consolidated modules](https://github.com/Effect-TS/effect/blob/06b2aba8d71b03677ce2db012efb4d982a3c5967/packages/effect/README.md)
- [Effect v3 source at `effect@3.22.1`](https://github.com/Effect-TS/effect/tree/effect%403.22.1)
- [Official v3-to-v4 migration guidance](https://github.com/Effect-TS/effect/blob/06b2aba8d71b03677ce2db012efb4d982a3c5967/MIGRATION.md)
- [v4 Node child-process implementation](https://github.com/Effect-TS/effect/blob/06b2aba8d71b03677ce2db012efb4d982a3c5967/packages/platform/node-shared/src/NodeChildProcessSpawner.ts)
- [v4 Node SQLite implementation and operational notes](https://github.com/Effect-TS/effect/blob/06b2aba8d71b03677ce2db012efb4d982a3c5967/packages/sql/sqlite-node/src/SqliteClient.ts)
- [Effect v4 CLI implementation](https://github.com/Effect-TS/effect/blob/06b2aba8d71b03677ce2db012efb4d982a3c5967/packages/effect/src/unstable/cli/Command.ts)
- [Effect v4 process API](https://github.com/Effect-TS/effect/blob/06b2aba8d71b03677ce2db012efb4d982a3c5967/packages/effect/src/unstable/process/ChildProcess.ts)
- [Official Effect setup skill](https://github.com/Effect-TS/skills/blob/28822c9e19998876a6b0e0d97877442012ed4391/skills/effect-ts/SKILL.md)
- [Official Effect v3-to-v4 agent workflow](https://github.com/Effect-TS/skills/blob/28822c9e19998876a6b0e0d97877442012ed4391/skills/effect-v3-to-v4/SKILL.md)
- [Effect TypeScript-Go tooling](https://github.com/Effect-TS/tsgo/tree/ca311a5c071e6a1c9f91f259c5373adc43dc6031)
- [Effect language service](https://github.com/Effect-TS/language-service/tree/5e4d380b6fcd20f048dd8d41515bcd9ea47ffda4)
- [Effect ESLint plugin](https://github.com/Effect-TS/eslint-plugin/tree/44bba8afb40ad3f36be7acc35d70afe067e424f9)
- [Node SQLite version and stability history](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html)
