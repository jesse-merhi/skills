# Findings registry

## 1. Use the installed command

Use installed `review-findings`, never resolve a skill directory. SQLite owns durable findings from users, native/cold reviewers and lenses, run identities, decisions, verification and the open queue; chat history does not. Keep the database outside the reviewed repository; `path` reports its location (default `~/.local/state/agent-review-findings/reviews.sqlite`).

Read `review-findings --help`, then subcommand `--help` for flags. Run `review-findings schema` before the first finding record in every review; it owns field catalogs, allowed combinations and rating consistency. Follow it over remembered examples. If the installed command lacks this catalog, report the installation mismatch rather than falling back to a skill-dir launcher or silently using an older contract.

## 2. Choose the command

| Task | Command |
| --- | --- |
| Locate or initialize SQLite | `path`, `init` |
| Read the record contract | `schema` |
| Freeze authorized scope / resume its state | `scope-start` / `scope-status --json` |
| Check scope / record approved expansion / finish | `scope-check` / `scope-authorize` / `scope-complete` |
| Read pass state / record passes, repairs or decisions | `progress-status` / `progress-record` |
| Save a triaged finding / append repeat evidence | `record` / `record --match-of ID` |
| Save finished validation | `record-command` |
| Search before dispatch, resume or answering review questions | `query` |
| Assign changed files / save one invocation's coverage | `coverage-status --json` / `coverage-record` |
| Rebuild owner summary / complete audit / material cards | `closeout --summary` / `closeout --json` / `closeout --material` |
| Remove stale low-use index entries periodically | `prune` |

Use the saved repository name/path, branch, target and base to avoid mixing runs. A finding record may omit branch/base only when repository and target identify exactly one existing run; ambiguity requires both.

Follow the pass-recording, fixing and blocked-check instructions linked where they are used in the main skill. Historical-head measurement without checking it out needs Git 2.41+ for target binary attributes; otherwise check out that head or obtain an authorized Git update.

## 3. Record findings and decisions

1. Record each finding as soon as triaged, using `schema` for its kind and disposition; never invent evidence to fill a template. Apply `speak-fking-english` to each batch without changing technical claims. Give the owner the premise, what goes wrong/where, who experiences it, and the repair, rejection reason or outstanding decision. Keep reviewer shorthand, engine names, severity and fingerprints in structured fields.
2. Mark findings material when they affect visible behavior, workflows, access/permissions, data correctness, audit integrity, finance, schemas/migrations or API contracts. Record affected files/behavior, source, owner/next action and validation. Use the main skill's findings guide for evidence and repair decisions.
3. Let the CLI derive severity/disposition; do not pass priority, severity or disposition. Handling cannot turn rejected or unproven risk into work. Keep runtime and maintenance evidence separate. Use the schema's rejection contract for unsupported candidates, including the failed gate and rationale rather than fabricated proof.
4. Use `fix` for accepted contained work, `consult` for owner decisions and deferred `follow-up` for nonblocking adjacent work. An accepted local `fix` deferred as residual risk requires a decision explaining that acceptance. An unanswered consult stays open; deferral requires `--owner-resolution declined` and the owner's explicit decision.
5. Close an approved consulted repair as fixed with `--owner-resolution approved`; close a rejected finding with `declined`, always recording the owner's decision. Use the same explicit approval when keeping a provisional fix. Declining a provisional repair means revert it and record `reopened` with decision text but no owner resolution: the finding remains active.
6. Preserve terminal current-schema owner decisions: exact replay is a no-op even after scope completion; changing any field requires a new decision ID. Active legacy findings remain open until re-recorded with current evidence. An evidence-only upgrade must preserve status, source identity, owner decision, disposition, fix scope and handling; completed legacy history remains terminal and labelled legacy.
7. Append recurring reports to the same open finding with `record --match-of ID`, source, evidence and match note, rather than creating another card. Matching does not change its status or resolve its question. Record each validation command immediately when it finishes, including result, reason and related finding.

## 4. Assign and record file coverage

1. Use `coverage-status --json` before general/discovery dispatch. Assign stale and unreviewed files first, then reviewed-once, then reviewed-twice. Give cold reviewers files/flows without earlier verdicts or counts. Retain each assigned file's `changeId`.
2. Record all substantively reviewed changed files from one general invocation in a single `coverage-record`, pairing each file with its observed change ID in order. One review ID counts once per file, including retries; a new ID requires a genuinely independent invocation.
3. Count assessment of changed behavior for actionable correctness/maintenance findings, not listing, context reads, narrow-lens classification or appearance in a whole-repository diff. Coverage prioritizes work; it is not a clean gate.
4. Respect exact-content checks: edits invalidate earlier coverage without deleting history; any changed file rejects the whole submitted batch. Paths outside the manifest, non-UTF-8 Git paths and dirty nested repositories stop coverage rather than guess identity.

## 5. Rebuild the closeout

1. After compaction, handoff or a long review, rebuild from `closeout --summary` and retrieve `closeout --json` when writing/checking it. Use `--material` for important cards. Keep totals, sources/dispositions, rejection gates, impact/severity, unresolved work and verification visible; source outcomes and rejection gates support native/cold precision comparisons.
2. Preserve the distinctions: follow-ups and owner-declined consultations are deferred work, accepted local risk is accepted residual risk, and unanswered decisions stay open. Database state alone is not independent review proof or readiness authorization.
3. Use structured rows for status, target, branch, IDs, files, owner and verification. Search combines FTS5 and a local hashed-vector index; older findings rank lower unless re-recording or search hits raise their seen count. Periodic `prune` removes stale low-use findings from the local index; inspect its help and scope before removal.
