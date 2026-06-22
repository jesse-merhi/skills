#!/usr/bin/env python3
"""Summarize the net PR diff from base to HEAD.

The output is intended for PR body/proof updates. It compares the PR base
to HEAD so branch-local churn such as A -> B -> A does not get described as
a current PR change.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class BaseInfo:
    source: str
    ref: str
    sha: str
    merge_base: str


def run_git(args: list[str], *, check: bool = True) -> str:
    result = subprocess.run(
        ["git", *args],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if check and result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout.strip()


def run_command(args: list[str]) -> tuple[int, str, str]:
    result = subprocess.run(
        args,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def resolve_ref(ref: str) -> str | None:
    try:
        return run_git(["rev-parse", "--verify", ref])
    except RuntimeError:
        return None


def find_base() -> BaseInfo:
    code, stdout, _ = run_command(["gh", "pr", "view", "--json", "baseRefName,baseRefOid"])
    if code == 0 and stdout:
        try:
            data = json.loads(stdout)
            base_ref = str(data.get("baseRefName") or "main")
            base_sha = str(data.get("baseRefOid") or "")
            if base_sha:
                merge_base = run_git(["merge-base", base_sha, "HEAD"])
                return BaseInfo(
                    source="gh pr view",
                    ref=base_ref,
                    sha=base_sha,
                    merge_base=merge_base,
                )
        except (json.JSONDecodeError, RuntimeError):
            pass

    for ref in ("origin/main", "main"):
        sha = resolve_ref(ref)
        if sha:
            merge_base = run_git(["merge-base", sha, "HEAD"])
            return BaseInfo(source="git", ref=ref, sha=sha, merge_base=merge_base)

    merge_base = run_git(["merge-base", "HEAD~1", "HEAD"])
    return BaseInfo(source="fallback", ref="HEAD~1", sha=merge_base, merge_base=merge_base)


def pathspec(paths: list[str]) -> list[str]:
    return ["--", *paths] if paths else []


def diff_name_status(base: str, paths: list[str]) -> list[dict[str, str]]:
    output = run_git(["diff", "--name-status", f"{base}...HEAD", *pathspec(paths)])
    rows: list[dict[str, str]] = []
    for line in output.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            rows.append({"status": parts[0], "path": parts[-1]})
    return rows


def diff_stat(base: str, paths: list[str]) -> str:
    return run_git(["diff", "--stat", f"{base}...HEAD", *pathspec(paths)], check=False)


def commits(base: str, paths: list[str]) -> list[str]:
    output = run_git(["log", "--oneline", f"{base}..HEAD", *pathspec(paths)], check=False)
    return [line for line in output.splitlines() if line]


def files_touched_in_history(base: str, paths: list[str]) -> list[str]:
    output = run_git(
        ["log", "--name-only", "--pretty=format:", f"{base}..HEAD", *pathspec(paths)],
        check=False,
    )
    return sorted({line.strip() for line in output.splitlines() if line.strip()})


def proof_kind(path: str) -> str:
    ui_markers = ("/routes/", "/components/", "/app/", "/pages/", "src/styles", ".css")
    doc_markers = ("docs/", "specs/", ".md", ".mdx")
    api_markers = ("api", "server", "route", "handler", "controller")
    job_markers = ("cron", "queue", "job", "worker", "scheduler", "migration")

    lower = path.lower()
    if any(marker in lower for marker in ui_markers):
        return (
            "PR-visible screenshot required if human-visible UI changed; upload through "
            "GitHub's PR UI with Computer Use and include claim, URL/state, viewport, and crop/full-page reason."
        )
    if any(marker in lower for marker in job_markers):
        return "Mermaid/table: scheduled, queued, or cleanup behavior changed."
    if any(marker in lower for marker in api_markers):
        return "Mermaid/API example: request, response, or integration behavior changed."
    if any(marker in lower for marker in doc_markers):
        return "No screenshot by default: docs/spec text changed."
    return "Mermaid/table/API example: explain the net behavior change; avoid screenshots by default."


def file_details(base: str, paths: list[str], net_paths: set[str], touched_paths: set[str]) -> list[dict[str, Any]]:
    details: list[dict[str, Any]] = []
    for file_path in paths:
        branch_commits = commits(base, [file_path])
        status = "modified" if file_path in net_paths else "no net diff"
        if file_path not in touched_paths and file_path not in net_paths:
            status = "not touched in branch"
        details.append(
            {
                "path": file_path,
                "status": status,
                "branch_commits": branch_commits,
                "proof_hint": proof_kind(file_path) if status == "modified" else "Omit from PR proof unless needed for context.",
            }
        )
    return details


def build_report(paths: list[str]) -> dict[str, Any]:
    base = find_base()
    head = run_git(["rev-parse", "HEAD"])
    changed = diff_name_status(base.merge_base, paths)
    touched = files_touched_in_history(base.merge_base, paths)
    net_paths = {row["path"] for row in changed}
    touched_paths = set(touched)
    churn_only = sorted(touched_paths - net_paths)
    return {
        "base": {
            "source": base.source,
            "ref": base.ref,
            "sha": base.sha,
            "comparisonBase": base.merge_base,
        },
        "head": head,
        "changedFiles": changed,
        "diffStat": diff_stat(base.merge_base, paths),
        "commits": commits(base.merge_base, paths),
        "branchOnlyChurnNoNetDiff": churn_only,
        "fileDetails": file_details(base.merge_base, paths, net_paths, touched_paths) if paths else [],
        "proofPlan": [{"path": row["path"], "hint": proof_kind(row["path"])} for row in changed],
    }


def markdown(report: dict[str, Any], *, proof_plan: bool) -> str:
    base = report["base"]
    lines = [
        f"Base: {base['ref']} {base['comparisonBase'][:12]}",
        f"Base source: {base['source']}",
        f"Head: {report['head'][:12]}",
        "",
        "## Net Changed Files",
    ]
    if report["changedFiles"]:
        lines.extend(f"- {row['status']} {row['path']}" for row in report["changedFiles"])
    else:
        lines.append("- None")

    lines.extend(["", "## Diff Stat"])
    lines.append("```text")
    lines.append(report["diffStat"] or "No net diff.")
    lines.append("```")

    lines.extend(["", "## Branch Commits"])
    if report["commits"]:
        lines.extend(f"- {line}" for line in report["commits"])
    else:
        lines.append("- None")

    lines.extend(["", "## Branch-Only Churn With No Net Diff"])
    if report["branchOnlyChurnNoNetDiff"]:
        for path in report["branchOnlyChurnNoNetDiff"]:
            lines.append(f"- {path}")
        lines.append("")
        lines.append("Do not describe these paths as current PR behavior changes.")
    else:
        lines.append("- None")

    if report["fileDetails"]:
        lines.extend(["", "## Requested File Details"])
        for detail in report["fileDetails"]:
            lines.append(f"- {detail['path']}: {detail['status']}")
            if detail["branch_commits"]:
                lines.extend(f"  - {commit}" for commit in detail["branch_commits"])
            lines.append(f"  - {detail['proof_hint']}")

    if proof_plan:
        lines.extend(["", "## Proof Plan"])
        if report["proofPlan"]:
            lines.extend(f"- {item['path']}: {item['hint']}" for item in report["proofPlan"])
        else:
            lines.append("- No net changed files; remove stale PR proof for reverted behavior.")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Summarize net PR diff from base to HEAD.")
    parser.add_argument("paths", nargs="*", help="Optional file paths to inspect.")
    parser.add_argument("--markdown", action="store_true", help="Print Markdown output.")
    parser.add_argument("--json", action="store_true", help="Print JSON output.")
    parser.add_argument("--proof-plan", action="store_true", help="Include proof suggestions.")
    args = parser.parse_args()

    paths = [str(Path(path)) for path in args.paths]
    try:
        report = build_report(paths)
    except RuntimeError as error:
        print(f"pr_net_diff.py: {error}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(markdown(report, proof_plan=args.proof_plan or args.markdown))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
