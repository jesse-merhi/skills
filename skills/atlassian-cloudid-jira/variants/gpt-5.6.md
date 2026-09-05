---
name: atlassian-cloudid-jira
description: Query Jira, JPD, and Confluence through local Rovo Dev MCP, including site IDs, JQL, CQL, and boards.
---

# Atlassian via Rovo Dev

Complete the requested Jira, JPD, or Confluence operation through the user's
authenticated Rovo Dev gateway. Name the intended site explicitly on every
query so an unrelated configured tenant cannot supply the answer.

Prefer an exposed local Rovo-backed Atlassian MCP bridge. Otherwise use the
read-only launcher:

```sh
<skill-dir>/scripts/rovodev-atlassian \
  --site https://<workspace>.atlassian.net \
  "Search <project-key> with JQL and summarize the five newest issues"
```

Use `acli rovodev legacy` directly only for an expressly authorized write or a
request the launcher cannot express. Put the exact site and mutation in the
prompt. Do not browse anonymously for private content.

Resolve site and project, issue, space, or page identifiers. Keep multiple sites
in separate explicitly scoped queries. Use JQL for Jira lists and CQL for
Confluence lists, requesting only needed fields. A JPD `/ideas/view/...` URL is
a board view: derive its project key and query JQL, never send it to `get_jira_issue`.
Before trusting an empty result, verify the actual input/result site.

Discovery is read-only. A requested draft does not authorize comments, issue
creation, or field edits. For a requested mutation, resolve and state the exact
site, key, and change and use normal action-time confirmation when required.

Recover based on the observed failure: wrong board URL → project JQL; no issues
→ inspect `site_url` before changing JQL; discovery `429` → wait once or use an
already exposed bridge, not a retry loop. Ignore an unrelated optional MCP
failure when Atlassian tools started. For missing/unauthenticated `acli rovodev`,
use read-only help/auth diagnostics and report the setup problem; never scrape
cookies or tokens.

Report whether results are live and include useful JQL/CQL. The launcher accepts
one validated `--site https://*.atlassian.net` plus a plain-language read request,
forces read-only access, prints no credentials, and has no write mode.
