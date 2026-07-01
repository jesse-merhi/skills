# Query Strategy

Use the words the user or agent likely typed, not a perfect summary. Good query
terms include:

- product or repo names: `sample-app`, `agent-session-find`
- visible feature words: `export ui`, `mobile build`, `database restore`
- error text or symbols: `missing_symbol`, `No such file`
- workflow labels: `code review`, `test-audit`, `installer`
- delegation labels: `handoff`, `worker`, `subagent`, `PR 505`, `branch`
- file or command fragments: `Cargo.toml`, `install.sh`, `bun run check`

Run two or three short searches instead of one long paragraph. Keep exact
phrases for rare terms and use broader words for fuzzy recall.

## Widening

If nothing matches:

- increase `--index-since`
- remove `--cwd`
- try synonyms
- omit `--max-sources` for a fuller local refresh

If the relevant work happened in another harness, prefer its native local
history or a configured `agent-session-find` source for that harness before
asking the user to reconstruct context from memory.
