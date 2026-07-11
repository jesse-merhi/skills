#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


OPENAI_MODELS_API_URL = "https://api.openai.com/v1/models"
ANTHROPIC_MODELS_API_URL = "https://api.anthropic.com/v1/models"
CLAUDE_AGENT_SDK_PACKAGE = "@anthropic-ai/claude-agent-sdk@0.3.185"

EXPECTED_CODEX_MODEL = "gpt-5.6-sol"
EXPECTED_CODEX_EFFORT = "high"
EXPECTED_CLAUDE_ALIAS = "claude-fable-5"
EXPECTED_CLAUDE_MODEL = "claude-fable-5"
EXPECTED_CLAUDE_NAME = "Fable 5"
EXPECTED_CLAUDE_EFFORT = "high"


@dataclass(frozen=True)
class Source:
    label: str
    text: str


@dataclass(frozen=True)
class Check:
    name: str
    ok: bool
    source: str
    expected: str
    observed: str
    detail: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="check-review-models",
        description="Stop review runs when official Codex or Claude model guidance has moved.",
    )
    parser.add_argument("--openai-models-url", default=OPENAI_MODELS_API_URL)
    parser.add_argument("--anthropic-models-url", default=ANTHROPIC_MODELS_API_URL)
    parser.add_argument("--codex-bin", default=os.environ.get("CODEX_BIN", "codex"))
    parser.add_argument("--claude-bin", default=os.environ.get("CLAUDE_BIN", "claude"))
    parser.add_argument(
        "--engine",
        choices=("codex", "claude", "both"),
        default="codex",
        help="Validate only the selected review engine. Default: codex.",
    )
    parser.add_argument("--claude-sdk-package", default=os.environ.get("CODEX_REVIEW_MODEL_GATE_CLAUDE_SDK_PACKAGE", CLAUDE_AGENT_SDK_PACKAGE))
    parser.add_argument("--claude-sdk-dir", default=os.environ.get("CODEX_REVIEW_MODEL_GATE_CLAUDE_SDK_DIR"))
    parser.add_argument("--codex-catalog-file", default=os.environ.get("CODEX_REVIEW_MODEL_GATE_CODEX_CATALOG_FILE"))
    parser.add_argument("--claude-code-file", default=os.environ.get("CODEX_REVIEW_MODEL_GATE_CLAUDE_CODE_FILE"))
    parser.add_argument("--openai-models-file", default=os.environ.get("CODEX_REVIEW_MODEL_GATE_OPENAI_MODELS_FILE"))
    parser.add_argument("--anthropic-models-file", default=os.environ.get("CODEX_REVIEW_MODEL_GATE_ANTHROPIC_MODELS_FILE"))
    parser.add_argument("--expected-codex-model", default=EXPECTED_CODEX_MODEL)
    parser.add_argument("--expected-codex-effort", default=EXPECTED_CODEX_EFFORT)
    parser.add_argument("--expected-claude-alias", default=EXPECTED_CLAUDE_ALIAS)
    parser.add_argument("--expected-claude-model", default=EXPECTED_CLAUDE_MODEL)
    parser.add_argument("--expected-claude-name", default=EXPECTED_CLAUDE_NAME)
    parser.add_argument("--expected-claude-effort", default=EXPECTED_CLAUDE_EFFORT)
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument("--check-api-inventory", action="store_true", help="Also check authenticated provider model-list APIs.")
    parser.add_argument("--json", action="store_true", help="Print machine-readable check output.")
    return parser.parse_args()


def read_codex_catalog(codex_bin: str, path: str | None, timeout: int) -> Source:
    if path:
        source_path = Path(path)
        return Source(str(source_path), source_path.read_text(encoding="utf-8"))
    resolved = shutil.which(codex_bin)
    if not resolved:
        raise RuntimeError(f"unable to find Codex CLI: {codex_bin}")
    try:
        result = subprocess.run(
            [resolved, "debug", "models"],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise RuntimeError(f"unable to run `{resolved} debug models`: {exc}") from exc
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"`{resolved} debug models` failed: {message[:1000]}")
    return Source(f"{resolved} debug models", result.stdout)


def default_cache_dir() -> Path:
    root = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache"))
    return root / "code-review-model-gate" / "claude-agent-sdk"


