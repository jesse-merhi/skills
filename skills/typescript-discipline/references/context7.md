# Remote Context7 documentation

Context7 is an optional remote MCP documentation service. Use it only through
the Context7 tools exposed by the current agent session.

## Lookup flow

1. Resolve the library name with Context7's `resolve-library-id` tool.
2. Query the returned library ID with `query-docs` and a focused question.
3. Use the installed dependency version from `package.json` to choose the
   relevant documentation result.

The presence of a Context7 entry in a configuration file is not proof that the
agent can call it. A successful lookup must appear as an actual Context7 tool
call in the current session.

## If Context7 is unavailable

Do not install or start `@upstash/context7-mcp`, a local wrapper, or another
local MCP helper as a fallback. Do not add MCP configuration or credentials to
the repository. Use the library's official documentation or the installed
package source and state that Context7 was unavailable.

Never print, copy, commit, or paste Context7 API keys, OAuth tokens, or other
authentication headers.
