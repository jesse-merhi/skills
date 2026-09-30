#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  cat <<'HELP'
Usage: bash scripts/cloud/setup.sh

Prepare a cloud VM with Node 24, the Bun version from package.json, and
dependencies from bun.lock. Missing or mismatched tools are installed globally
through npm; installation failures stop setup.

Claude: the repository's SessionStart hook runs this only in cloud sessions.
Codex: use "bash scripts/cloud/setup.sh" for installation and dependency refresh.
After setup, use the repository's normal Bun commands for checks and development.
HELP
  exit 0
fi

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

package_manager="$(node -p 'require("./package.json").packageManager')"
case "$package_manager" in
  bun@*) bun_version="${package_manager#bun@}" ;;
  *) echo "Cloud setup requires a Bun packageManager pin in package.json." >&2; exit 1 ;;
esac

tools=()
if [[ "$(node -p 'process.versions.node.split(".")[0]')" != "24" ]]; then
  tools+=("node@24")
fi
if command -v bun >/dev/null 2>&1; then
  installed_bun="$(bun --version)"
  if [[ "$installed_bun" != "$bun_version" ]]; then
    tools+=("$package_manager")
  fi
else
  tools+=("$package_manager")
fi
if [[ "${#tools[@]}" -gt 0 ]]; then
  # Claude's base image already has Node symlinks; npm must replace them.
  npm install --global --force --no-audit --no-fund "${tools[@]}"
  hash -r
fi

node --version
bun --version
bun install --frozen-lockfile
