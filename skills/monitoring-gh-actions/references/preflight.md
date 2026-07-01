# Preflight

Before watching:

1. Confirm `gh` is installed: `gh --version`
2. Confirm auth is valid: `gh auth status`
3. Identify what you are watching:
   - a PR's checks: use `gh pr checks`
   - a specific workflow run: use `gh run watch <run-id>`
   - if you do not yet know the run id, find it first with `gh run list` or
     `gh pr checks`

If `gh` is missing or unauthenticated, stop and tell the user.