def ensure_claude_sdk(sdk_dir: Path, package: str, timeout: int) -> None:
    package_json = sdk_dir / "node_modules" / "@anthropic-ai" / "claude-agent-sdk" / "package.json"
    if package_json.exists():
        return
    npm = shutil.which("npm")
    if not npm:
        raise RuntimeError("unable to find npm for Claude Agent SDK model catalog check")
    sdk_dir.mkdir(parents=True, exist_ok=True)
    if not (sdk_dir / "package.json").exists():
        (sdk_dir / "package.json").write_text('{"private":true,"type":"module"}\n', encoding="utf-8")
    try:
        result = subprocess.run(
            [npm, "install", "--silent", "--no-audit", "--no-fund", "--ignore-scripts", package],
            cwd=sdk_dir,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=max(timeout, 60),
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise RuntimeError(f"unable to install Claude Agent SDK package {package}: {exc}") from exc
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"unable to install Claude Agent SDK package {package}: {message[:1000]}")


def read_claude_code_catalog(claude_bin: str, path: str | None, sdk_package: str, sdk_dir: str | None, timeout: int) -> Source:
    if path:
        source_path = Path(path)
        return Source(str(source_path), source_path.read_text(encoding="utf-8"))
    resolved_claude = shutil.which(claude_bin)
    if not resolved_claude:
        raise RuntimeError(f"unable to find Claude CLI: {claude_bin}")
    node = shutil.which("node")
    if not node:
        raise RuntimeError("unable to find node for Claude Agent SDK model catalog check")
    resolved_sdk_dir = Path(sdk_dir) if sdk_dir else default_cache_dir()
    ensure_claude_sdk(resolved_sdk_dir, sdk_package, timeout)
    script = r"""
import { query } from '@anthropic-ai/claude-agent-sdk';

async function* noPrompt() {}

const q = query({
  prompt: noPrompt(),
  options: {
    cwd: process.env.CODE_REVIEW_MODEL_GATE_CWD || process.cwd(),
    pathToClaudeCodeExecutable: process.env.CODE_REVIEW_MODEL_GATE_CLAUDE_BIN,
    tools: [],
    allowedTools: [],
    disallowedTools: [],
    permissionMode: 'dontAsk',
    persistSession: false,
  },
});

try {
  const init = await q.initializationResult();
  console.log(JSON.stringify({ models: init.models || [] }));
} finally {
  q.close();
}
"""
    env = os.environ.copy()
    env["CODE_REVIEW_MODEL_GATE_CLAUDE_BIN"] = resolved_claude
    env["CODE_REVIEW_MODEL_GATE_CWD"] = os.getcwd()
    try:
        result = subprocess.run(
            [node, "--input-type=module", "-e", script],
            cwd=resolved_sdk_dir,
            env=env,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise RuntimeError(f"unable to query Claude Code SDK model catalog: {exc}") from exc
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"Claude Code SDK model catalog check failed: {message[:1000]}")
    return Source(f"{resolved_claude} via Claude Agent SDK initializationResult().models", result.stdout)


def read_json_source(
    url: str,
    path: str | None,
    timeout: int,
    *,
    api_key: str | None,
    headers: dict[str, str],
) -> Source | None:
    if path:
        source_path = Path(path)
        return Source(str(source_path), source_path.read_text(encoding="utf-8"))
    if not api_key:
        return None
    request_headers = {"User-Agent": "code-review-model-gate/1.0", **headers}
    request = urllib.request.Request(url, headers=request_headers)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            body = response.read().decode(charset, errors="replace")
    except (OSError, urllib.error.URLError) as exc:
        return Source(url, json.dumps({"error": f"unable to fetch {url}: {exc}"}))
    return Source(url, body)


def normalize_model(value: str) -> str:
    return value.strip().strip("`\"'.,;:").lower()


def normalize_name(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip()).lower()


def version_tuple(value: str) -> tuple[int, ...] | None:
    parts = re.findall(r"\d+", value)
    if not parts:
        return None
    return tuple(int(part) for part in parts)


