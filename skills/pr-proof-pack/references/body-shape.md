# PR Body Shape

## Contents

- [Default Shape](#default-shape)
- [Tables](#tables)
- [API And Backend Proof](#api-and-backend-proof)

Use the net diff as input, not as the PR description format. A good PR body
first tells the reviewer what behavior changed and why it matters, then points
to the smallest proof. Do not lead with a generic "Net Diff" table when it
would force the reader to translate implementation buckets into product or API
behavior.

## Default Shape

Prefer this structure for most backend, API, validation, data, and workflow
PRs:

````md
## Summary

<Two to four sentences in plain language. Name the behavior that changed, the
main affected surfaces, and the user/API effect. Avoid task shorthand.>

## What Changed

- <Surface or behavior>: <concrete before/after or new rule>.
- <Surface or behavior>: <concrete before/after or new rule>.

## Proof

Behavioral proof:

- <Concrete user action, API request/response, state transition, or data
  example>: shows <specific changed behavior>.
- <Concrete user action, API request/response, state transition, or data
  example>: shows <specific changed behavior>.

## Verification

Reviewer-checkable behavior:

- <Copy-paste command, request/response pair, screenshot state, or API example>
  demonstrates <specific changed rule>.

Automated checks:

- CI covers <test/check name or category>, or `<short command>` passed locally.
- Not run: <command or check>: <honest reason>, when applicable.
````

Use only sections that help review. Start from the description-first shape
above. Add optional sections only when they improve comprehension:

````md
## Summary
- ...

## What Changed
- ...

## Flow
```mermaid
...
```

## Proof
- ...

## Screenshots
| Screenshot | Claim Proved | URL / State | Viewport | Crop Choice |
| --- | --- | --- | --- | --- |
| ... | ... | ... | ... | ... |

## Verification
- Reviewer-checkable behavior.
- Automated checks.
````

Avoid separate `Net Diff`, `API Behavior Examples`, and `Review` sections unless
they add information a reviewer cannot get from `Summary`, `What Changed`,
`Proof`, and `Verification`. If you include review-loop evidence, state it as a
concise verification item and omit internal run labels, task codes, and
reviewer-process details that do not help assess the PR.

## Tables

Use tables only for real comparisons or matrices. The columns must represent
clear comparison axes such as `Before` / `After`, `Surface` / `Changed
behavior`, `Scenario` / `Without acknowledgement` / `With acknowledgement`, or
`Screenshot` / `Claim Proved` / `Viewport`.

If the content is just a list of facts, a sequence of proof items, or prose
arranged into columns, use bullets, short subsections, or collapsible
`<details>` blocks instead. Keep table cells short enough to scan; if a cell
needs multiple clauses, a list of files, or a long command, do not use a table.

## API And Backend Proof

For validation/API PRs, describe the changed contract instead of listing vague
"API behavior examples." Good: "Supplier create/update now rejects invalid
contact email or Australian phone numbers with `400` before persistence." Bad:
"Supplier create/update | Invalid contact email or contact phone number |
`400` validation failure."

For API and backend PRs, prefer behavioral verification over test inventory.
Include a minimal request and response, such as a `curl` command or JSON
request/response pair, for each important changed rule. Keep it copy-pasteable
when possible. If auth, fixture setup, or environment data prevents a real
copy-paste command, provide a representative request/response example and say
what fixture or role is needed.

Example:

````md
## Verification

Reviewer-checkable behavior:

Invalid supplier phone numbers now fail before supplier creation:

```sh
curl -i -X POST "$API_URL/suppliers" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  --data '{"name":"Acme","pointOfContactPhoneNumber":"+15555550123"}'
```

Expected response:

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "message": "Please enter a valid phone number"
}
```

Automated checks:

- CI runs the shared validation, contract/OpenAPI, and affected router tests.
````

Do not make `Proof` a list of test file names. Test files can support proof,
but the PR body should first explain the behavior those tests demonstrate. When
CI already runs the commands, summarize the relevant CI coverage in one or two
bullets instead of pasting the full local command list.

Avoid:

- tables used as layout for non-comparative prose, checklists, or proof
  inventory;
- tables whose columns do not make a clear comparison or matrix easier to
  understand;
- proof tables whose cells contain paragraphs, long file lists, or long
  commands;
- proof sections that are only a list of test files;
- verification sections that only paste CI-equivalent command lists;
- "API behavior examples" tables that restate `400` or happy-path outcomes
  without naming the concrete changed rule;
- raw review-loop sections that talk about Codex passes, subagent passes, Jira
  creation, or internal review labels instead of reviewer-relevant risk;
- raw terminal dumps or unwrapped command dumps in the PR body.
