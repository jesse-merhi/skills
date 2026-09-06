# Skill tooling improvements

## Reference duplication removed — September 7

Checked all 28 managed skills and their linked instructions. Removed repeated instructions in nine skills without adding another writing rule: the existing writing guidance already says each instruction should have one home.

- **code-review:** the main workflow links to its owners instead of repeating rating, reviewer-context, pass-count, blocked-check and final-report details. Counts now live in the review loop; rating stays in the findings guide.
- **pr-proof-pack, frontend-ui-validation, grill-with-docs, design, to-spec, to-tickets:** removed duplicate writing, media, native-run, ADR, prototype and UI-planning instructions beside reference calls. Kept routing, unique permissions and sequencing.
- **de-slop, writing-good-tests:** removed repeated plain-language and test-cleanup instructions already owned elsewhere.
- **wait-efficiently:** applied the user's already-saved master to all four source variants without changing its audit draft or ready state. The Codex reference retains output preservation, which the user's shorter master no longer repeats.
- Kept **just-do-it** unchanged as the user's final version. Preserved all required evidence, native stop-and-ask behavior, PR category breakdowns and review/repair limits.

The audit gives each changed skill a short Changed / Check reminder. Original comments and files are preserved in `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/feedback-20260907-030035` and audit History.

## Fewer review references — September 7

- Consolidated nine references: triage, repair scope, shared repairs, repeated findings and pending questions now live in **Check, rate and fix findings**. Reviewer setup, domain skills and coverage now live in **Run an independent review**. Removed the separate flow-map and large-diff-slice procedures; reviewers still trace affected behavior and can divide substantial independent work.
- Kept the four stages. Native commands have one home; custom reviewer briefs belong to independent review. The Codex helper can still use its installed findings-reviewer profile, which is different from accepting a custom prompt.
- Every returned finding gets an evidence-backed likelihood and impact assessment; native priority labels are not copied blindly. Realistic local reproduction, important internal failures, defense in depth and maintenance cost remain.
- Simplified the review-loop explanation and changed-file checks. Unanswered questions stay open while unrelated authorized work continues. Existing pass counts, budgets, repair limits, permissions and publication checks are unchanged.
- ClawSweeper has a separate, explicitly requested route outside the normal four-stage workflow. Existing callers such as **just-do-it** remain supported and unchanged.
- References fell from 20 to 11 and their combined text is about 35% shorter. All four complete model prompts are maintained. The audit's Changed / Check note identifies what to re-read; applied comments and removed reference drafts remain in History.

Before-files and feedback: `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/simplify-review-20260907-024858`.

## Inline review workflow — September 7

- Rewrote **code-review** as four plain steps with inline reference links and complete command examples. Reviewers receive readability, test and TypeScript guidance as inputs instead of a duplicate coordinator pre-review.
- Retired **finding-discipline** into the shorter **Check the findings** reference. Retired **review-guardrails** into **When a check blocks work**; its progress instructions are now part of **Record each review pass**. The audit marks both standalone skills deleted/green and retains their original files, comments and edits.
- Kept real application reachability, meaningful internal failures, defense in depth, maintenance cost, scope/permission checks and saved review limits. The existing CLI scoring and limits are unchanged.
- Simplified **reducing-cognitive-load** around plain, accurate names rather than unrealistic process/data examples.
- Final output now reports whole-run raised/fixed/discarded counts, optional nonduplicated highest/lowest-priority examples, and added/deleted lines with the diff range labeled. Maintenance findings receive no invented runtime priority.
- Replaced PR closeout with **Publish fixes**. The review workflow ends at the authorized existing-PR push, not automatic proof-pack, human sign-off or merge. Existing publication ownership/destination checks and separate global readiness/merge requirements remain.

Independent instruction exercises caught and corrected two command-order issues: required scope-check/completion reasons, and recording validation before closing the run. All four prompt profiles and both installed views are updated; 28 managed skills and 22 commands remain. Skill-layout checks and 17 materializer tests pass. No real review, bot trigger, live findings-database write or publication was run.

Before-files, comments and evidence: `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/fresh-20260907`.

## Coordinator triage and simpler guardrails — September 7

- **finding-discipline** now guides triage after review, not reviewer discovery. It checks real consequences, repair value and maintenance cost. Operational bugs include jobs, backups, data, migrations and security even without a UI symptom; the user's defense-in-depth edit is preserved. Production captures are not required.
- **review-findings schema** explains runtime versus maintenance, likelihood and impact. The existing scoring matrix, evidence checks, fields, saved data and permissions are unchanged. The CLI computes outcomes from recorded evidence; the coordinator checks that evidence.
- **code-review** keeps initialization and applies triage after every result. Cold briefs and the Codex reviewer preset return candidates without requiring finding-discipline. The Codex helper does select this preset when installed; the earlier claim that native reviewers were never given such guidance was too broad.
- **reducing-cognitive-load** now focuses on names at definitions and usages, familiar words, and code a human can follow. Removed the generic type/validation checklist; those rules remain in their existing owners.
- **review-guardrails** now handles actual blocked checks. Removed role exposition, duplicated setup/defaults/completion instructions and the repeated diff formula. The CLI already reports measured growth and allowance.
- Moved finding-related references into code-review with clearer names: **Repair scope** checks permission; **Shared repairs** handles cross-boundary fixes; **Pending decisions** handles repair/keep-revert questions; **Repeated findings** attaches later evidence to an already-open question instead of creating duplicate cards. Guardrails retains only budget recovery and progress commands.

All four prompt profiles and both installed model views are updated. Applied notes remain in History; substantive changes have Changed / Check reminders for re-review. User-ready states on unrelated skills are preserved. Existing CLI tests, thirteen finding unit tests, seventeen materializer tests, typecheck, scoped lint and skill layout pass. Independent prompt exercises cover runtime/maintenance classification, realistic local failures, internal data loss, reviewer roles and unchanged budget/permission stops. No real review, bot trigger or live database write was run.

Evidence and before-files: `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/triage-20260907`.

## Latest feedback applied — September 7

This section supersedes the earlier pass reports below.

