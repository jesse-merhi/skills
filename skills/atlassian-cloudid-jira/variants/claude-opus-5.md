---
name: atlassian-cloudid-jira
description: Query Jira, JPD, and Confluence through local Rovo Dev MCP, including site IDs, JQL, CQL, and boards.
---

# Atlassian via Rovo Dev

Return the requested Atlassian answer or perform the specifically authorized
mutation through authenticated Rovo Dev. Keep routine discovery in this session,
request only needed fields, and avoid a running account of each lookup.

Resolve the site and project, issue, space, or page. Scope every query to one
explicit site, including multi-site requests. Prefer an exposed local Rovo-backed
Atlassian MCP bridge; otherwise use:

```sh
<skill-dir>/scripts/rovodev-atlassian \
  --site https://<workspace>.atlassian.net \
  "Search <project-key> with JQL and summarize the five newest issues"
```

This launcher accepts one validated `--site https://*.atlassian.net` and a
plain-language read request, forces read-only behavior, prints no credentials,
and has no write mode. Use `acli rovodev legacy` directly only for an expressly
authorized write or a request the launcher cannot express, naming the exact site
and mutation. Do not use anonymous browsing for private content.

For reads, use Jira JQL or Confluence CQL and verify the tenant before accepting
an empty result. JPD `/ideas/view/...` URLs identify views, not issues: derive
the project key and use JQL instead of `get_jira_issue`. For writes, state the
exact site, key, and change, retaining required action-time confirmation. Drafting
never authorizes comments, issue creation, or field edits.

Fold failure checks into the lookup: a board-as-issue error calls for project
JQL; no issues calls for checking `site_url` before changing JQL; discovery `429`
calls for one wait or an already exposed bridge, not repeated retries. Ignore
unrelated optional MCP failures if Atlassian tools started. Diagnose missing or
unauthenticated `acli rovodev` with read-only help/auth checks; report the problem
without scraping cookies or tokens.

Finish with a concise result, whether live Jira/Confluence was consulted, and
useful reproducible JQL/CQL. Do not add unrelated mutations or a verifier team.
