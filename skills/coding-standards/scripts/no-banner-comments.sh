#!/usr/bin/env bash
# Lint for decorative comment separators (// -----, // =====, # -----, etc.)
# These add noise without value. Use plain section comments instead.

set -euo pipefail

PATTERN='^[[:space:]]*(//|#)[[:space:]]*[-=]{10,}[[:space:]]*$'

# Default: every tracked file. `--staged` limits the scan to the files staged for commit.
MODE="${1:-tracked}"
if [ "$MODE" = "--staged" ]; then
  FILES=$(git diff --cached --name-only --diff-filter=ACM)
else
  FILES=$(git ls-files)
fi

errors=0
while IFS= read -r file; do
  [[ "$file" =~ \.(yaml|yml|sh)$ ]] || continue
  [[ "$file" =~ node_modules/ ]] && continue
  [[ "$file" =~ dist/ ]] && continue

  if [ "$MODE" = "--staged" ]; then
    content=$(git show ":$file" 2>/dev/null || true)
  else
    content=$(cat "$file" 2>/dev/null || true)
  fi
  matches=$(printf '%s\n' "$content" | grep -nE "$PATTERN" || true)
  if [ -n "$matches" ]; then
    while IFS= read -r match; do
      echo "ERROR: $file:$match — decorative comment separator"
      errors=$((errors + 1))
    done <<< "$matches"
  fi
done <<< "$FILES"

if [ "$errors" -gt 0 ]; then
  echo ""
  echo "$errors decorative comment separator(s) found. Use plain '// Section name' instead."
  exit 1
fi
