---
name: atlassian-queries
description: 'Query Jira, JPD, and Confluence using authenticated Atlassian tools.'
---

# Atlassian queries

Use the available direct Atlassian MCP tools, naming the intended site on every request. Discover the supported operation when needed, then call the relevant search or read tool. If direct tools are unavailable, report what is missing.

Use the bundled Rovo-agent launcher only when explicitly requested; it adds another agent session rather than calling the tool directly:

```sh
rovodev-atlassian --site https://<workspace>.atlassian.net "Find the five newest issues in <project-key>"
```

Use JQL for Jira and JPD, CQL for Confluence. A JPD `/ideas/view/...` URL is a board: extract its project and query JQL rather than treating it as an issue. Verify the returned site before trusting an empty result.

Choose read operations for read tasks. Neither a generic MCP dispatcher nor the launcher's prompt enforces read-only access. If enforcement is required, confirm existing provider-side restrictions; changing permissions requires authorization. For an explicitly requested write, use an exposed tool with the exact site, item, and mutation. A request for a draft is not permission to publish it.

On failure, inspect the reported site or authentication problem first. For a discovery 429, wait once or use an already available bridge. Leave credentials with the authenticated tools.

Return the useful results, their links, and the query when it helps reproduce them.
