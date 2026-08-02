#!/usr/bin/env bash
# Open a GitHub PR for local-backed review in VS Code.
# Reuse an existing branch worktree or create a throwaway review worktree.
# Usage: pr-review.sh <pr-number>
set -euo pipefail

PR="${1:-}"
if [[ -z "$PR" ]]; then
  echo "usage: pr-review.sh <pr-number>" >&2
  exit 2
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

meta="$(gh pr view "$PR" --json headRefName,baseRefName,url,isCrossRepository)"
branch="$(printf '%s' "$meta" | python3 -c 'import json,sys;print(json.load(sys.stdin)["headRefName"])')"
base="$(printf '%s' "$meta" | python3 -c 'import json,sys;print(json.load(sys.stdin)["baseRefName"])')"
url="$(printf '%s' "$meta" | python3 -c 'import json,sys;print(json.load(sys.stdin)["url"])')"
cross="$(printf '%s' "$meta" | python3 -c 'import json,sys;print(json.load(sys.stdin)["isCrossRepository"])')"

wt_path="$(git worktree list --porcelain \
  | awk -v b="refs/heads/$branch" '
      /^worktree /{p=substr($0,10)}
      $0=="branch "b{print p}')"

created="no"
if [[ -z "$wt_path" ]]; then
  wt_path="$repo_root/.worktrees/pr-$PR"
  echo "No worktree bound to '$branch' — creating a review worktree at:"
  echo "  $wt_path"
  git fetch --quiet origin "$branch" || git fetch --quiet origin "pull/$PR/head:$branch" || true
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    git worktree add "$wt_path" "$branch"
  else
    git worktree add "$wt_path" -b "$branch" --track "origin/$branch"
  fi
  created="yes"
else
  echo "Reusing existing worktree for '$branch':"
  echo "  $wt_path"
fi

mergebase="$(git -C "$wt_path" merge-base "origin/$base" HEAD 2>/dev/null || echo "$base")"

echo
echo "PR #$PR  ($url)"
echo "branch : $branch"
echo "base   : $base   (cross-repo: $cross)"
echo
echo "Changed files (net diff vs $base):"
git -C "$wt_path" diff --stat "$mergebase"...HEAD || true
echo
echo "Review in the opened VS Code window:"
echo "  • Open the dedicated GitHub Pull Request activity view."
echo "  • Under 'Changes in Pull Request #$PR', click a filename to open its diff."
echo "  • Navigate from the modified/right pane with Cmd-click, F12, or Shift+F12."
echo "  • Use the general GitHub/Octocat view only to discover PRs and issues."
echo "  • A locked tab or 'Partial mode' means the wrong remote-preview surface is open."
if [[ "$created" == "yes" ]]; then
  echo
  echo "When done reviewing this foreign PR, remove the throwaway worktree:"
  echo "  git worktree remove \"$wt_path\""
fi
echo

code "$wt_path"