def model_ids_from_api(source: Source) -> tuple[list[str], str | None]:
    try:
        parsed = json.loads(source.text)
    except json.JSONDecodeError as exc:
        return [], f"model API returned non-JSON output: {exc}"
    if isinstance(parsed, dict) and isinstance(parsed.get("error"), str):
        return [], parsed["error"]
    data = parsed.get("data") if isinstance(parsed, dict) else parsed
    if not isinstance(data, list):
        return [], "model API response did not contain a data array"
    ids: list[str] = []
    for item in data:
        if isinstance(item, dict) and isinstance(item.get("id"), str):
            ids.append(normalize_model(item["id"]))
        elif isinstance(item, str):
            ids.append(normalize_model(item))
    if not ids:
        return [], "model API response did not contain model IDs"
    return sorted(set(ids)), None


def newer_gpt_models(ids: list[str], expected: str) -> list[str]:
    expected_version = version_tuple(expected)
    if expected_version is None:
        return []
    newer: list[str] = []
    for model_id in ids:
        if not model_id.startswith("gpt-"):
            continue
        observed_version = version_tuple(model_id)
        if observed_version and observed_version > expected_version:
            newer.append(model_id)
    return newer


def higher_family_model_ids(ids: list[str]) -> list[str]:
    return [model_id for model_id in ids if "fable" in model_id or "mythos" in model_id]


def codex_catalog_models(source: Source) -> tuple[list[dict[str, Any]], str | None]:
    try:
        parsed = json.loads(source.text)
    except json.JSONDecodeError as exc:
        return [], f"Codex model catalog returned non-JSON output: {exc}"
    models = parsed.get("models") if isinstance(parsed, dict) else None
    if not isinstance(models, list):
        return [], "Codex model catalog did not contain a models array"
    result = [model for model in models if isinstance(model, dict)]
    if not result:
        return [], "Codex model catalog did not contain model objects"
    return result, None


