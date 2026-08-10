#!/usr/bin/env python3
import argparse
import os
import signal
import subprocess
import sys


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ttl", type=int, required=True)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if args.ttl < 0:
        parser.error("--ttl must be non-negative")
    if args.command[:1] == ["--"]:
        args.command = args.command[1:]
    if not args.command:
        parser.error("a command is required after --")
    return args


def terminate_group(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is not None:
        return
    try:
        os.killpg(process.pid, signal.SIGTERM)
        process.wait(timeout=10)
    except ProcessLookupError:
        return
    except subprocess.TimeoutExpired:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            return
        process.wait()


def main() -> int:
    args = parse_args()
    process = subprocess.Popen(args.command, start_new_session=True)

    def handle_signal(signum: int, _frame: object) -> None:
        terminate_group(process)
        raise SystemExit(128 + signum)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    try:
        if args.ttl == 0:
            return process.wait()
        return process.wait(timeout=args.ttl)
    except subprocess.TimeoutExpired:
        terminate_group(process)
        return 124
    finally:
        terminate_group(process)


if __name__ == "__main__":
    sys.exit(main())
