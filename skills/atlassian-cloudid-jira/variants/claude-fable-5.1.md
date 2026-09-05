---
name: atlassian-cloudid-jira
description: Query Jira, JPD, and Confluence through local Rovo Dev MCP, including site IDs, JQL, CQL, and boards.
---

# Atlassian via Rovo Dev

Use the authenticated Rovo Dev gateway and state the intended Atlassian site.
Do not let local configuration silently choose another tenant.

1. Resolve the site and project, issue, space, or page from the request. Keep
   each query to one explicit site. Decide whether the request authorizes a
   read or a specific mutation; a draft is not permission to post or edit.
2. Prefer the harness's local Rovo-backed Atlassian MCP bridge. If unavailable,
   use the bundled read-only launcher:

   ```sh
   <skill-dir>/scripts/rovodev-atlassian \
     --site https://<workspace>.atlassian.net \
     "Search <project-key> with JQL and summarize the five newest issues"
   ```

   Use `acli rovodev legacy` directly only for a clearly authorized write or a
   request the launcher cannot express. Include the exact site and mutation.
   Do not use anonymous browsing for private Atlassian content.
3. Use JQL for Jira lists and CQL for Confluence lists. Request only needed
   fields and batch independent reads. Treat JPD `/ideas/view/...` URLs as board
   views: extract the project key and query JQL, not `get_jira_issue`.
4. Verify the actual site in the input or result before trusting an empty
   answer. For a write, state the exact site, issue/page key, and change, then
   use normal action-time confirmation when required. Perform only that mutation.
5. If a board URL fails as an issue, switch to project JQL. If no issues return,
   check `site_url` before revising JQL. On discovery `429`, wait once or use an
   already exposed bridge; do not loop. Ignore unrelated optional MCP startup
   failures if Atlassian tools started. For missing or unauthenticated
   `acli rovodev`, run read-only help/auth diagnostics and report the concrete
   problem. Never scrape tokens or cookies.
6. Return the result, identify live Jira/Confluence evidence, and include useful
   JQL/CQL. Mark copied source wording as quotations. During long work, update
   only when evidence, direction, or a blocker changes.

The launcher accepts one validated `--site https://*.atlassian.net` and a
plain-language read request. It forces read-only behavior, does not print
credentials, and intentionally provides no write mode.
