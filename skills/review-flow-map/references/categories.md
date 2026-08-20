# Change categories

Classify changed files by behavior category. Use categories that match
behavior, not directory order:

- entrypoint: route, CLI command, job, handler, workflow, screen, public API
- contract: schema, type, protocol, config, permission, env var, API response
- state: persistence, cache, query key, reducer, lifecycle, migration
- side effect: network, file system, subprocess, queue, notification, telemetry
- presentation: UI component, copy, styles, generated output
- validation: tests, fixtures, mocks, docs that define expected behavior
- supply chain: workflow, package manifest, lockfile, install/build/release
  script

For rendered frontend UI, include viewport/state proof in validation targets
with `frontend-ui-validation`.

If the diff includes CI, dependency, publishing, generated/vendor, permission,
secret-handling, or code-execution changes, call those out explicitly in the
changed-file map.
