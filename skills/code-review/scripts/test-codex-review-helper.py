#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import shutil
import stat
import subprocess
import sys
import tempfile
from pathlib import Path


FAKE_CODEX = """#!/usr/bin/env bash
set -euo pipefail

if [[ "$*" != *" review "* && "$*" != review* ]]; then
  if [[ "$*" == *" exec "* ]]; then
    output_path=""
    previous=""
    for arg in "$@"; do
      if [[ "$previous" == "--output-last-message" ]]; then
        output_path="$arg"
        break
      fi
      previous="$arg"
    done
    if [[ -z "$output_path" ]]; then
      echo "fake codex expected --output-last-message for exec" >&2
      exit 6
    fi
    if [[ -n "${FAKE_CODEX_STRUCTURED_JSON:-}" ]]; then
      printf '%s\n' "$FAKE_CODEX_STRUCTURED_JSON" > "$output_path"
    else
      printf '%s\n' '{"findings":[],"overall_correctness":"patch is correct","overall_explanation":"No findings.","overall_confidence":0.9}' > "$output_path"
    fi
    if [[ "$*" == *" --json "* ]]; then
      echo '{"type":"turn.started"}'
      echo '{"type":"item.started","item":{"type":"tool_call"}}'
      echo '{"type":"turn.completed","usage":{"input_tokens":12,"cached_input_tokens":0,"output_tokens":3,"reasoning_output_tokens":1}}'
    fi
    exit 0
  else
    echo "fake codex expected a review or exec command, got: $*" >&2
    exit 2
  fi
fi

if [[ -n "${FAKE_CODEX_EXPECT_APP_TEXT:-}" ]]; then
  actual="$(cat app.txt)"
  if [[ "$actual" != "$FAKE_CODEX_EXPECT_APP_TEXT" ]]; then
    echo "fake codex expected app.txt to contain: $FAKE_CODEX_EXPECT_APP_TEXT" >&2
    echo "actual: $actual" >&2
    exit 3
  fi
fi

if [[ -n "${FAKE_CODEX_EXPECT_FILE:-}" && ! -f "$FAKE_CODEX_EXPECT_FILE" ]]; then
  echo "fake codex expected file to exist: $FAKE_CODEX_EXPECT_FILE" >&2
  exit 4
fi

if [[ "${FAKE_CODEX_EXPECT_CLEAN_STATUS:-0}" == "1" ]]; then
  status="$(git status --porcelain)"
  if [[ -n "$status" ]]; then
    echo "fake codex expected clean snapshot status" >&2
    echo "$status" >&2
    exit 5
  fi
fi

if [[ -n "${FAKE_CODEX_EXPECT_ARGS_CONTAIN:-}" && "$*" != *"$FAKE_CODEX_EXPECT_ARGS_CONTAIN"* ]]; then
  echo "fake codex expected args to contain: $FAKE_CODEX_EXPECT_ARGS_CONTAIN" >&2
  echo "actual args: $*" >&2
  exit 6
fi

if [[ "${FAKE_CODEX_FINDING:-0}" == "1" ]]; then
  echo "### [P1] Fake actionable finding"
  echo "This fixture proves finding detection returns nonzero."
else
  echo "No findings."
  echo "The reviewed change is correct."
fi
"""


FAKE_CLAUDE = """#!/usr/bin/env bash
set -euo pipefail

cat >/dev/null
if [[ -n "${FAKE_CLAUDE_STRUCTURED_JSON:-}" ]]; then
  printf '%s\n' "$FAKE_CLAUDE_STRUCTURED_JSON"
else
  printf '%s\n' '{"findings":[],"overall_correctness":"patch is correct","overall_explanation":"No findings.","overall_confidence":0.9}'
fi
"""


CODEX_CATALOG = json.dumps(
    {
        "models": [
            {
                "slug": "gpt-5.6-sol",
                "display_name": "GPT-5.6-Sol",
                "visibility": "list",
                "priority": 1,
                "supported_reasoning_levels": [{"effort": "high"}, {"effort": "xhigh"}],
            },
            {
                "slug": "gpt-5.5",
                "display_name": "GPT-5.5",
                "visibility": "list",
                "priority": 0,
                "supported_reasoning_levels": [{"effort": "high"}, {"effort": "xhigh"}],
            },
        ]
    }
)


