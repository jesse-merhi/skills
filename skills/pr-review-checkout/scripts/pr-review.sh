#!/usr/bin/env bash
set -euo pipefail

forward_cli=false
for argument in "$@"; do
  case "$argument" in
    --help|-h|--version|-v|--wizard|--completions|--log-level)
      forward_cli=true
      ;;
  esac
done

if [[ "$forward_cli" == true ]]; then
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  exec node "$script_dir/../src/bin.ts" "$@"
fi

if [[ $# -ne 1 ]]; then
  echo "usage: pr-review.sh <pr-number>" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$script_dir/../src/bin.ts" -- "$1"