- **finding-discipline:** three concise stages replace production-only proof with reachable user-flow evidence, including realistic local fixtures. Removed the duplicated ratings reference and aligned the shared instruction and repair callers. This work is no longer deferred as a separate user-owned task.
- **code-review:** combined target selection and setup into the first stage. **review-guardrails:** ordinary proven, contained repairs proceed without another approval; actual budgets, explicit permissions and concrete high-risk decisions still apply. Ordinary reversible fixes are not automatically provisional.
- **typescript-discipline:** removed the redundant final test/workflow bullet. **writing-good-tests:** aligned its evidence sentence with reachable-flow proof and preserved the user's wording elsewhere.
- Removed five per-skill LICENSE files as requested; attribution metadata and historical copies remain.
- Removed the duplicate **Outstanding feedback** box above the document. Comments remain in the notes editor, with sidebar badges/filter/counts; **Changed / Check** still explains what to re-review.
- Cleared applied comments with revision checks, preserving their history. Explained the optional GitHub wait estimator. Removed the agent-invented OpenClaw automatic-preview backlog; no new preview service was requested or built.
- Managed command activation exposed a query crash on an existing record containing `constructor`. An own-property check fixes the inherited dictionary lookup. The exact copied-database replay now succeeds and preserves all 18 tables, existing values and schema; the live database was not modified by validation.

Verification: four targeted CLI query tests, thirteen finding unit tests and sixteen audit store/source tests pass, with typecheck and scoped lint. Skill layout passes for 30 skills and 48 references. Independent exercises of all four complete prompt profiles confirm local user-flow evidence and the routine-repair/permission boundaries. The restarted live UI shows the new code-review stages and Changed / Check reminder without the duplicate feedback box. All 60 saved records, 1,588 prior history revisions and three recoveries are preserved exactly. Managed activation is recorded below when complete. No real review, bot trigger or publication was run.

### Activation closeout

Both installed views now use the durable source at `/Users/jmerhi/.local/share/jesse-merhi-skills/source`: 30 skills each for Codex Astra and Claude Fable, with three retired links removed from each harness. All 22 managed commands pass their help checks. The two verified legacy executables and their sidecar are backed up outside PATH. Only known repository-owned global/preset links were retargeted; unknown files and live review data were not replaced.

Evidence and preserved originals: `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/finding-discipline-20260907`.

## Outstanding feedback and missed edits — September 7

Historical pass report; its outstanding items and policy descriptions are superseded above.

Three agents inspected all 60 saved entries, current document edits, comments, histories and recoveries. The green code-review entry still had a new request: review state was not a reliable indicator of unanswered feedback.

- **Outstanding feedback** now has its own orange badge, filter, library count and top-of-document preview. It is independent of **Needs re-review** and remains visible beside an older applied summary. Cleared historical comments do not count. Deleted skills retain green dots and show any outstanding notes separately.
- Normal typing and autosave update indicators without replacing either editor. Loading the saved side of a conflict refreshes the indicators too. Reload an already-open page after agent updates; cross-tab/external changes are not live-streamed into cached drafts.
- **code-review:** target selection is one sentence; setup owns initialization. **Decide what to fix** and repair lenses now live in fixing-and-reporting. Native/cold pre-pass and post-repair budget checks remain at their operations; the bot reference explicitly checks before triggering.
- **review-guardrails:** removed the duplicate five-stage workflow; retained a shorter budget/scope policy. This is a placement change, not implementation of the proposed budget-or-danger-only stopping policy. Current CLI question/failed-repair limits and existing permission/evidence rules still apply.
- **reducing-cognitive-load:** applied the user's revision 36 introduction and naming edits unchanged to all four variants, without creating extra re-review for the user's own text.
- **writing-good-tests:** corrected the stale display name in the audit's metadata draft; review state is preserved. **writing-for-agents:** removed the runtime licence-preservation instruction; legal files and attribution remain intact.

### Still outstanding

1. Guardrails autonomy: align the desired stopping policy with the actual CLI and applicable permission boundaries. The scripts measure budgets; they do not reliably infer all dangerous actions. This remains a visible note, not an applied claim.
2. Managed PATH/live-view activation: the two existing repository-owned binaries still need the separately described migration. Source and audit changes are not proof that every harness is using them.
3. OpenClaw staging: automatic safe synthetic-preview setup is still not implemented. Removing the declaration was only part of that request. This is restored to current notes rather than hidden in history.

Finding-discipline remains user-owned and unchanged. Its agent-written no-action FYI was cleared, not its history. Historical reference-placement requests were superseded by the later correction to use metadata for external provenance. Licence notices were removed from reading lists, not deleted from distributions. The review-flow-map invocation question has a measurement limit: session mentions are not invocation counts. No current repository matching jessify appeared in the authenticated jesse-merhi repository listing; that does not establish what happened to an older/deleted repository.

### Verification

Store/source tests: **16 passed**. Materializer tests: **17 passed**. Typecheck and scoped lint passed. Browser validation used isolated copies of real saved state and checked visibility, filtering, save/reload, focus/selection, whitespace clearing and deleted-state colors. A replay of the captured review-flow-map conflict exposed a stale badge on Load saved version; the same replay passes after the correction. Independent instruction exercises cover complete prompt files, not separate model-family executions. No real review, publication or bot trigger was run.

Snapshots and evidence: `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/feedback-visibility-20260906`. Earlier sections below describe earlier passes; this section distinguishes the remaining work.

## Name corrected — September 7

The combined test-writing skill is now **writing-good-tests**, displayed as **Writing Good Tests**, rather than `tdd`. Its test-quality, coverage-planning and test-first guidance is retained. All four source variants, current callers and both installed skill lists use the new name. Upstream URLs still identify the original TDD source.

The audit carries the existing draft and review state to writing-good-tests. The old `tdd` entry is a green, retired history record pointing to the new name; its original snapshots and comments remain available. This naming correction does not create additional re-review work. The separate legacy-binary migration below remains pending and neither binary was changed.

## Feedback sweep — September 7

This is the earlier sweep checklist. The outstanding-feedback section above records later corrections and remaining work.

**Activation pending:** source changes and audit drafts are ready. Updating the live Codex/Claude views and PATH commands awaits your choice about two verified legacy repository binaries: `review-findings` and `clawhub-local-test`. Neither has been overwritten. The proposed migration backs them up outside PATH before publishing the managed aliases; databases and other state stay untouched.

### Feedback applied