OPENAI_MODELS_API = json.dumps(
    {
        "object": "list",
        "data": [
            {"id": "gpt-5.6-sol", "object": "model"},
            {"id": "gpt-5.5", "object": "model"},
        ],
    }
)


STALE_OPENAI_MODELS_API = json.dumps(
    {
        "object": "list",
        "data": [
            {"id": "gpt-5.7", "object": "model"},
            {"id": "gpt-5.6", "object": "model"},
        ],
    }
)


STALE_CODEX_CATALOG = json.dumps(
    {
        "models": [
            {
                "slug": "gpt-5.7",
                "display_name": "GPT-5.7",
                "visibility": "list",
                "priority": 0,
                "supported_reasoning_levels": [{"effort": "high"}, {"effort": "xhigh"}],
            },
            {
                "slug": "gpt-5.6-terra",
                "display_name": "GPT-5.6-Terra",
                "visibility": "list",
                "priority": 1,
                "supported_reasoning_levels": [{"effort": "high"}, {"effort": "xhigh"}],
            },
        ]
    }
)


CLAUDE_CODE_SDK_CATALOG = json.dumps(
    {
        "models": [
            {
                "value": "claude-fable-5",
                "displayName": "Fable",
                "description": "Fable 5 for the hardest tasks",
                "supportsEffort": True,
                "supportedEffortLevels": ["low", "medium", "high", "xhigh", "max"],
            },
            {
                "value": "default",
                "displayName": "Default (recommended)",
                "description": "Use the default model (currently Opus 4.8 (1M context))",
                "supportsEffort": True,
                "supportedEffortLevels": ["low", "medium", "high", "xhigh", "max"],
            },
            {
                "value": "opus[1m]",
                "displayName": "Opus",
                "description": "Opus 4.8 with 1M context",
                "supportsEffort": True,
                "supportedEffortLevels": ["low", "medium", "high", "xhigh", "max"],
            },
            {
                "value": "sonnet",
                "displayName": "Sonnet",
                "description": "Sonnet 4.6",
                "supportsEffort": True,
                "supportedEffortLevels": ["low", "medium", "high", "max"],
            },
        ]
    }
)


STALE_CLAUDE_CODE_SDK_CATALOG = json.dumps(
    {
        "models": [
            {
                "value": "claude-fable-5",
                "displayName": "Fable",
                "description": "Mythos 5 for the hardest tasks",
                "supportsEffort": True,
                "supportedEffortLevels": ["low", "medium", "high", "xhigh", "max"],
            }
        ]
    }
)


FABLE_CLAUDE_CODE_SDK_CATALOG = json.dumps(
    {
        "models": [
            {
                "value": "default",
                "displayName": "Default (recommended)",
                "description": "Use the default model (currently Opus 4.8 (1M context))",
                "supportsEffort": True,
                "supportedEffortLevels": ["low", "medium", "high", "xhigh", "max"],
            },
            {
                "value": "opus[1m]",
                "displayName": "Opus 4.8",
                "description": "Opus 4.8 with 1M context",
                "supportsEffort": True,
                "supportedEffortLevels": ["low", "medium", "high", "xhigh", "max"],
            },
            {
                "value": "claude-fable-5",
                "displayName": "Fable",
                "description": "Fable 5 for the hardest tasks",
                "supportsEffort": True,
                "supportedEffortLevels": ["low", "medium", "high", "xhigh", "max"],
            },
        ]
    }
)


ANTHROPIC_MODELS_API = json.dumps(
    {
        "data": [
            {"id": "claude-opus-4-8", "type": "model"},
            {"id": "claude-sonnet-4-6", "type": "model"},
        ]
    }
)


STALE_ANTHROPIC_MODELS_API = json.dumps(
    {
        "data": [
            {"id": "claude-fable-5", "type": "model"},
            {"id": "claude-mythos-4-7", "type": "model"},
            {"id": "claude-opus-4-8", "type": "model"},
        ]
    }
)


