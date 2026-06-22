---
name: supply-chain-security-pass
description: 'Review PRs or diffs that touch CI, GitHub Actions, dependencies, lockfiles, publishing, scripts, generated files, secrets, permissions, or code execution.'
---

# Supply Chain Security Pass

Run this as a separate pass from functional review. The question is not "does the feature work?" but "did this diff change who or what can execute code, fetch dependencies, access secrets, publish artifacts, or trust external inputs?"

## High-Risk Surfaces

Inspect these carefully when changed:

- `.github/workflows/**`, reusable workflows, custom actions, action pins, permissions, secrets, environments
- package manifests and lockfiles: `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `Cargo.lock`, `go.sum`, `requirements*.txt`, `uv.lock`
- install/build/release/publish scripts, Dockerfiles, Makefiles, shell scripts, postinstall hooks
- dependency source changes: registry, git URL, tarball URL, local path, override, patch, resolution
- generated, vendored, minified, binary, or checked-in tool output
- code that reads secrets, tokens, credentials, cookies, auth headers, signing keys, or private env vars
- permissions, sandbox, allowlist, approval, auth, routing, webhook, or callback code
- downloads, extraction, subprocess execution, dynamic import/eval, plugin loading, templates, codegen

## Review Steps

1. Identify changed trust boundaries.
   Ask what new actor, network source, token, file, process, package, or runtime path is now trusted.

2. Compare intent to surface area.
   A small bugfix should not quietly change CI permissions, add lifecycle hooks, replace dependency sources, or broaden secret access.

3. Inspect pins and provenance.
   Prefer immutable SHAs for GitHub Actions and trusted registries for packages. Treat branch/tag action refs, curl-piped scripts, tarballs, and git dependencies as review-worthy until provenance is clear.

4. Trace secret exposure.
   Check whether secrets are printed, passed to untrusted steps, exposed to forked PRs, written to artifacts, included in cache keys, or sent to third-party actions/services.

5. Check install and execution paths.
   Look for new preinstall/postinstall scripts, shell expansion, unquoted variables, downloaded executables, archive extraction paths, and command construction from external input.

6. Validate lockfile coherence.
   Lockfile changes should match manifest changes. Unexpected transitive churn, registry drift, integrity drift, or new packages with install scripts deserve explanation.

7. Decide if the concern is actionable.
   Use `finding-discipline`: report only concrete exploit, privilege, provenance, reproducibility, or supply-chain failure modes.

## Useful Commands

```sh
git diff --name-status <base>...HEAD
git diff <base>...HEAD -- .github package.json pnpm-lock.yaml package-lock.json yarn.lock
rg -n "permissions:|secrets\\.|GITHUB_TOKEN|pull_request_target|workflow_run|curl|wget|bash|sh|postinstall|preinstall|npm publish|docker login|eval|Function\\(" .
rg -n "token|secret|credential|private key|api[_-]?key|authorization|cookie" .
```

For dependency changes, use the repo's package manager first. If current package metadata or advisories affect the answer, look them up from primary sources and cite them.

## Finding Patterns

Report concrete issues like:

- workflow changes from `pull_request` to `pull_request_target` while running untrusted checkout code
- broadened `GITHUB_TOKEN` permissions without need
- third-party action changed from pinned SHA to mutable tag
- secret passed into a step controlled by forked PR content
- new install script or downloaded executable without provenance
- lockfile changes unrelated to manifest changes
- dependency source changed from registry package to git/tarball URL
- release/publish path can run from the wrong branch, tag, actor, or event
- generated/vendor artifact differs from source without reproducible generation path

Do not report vague "supply chain risk" without showing the exact trust expansion and likely consequence.

## Output Shape

Use:

- `Changed Trust Boundaries`: what can now execute/access/fetch/publish.
- `Checked Surfaces`: files and commands inspected.
- `Findings`: concrete actionable issues, if any.
- `Cleared`: risky-looking changes that are acceptable and why.
- `Residual Risk`: only limitations that matter to approval.