| Your feedback | What changed / where to look |
| --- | --- |
| Share review loops and fixing/reporting; remove separate loop skills | Native, cold and ClawSweeper workflows now live under **code-review**, sharing numbered loop and repair/reporting references. The three former entry points are deleted in source and green in the audit. |
| Native review is too wordy; use high for Claude and the Codex helper | Short numbered instructions; Claude uses **high**, Codex uses **codex-review** with explicit target checks and its own cleanup. Two native clean passes remain required; evidence-rejected candidates can count as clean. |
| Guardrails need numbered steps, test audit and best practices | Five main stages explicitly include TDD/test quality, repository standards and relevant domain checks. Eight review/guardrail references are 46% shorter while preserving limits and owner decisions. |
| Stop resolving helper directories | The installer publishes 22 explicit public commands, with shared harness ownership, collision protection, rollback and targeted updates. Skill examples use those names rather than locating script directories. Live migration is the pending item above. |
| Remove vague cognitive-load advice across skills | Replaced generic caller/type-boundary/proportionality advice with concrete names, data shapes and examples. Also tightened TDD, TypeScript, handoff, specification, ticket, HTML-explanation and proof-selection wording. |
| Cleaner references and help are redundant/confusing | Moved useful interpretation and cleanup constraints inline; removed four redundant guides. Fixed the actual `--help` bug: it now prints usage without scanning skills, logs or Codex. |
| Remove upstream-license documents from skill reading lists | Preserved the notices byte-for-byte in **LICENSE** for writing-for-agents, skill-cleaner and speak-fking-english. No remaining upstream-license reference documents. |
| Wait guidance needs practical commands and less prose | Short main prompt plus concise host/CI instructions, tracked waits, `quiet-wait`, optional `estimate-gh-wait`, and no invented background wakeups. |
| Fold skill mechanics and model routing into writing-for-agents | Both are brief sections in the main prompt. The four substantive model guides remain. |
| Apply my actual edited drafts too | Applied your diagram and frontend-validation masters, retaining their ready state. Preserved your later removal of code-review's introductory paragraph. |

**Review states:** substantive rewrites have orange **Needs re-review** plus **Changed / Check** reminders. Applied comments leave the active queue but remain in History. Deletion records are green. Legal-file moves, command-path-only changes and your directly applied drafts do not create new re-review work; frontmatter-only edits still do not either.

**Finding-discipline remains yours:** its skill and production-evidence policy are untouched. The audit note now says that explicitly instead of presenting an unanswered choice.

### Verification and known limits

- Installer/materializer: **39 tests passed**. Cleaner: **10 tests passed**, including help paths that forbid analyzer filesystem access and child processes. TypeScript and scoped lint passed. The skill-layout check passes for 30 skills and 49 references; all 170 skill Markdown files have no hard-wrapped prose.
- Independent instruction exercises cover the affected four prompt profiles, including clean counts, rejected findings, coordinator/reviewer roles, partial review requests, permissions and waits. This is prompt coverage, not execution on four different model families. No real review engine, bot review, PR mutation or push was run.
- The separate 40-scenario writing exercise was **not uniformly clean**: outputs invented some requirements/evidence, two shell examples omitted needed quoting, and one arithmetic explanation was wrong. Its ten-case batches may have leaked context between cases, so these are output failures, not established regressions caused by the edits. Successful responders were Opus; Fable was unavailable. Your UI/diagram masters remain unchanged beyond command aliases. Full results are in `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/prompt-exercises-remaining-20260906T143131Z/report.md`.
- One existing CLI limitation surfaced: after a completed ClawSweeper phase, changing only proof on the same SHA cannot reopen the saved phase. The workflow now reports that case as incomplete instead of treating old passes as current. The available reproduction is synthetic; no production-evidence-qualified CLI repair was made.
- Native target checks now use before/after Git SHAs and reject retargeted results; the helper's initial text label is not misrepresented as a final SHA receipt.

Snapshots, save plans, validation logs and installation backups are in `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/feedback-sept7.4hr_zw4w`. Original snapshots and prior feedback/history are retained.

## Reference correction — September 6

The earlier interpretation was wrong: **metadata records where an external skill came from**, such as Matt Pocock's upstream skill. Internal supporting-file links and when to read them belong in the skill body.

- Corrected all 88 affected variants across 22 skills, preserving internal guidance and current workflow behavior. Existing source fields and license notices remain; missing upstream origins come from the repository's recorded provenance. Anthropic frontend-design attribution moved from the design reference into metadata. Ordinary documentation and runtime URLs are not mislabeled as skill origins.
- Corrected the writing-for-agents sentence that introduced the mistake. The audit masters preserve your edits; both installed model views are updated.
- These provenance/layout-only corrections do **not** create re-review work. Restored six entries that were ready before my metadata move: ClawSweeper, design, grill-with-docs, html-explanations, pr-proof-pack and session-recall. Other outstanding substantive reviews and comments remain unchanged.
- All 17 materializer tests and skill-layout lint pass. An independent instruction exercise covered all four profiles and found no loss of routing, permissions or completion rules. No skill workflow was executed.

This section supersedes the older claims that internal references belong in metadata. Original snapshots, feedback and history remain saved.

## Remaining jobs — completed September 6

This is the current status; the older sections below are history, not an open task list.

- **Review guardrails:** the existing findings CLI now enforces the saved eight-hour budget, five-open-question cap, phase targets and two-unsuccessful-repair consultation rule. Initial overrides stay frozen across resumes. Native and ClawSweeper require two clean passes; cold defaults to one, configurable at initialization. Repeated findings attach evidence to their existing record rather than creating duplicates.
- **Native review loop:** shortened all four prompts and consolidated target, counters and transitions into one loop reference. Engine references now cover invocation, completion and cleanup. Evidence-rejected findings count as clean; this fixes contradictory wording, not a new policy. The user's separately edited audit master keeps its omitted one-off-review paragraph.
- **Cold-review memory:** installed the scoped Codex findings-reviewer profile with memory injection/generation and recall disabled. An actual local CLI fixture injected a synthetic memory marker in the control session and omitted it in the reviewer session. No real model or user memory was used. Claude guidance uses a fresh agent without configured memory; app hosts without per-agent controls must disclose the limitation. This is not filesystem isolation.
- **Old callers:** updated only the retired test-audit and gh-stack references in the separate AGENTS.md loaded by OpenCode. It now names TDD planning and the installed `gh stack` command. The symlink and other instructions are unchanged.
- **Finding-discipline:** you are updating this separately. Its production-evidence policy and feedback are deliberately left untouched; no answer is needed here.

### What to re-review

Open **review-until-clean** for the shorter loop, **review-guardrails** for saved limits and repair records, and **code-review** / **cold-pr-review-until-clean** for reviewer memory boundaries. Their orange **Needs re-review** state includes a **Changed / Check** reminder. Addressed notes are cleared from the active queue and retained in History. Deleted entries stay green.

### Proof and limits

