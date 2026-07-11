#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest


SCRIPT = Path(__file__).with_name("quiet-wait.py")
SPEC = importlib.util.spec_from_file_location("quiet_wait", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class QuietWaitTest(unittest.TestCase):
    def test_parses_supported_units(self) -> None:
        self.assertEqual(MODULE.parse_duration("300"), 300)
        self.assertEqual(MODULE.parse_duration("5m"), 300)
        self.assertEqual(MODULE.parse_duration("1.5h"), 5400)
        self.assertEqual(MODULE.parse_duration("250ms"), 0.25)

    def test_rejects_invalid_or_excessive_durations(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.parse_duration("later")
        with self.assertRaises(ValueError):
            MODULE.parse_duration("25h")

    def test_prints_only_one_completion_record(self) -> None:
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "20ms"],
            check=True,
            capture_output=True,
            text=True,
        )
        lines = result.stdout.splitlines()
        self.assertEqual(len(lines), 1)
        self.assertEqual(json.loads(lines[0])["status"], "elapsed")
        self.assertEqual(result.stderr, "")


if __name__ == "__main__":
    unittest.main()
