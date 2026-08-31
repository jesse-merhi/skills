# Polling and freshness

Capture a **baseline timestamp** before the first trigger so you can distinguish
new Clawsweeper output from history:

```sh
gh pr view <pr> --json comments,reviews,headRefOid \
  --jq '{head: .headRefOid, last_comment: (.comments | last).createdAt, last_review: (.reviews | last).submittedAt}'
```

After triggering, monitor for Clawsweeper's response. Poll on a sane cadence:

- first 2 minutes: every ~20s
- after that: every ~60s

Each poll:

```sh
gh pr view <pr> --json comments,reviews \
  --jq '[(.comments[] | {kind:"comment", at:.createdAt, author:.author.login, body:.body}),
         (.reviews[]  | {kind:"review",  at:.submittedAt, author:.author.login, body:.body, state:.state})]
        | map(select(.at > $last_trigger_at and (.author | test("clawsweeper"; "i"))))'
```

A response is fresh only when:

- it is from Clawsweeper (login or app slug matches), and
- its createdAt/submittedAt is strictly after `last_trigger_at`, and
- the PR head SHA has not changed since `last_trigger_at`.

Stop polling only when at least one fresh response is present and Clawsweeper has
clearly finished. Look for a final summary comment or review submission, not
just an in-progress "working on it" reply.

## Recognising Clawsweeper's response

Clawsweeper may post as a regular issue comment or as a PR review. Watch both.
Match its identity loosely, such as a login containing `clawsweeper`, possibly
with a `[bot]` suffix. Do not match on the trigger comment itself.

A response is finished when one of these is true:

- A review is submitted (`reviews[].submittedAt` populated) with a clear
  verdict.
- A summary comment is posted that lists findings or explicitly states no
  findings.
- Clawsweeper's last message is not a transient "working on it", "queued", or
  "starting review" placeholder.

If you only see an in-progress placeholder, keep polling. Do not classify yet.

## Head-SHA discipline

Always re-check the PR head SHA when polling. If a new commit lands on the PR
after your trigger but before Clawsweeper finishes, Clawsweeper may be reviewing
the older tree.

In that case:

- Discard the in-flight response.
- Re-trigger `/clawsweeper re-review` against the new head.
- Restart the wait for that iteration.

Never count a re-review as clean when its `last_head_sha` does not match the
current PR head.

## Platinum-or-better label

After the third consecutive clean response, keep the same head pinned and wait
for Clawsweeper's label update:

```sh
gh pr view <pr> --json headRefOid,labels \
  --jq '{head: .headRefOid, labels: [.labels[].name]}'
```

Success requires the head to remain equal to `last_head_sha` and the labels to
contain exactly one of these PR ratings:

- `rating: 🐚 platinum hermit`
- `rating: 🦞 diamond lobster`
- `rating: 🦀 challenger crab`

A similarly named issue rating does not count. Label updates can lag the
review, so hold the wait within the workflow's wall-clock cap. Never add,
remove, or rewrite a rating label.

A later push invalidates the clean streak and rating observation even when
GitHub has not removed the old label yet. Re-trigger the workflow for the new
head.
