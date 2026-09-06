# Local skill review

The review queue shows this repository's skills, including its deleted originals. External snapshots already in the database stay in History/Export but are hidden from the queue and tabs. Add `--personal` only when you explicitly want additional skills from `~/.codex/skills`, `~/.claude/skills`, and `~/.agents/skills`. Repository names take precedence. External snapshots are not permission to overwrite upstream-owned installations. Portable exports may contain private data; keep them local.

A localhost-only editor for this repository's skill library. Review one master
per logical skill, follow references in tabs, and save decisions without changing
source files or installed skills. There is no model API, hosted service, CDN, or
account requirement.

## Start and resume

From the repository root:

```sh
bun run review:skills
```

Open `http://127.0.0.1:4317`. Keep the server running while editing. Restarting
the command reopens the same saved review. To choose another port or state folder:

```sh
bun run review:skills --port 4318 --state /absolute/path/to/review-state
```

The app uses the repository's locked Effect and SQLite packages, Bun's native
server, bundler and Markdown renderer, and ordinary browser controls. On macOS,
the installed Effect SQLite driver needs extension-capable SQLite even though it
disables extension loading immediately. The launcher uses an existing Homebrew
SQLite library or accepts `--sqlite-library /absolute/path/to/libsqlite3.dylib`.
It does not install or upgrade dependencies. Restore the repo's locked packages
with its usual installation process if `node_modules` is absent.

## What is saved

The default state folder is `~/.local/share/skill-review/<repository-key>/`.
The key comes from Git's common directory, so worktrees of the same checkout
share a review. The folder is deliberately outside the worktree. An independent
clone gets a different key; use an export to transfer its review.

- `review.sqlite` is the authoritative database. Keep its `-wal` and `-shm`
  companions with it while the server is running; use the backup/export controls
  instead of copying just the live database.
- Every confirmed save appends a permanent revision in a SQLite transaction
  with WAL and `synchronous=FULL`. Draft decisions and supporting-file edits are
  saved together. No history is pruned.
- Original text, every model variant, binary assets, file modes, symlink targets,
  source revision, and capture time are stored separately from editable drafts.
  A changed or missing source never replaces this snapshot.
- Autosave runs after a short typing pause. The indicator says **Saved to disk**
  only after acknowledgement. Pending edits also go into a per-page browser
  recovery buffer. Closing with pending edits warns; failed writes remain pending.
- Concurrent edits use revision checks. A stale save cannot replace a newer
  draft; its text is stored in recovery history. Choose the saved version or
  append your version as a new revision. Both remain recoverable.
- Tab position, review state, notes, decisions, and file-review checkmarks are
  persisted. Reference links use saved master/supporting drafts, falling back to
  captured source for untouched files. They are not treated
  as proof of runtime invocation. Ordering uses entry-point references first;
  cycles are displayed as references rather than invented parentage.
- When loading a skill, files removed from its available source appear under
  **Removed files · preserved originals**, not the active file list or review
  count. Their original text is read-only; saved edits and comments remain in
  history and exports. If the source is unavailable, the app does not infer file
  deletions. Reload after an agent updates source files to refresh this view.

**Saved drafts are not Git commits.** The application never commits, publishes,
deletes source skills, installs variants, or executes skill instructions/scripts.
This protects against refreshes, process restarts, conflicting saves, and
accidental draft replacement, not destruction or failure of the entire disk.
Keep an export on another device or a backed-up drive for that risk.

## One human master, all original variants

For this first review, the existing default prompts are already model-neutral in
their wording. Independent comparison against all four profiles identifies
behavioral differences; these appear under **Behavior differs across variants**
instead of being silently resolved. The master remains readable and each exact
original variant is available read-only. This is not an automatic text generator.

Optional `master-preparation.json` in the state directory supplies a prepared
master and variant notes for each name, pinned to the exact source fingerprint.
Only matching preparation is used when first seeding a skill. Restarting never
overwrites an existing draft. The preparation is also included in snapshots and
exports. Without preparation, the default prompt is the starting draft and its
other variants still need comparison before applying changes.

Supporting UTF-8 files can be edited as drafts; binary files and symbolic links
remain preserved originals. Use notes for split boundaries and deletion reasons.
**Ready to apply** is a review marker, not an execution button. Editing master or
supporting-file text returns that skill to **In progress**.

After applying substantive feedback, the agent saves the updated master/supporting drafts as
**Needs re-review**. Provenance-only frontmatter changes preserve the existing
review state and checkmarks; they do not create re-review work. Restoring internal
reference links after a metadata-only move is also a layout correction, not a
new review request. Preserve any re-review still owed for substantive changes.
Orange dots and a text badge identify skills needing re-review; use the
matching queue filter to find them. The applied record carries the feedback
revision, timestamp, a short change summary, and `reviewFocus`: what the user
should check next, naming the relevant files or decisions. The banner separates
these as **Changed** and **Check** rather than repeating the full feedback. Clear only resolved notes in
the current draft; originals and every earlier comment remain in History.
Reset file-review checkmarks for changed material. Mark the result ready after
reviewing it, or leave further notes for the next pass.

