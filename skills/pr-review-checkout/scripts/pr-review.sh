#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: pr-review.sh <pr-number>" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
case "$1" in
  --help|-h|--version|-v)
    exec node "$script_dir/../src/bin.ts" "$1"
    ;;
  *)
    exec node "$script_dir/../src/bin.ts" -- "$1"
    ;;
esac
