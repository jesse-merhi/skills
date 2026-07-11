#!/usr/bin/env python3
"""Sleep silently for a validated duration and print one completion record."""

from __future__ import annotations

import argparse
import json
import re
import time


DURATION_RE = re.compile(r"^(?P<value>[0-9]+(?:\.[0-9]+)?)(?P<unit>ms|s|m|h)?$")
UNIT_SECONDS = {None: 1.0, "ms": 0.001, "s": 1.0, "m": 60.0, "h": 3600.0}


def parse_duration(value: str) -> float:
    match = DURATION_RE.fullmatch(value.strip().lower())
    if match is None:
        raise ValueError("duration must be a non-negative number with ms, s, m, or h")
    seconds = float(match.group("value")) * UNIT_SECONDS[match.group("unit")]
    if seconds > 86_400:
        raise ValueError("duration must not exceed 24 hours")
    return seconds


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("duration", help="Duration such as 300, 30s, 5m, or 1h")
    args = parser.parse_args()

    try:
        requested_seconds = parse_duration(args.duration)
    except ValueError as error:
        parser.error(str(error))

    started = time.monotonic()
    time.sleep(requested_seconds)
    elapsed = time.monotonic() - started
    print(
        json.dumps(
            {
                "requested_seconds": requested_seconds,
                "elapsed_seconds": round(elapsed, 3),
                "status": "elapsed",
            },
            separators=(",", ":"),
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