**Outstanding feedback** is separate from review state. Any nonblank current notes
show an orange badge, a queue filter and a library count. Read and edit the
feedback in the notes field, without a duplicate banner. The indicator remains visible even when the skill is ready or has an earlier
applied record. Clearing addressed notes removes the indicator; historical notes
do not count. The count is skills with notes, not individual comments. Deleted
skills keep their green completion dot while any remaining notes retain a badge.
Notes indicators update while typing without replacing either editor. Direct
document edits still use the existing In progress state; they are not inferred
to be comments or proof that feedback has been implemented.

The main file list and its review count contain documents, not code. Scripts,
source, tests, and other assets remain accessible under collapsed **Code and
assets**. Preview navigation pauses while either text editor has focus and
refreshes after leaving it; autosave continues independently.

## Backup, export, and restore

**Back up** creates a separate SQLite copy in the state directory. A backup is
also created at startup. **Export all** downloads a complete JSON archive with
originals, drafts, history, save identifiers, recovery records, and navigation.
For command-line export:

```sh
bun run review:skills --export /absolute/path/to/new-backup.json
```

The command refuses to overwrite an existing export. To restore an archive:

```sh
bun run review:skills --state /absolute/path/to/new-empty-state --restore /absolute/path/to/backup.json
bun run review:skills --state /absolute/path/to/new-empty-state
```

Restoration validates the archive and runs in one transaction. It refuses a
nonempty review database. Do not replace or edit an active SQLite database by hand.

## Applying drafts with an agent

The optional `bun packages/skill-review/apply.mjs` command pins one ready draft:

```sh
bun packages/skill-review/apply.mjs prepare --name SKILL --revision N --plan /private/new-plan
bun packages/skill-review/apply.mjs apply --plan /private/new-plan
bun packages/skill-review/apply.mjs rollback --plan /private/new-plan
```

Between prepare and apply, the agent reconciles source drift and edits the plan's candidate directory into all four complete variants, then independently exercises them. Apply rechecks the live revision and current source fingerprint. It keeps the prior source directory and a transaction record; rollback refuses to overwrite later source edits. It does not generate prompts, mutate review history, install views, split/delete skills, or publish. Use targeted `install-skills --skill NAME` for each matching installed model afterward. Splits/deletions still require an explicit coordinated change plan.

Tell the agent: “Apply the ready drafts from my skill-review workspace,” and
provide the state path shown under **?**. This is a separate authorized task.

1. Export the current review without replacing an existing file. Preserve all
   draft history and original snapshots.
2. Select only `draft.content.status = ready`. Inspect the exact draft revision,
   master, changed supporting files, decision, notes, and original variant
   differences. A checkbox or heuristic reference is not semantic validation.
3. Compare captured source fingerprints and files with the current repository.
   Do not overwrite intervening edits. Resolve incompatible variant behavior or
   unclear split/deletion scope with the user; do not silently union conflicts.
4. Work on an authorized feature branch. Apply the approved human master and
   supporting changes using `writing-for-agents` and its model-writing guidance.
   Produce every supported complete variant. Keep linked split/merge changes
   together and reconcile callers before removing a skill.
5. Validate executable behavior and independently exercise the affected skill
   profiles. Record the exact applied draft revisions and resulting file changes
   in the task closeout. Do not treat an old ready draft as a new instruction to
   reapply. The current editor intentionally does not apply changes itself.
6. Save the applied result with the exact current revision as its write
   precondition. For substantive changes, use `status: needs-review` and an `applied` record with a concise
   `summary` and skill-specific `reviewFocus`. Preserve edits
   made while implementation was in progress; a conflict requires reconciliation,
   not an overwrite. Keep unresolved feedback visible. Source edits and this
   acknowledgement are separate operations, so acknowledge only completed work.
   For provenance-only or reference-layout corrections, keep the current state,
   checkmarks and any substantive re-review reminder. Remove a re-review flag
   caused solely by an earlier metadata move by restoring its prior review state.

The reusable review skill should be distilled after this workflow has been used
and refined, rather than encoding an untested review ritual in advance.

## Validation ownership

- `Store.test.ts` owns durable saves, stale-write isolation and recovery,
  idempotent acknowledgements, read-only-file enforcement, full archive restore,
  usable SQLite backups, HTTP origin/shape boundaries, source-removal display
  metadata without data loss, and draft-aware reference ordering. The removal
  test also distinguishes unavailable sources and restored files; earlier save
  tests do not exercise that live-source boundary. No storage migration is needed.
- `Source.test.ts` owns lossless text/binary/symlink capture through the actual
  scanner. These are executable storage contracts, not tests of skill prose.
- Browser validation is manually run against a separate state directory. It
  covers editing/reload, supporting files, cross-skill tabs, saves interrupted by
  typing, offline recovery, conflicts, history, backup, and narrow layouts.
- Existing repository tests do not cover this new application boundary. No
  existing test owners or automatic E2E triggers are changed. The new tests use
  temporary local databases and one bounded scanner subprocess; no material
  execution-cost impact is expected.
