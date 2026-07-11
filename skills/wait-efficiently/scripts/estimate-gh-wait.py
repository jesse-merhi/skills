#!/usr/bin/env python3
"""Estimate the next useful GitHub Actions observation from historical runs."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import math
import subprocess
from typing import Any


FALLBACK_SECONDS = 120
MIN_SAMPLES = 3
MAX_WAIT_SECONDS = 1800


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def duration_seconds(run: dict[str, Any]) -> float | None:
    started = run.get("startedAt")
    updated = run.get("updatedAt")
    if not started or not updated:
        return None
    duration = (parse_timestamp(updated) - parse_timestamp(started)).total_seconds()
    return duration if duration > 0 else None


def percentile(values: list[float], probability: float) -> float:
    ordered = sorted(values)
    index = max(0, math.ceil(probability * len(ordered)) - 1)
    return ordered[index]


def estimate(
    current: dict[str, Any], history: list[dict[str, Any]], now: datetime
) -> dict[str, Any]:
    if current.get("status") == "completed":
        return {
            "status": "completed",
            "sample_count": 0,
            "suggested_wait_seconds": 0,
        }

    candidates = [
        run
        for run in history
        if run.get("databaseId") != current.get("databaseId")
        and run.get("status") == "completed"
        and run.get("workflowName") == current.get("workflowName")
        and run.get("event") == current.get("event")
    ]
    same_branch = [run for run in candidates if run.get("headBranch") == current.get("headBranch")]
    if len(same_branch) >= MIN_SAMPLES:
        candidates = same_branch

    durations = [duration for run in candidates if (duration := duration_seconds(run)) is not None]
    if len(durations) < MIN_SAMPLES:
        return {
            "status": current.get("status", "unknown"),
            "sample_count": len(durations),
            "fallback": True,
            "suggested_wait_seconds": FALLBACK_SECONDS,
        }

    p50 = percentile(durations, 0.50)
    p75 = percentile(durations, 0.75)
    started_at = current.get("startedAt")
    elapsed = max(0.0, (now - parse_timestamp(started_at)).total_seconds()) if started_at else 0.0
    remaining = max(0.0, p75 - elapsed)
    suggested = 30 if remaining <= 30 else max(60, min(MAX_WAIT_SECONDS, round(remaining)))

    return {
        "status": current.get("status", "unknown"),
        "sample_count": len(durations),
        "historical_p50_seconds": round(p50),
        "historical_p75_seconds": round(p75),
        "elapsed_seconds": round(elapsed),
        "estimated_remaining_seconds": round(remaining),
        "suggested_wait_seconds": suggested,
    }


def gh_json(arguments: list[str]) -> Any:
    result = subprocess.run(
        ["gh", *arguments],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-id", required=True, type=int)
    parser.add_argument("--repo")
    parser.add_argument("--limit", type=int, default=30)
    args = parser.parse_args()

    repo_args = ["--repo", args.repo] if args.repo else []
    fields = "databaseId,workflowName,event,headBranch,startedAt,updatedAt,status,conclusion"
    current = gh_json(["run", "view", str(args.run_id), *repo_args, "--json", fields])
    history = gh_json(
        [
            "run",
            "list",
            *repo_args,
            "--workflow",
            current["workflowName"],
            "--status",
            "completed",
            "--limit",
            str(args.limit),
            "--json",
            fields,
        ]
    )
    output = estimate(current, history, datetime.now(timezone.utc))
    output.update({"run_id": args.run_id, "workflow": current["workflowName"]})
    print(json.dumps(output, separators=(",", ":"), sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
