#!/usr/bin/env python3

from __future__ import annotations

from datetime import datetime, timezone
import importlib.util
from pathlib import Path
import unittest


SCRIPT = Path(__file__).with_name("estimate-gh-wait.py")
SPEC = importlib.util.spec_from_file_location("estimate_gh_wait", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def run(run_id: int, duration_minutes: int, branch: str = "main") -> dict[str, object]:
    return {
        "databaseId": run_id,
        "workflowName": "Build",
        "event": "pull_request",
        "headBranch": branch,
        "startedAt": "2026-07-11T00:00:00Z",
        "updatedAt": f"2026-07-11T00:{duration_minutes:02d}:00Z",
        "status": "completed",
    }


class EstimateGhWaitTest(unittest.TestCase):
    def test_uses_same_branch_p75_and_elapsed_time(self) -> None:
        current = {
            "databaseId": 99,
            "workflowName": "Build",
            "event": "pull_request",
            "headBranch": "feature",
            "startedAt": "2026-07-11T00:00:00Z",
            "status": "in_progress",
        }
        history = [run(1, 6, "feature"), run(2, 8, "feature"), run(3, 10, "feature")]
        result = MODULE.estimate(
            current,
            history,
            datetime(2026, 7, 11, 0, 2, tzinfo=timezone.utc),
        )
        self.assertEqual(result["historical_p75_seconds"], 600)
        self.assertEqual(result["estimated_remaining_seconds"], 480)
        self.assertEqual(result["suggested_wait_seconds"], 480)

    def test_falls_back_with_too_few_samples(self) -> None:
        current = {
            "databaseId": 99,
            "workflowName": "Build",
            "event": "pull_request",
            "headBranch": "feature",
            "startedAt": "2026-07-11T00:00:00Z",
            "status": "queued",
        }
        result = MODULE.estimate(
            current,
            [run(1, 6), run(2, 8)],
            datetime(2026, 7, 11, 0, 1, tzinfo=timezone.utc),
        )
        self.assertEqual(result["suggested_wait_seconds"], 120)
        self.assertTrue(result["fallback"])


if __name__ == "__main__":
    unittest.main()