The guardrails worker passed 27 tests across five suites, the full findings-registry shell suite, targeted ESLint, TypeScript and strict Effect diagnostics. Final integration reran 13 progress/limits/real-CLI cases, all 17 materializer tests, TypeScript and skill-layout lint successfully. A synthetic CLI journey shows a full consult queue refusing a start without advancing its revision; an owner decision clears the queue; two clean native passes refuse a third unchanged start.

Independent instruction exercises found and corrected old caller wording that treated every stop as scope approval, plus a cold-loop ambiguity between stopping another pass and completing the phase. The final exercise confirms those distinctions. This was not execution on four different model families. Both installed profiles match their prompts and shared resources; 123 unselected entries per harness are unchanged. An initial installation check incorrectly expected copied directories where the materializer intentionally uses symlinks; checking resolved resources passed.

Scripts enforce the recorded facts, not their truth: the coordinator still judges evidence, owner authority, matching causes and scope, and must start every required review phase. Repair counts are per finding, not inferred from review passes. Expiry blocks further work; it does not kill a running process. No actual review engine, review bot, PR mutation or publication ran.

The audit backups, native memory fixture, validation log and installation manifest are saved in `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/remaining-jobs.dS9PaH`. The guardrails CLI demonstration and worker checks are in `/tmp/review-limits.LDrxod`.

## Reference layout and remaining comments — September 6

This section supersedes the revision counts below.

- **Applied:** moved document links, read-when guidance and license checks into frontmatter for 20 skills, covering all 80 model variants. Bodies retain workflow steps, commands and permissions. Audit masters and the installed Codex/Astra and Claude/Fable views are updated.
- **De-slop:** moved unchanged legal notices to `LICENSE`, outside the review document list. Cleared its comment and left it ready, as requested.
- **Comments checked:** read all ten remaining notes and their original feedback. Cleared the fulfilled design reference request and the leftover naming/helper note. Seven notes remain across five actual issues below; none is silently marked implemented.
- **Deleted skills:** all 18 saved deletion records remain ready. Removed the CSS override that incorrectly painted deleted ready entries grey; review state now controls their dot.
- **Preserved:** all original snapshots, earlier comments, revision history, recovery records and unrelated installed skills. The user's edited review-until-clean master remains distinct from source; this pass did not restore its removed paragraph.

### Still open — not implemented

| Feedback | Actual remaining work |
| --- | --- |
| Review guardrails should be scripted | Extend the existing findings CLI to enforce its saved time and consult limits and stop unchanged reruns at the configured clean target. Current code enforces diff growth/new binaries and recorded ClawSweeper limits, but does not enforce everything described in prose. No new framework is needed. |
| Review-until-clean is too long and its engines do too much | Discuss the intended loop, then consolidate repeated target, commit and reporting rules. Resolve the existing disagreement about whether evidence-rejected findings count as clean; this is separate from the settled two-clean ClawSweeper rule. |
| Production evidence is too restrictive | Decide whether real application-flow reproduction may replace the captured-production-input requirement in the owning global policy. That requirement is unchanged pending the answer. |
| Cold reviewers can inherit prior knowledge | Fresh nonforked reviewers avoid the implementation conversation; filesystem and persistent-memory isolation are not proven. The cold-review reference discloses the limitation. No host permission or memory settings were changed. |
| Old TDD/stack callers | The separate `/Users/jmerhi/repos/skills/AGENTS.md`, loaded by OpenCode, still names retired skills. Its migration is not applied to that checkout. This one issue accounts for the TDD, test-audit and gh-stack notes. |

Queue matching means recognizing the same cause in the same code after an independent result. Scope checking asks whether a repair belongs to the requested change. A systemic repair fixes the shared owner instead of repeating patches at callers. Scripts can store decisions and enforce limits; they cannot establish those judgments by counting lines.

Validation: skill-layout lint passes for 33 skills and 62 references; all 17 existing materializer tests pass. An independent read-only walkthrough covered seven scenarios across all four prompt profiles and found no relocation-related loss. This was not execution on four different models. The running audit page shows frontmatter in the editor and the cleaner body in Preview.

## Latest feedback pass — applied

- **Tests:** `tdd` now owns test planning, quality, portfolio/cost checks and test-first implementation. Review-only work remains read-only; existing proof is reused without manufacturing a red test. Retired `test-audit` and migrated callers.
- **ClawSweeper:** TWO consecutive clean reviews on unchanged evidence. Kept the applied six-trigger/four-attempt/twenty-minute limits, one ambiguity retry and at most three useful diamond improvements. No unlimited loop was authorized.
- **Stacked PRs:** keep the installed `gh stack` extension and use `gh stack --help` where relevant. Removed only the four matching pinned skill copies for Codex, Claude, opencode and Pi; the extension binary and manifest checksums are unchanged.
- **Writing:** Speak English is a short plain-language pass. The new `de-slop` skill owns explicit prose rewrites and calls Speak English, not the reverse. Actual license notices remain.
- **Review:** ordered code-review stages; moved cold dispatch and its checklist into an internal reference. Reconciled coverage ownership, current tool schemas, phase-specific reruns, configured cold targets, early consult resume, native question UI and provider/API/media proof checks.
- **Standards:** restored direct TypeScript bullets after reading the original repository snapshot; added explicit existing Zod/Effect Schema boundary guidance. Clear names and purposeful helpers are encouraged without inventing runtime defects or weakening finding gates.
- **Waiting:** host-specific details moved out of the main prompt. Native `gh run watch`/`gh pr checks --watch` replace the mandatory estimator route; the existing estimator and quiet delay helper remain optional.

### Saved audit and installed proof

Eighteen entries now have exact-revision **Changed / Check** acknowledgments and **Needs re-review** status. Latest revisions: code-review 7; cold-pr-review 16 (moved); cold-pr-review-until-clean 4; finding-discipline 4; reducing-cognitive-load 11; review-guardrails 6; review-until-clean 5 (caller only); speak-fking-english 6; de-slop 1; typescript-discipline 11; wait-efficiently 3; tdd 16; test-audit 8 (moved); ClawSweeper 52; gh-stack 8 (skill removed); to-spec 65; to-tickets 68; just-do-it 77. No concurrent draft was overwritten. The three earlier ownership/streak/stack choices are settled; the policy questions below remain visible.

