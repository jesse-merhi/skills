---
name: pr-proof-pack
description: Create or check concise reviewer-visible PR context and practical proof when an authorized workflow publishes an update or prepares it for merge. Lead with what broke and how it is fixed, use actual product screenshots for static UI changes and recordings for motion or manual interaction, keep technical diagrams as separate system explanations, break down large changes by direct-base +LOC and -LOC, and prefer copyable text for textual behavior.
---

# PR proof pack

Check whether the existing PR still tells the truth. Refresh only stale or
missing proof, under the caller's publication authority. This skill grants no
push, PR-edit, or upload permission. Local edits, commits, rebases, findings,
and tests do not trigger reviewer-visible proof work.

1. Check proof for PR creation/publication/reopening/conversion/readiness,
   authorized pushed updates, and merge preparation. A push is a freshness
   trigger, not a rewrite command. For a stack, check each affected layer against
   its direct base and record position/adjacent dependencies.
2. Resolve `<skill-dir>`, provider, exact PR/head/base, and existing body/title/proof.
   GitHub uses `gh pr view --json number,url,body,title,baseRefName,headRefName,headRefOid`.
   For stacks load `gh-stack` and inspect `gh stack view --json`. For Bitbucket
   Cloud follow [bitbucket.md](references/bitbucket.md), explicitly resolving
   workspace/repository/PR and read-only TWG metadata. Batch independent reads.
3. Run `<skill-dir>/scripts/pr-net-diff --markdown`, optionally for narrow files.
   Bitbucket requires its resolved destination/source hashes as `--base`/`--head`.
   Judge direct-base-to-final-head net change, not the latest commit or chat history.
   Exclude churn absent from the net diff. Preserve exact nonoverlapping `+LOC`/
   `-LOC` rows for multi-part/large PRs, counting every file once and reconciling totals.
4. Classify freshness. `current` means title, opening problem/fix context,
   claims, reproduction, states, and appropriately formatted evidence still
   match. `stale` means an important behavior/premise/state/viewport/workflow/
   reproduction/claim changed, required proof/diagram is missing, or its format
   is harder to understand than a simpler one. `blocked` means it cannot be
   verified. Commit count/SHA/churn/push alone is not stale. For current proof,
   report why and stop without mutation.
5. For stale proof, preflight required capabilities. On github.com check
   `gh auth status --active --hostname github.com`; visual refresh needs gh ≥2.99.0.
   Rendered-media checks need curl ≥8.4 to enforce limits without Content-Length;
   the verifier preflights it. Identify browser/device needs, but do not require
   interactive browsing for ordinary GitHub upload/headless readback or attachments
   for text-only proof. Bitbucket follows the reference and live TWG help;
   TWG/Atlassian skills are optional. Its visual readback requires interactive
   inspection, while text-only does not. Stop and name the capability the human
   must restore if a required gate fails.
6. Read [proof-selection.md](references/proof-selection.md). Reproduce only the
   changed practical behavior and preserve current useful evidence. Use copyable
   text for input/output/traces/requests/responses/state. Direct-base reproducible
   bugs need matched broken/fixed results labeled `Before: direct base` and
   `After: PR`. Static UI requires actual product screenshots matched to meaningful
   reproducible baselines; motion/timing/gesture/manual interaction requires
   concise edited recording; mixed claims require both. If no meaningful baseline
   exists, explain it and show actual entrypoint/outcome. Textual labels/accessibility
   output use text when appearance is not the claim. Read
   [screenshots.md](references/screenshots.md) for visuals and
   [video-editing.md](references/video-editing.md) for recordings. Inspect every
   selected visual, choose deliberate sizes, and group related comparisons.
7. For introduced/materially changed systems/workflows, load `design-technical-diagrams`
   and make one end-to-end diagram by default. Define its question, with the PR
   body as destination and net diff/repo behavior as brief. Show recognizable
   trigger, real actors/systems, ordered atomic actions, decisions, handoff
   state/artifacts, and outcome/feedback. Number steps when order matters, use
   icons to orient, define terms, and avoid file/function buckets or multi-action
   boxes. Export a static PR-sized image and inspect whole frame, destination
   size, close detail, and export. Read [mermaid.md](references/mermaid.md) if
   considering a small flow. Diagram explanation never replaces practical UI/
   runtime proof; only a changed diagram product's own pixels may prove its output.
8. Use [plain-language.md](references/plain-language.md) and
   [body-shape.md](references/body-shape.md) to draft the smallest update. Keep
   true sections. Assume no private thread/planning context. First two sentences
   explain the break/importance, next two the fix/outcome. Keep the reconciled
   breakdown and body budget, justifying exceptions. Review title/commit subjects.
   Preserve and label source quotations. Immediately before saving, load
   `speak-fking-english` for reviewer-facing text; use its compact pass unless
   explicitly invoked for the artifact.
9. Check caller authority. For a diagram or visual evidence, read
   [screenshots.md](references/screenshots.md) before upload.
   Immediately reread GitHub head/body and compare to
   the initial snapshot; restart freshness on either change. Include every
   selected local media reference in the complete draft, then upload with the body:

   ```sh
   gh pr edit <full-PR-URL-resolved-in-step-2> \
     --body-file <draft-markdown-path> \
     --attach <first-media-path> \
     --attach <second-media-path>
   ```

   Repeat attachment flags for all files. Keep provider-hosted evidence in the
   main PR body, never a detached comment. On partial failure use the live body
   as retry draft and upload only remaining local references. Before returning
   blocked, remove broken refs or restore the last fully hosted body. Bitbucket
   uses one `twg bb pull-requests update` with full `--description-file`, each
   image's `--image` and descriptive `--image-name`; video is unsupported. Text
   proof needs no attachment.
10. Inspect the finished GitHub title/body and run the headless verifier:

    ```sh
    <skill-dir>/scripts/github-verify-rendered-proof --pr <full-PR-URL-resolved-in-step-2> --head <final-head-SHA-resolved-in-step-2>
    ```

    Require expected head, all rendered asset statuses/types/nonempty bytes,
    and exact byte sizes for new uploads. It reads `body_html` without printing
    signed URLs and fetches assets without the gh token. Use an interactive
    browser for client-rendered Mermaid, literal layout/pixels, percentage sizing,
    table composition, or playback. Inspect diagram export and fetched asset
    visually. Bitbucket requires TWG head/title/body/embed readback plus interactive
    rendered-media pixels. Remove stale proof instead of accumulating it.
11. Return `current`, `refreshed`, or `blocked` with affected PRs and meaningful
    evidence/capability limits. Remind the caller to apply each layer's exact-head
    Review and persistent PR Sign-off gates before readiness/sign-off/merge.
    Proof is not review. Tests and CI support observed practical evidence, never replace it.

During long work, report new evidence, changed proof plans, or blockers. Finish
only when the actual required proof and rendered readback pass, or name the blocker.
