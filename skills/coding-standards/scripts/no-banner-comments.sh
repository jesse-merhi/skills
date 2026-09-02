#!/usr/bin/env bash
# Lint for decorative comment separators (// -----, // =====, # -----, etc.)
# These add noise without value. Use plain section comments instead.

set -euo pipefail

PATTERN='^(//|#) [-=]{10,}'
FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || git ls-files)

errors=0
while IFS= read -r file; do
  [[ "$file" =~ \.(ts|tsx|js|mjs|yaml|yml|sh)$ ]] || continue
  [[ "$file" =~ node_modules/ ]] && continue
  [[ "$file" =~ dist/ ]] && continue

  matches=$(grep -nE "$PATTERN" "$file" 2>/dev/null || true)
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