The final comparison preserves all 58 earlier originals, 1,134 prior revisions and three recovery records. Adding de-slop gives 59 originals and 1,158 revisions. Both selected installations match all shared resources as well as their complete prompt; twenty unselected views per harness are unchanged. In particular, both installed cold-loop references include the corrected early-consult resume gate. ClawSweeper's final reference also applies the saved removal of duplicate finish/provenance prose; its pinned research remains in this report and history, and its main limits remain unchanged.

The full report, exact changed-path manifest, test logs, exports and external-caller patch are in `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/new-live-feedback.ce6ZpB`. The final ClawSweeper prose exercise found no contradictions in either unchanged-head platinum or one-useful-improvement scenarios; no bot workflow ran.

### What investigation established

**Cold memory/context:** a fresh conversation is not a filesystem sandbox. Current [Claude subagent documentation](https://code.claude.com/docs/en/sub-agents) distinguishes non-forked context from forks/resumes and optional persistent subagent memory; its current startup description excludes main-conversation auto memory from non-fork agents. Shared instructions, accessible files and configured reviewer memory can still expose earlier work. No memory or permission settings were changed.

**Background completion:** [Codex documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) establishes parallel agents and result collection, not a portable guarantee that an ended parent turn restarts. The current host's actual callback/wait contract controls that choice. Claude has tracked background completion; no extra timer is needed for already-tracked work. No background automation was created.

**Existing wait tools:** local `gh` 2.100.0 help confirms watch, interval and exit-status support. Four existing wait tests passed; an actual `quiet-wait 25ms` emitted one completion record after 27ms. That proves the local delay path, not a future model wake.

**Existing review CLI:** scope-start saves the run timestamp/baseline, scope-check enforces diff growth/new binaries, and progress records preserve revision-checked counters. The eight-hour limit, five-question cap and judgment that two patch cycles have not converged are not fully enforced by those commands. The two-cycle consultation trigger was already in the earliest snapshot; it is not a blanket cap on review or clean-confirmation passes. No new policy engine, wrapper or dependency was added.

### Still genuinely open

- Relaxing production-evidence requirements needs an explicit change to the owning global policy. Synthetic examples were not promoted to production evidence.
- Naming and readability can be maintenance findings with a current cost. Treating every style preference as actionable, or removing that evidence bar, was not approved.
- Further automatic enforcement of review judgment/time/consult rules needs a scoped design decision; the current script is not advertised as enforcing what it does not enforce.
- Native review-until-clean's rejected-pass/engine-policy question remains separate from the now-settled ClawSweeper streak.
- opencode's active AGENTS points into the separate `/Users/jmerhi/repos/skills` checkout. That file and symlink were not changed. A precise two-hunk test/stack caller migration patch is retained for explicit checkout authority.

Fifteen selected skills are mirrored and installed exactly for Astra and Fable, with all four source variants retained. Independent exercises covered all 44 primary prompts and corrected the shared-reference inconsistencies. Installer/materializer, wait, reviewer metadata and audit persistence checks passed; lint/type/Effect checks passed. An initial metadata-test extraction command was malformed, then corrected and rerun successfully; the original log is retained. No actual review, PR/stack mutation, bot trigger, auth change or deployment ran.


## Current decisions and demonstrations

Your decisions are recorded in the relevant skill drafts, separately from completed source changes:

- **Design:** leave unchanged for now; take selective inspiration from Anthropic rather than install a large replacement.
- **Browser — applied:** removed the separate browser-use skill. Use your existing Claude Chrome integration. Browser apps, integration, CLI and package cache are untouched.
- **Frontend validation — applied:** separate web and native guidance, with Maestro for native journeys. Implementation owns evidence; tickets, specs, reviews and proof-pack reuse it. All four variants and affected callers are updated.
- **Skill structure — applied:** model-writing guidance and its tools now live in writing-for-agents; rubbish auditing is an internal code-review reference. Retired standalone installations and migrated runtime imports, documentation and managed global callers.
- **Atlassian — applied:** direct authenticated tools first. The wrapper starts another agent only when explicitly requested. Missing tools and unconfirmed read-only enforcement are reported, not fixed by silently changing permissions.

### Better capture behavior

The web helper now accepts `--wait-for <selector>` and `--timeout-ms`, waits for DOM content rather than network-idle, and records final URLs, timestamps and failed captures. A failed capture remains in the report while later requested captures still run; the overall command exits unsuccessfully.

Ran the actual helper against a local synthetic page: the ready capture succeeded despite ongoing traffic; a missing selector produced a retained timeout; a later capture succeeded. This proves capture lifecycle, not a real app journey or native-device behavior. Existing overlap/44px checks remain heuristics; the helper still does not execute interaction sequences. Maestro/device journeys were not run.

### Remaining research: answers, not silent rewrites

| Question | Investigation result |
| --- | --- |
| Atlassian setup | Direct upstream tool discovery succeeded through the available bridge. That avoids the wrapper's extra reasoning agent, but its generic dispatcher is not read-only. Existing bridge discovery works; migrating its older endpoint to the current [v2 architecture](https://developer.atlassian.com/cloud/rovo-mcp/) needs separate integration/auth testing. No credentials, endpoints or permissions changed. |
| Flow map versus review CLI | CLI owns scope, file coverage, pass/head/progress and stale-result records. The compact reference owns the input → state/effects → result explanation. Reuse the records; keep the explanation. Current source already does this. No usage counts claimed. |
| Skill-cleaner upstream | Compared [the latest upstream skill change](https://github.com/steipete/agent-scripts/tree/0e8ca002fc1dd76ae84c71f8d24dfd1ac7096ff5/skills/skill-cleaner). Our adaptation adds configured-model/cache handling, symlink traversal, custom-tool-call usage and local infrastructure. Recommendation: retain its loaded-root/duplicate/usage/budget analysis, which the editor does not replace. Added an upstream-review baseline to all four metadata blocks, not a fabricated adaptation revision. No analyzer scan ran. |
| ClawSweeper ratings | The [saved pinned implementation](https://github.com/openclaw/clawsweeper/blob/42226a81c43c2c8ded17a684a706e58f3a58577a/src/clawsweeper-rating.ts) uses the weaker of patch quality and applicable proof. Clean/security-clear patch confidence needs 0.95 for challenger, 0.80 for diamond and 0.60 for platinum. P3 caps patch rank at platinum; P2 at gold; P0/P1 at silver or worse. Suitable logs can support diamond and suitable visual/linked evidence challenger; more media cannot fix a weak patch. Deployed bot behavior was not checked. |
| License reminders | Actual MIT notices remain with retained adaptations; repetitive runtime reminders are unnecessary. [Notice text](https://raw.githubusercontent.com/mattpocock/skills/main/LICENSE) is not replaced by a provenance URL. Writing-for-agents already removes the runtime instruction; retaining its notice file is intentional, not unfinished feedback. |
| ACP lifecycle | Installed ACPX already closes its one-shot client, managed terminals and adapter. Native archive help also exists. Do not add a duplicate lifecycle manager. Client cwd checks and approval modes do not enforce a brief's narrower file list. Source inspection only; no session, permission challenge or archival executed. |

Validation: installer/materializer, audit persistence/source/apply, the manually triggered synthetic capture case, lint, typechecking and Effect diagnostics passed. Parent additionally ran 17 materializer cases, existing Handoff/Grill checks, both diagram geometry checks and independent prompt exercises. Ten affected skills were installed in both harnesses across worker and parent passes. No commits, pushes or auth changes.

### Handoff's confusing comment

That comment was added by the audit worker, not by you. It restored an old question about making a launch script after the script already existed. It is now removed. Your Handoff wording is unchanged. Running the real planner here produced:

```text
surface=codex-app
destination=codex-app
relationship=continuation
action=native-tool
tool=mcp__codex_app__create_thread
```

This proves detection and the recommended route, not agent startup. No session or worktree was launched. The planner's existing fixture checks pass.

### Grill and diagrams: actual demonstrations

- **Grill:** the real collector found the configured Obsidian vault and the audit research note. The actual Obsidian connector then read that note. The helper returns paths, not conclusions or note edits. Broad searches returned archived matches first: use project-specific context rather than treating an alphabetical match as the latest decision.
- **Diagrams:** rendered and visually inspected a 14-node explanation of this server's save flow. The initial export is 893px wide. Giving its main path stronger Graphviz edge weights straightens that path and reduces width to 639px, retaining 13px text and no geometry-check findings. No renderer rewrite was needed. The improved graph still refuses a 390px export because labels would shrink to 7.9px. It is desktop proof, not mobile proof or a guarantee for every graph.

Demonstration artifacts and the pre-change audit export are preserved in `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/tooling-followup.c60Kks`.

### Earlier follow-ups — superseded

The three earlier questions are now answered: combined TDD/test quality, two ClawSweeper clean reviews with retained limits, and stacked PR tooling without a separate skill. The latest pass also implements the cold-review and TypeScript feedback. See the current section above for genuinely open policy and external-caller questions.

## Earlier feedback pass (historical)

Use **Show → Needs re-review** for the orange queue. Each changed skill has a short **Changed / Check** note at the top: what was applied and where to focus your re-review. The timestamp and original feedback revision remain below it. Resolved notes move out of the active draft, not out of history. Code files are tucked into **Code and assets**; document counts exclude them.

### What changed

| Feedback | Result |
| --- | --- |
| Atlassian queries | Renamed to `atlassian-queries`; shorter query-first instructions. The Rovo launcher requests read-only behavior but does not enforce a permission boundary. |
| ClawHub local test | One direct launch command, no global symlink setup, four references reduced to one. Clarified that `--skip-import` skips replacement but can still change schema/auth/fixtures. |
| ClawSweeper | Plain review/fix loop; six references reduced to one rating guide. Removed the bespoke watcher and use `wait-efficiently`. Retained fresh-response, budget, streak, and publication boundaries. Current rating code was checked once for the saved guide; future runs need not inspect the bot repository. |
| Cleanup | Shortened the body and discovery reference. Kept ownership evidence and protection for dirty/shared state. The inventory writes a report but deletes nothing. |
| Design | Reworked around users, content, existing components, and deliberate visual choices. Researched [Anthropic's current design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) and [W3C structure guidance](https://www.w3.org/WAI/tutorials/page-structure/), without installing another skill or importing its rigid checklist. |
| Diagnose | Kept a short evidence-and-permissions reminder instead of a full debugging recipe. Its useful distinction is diagnosis versus authorized repair; a modern agent doesn't need a tutorial on debugging. |
| UI validation | The coordinator owns one pass; reviewers request gaps. Specs/tickets describe expected evidence instead of invoking another pass. Folded MCP/design-specific notes into the main guidance and one layout reference; added existing Maestro-flow guidance for native apps. |
| UI helper | Inspected the script: it already captures multiple URL states, widths, screenshots and console errors. Documented its real limits: URL states don't perform interactions, and overlap/44px warnings are heuristics. No speculative script rewrite or dependency installation. |
| HTML explanations | Shortened the main instructions and all three references. Kept useful templates, accurate annotated diffs, local privacy, responsive layout, and code styling; removed repeated page contracts. |
| TDD (earlier pass, superseded above) | Previously split test selection from implementation. The latest pass combines both in tdd while retaining coverage ownership and cost rules. |
| Review flow map | Already deleted as a standalone skill. Shortened its reference under code review: the CLI records scope/coverage; the agent still needs to understand behavior. Cold review reads the reference, not the whole code-review workflow. |
| Handoff / just-do-it / writing-for-agents | Applied the exact saved text edits across all four complete variants, without adding the removed boilerplate back. |
| Architecture skill | Deleted `improve-codebase-architecture`, removed installed copies, and reconciled its callers without dropping basic architecture checks from reviews. |
| Personal deletions | Removed `comp6841-portfolio-marking`, `jessify-privacy-guard`, and `openclaw-opengrep-remediation` from their local source/install locations after backup. None was present in the current public `jesse-merhi/skills` tree. No remote history was rewritten or published. |

### Questions about unfamiliar skills

The live queue now contains only this repository's skills and its preserved deletions. Previously captured external skills remain in the export rather than cluttering the queue.

- **gh-stack (historical, superseded above)** was GitHub's installed extension skill, not authored here; its metadata identified `github/gh-stack` v0.1.0. The latest authorized pass removed only its verified skill copies and kept the extension/tool.
- **browser-use** is an external CDP harness. Codex uses its supplied browser tooling; a second browser-control skill is unnecessary for that route. For Claude, [its official Chrome integration](https://code.claude.com/docs/en/chrome) is a supported first option when available. There is no evidenced universal “best” choice; no browser tooling was installed or switched.
- **hatch-pet** is outside this repo, so the conditional deletion did not apply. Hidden from this audit, not deleted.
- **maintainer-eval** came from `~/.claude/skills`: it evaluates maintainer activity. It is outside the repository scope and is now hidden.

### Staging follow-up completed

The launcher no longer requires a JSON declaration or special route. It checks the preview's HTTP response locally and through the tunnel, retains known private-port rejection, expiry, status, and stop, and removes the setup reference. The short main prompt keeps the actual requirement: synthetic data, no credentials, no live Gateway. An HTTP response establishes reachability, not privacy. No public tunnel was opened for this change.

PR Proof Pack's later saved edits are also applied: the shorter template instruction in all four variants, and removal of the raw-capture retention sentence from Media. The user's completed Grill and Just Do It reviews were left alone.

The subsequently completed Handoff edit is applied too: confirm agent startup and check for accidentally created duplicate sessions. An independent exercise of all four prompts covered queued/ambiguous startup and duplicate sessions without launching anything. At that earlier checkpoint, ClawSweeper was still being edited; the latest pass above applies its now-confirmed choices.

Follow-up validation: eight staging tests passed, including plain HTML without a declaration, local failure before launch, public-readiness failure cleanup, protected ports, start/status/stop, and interrupted-startup process cleanup. Public transport and successful tunnel processes were mocked; the interrupted-startup test used a real local fixture and fake cloudflared process. The HTTP-error case emitted a non-fatal Python ResourceWarning. Twenty-six materializer/installer tests, skill lint, code lint, and typecheck passed. The declaration-schema test was retired with that contract; the other safety/lifecycle coverage remains. No material execution-cost impact (eight local tests completed in 2.7 seconds). An independent agent exercised all eight prompts against synthetic-preview, private-service, missing-tool, read-only PR, and concurrent-edit scenarios. It confirmed that removing the declaration and raw-capture sentence does not authorize exposing private data or deleting user files; these were simulations, not separate model-family runs.

### Editor and validation

Preview reloads are deferred while typing in the main editor or notes; autosave continues. The preview refreshes when focus leaves the editors. Dia was observed with focus in the preview; the intermittent jump was not consistently reproduced. This change removes preview navigation during typing, rather than claiming a proven browser-engine diagnosis.

The store/API tests cover the new applied record, re-review status, export/restore, and repository filtering without data loss. Targeted store/source/ClawHub tests: 22 passed. Materializer, installer, apply, and personal-source tests: 28 passed. Existing staging-helper tests: 5 passed. Typecheck, lint and Effect diagnostics passed. An independent agent simulated nine workflows across all 36 complete variants; no remote workflow or real production import was run.

All originals, old feedback and revisions remain saved. Backup bundles: `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/feedback-pass.N6QHxi` and `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/finish-feedback.XgvqsZ`. The latter preserves the source, installed views, and exact feedback before this follow-up. Final comparison preserved 58 original snapshots and 939 earlier revisions plus recoveries. Both harness installations match the three updated skills; the other 37 installed main prompts in each harness are unchanged.



## PR Proof Pack writing pass

Applied the user's approved writing changes to PR Proof Pack and Writing for agents. PR Proof Pack now has four short stages and five references: Proof selection, PR writing, Media, GitHub publishing, and Bitbucket. Its main prompt and references are about 1,700 words, down from about 7,300, including the user's own Proof selection rewrite. The user's wording is unchanged apart from trailing whitespace.

- Writing for agents now leads with explaining the job to a capable colleague. Metadata owns the introduction; stages and templates remain useful, flexible tools. Necessary commands and permission boundaries remain explicit.
- Screenshots and video editing are combined as Media. Redundant selection rules, FFmpeg recipes, anti-pattern lists, and rigid caption/sentence formulas are removed.
- The Mermaid and separate Plain language references are deleted. General writing uses speak-fking-english, whose own audit remains separate.
- PRs retain the category breakdown and an adaptable template. The workflow authorizes title, description, and proof updates on the user's own PR; explicitly read-only requests remain read-only. It does not grant unrelated PR changes.
- GitHub version checking is troubleshooting after an upload failure, not a preflight ritual. Current commands are directly linked from the main skill; a missing link is not why the old screenshots reference was long.
- Publication verification uses provider commands and headless media checks, not routine PR browser visits. Captured media still needs visual inspection. Bitbucket readback alone cannot establish image availability; that limitation is stated rather than hidden.
- The audit now allows edits to newly added text references, using current-source metadata while preserving original snapshots, saved revisions, and read-only variant/binary boundaries.

Validation: 21 existing rendered-GitHub verifier tests, 29 media/publication/materializer/installer tests, and 13 SQLite/API tests passed. The GitHub tests exercise local fixtures, not a live upload. TWG command help was checked locally; no remote PR was changed. Independent simulated exercises covered all eight changed profile prompts, read-only work, partial uploads with concurrent edits, and Bitbucket's format limits.

Backups: `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/proof-pack-rewrite.w6tzfI`. Targeted installation changes only PR Proof Pack and Writing for agents; the other 39 installed prompts in each harness remain unchanged.

## Remaining feedback applied

This follow-up updates all four model variants and preserves the originals and review history. The audit now labels deleted skills explicitly rather than showing an ordinary green review dot.

| Skill | Change |
| --- | --- |
| `parallel-slice-orchestration` | Deleted from the source and both installed harnesses. Its historical audit record remains available. |
| `design` | Removed vocabulary lookup; consolidated motion guidance; made prototype exploration less prescriptive. Removed the license reference from the reading path, retaining required upstream attribution in `LICENSE`. |
| `design-technical-diagrams` | Rewritten around automatic layout, readable labels, and actual export inspection. A new Graphviz helper sizes nodes/routes and rejects output that would make labels too small. |
| `feedback-hardening` | Shortened substantially while retaining independent recommendation, bound approval, drift checks, worker ownership, and cleanup. |
| `grill-with-docs` | A read-only command returns repository/worktree identity and matching repository/Obsidian paths. Repeated grounding instructions are inline; the user's ADR naming and unavailable-path edits are applied. |
| `openclaw-stg-test` | Shorter main prompt and browser guidance, direct bundled commands, synthetic-data boundary, and cleanup retained. No public tunnel was started. |
| `pr-proof-pack` | Short description and unambiguous bundled helper paths; category totals use the requested PR's resolved base/head. The user's completed proof-selection draft is now included in the writing pass above. |
| `review-flow-map` | Moved into `code-review/references/flow-map.md`, linked from code-review and cold review. The standalone skill is deleted. |
| `to-spec` | Applied the shortened user draft and frontend reference; naming now lives in the note template. |
| `to-tickets` | Applied the user draft; naming is in the main prompt. Removed the execution-contract reference and generic three-phase checklist; tickets describe their actual work and verification. |

Usage caveat: searching the existing local index found four session cards mentioning `review-flow-map`, including maintenance discussion and review reads. That is not an invocation count; there is no reliable total from this index.

Verification: 28 focused helper/materializer/installer tests and 12 audit persistence/API tests passed, alongside lint, skill-layout checks, typechecking, and Effect diagnostics. A generated 720px diagram was inspected visually: readable labels, no crossings or collisions in that example. Automatic layout is not a guarantee for every graph; the prompt still requires visual inspection.

Backups for this pass are in `/Users/jmerhi/.local/share/skill-review/f2a4e1b97f179282/remaining-feedback.4JqahU`, with separate SQLite backups in its parent. Finalized Handoff, Just Do It, and Session Recall audit records are untouched.

## Earlier tooling work

Implemented locally on 2026-09-05. No remote PR, comment, label, deployment, grade, or access change was performed.

| # | Improvement | What is available |
| --- | --- | --- |
| 1 | Video inspection and editing | `pr-proof-pack/scripts/proof-media` inspects dimensions/audio/duration, produces timestamped frames and a contact sheet, and cuts explicit intervals without speeding up or overwriting the original. |
| 2 | Screenshot comparison | The same helper makes a labeled before/after PNG. Different dimensions are rejected rather than silently resized. |
| 3 | Attachment publication bookkeeping | `proof-publication.mjs` preserves the PR baseline, draft, and asset hashes; detects head/body/title/asset drift; saves readbacks and remaining local references after partial failure. Native `gh --attach` still owns authorized publication. |
| 4 | Revision-bound skill application | `packages/skill-review/apply.mjs` prepares one exact ready revision, preserves its source, checks all four candidate variants, refuses intervening draft/source changes, applies locally, and supports guarded rollback. `install-skills --skill NAME` updates only selected skills. |
| 5 | Complete personal catalog | `--personal` adds the 13 personal skill names outside this repository, deduplicating names and real paths while excluding hidden/vendor caches. External owner paths remain visible. The live catalog retains all 57 records, including retired skills. |
| 6 | Bundled UI proof | `audit-layout.mjs` captures screenshots, console errors, and layout findings together for named route states and viewports, with an optional existing private Playwright storage-state file. |
| 7 | Saved review progress | The existing findings SQLite database now records revision-checked phase, pass, head, clean streak, and evidence events. Distinct started passes are required before clean results. This is bookkeeping, not an independent review attestation. |
| 8 | Bounded bot observation | ClawSweeper's read-only watcher checks the pinned head, exact bot login, and response time for up to 20 minutes. It returns candidates for classification, never automatic clean verdicts. Attempt counters persist in the findings database. |
| 9 | Cleanup inventory | A read-only command gathers native Git, process-cwd, and optional Compose-label evidence. Nothing is marked safe to delete; unknown ownership remains unresolved. |
| 10 | Reusable prototype picker | Copyable CSS/JS assets supply named variants, URL selection, keyboard shortcuts, optional replay, reduced-motion styling, and disposal. The old code-heavy reference is now short. |
| 11 | Diff-page generation | A command fills the existing annotated-diff design with revision-pinned Git file patches and digests. It is an explanatory draft: the agent still supplies behavioral explanations and inspects the rendered page. |
| 12 | Fewer tiny references | `diagnose`, `review-flow-map`, and `typescript-discipline` now carry their useful guidance in the main prompt. Eleven tiny references were removed; originals remain in audit history/backups. |
| 13 | Lightweight routine writing | The routine writing check is 237 words including metadata. The substantial rewrite/visual guidance is conditional, in one retained reference, rather than loaded for every ordinary final response. |
| 14 | Separate mutable data | Marking's dated cohort policies/state and maintainer roster prose were removed from the main prompts. Current owner records stay authoritative; historical blocks were preserved verbatim in private local files. |

## What was checked

- Repository lint, skill-layout lint, TypeScript, and Effect diagnostics.
- Targeted Node integration tests for media, publication bookkeeping, targeted installation, source apply/rollback, personal-source capture, bot freshness, cleanup inventory, and diff generation.
- SQLite/API tests for saving, recovery, original preservation, source additions/removals, and review progress.
- Real browser capture of two picker states at three widths: six screenshots, zero console errors, zero layout warnings/errors.
- Native-browser interaction checks for selection, keyboard switching, typing isolation, replay, and the audit's new read-only source files.
- Independent read-only exercises across all four prompt variants. These were behavior exercises, not executions by four different model families.
- Full before/after archive comparison preserved all 44 earlier original snapshots, 302 saved revisions, and the recovery record. Your new comments were retained too.
- Thirteen selected skills were installed for Codex/Astra and Claude/Fable. Thirty unselected installed skills in each view stayed unchanged. `just-do-it`, `session-recall`, and `handoff` audit records were untouched by this work.

A replay of the real saved navigation also exposed overlapping tabs. Their labels now keep their width and scroll instead of overlapping. That repair changes no draft/navigation data.

## Boundaries

- Remote upload/retry, live ClawSweeper completion, container teardown, grading, and access changes were not exercised. Their helpers were tested without performing those external actions.
- GitHub's read/edit sequence is not atomic. A fresh preflight and post-write reconciliation are still necessary; missing local references do not prove successful publication.
- The apply command handles one replacement, not automatic split/delete orchestration or joint source-and-two-harness transactions. The agent still plans splits/deletions, produces and exercises variants, then uses the targeted installer. Prior directories and views are backed up.
- The diff generator is a starting draft, not a finished explanation or a code-review result.
- New source files appear read-only in the audit; leave feedback in notes. Existing originals remain immutable, and nothing is applied just by marking it ready.

## Additional exploratory ideas

These were separate from the 14-item implementation list:

- **Pet resume/finalize:** the existing skill explicitly prefers reading its job manifest and calling the existing extraction, inspection, assembly, and validation scripts. No competing status/orchestration wrapper was added.
- **Upgrade checkpoints:** the owning upgrade workflow already requires exact pins, per-checkpoint evidence, and an unmodified final verdict. No parallel checkpoint database or fabricated runtime qualification was introduced.
- **Safe note creation:** the available native Obsidian writer already refuses existing files unless overwrite is explicit. A custom filesystem writer would duplicate that capability.
- **Feedback-hardening simplification:** left as its separate reviewed workflow rather than changing its approval/worker lifecycle protocol during this tooling implementation.

The skill-by-skill editorial review is still yours to finish. Standardizing that completed review into its own skill remains a separate final step, rather than declaring every skill reviewed now.
