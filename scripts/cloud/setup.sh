#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  cat <<'HELP'
Usage: bash scripts/cloud/setup.sh

Prepare a cloud VM with Node 24, the Bun version from package.json, and
dependencies from bun.lock. Missing or mismatched tools are installed through npm
in .codex/tools, with npm and Bun caches there. Explicit npm_config_prefix,
npm_config_cache, and BUN_INSTALL_CACHE_DIR overrides are respected.
Installation failures stop setup.

Claude: the SessionStart hook runs this only in cloud sessions. Successful setup
adds activation to CLAUDE_ENV_FILE when available for subsequent Bash commands.
Other cloud shells: run setup, then source scripts/cloud/env.sh in each shell
before using the repository's normal Bun commands for checks and development.
HELP
  exit 0
fi

cd "$(dirname "${BASH_SOURCE[0]}")/../.."
# shellcheck source=scripts/cloud/env.sh
source scripts/cloud/env.sh
mkdir -p "$npm_config_prefix" "$npm_config_cache" "$BUN_INSTALL_CACHE_DIR"

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
  # An explicitly supplied prefix may already contain runtime symlinks.
  npm install --global --force --no-audit --no-fund "${tools[@]}"
  hash -r
fi

node --version
bun --version
bun install --frozen-lockfile

if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
  printf 'source %q\n' "$PWD/scripts/cloud/env.sh" >> "$CLAUDE_ENV_FILE"
fi