def run(command: list[str], cwd: Path, *, env: dict[str, str] | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        command,
        cwd=cwd,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if check and result.returncode != 0:
        raise AssertionError(
            f"command failed ({result.returncode}): {' '.join(command)}\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        )
    return result


def write(path: Path, text: str, *, executable: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    if executable:
        mode = path.stat().st_mode
        path.chmod(mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def create_repo(repo: Path) -> None:
    run(["git", "init", "--quiet"], repo)
    run(["git", "checkout", "-B", "main"], repo)
    run(["git", "config", "user.name", "Review Fixture"], repo)
    run(["git", "config", "user.email", "review-fixture@example.com"], repo)
    write(repo / "app.txt", "initial\n")
    run(["git", "add", "app.txt"], repo)
    run(["git", "commit", "--quiet", "-m", "initial"], repo)


def assert_contains(output: str, expected: str) -> None:
    if expected not in output:
        raise AssertionError(f"expected output to contain {expected!r}\noutput:\n{output}")


def assert_not_contains(output: str, unexpected: str) -> None:
    if unexpected in output:
        raise AssertionError(f"expected output not to contain {unexpected!r}\noutput:\n{output}")


def structured_report(findings: list[dict[str, object]], *, correct: bool = False) -> str:
    return json.dumps(
        {
            "findings": findings,
            "overall_correctness": "patch is correct" if correct else "patch is incorrect",
            "overall_explanation": "Structured fixture result.",
            "overall_confidence": 0.91,
        }
    )


def finding(
    *,
    title: str = "Fake structured finding",
    body: str = "The changed command handling is unsafe.",
    priority: str = "P1",
    category: str = "security",
    file_path: str = "app.txt",
    line: int = 1,
    scope: str = "direct",
    scope_reason: str = "The finding points at a changed file.",
    fix: str = "Use a safe API.",
) -> dict[str, object]:
    return {
        "title": title,
        "body": body,
        "priority": priority,
        "confidence": 0.88,
        "category": category,
        "scope": scope,
        "scope_reason": scope_reason,
        "code_location": {"file_path": file_path, "line": line},
        "fix": fix,
    }


def helper_path() -> Path:
    return Path(__file__).resolve().parent / "codex-review"


def model_gate_path() -> Path:
    return Path(__file__).resolve().parent / "check-review-models"


def run_helper(
    repo: Path,
    fake_codex: Path,
    args: list[str],
    *,
    finding: bool = False,
    extra_env: dict[str, str] | None = None,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["FAKE_CODEX_FINDING"] = "1" if finding else "0"
    if extra_env:
        env.update(extra_env)
    return run([str(helper_path()), "--codex-bin", str(fake_codex), *args], repo, env=env, check=check)


def main() -> int:
    temp_root = Path(tempfile.mkdtemp(prefix="codex-review-helper."))
    try:
        repo = temp_root / "repo"
        repo.mkdir()
        bin_dir = temp_root / "bin"
        fake_codex = bin_dir / "codex"
        fake_claude = bin_dir / "claude"
        write(fake_codex, FAKE_CODEX, executable=True)
        write(fake_claude, FAKE_CLAUDE, executable=True)
        openai_models_api = temp_root / "openai-models.json"
        stale_openai_models_api = temp_root / "stale-openai-models.json"
        codex_catalog = temp_root / "codex-catalog.json"
        stale_codex_catalog = temp_root / "stale-codex-catalog.json"
        anthropic_models_api = temp_root / "anthropic-models.json"
        stale_anthropic_models_api = temp_root / "stale-anthropic-models.json"
        claude_code_catalog = temp_root / "claude-code-models.json"
        stale_claude_code_catalog = temp_root / "stale-claude-code-models.json"
        fable_claude_code_catalog = temp_root / "fable-claude-code-models.json"
        write(openai_models_api, OPENAI_MODELS_API)
        write(stale_openai_models_api, STALE_OPENAI_MODELS_API)
        write(codex_catalog, CODEX_CATALOG)
        write(stale_codex_catalog, STALE_CODEX_CATALOG)
        write(anthropic_models_api, ANTHROPIC_MODELS_API)
        write(stale_anthropic_models_api, STALE_ANTHROPIC_MODELS_API)
        write(claude_code_catalog, CLAUDE_CODE_SDK_CATALOG)
        write(stale_claude_code_catalog, STALE_CLAUDE_CODE_SDK_CATALOG)
        write(fable_claude_code_catalog, FABLE_CLAUDE_CODE_SDK_CATALOG)
        os.environ["CODEX_REVIEW_MODEL_GATE_OPENAI_MODELS_FILE"] = str(openai_models_api)
        os.environ["CODEX_REVIEW_MODEL_GATE_CODEX_CATALOG_FILE"] = str(codex_catalog)
        os.environ["CODEX_REVIEW_MODEL_GATE_ANTHROPIC_MODELS_FILE"] = str(anthropic_models_api)
        os.environ["CODEX_REVIEW_MODEL_GATE_CLAUDE_CODE_FILE"] = str(claude_code_catalog)
        create_repo(repo)

        gate = run([str(model_gate_path())], repo)
        assert_contains(gate.stdout, "review model check passed")
        assert_not_contains(gate.stdout, "API model inventory")

        api_gate = run([str(model_gate_path()), "--check-api-inventory"], repo)
        assert_contains(api_gate.stdout, "review model check passed")
        assert_contains(api_gate.stdout, "OpenAI API model inventory")
        assert_contains(api_gate.stdout, "Anthropic API model inventory")

        stale_openai_api_gate = run(
            [
                str(model_gate_path()),
                "--check-api-inventory",
                "--openai-models-file",
                str(stale_openai_models_api),
                "--codex-catalog-file",
                str(codex_catalog),
                "--anthropic-models-file",
                str(anthropic_models_api),
                "--claude-code-file",
                str(claude_code_catalog),
            ],
            repo,
            check=False,
        )
        if stale_openai_api_gate.returncode == 0:
            raise AssertionError(
                f"stale OpenAI API gate unexpectedly passed\nstdout:\n{stale_openai_api_gate.stdout}\nstderr:\n{stale_openai_api_gate.stderr}"
            )
        assert_contains(stale_openai_api_gate.stdout, "review model gate failed")
        assert_contains(stale_openai_api_gate.stdout, "observed gpt-5.7")

        stale_gate = run(
            [
                str(model_gate_path()),
                "--codex-catalog-file",
                str(stale_codex_catalog),
                "--claude-code-file",
                str(claude_code_catalog),
            ],
            repo,
            check=False,
        )
        if stale_gate.returncode == 0:
            raise AssertionError(f"stale model gate unexpectedly passed\nstdout:\n{stale_gate.stdout}\nstderr:\n{stale_gate.stderr}")
        assert_contains(stale_gate.stdout, "review model gate failed")
        assert_contains(stale_gate.stdout, "observed <missing>")

        stale_claude_code_gate = run(
            [
                str(model_gate_path()),
                "--codex-catalog-file",
                str(codex_catalog),
                "--claude-code-file",
                str(stale_claude_code_catalog),
            ],
            repo,
            check=False,
        )
        if stale_claude_code_gate.returncode == 0:
            raise AssertionError(
                f"stale Claude Code gate unexpectedly passed\nstdout:\n{stale_claude_code_gate.stdout}\nstderr:\n{stale_claude_code_gate.stderr}"
            )
        assert_contains(stale_claude_code_gate.stdout, "review model gate failed")
        assert_contains(stale_claude_code_gate.stdout, "observed claude-fable-5 -> Mythos 5")

        stale_anthropic_api_gate = run(
            [
                str(model_gate_path()),
                "--check-api-inventory",
                "--openai-models-file",
                str(openai_models_api),
                "--codex-catalog-file",
                str(codex_catalog),
                "--anthropic-models-file",
                str(stale_anthropic_models_api),
                "--claude-code-file",
                str(claude_code_catalog),
            ],
            repo,
            check=False,
        )
        if stale_anthropic_api_gate.returncode != 0:
            raise AssertionError(
                f"Anthropic API inventory gate unexpectedly failed\nstdout:\n{stale_anthropic_api_gate.stdout}\nstderr:\n{stale_anthropic_api_gate.stderr}"
            )
        assert_contains(stale_anthropic_api_gate.stdout, "review model check passed")
        assert_contains(stale_anthropic_api_gate.stdout, "observed claude-fable-5")
        assert_contains(stale_anthropic_api_gate.stdout, "claude-mythos-4-7")

        fable_claude_models_gate = run(
            [
                str(model_gate_path()),
                "--codex-catalog-file",
                str(codex_catalog),
                "--claude-code-file",
                str(fable_claude_code_catalog),
            ],
            repo,
            check=False,
        )
        if fable_claude_models_gate.returncode != 0:
            raise AssertionError(
                f"Fable Claude model gate unexpectedly failed\nstdout:\n{fable_claude_models_gate.stdout}\nstderr:\n{fable_claude_models_gate.stderr}"
            )
        assert_contains(fable_claude_models_gate.stdout, "review model check passed")
        assert_contains(fable_claude_models_gate.stdout, "Claude higher-family availability")
        assert_contains(fable_claude_models_gate.stdout, "observed claude-fable-5 -> Fable 5")

        write(repo / "app.txt", "dirty\n")
        local_dry_run = run_helper(repo, fake_codex, ["--mode", "auto", "--dry-run"])
        assert_contains(local_dry_run.stdout, "codex-review target: local")
        assert_contains(local_dry_run.stdout, "review ")
        assert_contains(local_dry_run.stdout, "model=\"gpt-5.6-sol\"")
        assert_contains(local_dry_run.stdout, "model_reasoning_effort=\"high\"")
        assert_contains(local_dry_run.stdout, "--uncommitted")

        run(["git", "add", "app.txt"], repo)
        run(["git", "commit", "--quiet", "-m", "dirty committed"], repo)
        run(["git", "checkout", "-B", "feature"], repo)
        write(repo / "app.txt", "feature\n")
        run(["git", "add", "app.txt"], repo)
        run(["git", "commit", "--quiet", "-m", "feature change"], repo)
        branch_dry_run = run_helper(repo, fake_codex, ["--mode", "auto", "--base", "main", "--dry-run"])
        assert_contains(branch_dry_run.stdout, "codex-review target: branch")
        assert_contains(branch_dry_run.stdout, "--base main")

        write(repo / "app.txt", "feature plus dirty overlay\n")
        write(repo / "notes.txt", "untracked note\n")
        whole = run_helper(
            repo,
            fake_codex,
            ["--mode", "auto", "--base", "main", "--heartbeat-seconds", "1"],
            extra_env={
                "FAKE_CODEX_EXPECT_APP_TEXT": "feature plus dirty overlay",
                "FAKE_CODEX_EXPECT_FILE": "notes.txt",
                "FAKE_CODEX_EXPECT_CLEAN_STATUS": "1",
            },
        )
        assert_contains(whole.stdout, "codex-review target: whole")
        assert_contains(whole.stdout, "--base main")
        assert_contains(whole.stdout, "snapshot: temporary worktree with local overlay")
        assert_contains(whole.stdout, "codex-review clean: no accepted/actionable findings reported")

        run(["git", "add", "app.txt", "notes.txt"], repo)
        run(["git", "commit", "--quiet", "-m", "overlay committed"], repo)
        write(repo / "app.txt", "local clean review\n")
        clean = run_helper(repo, fake_codex, ["--mode", "local", "--heartbeat-seconds", "1"])
        assert_contains(clean.stdout, "review model check passed")
        assert_contains(clean.stdout, "codex-review clean: no accepted/actionable findings reported")

        pinned_native = run_helper(
            repo,
            fake_codex,
            ["--mode", "local", "--heartbeat-seconds", "1"],
            extra_env={"FAKE_CODEX_EXPECT_ARGS_CONTAIN": 'model="gpt-5.6-sol" -c model_reasoning_effort="high"'},
        )
        assert_contains(pinned_native.stdout, "codex-review clean: no accepted/actionable findings reported")

        native_finding = run_helper(repo, fake_codex, ["--mode", "local", "--heartbeat-seconds", "1"], finding=True, check=False)
        if native_finding.returncode == 0:
            raise AssertionError(
                f"finding run unexpectedly passed\nstdout:\n{native_finding.stdout}\nstderr:\n{native_finding.stderr}"
            )
        assert_contains(native_finding.stdout, "codex-review findings: accepted/actionable findings reported")

        structured_json = temp_root / "structured-findings.json"
        structured = run_helper(
            repo,
            fake_codex,
            ["--mode", "local", "--structured", "--json-output", str(structured_json), "--heartbeat-seconds", "1"],
            extra_env={"FAKE_CODEX_STRUCTURED_JSON": structured_report([finding()])},
            check=False,
        )
        if structured.returncode == 0:
            raise AssertionError(f"structured finding run unexpectedly passed\nstdout:\n{structured.stdout}\nstderr:\n{structured.stderr}")
        assert_contains(structured.stdout, "structured review findings: 1 blocking")
        ledger = json.loads(structured_json.read_text())
        if ledger["findings"][0]["scope"] != "direct":
            raise AssertionError(f"expected direct scope in ledger: {ledger}")

        unrelated_json = temp_root / "unrelated-findings.json"
        unrelated = run_helper(
            repo,
            fake_codex,
            ["--mode", "local", "--structured", "--json-output", str(unrelated_json), "--heartbeat-seconds", "1"],
            extra_env={
                "FAKE_CODEX_STRUCTURED_JSON": structured_report(
                    [
                        finding(
                            title="Old unrelated issue",
                            body="This old file has a bug, but the current diff does not expose it.",
                            file_path="old/auth.ts",
                            scope="unrelated",
                            scope_reason="The file is not changed and the current diff does not call it.",
                        )
                    ],
                    correct=True,
                )
            },
        )
        assert_contains(unrelated.stdout, "structured review nonblocking findings: 1")
        assert_contains(unrelated.stdout, "structured review clean: no direct or induced findings reported")

        malformed = run_helper(
            repo,
            fake_codex,
            ["--mode", "local", "--structured", "--heartbeat-seconds", "1"],
            extra_env={
                "FAKE_CODEX_STRUCTURED_JSON": structured_report(
                    [finding(file_path="../old/auth.ts", scope="direct", scope_reason="Invalid path fixture.")]
                )
            },
            check=False,
        )
        if malformed.returncode == 0:
            raise AssertionError(f"malformed structured run unexpectedly passed\nstdout:\n{malformed.stdout}\nstderr:\n{malformed.stderr}")
        assert_contains(malformed.stderr, "invalid file path")

        streamed = run_helper(
            repo,
            fake_codex,
            ["--mode", "local", "--structured", "--stream-engine-output", "--heartbeat-seconds", "1"],
            extra_env={"FAKE_CODEX_STRUCTURED_JSON": structured_report([], correct=True)},
        )
        assert_contains(streamed.stdout, "codex turn started")
        assert_contains(streamed.stdout, "codex usage:")

        panel = run_helper(
            repo,
            fake_codex,
            [
                "--mode",
                "local",
                "--structured",
                "--reviewers",
                "codex,claude",
                "--thinking",
                "codex=xhigh",
                "--claude-bin",
                str(fake_claude),
                "--heartbeat-seconds",
                "1",
            ],
            extra_env={
                "FAKE_CODEX_STRUCTURED_JSON": structured_report([finding(title="Codex panel finding")]),
                "FAKE_CLAUDE_STRUCTURED_JSON": structured_report([finding(title="Claude panel finding")]),
            },
            check=False,
        )
        if panel.returncode == 0:
            raise AssertionError(f"panel structured run unexpectedly passed\nstdout:\n{panel.stdout}\nstderr:\n{panel.stderr}")
        assert_contains(panel.stdout, "reviewers: codex:model=gpt-5.6-sol:thinking=xhigh, claude:model=claude-fable-5:thinking=high")
        assert_contains(panel.stdout, "structured review findings: 2 blocking")

        print("test-codex-review-helper passed")
        return 0
    finally:
        shutil.rmtree(temp_root, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
