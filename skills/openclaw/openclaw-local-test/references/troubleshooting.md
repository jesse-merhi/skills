# Troubleshooting

- If startup fails, read `~/.openclaw-local-test/logs/gateway.err.log` first,
  then `gateway.log`.
- If the browser proxy route fails, inspect
  `~/.openclaw-local-test-proxy/logs/shared-browser-proxy.err.log`.
- If another agent is starting OpenClaw at the same time, the helper may briefly
  print `waiting for OpenClaw startup lock`; let it wait instead of manually
  choosing a port.
- If the health endpoint was live but later disappears, check
  `openclaw-local-test --status`; the helper detaches processes with
  `setsid`/`nohup`, so a stopped process usually means Gateway startup or
  channel init failed.
- If an instance should have auto-stopped but did not, run
  `openclaw-local-test --status`, then `openclaw-local-test --stop`. For
  compatibility-state instances, use `openclaw-dia-test --status` and
  `openclaw-dia-test --stop`.
- If Slack/Discord should be live but are not connected, verify the run was not
  started with `--no-channels`, then inspect the channel startup lines in
  `gateway.log`.
- If the Atlassian provider fails, verify the AIGW proxy is listening locally
  and inspect `~/Library/Logs/openclaw-aigw-proxy/stderr.log`.
- `openclaw-dia-test` is a compatibility command for older muscle memory.
  Prefer `openclaw-local-test` in new instructions.
