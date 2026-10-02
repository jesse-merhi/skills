#!/usr/bin/env bash
# Source this file in each cloud shell; setup cannot export into its parent.
cloud_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export npm_config_prefix="${npm_config_prefix:-$cloud_root/.codex/tools}"
export npm_config_cache="${npm_config_cache:-$npm_config_prefix/npm-cache}"
export BUN_INSTALL_CACHE_DIR="${BUN_INSTALL_CACHE_DIR:-$npm_config_prefix/bun-cache}"
export PATH="$npm_config_prefix/bin:$PATH"
unset cloud_root
