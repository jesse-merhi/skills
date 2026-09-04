---
name: atlassian-cloudid-jira
description: Query Jira, JPD, and Confluence through local Rovo Dev MCP, including site IDs, JQL, CQL, and boards.
---

# Atlassian via Rovo Dev

Resolve the user's Atlassian request through authenticated Rovo Dev, with the
intended tenant explicit. Use the request and authenticated discovery to settle
the site and target; ask only when the intended target remains ambiguous.

## Select the permitted operation

Discovery remains read-only. A draft request does not authorize posting comments,
creating issues, or editing fields. For a requested write, resolve and state the
exact site, issue/page key, and change, retaining required action-time confirmation.
Carry already-authorized operations through without another generic permission round.

Prefer the exposed local Rovo-backed Atlassian MCP bridge. Otherwise run:

```sh
<skill-dir>/scripts/rovodev-atlassian \
  --site https://<workspace>.atlassian.net \
  "Search <project-key> with JQL and summarize the five newest issues"
```

The launcher validates one `--site https://*.atlassian.net`, accepts a plain-language
read request, forces read-only access, and does not print credentials. It has no
write mode. Direct `acli rovodev legacy` is reserved for a specifically authorized
write or a request the launcher cannot express; include the exact site and mutation.

## Establish a trustworthy answer

Keep each query scoped to one explicit site. Use JQL for Jira lists and CQL for
Confluence lists with only required fields. Derive the project from JPD board-view
URLs and query JQL; `/ideas/view/...` is not input for `get_jira_issue`.
An empty result is meaningful only after the tool input/result confirms the site.

Recover from the actual failure: switch misidentified board URLs to project JQL;
check `site_url` before altering an empty query; on discovery `429`, wait once or
use an already exposed local bridge. Ignore an optional unrelated MCP failure
if the Atlassian tools started. For absent or unauthenticated `acli rovodev`,
perform read-only help/auth diagnostics and report the setup problem. Never
scrape tokens/cookies or anonymously browse private content.

Return the supported result, say whether it came from live Jira/Confluence, and
include JQL/CQL when it makes the lookup reproducible.
