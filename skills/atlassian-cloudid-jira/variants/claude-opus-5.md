---
name: atlassian-cloudid-jira
description: Query Jira, JPD, and Confluence through local Rovo Dev MCP, including site IDs, JQL, CQL, and boards.
---

# Atlassian via Rovo Dev

Perform the requested Atlassian operation only on the explicitly resolved site
and through the authenticated Rovo Dev path below. Before the first gateway
call, name the site and operation in one short line. Update the user only for a
site ambiguity, permission boundary, write decision, or partial result.

Return the requested records or mutation result with useful keys, site context,
and source links; omit raw payload fields the user does not need. Keep created
Jira or Confluence content to the requested template and length. Use the
workflow's lookup or readback evidence for the claim being made, without an
unrelated verification sweep. Keep this gateway work in the current session;
do not delegate it.

Route Atlassian work through the user's authenticated Rovo Dev gateway. Always
name the intended site explicitly; the CLI may otherwise inherit an unrelated
default Jira site.

## Choose the gateway

1. Prefer a harness-provided local Rovo-backed Atlassian MCP bridge when it is
   available. It is the same authentication path with less agent overhead.
2. Otherwise run the bundled read-only launcher:

   ```sh
   <skill-dir>/scripts/rovodev-atlassian \
     --site https://<workspace>.atlassian.net \
     "Search <project-key> with JQL and summarize the five newest issues"
   ```

3. Use `acli rovodev legacy` directly only for an explicitly authorized write
   or when the launcher cannot express the request. Put the exact site and
   mutation in the prompt.

Do not fall back to anonymous browsing for private Atlassian content.

## Read workflow

1. Extract the site URL and project, issue, space, or page identifiers from the
   request. If the user supplies more than one site, keep each query scoped to
   one explicit site.
2. For Jira lists, use JQL. For Confluence lists, use CQL. Ask the gateway to
   return only the fields needed for the task.
3. Treat Jira Product Discovery board-view URLs as views, not issues. Derive the
   project key from the URL and search it with JQL; never pass `/ideas/view/...`
   to `get_jira_issue`.
4. Verify the tool input or result names the intended site before trusting an
   empty result. A successful query against the wrong tenant is still wrong.
5. Report whether the answer came from live Jira/Confluence and include the JQL
   or CQL when it helps the user reproduce the lookup.

## Writes

Keep discovery read-only unless the user clearly asks for a mutation. Before a
write, resolve and state the exact site, issue/page key, and change. Never post
comments, create issues, or edit fields merely because the user asked for a
draft. Use the harness's normal action-time confirmation when it is required.

## Failure recovery

- If the gateway says a board-view URL is not a Jira issue, switch to JQL using
  the project key.
- If a query returns no issues, inspect the actual `site_url` before changing
  the JQL. Rovo Dev can inherit a different site from local config.
- If Atlassian MCP tool discovery returns `429`, stop retrying in a loop. Wait
  once or use an already-exposed local Rovo-backed bridge.
- Ignore failure of an unrelated optional MCP server when the Atlassian MCP
  tools themselves started successfully.
- If `acli rovodev` is missing or unauthenticated, run its read-only help/auth
  diagnostics and report the concrete setup problem. Do not scrape browser
  cookies or tokens.

## Launcher contract

`scripts/rovodev-atlassian` accepts one `--site https://*.atlassian.net` and a
plain-language read request. It validates the site, forces read-only behavior,
and invokes the Rovo Dev Atlassian MCP gateway without printing credentials.
It intentionally has no write mode.
