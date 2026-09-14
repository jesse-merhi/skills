# Test execution routing verification

Local exercise on 2026-09-14, branch `jesse/luna-test-execution`, starting HEAD `2289b46819dc5a835faa88bfe83baefd47ff66b0` plus this change. No live profile/skill installation or publication was performed.

## Observed behavior

A fresh CLI worker launched with `-m gpt-5.6-luna -c 'model_reasoning_effort="max"'` ran `node --check app.mjs` once and returned exit 0. Its persisted turn context verifies model `gpt-5.6-luna` and effort `max` for thread `01a0a00f-796e-7a83-a82d-f60c666d2f51`. This validates the explicit-settings fallback. The registered role's settings are checked by the installer suite; a live named-role invocation was not exercised.

An independent worker exercised the skill against three prepared Node fixture snapshots:

| Snapshot | Observed execution |
| --- | --- |
| Baseline | Application and metadata checks passed; receipt retained input manifests and logs. |
| Only summary changed | Reused the application check after tracing its source/configuration inputs; ran the metadata check successfully. |
| Runtime multiplier changed | Ran the affected application check, observed `9 !== 6`, stopped with exit 1, and left the next check unrun. No retries or repairs. |

The exercise made four check invocations. It avoided one redundant application invocation for the summary edit. The unrun check after failure is a stop condition, not a validation saving. These are small synthetic exercises, not proof of production portfolio quality or savings.

Independent read-only instruction review found no actionable issue across BASE, all four variants, shared routing, profile configuration and its test. It exercised selection, failure, reuse and unavailable-role decisions semantically; this is not the repository's full PR code-review gate.

## Evidence and limits

Local evidence is retained at `/tmp/luna-test-execution-proof/`: `native-launch-settings.json`, `native.jsonl`, `native-result.md`, and `exercise/receipt.md` with per-command logs. The CLI receipt proves command success and launch routing; the independent fixture receipt supplies full input manifests and reuse decisions.

The collaboration workers were requested with explicit Luna/max settings, but their child runtime metadata was not exposed. An initial settings search found the coordinator's record and was mistakenly attributed to a worker. That record does not verify child settings. Only the separately identified native CLI turn is independently verified as Luna/max.

The initial repository batch stopped at module loading because this worktree had no dependencies. The coordinator then linked the existing dependency tree at `/Users/jessemerhi/repos/skills/node_modules` without installing packages. Production dependency versions match this checkout; unrelated development dependencies differ or are missing, so this does not establish a fully equivalent environment for broader checks.

The handoff's historical estimate was $50.27 versus $2.57 at identical tokens on Luna for two earlier validation workers. That is a supplied counterfactual, not measured quality, quota or cost savings. This change has no measured production savings. Coordinator and review model settings remain unchanged.

## Final repository validation

After resolving missing dependencies, the existing worker still could not execute `ps`: the exact lock-process probe returned `spawnSync ps EPERM`. It stopped without retrying. The coordinator used the user's updated unrestricted execution environment to run the same checks, with a 60-second bound per command and short-circuiting on failure:

- `node --test packages/codex-profiles/install.test.mjs`: 8 passed.
- `node --test skills/writing-for-agents/scripts/materialize-skill-variants.test.mjs`: 17 passed.
- `bun run lint:skills`: 29 skills, 44 references, no errors.
- `git diff --check`: passed.

Logs and input hashes are recorded in `final-validation.json` and the three `*.final.log` files in the evidence directory. The coordinator did not duplicate a successful worker batch: earlier attempts failed due to diagnosed environment constraints. No production or test code was repaired. The evidence-only document addition does not affect the installer or materializer input flows and does not justify rerunning those suites.