def visible_codex_models(models: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [model for model in models if model.get("visibility") == "list" and isinstance(model.get("slug"), str)]


def claude_catalog_models(source: Source) -> tuple[list[dict[str, Any]], str | None]:
    try:
        parsed = json.loads(source.text)
    except json.JSONDecodeError as exc:
        return [], f"Claude Code SDK model catalog returned non-JSON output: {exc}"
    models = parsed.get("models") if isinstance(parsed, dict) else parsed
    if not isinstance(models, list):
        return [], "Claude Code SDK model catalog did not contain a models array"
    result = [model for model in models if isinstance(model, dict)]
    if not result:
        return [], "Claude Code SDK model catalog did not contain model objects"
    return result, None


def model_text(model: dict[str, Any]) -> str:
    values = [
        str(model.get("value", "")),
        str(model.get("displayName", "")),
        str(model.get("description", "")),
    ]
    return " ".join(values)


def extract_claude_catalog_name(model: dict[str, Any]) -> str:
    text = model_text(model)
    current = re.search(r"currently\s+([A-Za-z]+\s+\d+(?:\.\d+)?(?:\s+\([^)]+\))?)", text, re.IGNORECASE)
    if current:
        return re.sub(r"\s+", " ", current.group(1)).strip()
    family = re.search(r"\b((?:Claude\s+)?[A-Za-z]+\s+\d+(?:\.\d+)?(?:\s+\([^)]+\))?)\b", text, re.IGNORECASE)
    if family:
        return re.sub(r"\s+", " ", family.group(1).replace("Claude ", "")).strip()
    value = model.get("value")
    return str(value) if isinstance(value, str) else "<unreadable>"


def model_supports_effort(model: dict[str, Any], effort: str) -> bool:
    levels = model.get("supportedEffortLevels")
    return isinstance(levels, list) and effort in {str(level) for level in levels}


def higher_claude_family_models(models: list[dict[str, Any]], expected_name: str) -> list[str]:
    expected_lower = normalize_name(expected_name)
    result: list[str] = []
    for model in models:
        text = normalize_name(model_text(model))
        if ("fable" not in text and "mythos" not in text) or expected_lower in text:
            continue
        value = str(model.get("value", "<unknown>"))
        name = extract_claude_catalog_name(model)
        result.append(f"{value} ({name})")
    return result


def check_codex(source: Source, expected: str, expected_effort: str) -> Check:
    models, error = codex_catalog_models(source)
    if error:
        return Check(
            "Codex standard model",
            False,
            source.label,
            expected,
            "<unreadable>",
            error,
        )
    listed = visible_codex_models(models)
    if not listed:
        return Check("Codex standard model", False, source.label, expected, "<none>", "Codex model catalog had no visible list models.")
    expected_model = next((model for model in listed if normalize_model(str(model.get("slug"))) == normalize_model(expected)), None)
    supports_expected_effort = False
    if expected_model is None:
        observed = "<missing>"
        detail = f"Visible Codex models: {', '.join(str(model['slug']) for model in listed[:8])}"
    else:
        observed = normalize_model(str(expected_model["slug"]))
        effort_values = [
            str(level.get("effort"))
            for level in expected_model.get("supported_reasoning_levels", [])
            if isinstance(level, dict) and isinstance(level.get("effort"), str)
        ]
        supports_expected_effort = expected_effort in effort_values
        detail = f"Codex CLI catalog lists {expected} with reasoning levels: {', '.join(effort_values) or '<unknown>'}."
    return Check(
        "Codex standard model",
        expected_model is not None and supports_expected_effort,
        source.label,
        f"{expected} with {expected_effort} reasoning",
        observed,
        detail,
    )


def check_openai_model_api(source: Source | None, expected: str) -> Check:
    if source is None:
        return Check(
            "OpenAI API model inventory",
            True,
            "https://api.openai.com/v1/models",
            "no newer GPT review model",
            "skipped",
            "OPENAI_API_KEY was not set, so account model inventory could not be checked.",
        )
    ids, error = model_ids_from_api(source)
    if error:
        return Check(
            "OpenAI API model inventory",
            True,
            source.label,
            "no newer GPT review model",
            "skipped",
            f"Account model inventory check could not run: {error}",
        )
    newer = newer_gpt_models(ids, expected)
    return Check(
        "OpenAI API model inventory",
        not newer,
        source.label,
        "no newer GPT review model",
        ", ".join(newer[:5]) if newer else "none",
        f"Checked {len(ids)} model IDs from the OpenAI Models API.",
    )


def check_claude_model(
    source: Source,
    expected_alias: str,
    expected_model: str,
    expected_name: str,
    expected_effort: str,
) -> Check:
    models, error = claude_catalog_models(source)
    if error:
        return Check(
            "Claude Code review model",
            False,
            source.label,
            expected_name,
            "<unreadable>",
            error,
        )
    selected_model = next((model for model in models if normalize_model(str(model.get("value", ""))) == normalize_model(expected_alias)), None)
    if not selected_model:
        available = ", ".join(str(model.get("value", "<unknown>")) for model in models[:8])
        return Check(
            "Claude Code review model",
            False,
            source.label,
            expected_alias,
            "<missing>",
            f"Claude Code SDK model catalog values: {available}",
        )
    observed_name = extract_claude_catalog_name(selected_model)
    observed_value = normalize_model(str(selected_model.get("value", "")))
    supports_expected_effort = model_supports_effort(selected_model, expected_effort)
    has_expected_model_value = any(
        normalize_model(str(model.get("value", ""))) == normalize_model(expected_model)
        for model in models
    )
    ok = (
        observed_value == normalize_model(expected_alias)
        and normalize_name(expected_name) in normalize_name(observed_name)
        and supports_expected_effort
        and has_expected_model_value
    )
    description = str(selected_model.get("description", "")).strip()
    values = ", ".join(str(model.get("value", "<unknown>")) for model in models[:8])
    return Check(
        "Claude Code review model",
        ok,
        source.label,
        f"{expected_alias} -> {expected_name} ({expected_model})",
        f"{observed_value} -> {observed_name}",
        f"Selected entry description: {description or '<none>'}. {expected_effort} effort supported: {'yes' if supports_expected_effort else 'no'}. Catalog values: {values}.",
    )


def check_claude_higher_family(source: Source, expected_name: str) -> Check:
    models, error = claude_catalog_models(source)
    if error:
        return Check(
            "Claude higher-family availability",
            True,
            source.label,
            "informational only; selected Fable model remains the review source of truth",
            "<unreadable>",
            f"Claude Code SDK catalog could not be inspected for higher-family availability: {error}",
        )
    higher = higher_claude_family_models(models, expected_name)
    available = ", ".join(str(model.get("value", "<unknown>")) for model in models[:8])
    return Check(
        "Claude higher-family availability",
        True,
        source.label,
        "informational only; selected Fable model remains the review source of truth",
        ", ".join(higher[:5]) if higher else "none",
        f"Claude Code SDK model catalog values: {available}",
    )


def check_anthropic_model_api(source: Source | None, _expected_name: str) -> Check:
    if source is None:
        return Check(
            "Anthropic API model inventory",
            True,
            "https://api.anthropic.com/v1/models",
            "informational only; account inventory is not a review-model recommendation",
            "skipped",
            "ANTHROPIC_API_KEY was not set, so account model inventory could not be checked.",
        )
    ids, error = model_ids_from_api(source)
    if error:
        return Check(
            "Anthropic API model inventory",
            True,
            source.label,
            "informational only; account inventory is not a review-model recommendation",
            "skipped",
            f"Account model inventory check could not run: {error}",
        )
    higher = higher_family_model_ids(ids)
    return Check(
        "Anthropic API model inventory",
        True,
        source.label,
        "informational only; account inventory is not a review-model recommendation",
        ", ".join(higher[:5]) if higher else "none",
        f"Checked {len(ids)} model IDs from the Anthropic Models API.",
    )


def render_text(checks: list[Check]) -> str:
    ok = all(check.ok for check in checks)
    lines = ["review model check passed" if ok else "review model gate failed"]
    for check in checks:
        status = "ok" if check.ok else "stop"
        lines.append(f"- {status}: {check.name}: expected {check.expected}; observed {check.observed}")
        lines.append(f"  source: {check.source}")
        lines.append(f"  detail: {check.detail}")
    if not ok:
        lines.append("Stop the review before Phase 1. Update the code-review skill/helper or ask me how to proceed.")
    return "\n".join(lines) + "\n"


def render_json(checks: list[Check]) -> str:
    payload: dict[str, Any] = {
        "ok": all(check.ok for check in checks),
        "checks": [
            {
                "name": check.name,
                "ok": check.ok,
                "source": check.source,
                "expected": check.expected,
                "observed": check.observed,
                "detail": check.detail,
            }
            for check in checks
        ],
    }
    return json.dumps(payload, indent=2, sort_keys=True) + "\n"


def main() -> int:
    args = parse_args()
    try:
        checks: list[Check] = []
        if args.engine in {"codex", "both"}:
            codex_source = read_codex_catalog(args.codex_bin, args.codex_catalog_file, args.timeout)
            checks.append(check_codex(codex_source, args.expected_codex_model, args.expected_codex_effort))
            if args.check_api_inventory:
                openai_models_source = read_json_source(
                    args.openai_models_url,
                    args.openai_models_file,
                    args.timeout,
                    api_key=os.environ.get("OPENAI_API_KEY"),
                    headers={"Authorization": f"Bearer {os.environ.get('OPENAI_API_KEY', '')}"},
                )
                checks.append(check_openai_model_api(openai_models_source, args.expected_codex_model))
        if args.engine in {"claude", "both"}:
            claude_code_source = read_claude_code_catalog(
                args.claude_bin,
                args.claude_code_file,
                args.claude_sdk_package,
                args.claude_sdk_dir,
                args.timeout,
            )
            checks.extend([
                check_claude_model(
                claude_code_source,
                args.expected_claude_alias,
                args.expected_claude_model,
                args.expected_claude_name,
                args.expected_claude_effort,
                ),
                check_claude_higher_family(claude_code_source, args.expected_claude_name),
            ])
            if args.check_api_inventory:
                anthropic_models_source = read_json_source(
                    args.anthropic_models_url,
                    args.anthropic_models_file,
                    args.timeout,
                    api_key=os.environ.get("ANTHROPIC_API_KEY"),
                    headers={
                        "x-api-key": os.environ.get("ANTHROPIC_API_KEY", ""),
                        "anthropic-version": "2023-06-01",
                    },
                )
                checks.append(
                    check_anthropic_model_api(anthropic_models_source, args.expected_claude_name),
                )
    except Exception as exc:
        checks = [
            Check(
                "Review model catalog fetch",
                False,
                "Codex CLI / Claude Code SDK model catalogs",
                "fresh official model catalogs",
                "<failed>",
                str(exc),
            )
        ]
    output = render_json(checks) if args.json else render_text(checks)
    sys.stdout.write(output)
    return 0 if all(check.ok for check in checks) else 2


if __name__ == "__main__":
    raise SystemExit(main())
