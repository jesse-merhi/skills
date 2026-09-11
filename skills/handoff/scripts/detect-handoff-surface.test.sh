#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fixture_dir="$(mktemp -d)"
trap 'rm -rf "$fixture_dir"' EXIT

cat >"$fixture_dir/ps" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "123 1 ${SURFACE_TEST_CHAIN:-/bin/zsh}"
EOF
cat >"$fixture_dir/tmux" <<'EOF'
#!/usr/bin/env bash
[[ "${SURFACE_TEST_TMUX_VALID:-0}" == "1" ]] || exit 1
if [[ "$1" == "display-message" ]]; then
  printf '$7:\n'
else
  printf '%s\n' "$@" > "$SURFACE_TEST_LOG"
fi
EOF
cat >"$fixture_dir/pgrep" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
cat >"$fixture_dir/codex" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
cp "$fixture_dir/codex" "$fixture_dir/claude"
chmod +x "$fixture_dir/ps" "$fixture_dir/tmux" "$fixture_dir/pgrep" "$fixture_dir/codex" "$fixture_dir/claude"

assert_surface() {
  local expected="$1"
  shift
  local actual
  actual="$(env -u TMUX -u TMUX_PANE -u CODEX_THREAD_ID \
    PATH="$fixture_dir:/usr/bin:/bin" "$@" \
    "$script_dir/detect-handoff-surface" | sed -n 's/^surface=//p')"
  if [[ "$actual" != "$expected" ]]; then
    echo "expected surface=$expected, got surface=$actual" >&2
    exit 1
  fi
}

assert_surface tmux env TMUX=/tmp/tmux TMUX_PANE=%4 SURFACE_TEST_TMUX_VALID=1
assert_surface codex-app env CODEX_THREAD_ID=thread-1 SURFACE_TEST_CHAIN=/Applications/ChatGPT.app/Contents/Resources/codex
assert_surface claude-app env SURFACE_TEST_CHAIN=/Applications/Claude.app/Contents/MacOS/Claude
assert_surface terminal env TMUX=/tmp/stale TMUX_PANE=%9 SURFACE_TEST_TMUX_VALID=0 SURFACE_TEST_CHAIN=/bin/zsh

plan() {
  env -u TMUX -u TMUX_PANE -u CODEX_THREAD_ID PATH="$fixture_dir:/usr/bin:/bin" "$@" "$script_dir/detect-handoff-surface"
}

assert_field() {
  local output="$1" expected="$2"
  if ! grep -Fxq "$expected" <<<"$output"; then
    printf 'Missing field: %s\nPlan:\n%s\n' "$expected" "$output" >&2
    exit 1
  fi
}

output="$(plan env SURFACE_TEST_CHAIN=/bin/zsh)"
assert_field "$output" 'action=ask'
output="$(plan env CODEX_THREAD_ID=thread-1 SURFACE_TEST_CHAIN=/Applications/ChatGPT.app/Contents/Resources/codex)"
assert_field "$output" 'tool=mcp__codex_app__create_thread'
output="$(plan env SURFACE_TEST_CHAIN=/Applications/Claude.app/Contents/MacOS/Claude)"
assert_field "$output" 'action=ask'
output="$(plan env SURFACE_TEST_CHAIN=/bin/codex)"
assert_field "$output" 'action=new-terminal'
output="$(plan env SURFACE_TEST_CHAIN=/bin/claude)"
assert_field "$output" 'destination=claude-cli'

output="$(env PATH="$fixture_dir:/usr/bin:/bin" TMUX=/tmp/tmux TMUX_PANE=%4 SURFACE_TEST_TMUX_VALID=1 "$script_dir/detect-handoff-surface" --destination codex-app)"
assert_field "$output" 'action=native-tool'
if "$script_dir/detect-handoff-surface" --destination unknown >/dev/null 2>&1; then echo 'Invalid destination accepted' >&2; exit 1; fi
if "$script_dir/detect-handoff-surface" --relationship >/dev/null 2>&1; then echo 'Missing relationship accepted' >&2; exit 1; fi

export PATH="$fixture_dir:/usr/bin:/bin" TMUX=/tmp/tmux TMUX_PANE=%4 SURFACE_TEST_TMUX_VALID=1
export SURFACE_TEST_LOG="$fixture_dir/launch-args"
export HANDOFF_PATH="$fixture_dir/brief with 'quotes'.md" WORKING_DIRECTORY="$fixture_dir/repo with spaces" TASK_NAME="follow-up" BRANCH="handoff/follow-up"
for destination in codex-cli claude-cli; do
  for relationship in continuation aside; do
    output="$("$script_dir/detect-handoff-surface" --destination "$destination" --relationship "$relationship")"
    assert_field "$output" 'action=command'
    if [[ -e "$SURFACE_TEST_LOG" ]]; then echo 'Planning launched a command' >&2; exit 1; fi
    command="$(sed -n 's/^worktree_command=//p' <<<"$output")"
    bash -c "$command"
    if [[ "$relationship" == "continuation" ]]; then
      expected=$'split-window\n-h\n-t\n%4\n-c\n'
    else
      expected=$'new-window\n-t\n$7:\n-n\nfollow-up\n-c\n'
    fi
    expected+="$WORKING_DIRECTORY"$'\n-P\n-F\n#{pane_id}\n'
    if [[ "$destination" == "codex-cli" ]]; then
      expected+="$script_dir/codex-handoff-tmux"$'\n--run-codex\n--file\n'"$HANDOFF_PATH"$'\n--cd\n'"$WORKING_DIRECTORY"$'\n--worktree-name\nfollow-up\n--branch\nhandoff/follow-up'
    else
      expected+=$'claude\n--name\nfollow-up\n--worktree\nfollow-up\n'"Read the handoff at $HANDOFF_PATH and continue from it as a full independent session."
    fi
    actual="$(cat "$SURFACE_TEST_LOG")"
    if [[ "$actual" != "$expected" ]]; then printf 'Unexpected launch arguments:\n%s\nExpected:\n%s\n' "$actual" "$expected" >&2; exit 1; fi
    rm "$SURFACE_TEST_LOG"
  done
done

echo "detect-handoff-surface: ok"
