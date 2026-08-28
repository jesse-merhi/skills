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
[[ "${SURFACE_TEST_TMUX_VALID:-0}" == "1" ]]
EOF
cat >"$fixture_dir/pgrep" <<'EOF'
#!/usr/bin/env bash
exit 1
EOF
chmod +x "$fixture_dir/ps" "$fixture_dir/tmux" "$fixture_dir/pgrep"

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

echo "detect-handoff-surface: ok"
