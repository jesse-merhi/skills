# Review and validation

Review Claude's diff yourself:

- protect user changes
- reject unrelated edits
- check for design anti-patterns
- send concrete findings back through a fresh `claude exec` when Claude should
  fix its own work

Validate with the normal frontend proof:

- run the app or static server
- run `frontend-ui-validation`
- check mobile, tablet, and desktop widths
- verify console errors and horizontal overflow
