#!/usr/bin/env python3
"""Reversibly archive Claude CLI files after exit, with optional graceful closeout."""

import argparse
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import uuid


def running(pid):
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True


def read_session_record(record):
    # Claude rewrites these records in place and removes them during exit.
    deadline = time.monotonic() + 1
    while True:
        try:
            return json.loads(record.read_text())
        except FileNotFoundError:
            return None
        except json.JSONDecodeError:
            if time.monotonic() >= deadline:
                raise ValueError(f"Unreadable live-session record: {record}")
            time.sleep(0.05)


def session_pids(config, session_id):
    pids = set()
    for record in (config / "sessions").glob("*.json"):
        data = read_session_record(record)
        if data is None:
            continue
        if data.get("sessionId") == session_id:
            pid = data.get("pid")
            if not isinstance(pid, int) or pid <= 0 or record.stem != str(pid):
                raise ValueError(f"Invalid live-session record: {record}")
            if running(pid):
                pids.add(pid)
    return pids


def cli_parent(config, session_id):
    """Match a native CLI session record to this command's real ancestry."""
    matches = []
    pid = os.getppid()
    seen = set()
    while pid > 1 and pid not in seen:
        seen.add(pid)
        record = read_session_record(config / "sessions" / f"{pid}.json")
        if record and record.get("pid") == pid and record.get("sessionId") == session_id and record.get("entrypoint") == "cli":
            matches.append(pid)
        parent = subprocess.run(["ps", "-o", "ppid=", "-p", str(pid)], capture_output=True, text=True, check=False)
        if parent.returncode or not parent.stdout.strip():
            break
        pid = int(parent.stdout.strip())
    if len(matches) != 1:
        raise ValueError("Cannot identify exactly one current Claude CLI ancestor; session left open")
    return matches[0]


def save_manifest(bundle, data):
    temporary = bundle / "manifest.tmp"
    temporary.write_text(json.dumps(data, indent=2) + "\n")
    temporary.replace(bundle / "manifest.json")


def read_manifest(bundle, session_id):
    data = json.loads((bundle / "manifest.json").read_text())
    project = data.get("project")
    if data.get("session_id") != session_id or not isinstance(project, str):
        raise ValueError("Invalid archive manifest")
    if not project or project in (".", "..") or Path(project).name != project:
        raise ValueError("Invalid project directory in archive manifest")
    if not isinstance(data.get("companion"), bool):
        raise ValueError("Invalid companion-directory flag in archive manifest")
    return data


def paths(config, bundle, data):
    project = config / "projects" / data["project"]
    result = [(project / f'{data["session_id"]}.jsonl', bundle / "transcript.jsonl")]
    if data["companion"]:
        result.append((project / data["session_id"], bundle / "files"))
    return result


def move_all(pairs):
    # Preflight every destination, then roll back completed renames on failure.
    for source, destination in pairs:
        if source.is_symlink() or destination.exists() or destination.is_symlink():
            raise ValueError(f"Refusing symlink or existing destination: {destination}")
        if not source.exists():
            raise ValueError(f"Missing source: {source}")
    moved = []
    try:
        for source, destination in pairs:
            source.rename(destination)
            moved.append((source, destination))
    except OSError:
        for source, destination in reversed(moved):
            if source.exists():
                raise ValueError(f"Rollback blocked; preserved files remain at {destination}")
            destination.rename(source)
        raise


def archive(config, bundle, data):
    if session_pids(config, data["session_id"]):
        raise ValueError("Session is running; use archive --defer")
    # Final tools may create the adjacent directory after archiving was queued.
    data["companion"] = (config / "projects" / data["project"] / data["session_id"]).exists()
    data["status"] = "archiving"
    save_manifest(bundle, data)
    try:
        move_all(paths(config, bundle, data))
    except (OSError, ValueError) as error:
        data.update(status="failed", error=str(error))
        save_manifest(bundle, data)
        raise
    data["status"] = "archived"
    save_manifest(bundle, data)


def finish(config, bundle, data):
    """A skill Stop hook may request one graceful shutdown of its own CLI."""
    if data["status"] != "queued" or not data.get("auto_exit") or data.get("exit_requested"):
        return
    try:
        event = json.load(sys.stdin)
        transcript = config / "projects" / data["project"] / f'{data["session_id"]}.jsonl'
        if (not isinstance(event, dict) or event.get("hook_event_name") != "Stop"
                or event.get("session_id") != data["session_id"] or "agent_id" in event
                or event.get("stop_hook_active") is not False):
            raise ValueError("Expected the armed main session's final Stop event; session left open")
        if event.get("background_tasks") != [] or event.get("session_crons") != []:
            raise ValueError("Stop does not confirm empty background tasks and session crons; session left open")
        message, transcript_path = event.get("last_assistant_message"), event.get("transcript_path")
        if (not isinstance(message, str) or not message.strip() or not isinstance(transcript_path, str)
                or Path(transcript_path).resolve() != transcript.resolve()):
            raise ValueError("Stop does not confirm this transcript's final response; session left open")
        if not running(data["worker_pid"]):
            raise ValueError("Archive worker is not running; session left open")
        pid = cli_parent(config, data["session_id"])
        if pid != data["exit_pid"]:
            raise ValueError("Current CLI differs from the armed process; session left open")
        # Persist first: repeated Stop hooks must never send a second signal.
        data["exit_requested"] = True
        data.pop("auto_exit_error", None)
        save_manifest(bundle, data)
        os.kill(pid, signal.SIGTERM)
    except (OSError, ValueError) as error:
        data["auto_exit_error"] = str(error)
        save_manifest(bundle, data)
        raise


def wait_for_exit(config, bundle, session_id, lock):
    import fcntl

    fcntl.flock(lock, fcntl.LOCK_EX)
    data = read_manifest(bundle, session_id)
    if data["status"] == "cancelled":
        return data
    if data["status"] != "queued" or data["worker_pid"] != os.getpid():
        raise ValueError("This worker does not own the queued archive")
    fcntl.flock(lock, fcntl.LOCK_UN)
    deadline = time.monotonic() + 86400
    pids = set(data["waiting_for_pids"])
    try:
        while True:
            data = read_manifest(bundle, session_id)
            if data["status"] == "cancelled":
                return data
            pids = {pid for pid in pids if running(pid)} | session_pids(config, session_id)
            if not pids:
                break
            if time.monotonic() >= deadline:
                raise ValueError("Session still running after 24 hours; original files retained")
            time.sleep(1)
        fcntl.flock(lock, fcntl.LOCK_EX)
        data = read_manifest(bundle, session_id)
        if data["status"] == "queued":
            archive(config, bundle, data)
    except (OSError, ValueError) as error:
        fcntl.flock(lock, fcntl.LOCK_EX)
        data = read_manifest(bundle, session_id)
        if data["status"] == "queued":
            data.update(status="failed", error=str(error))
            save_manifest(bundle, data)
        raise
    return data


def main():
    parser = argparse.ArgumentParser(
        description=__doc__,
        epilog="Current session after cleanup: archive SESSION_ID --defer --auto-exit. "
        "The skill's Stop hook calls finish after the final response; it requests SIGTERM once, never force-kills. "
        "Without --auto-exit, --defer only waits for an independent exit. "
        "Use status to confirm, cancel to revoke a queued archive, "
        "or restore before claude --resume SESSION_ID. "
        "Archives only the transcript and its adjacent session directory. "
        "Other Claude state and Git worktrees stay in place. macOS/Linux only.",
    )
    parser.add_argument("command", choices=["archive", "restore", "status", "cancel", "finish"])
    parser.add_argument("session_id", help="Full Claude CLI transcript UUID")
    parser.add_argument("--config-dir", type=Path, default=Path(os.environ.get("CLAUDE_CONFIG_DIR", "~/.claude")).expanduser())
    parser.add_argument("--defer", action="store_true", help="Wait in a detached process for this session to exit (up to 24 hours)")
    parser.add_argument("--auto-exit", action="store_true", help="With archive --defer, arm the skill's one-shot Stop hook to close its current CLI gracefully")
    parser.add_argument("--wait", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    if args.auto_exit and (args.command != "archive" or not args.defer):
        parser.error("--auto-exit requires archive --defer")
    if os.name != "posix":
        parser.error("This helper supports macOS/Linux; use native Desktop archiving here")
    import fcntl

    session_id = str(uuid.UUID(args.session_id))
    config = args.config_dir.resolve()
    root = config / "session-archive"
    bundle = root / session_id
    if args.command == "status":
        data = read_manifest(bundle, session_id)
        worker_pid = data.get("worker_pid")
        if data["status"] == "queued" and (worker_pid is None or not running(worker_pid)):
            data["status"] = "failed"
            data["error"] = "Archive worker exited before confirming completion; inspect files with status and restore"
        print(json.dumps(data))
        return
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    with (root / f"{session_id}.lock").open("a") as lock:
        if args.wait:
            print(json.dumps(wait_for_exit(config, bundle, session_id, lock)))
            return
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if args.command == "finish":
            finish(config, bundle, read_manifest(bundle, session_id))
            return
        if args.command == "cancel":
            data = read_manifest(bundle, session_id)
            if data["status"] != "queued":
                raise ValueError("Only a queued archive can be cancelled")
            data["status"] = "cancelled"
            save_manifest(bundle, data)
        elif args.command == "restore":
            data = read_manifest(bundle, session_id)
            if session_pids(config, session_id):
                raise ValueError("Cannot restore while this session is running")
            pairs = [(saved, original) for original, saved in paths(config, bundle, data) if saved.exists()]
            if not pairs:
                raise ValueError("No archived files to restore")
            for _, destination in pairs:
                destination.parent.mkdir(parents=True, exist_ok=True)
            move_all(pairs)
            data["status"] = "restored"
            save_manifest(bundle, data)
        else:
            if bundle.exists() and read_manifest(bundle, session_id)["status"] not in ("restored", "cancelled"):
                raise ValueError(f"Archive already exists; use status or restore: {bundle}")
            matches = list((config / "projects").glob(f"*/{session_id}.jsonl"))
            if len(matches) != 1:
                raise ValueError(f"Expected exactly one transcript, found {len(matches)}")
            transcript = matches[0]
            if transcript.is_symlink() or transcript.parent.is_symlink():
                raise ValueError("Refusing a symlinked transcript or project directory")
            pids = session_pids(config, session_id)
            if pids and not args.defer:
                raise ValueError("Session is running; use archive --defer")
            exit_pid = cli_parent(config, session_id) if args.auto_exit else None
            if exit_pid is not None:
                pids.add(exit_pid)
            bundle.mkdir(mode=0o700, exist_ok=True)
            data = {"session_id": session_id, "project": transcript.parent.name,
                    "companion": transcript.with_suffix("").exists(), "status": "queued"}
            save_manifest(bundle, data)
            if pids:
                # Cleanup may remove the installed skill or checkout before Stop.
                helper = bundle / "finish.py"
                helper.write_bytes(Path(__file__).read_bytes())
                helper.chmod(0o700)
                with (bundle / "worker.log").open("a") as log:
                    worker = subprocess.Popen(
                        [sys.executable, str(helper), "archive", session_id,
                         "--config-dir", str(config), "--wait"],
                        stdin=subprocess.DEVNULL, stdout=log, stderr=log,
                        cwd=root, start_new_session=True,
                    )
                data.update(worker_pid=worker.pid, waiting_for_pids=sorted(pids))
                if exit_pid is not None:
                    data.update(auto_exit=True, exit_pid=exit_pid)
                save_manifest(bundle, data)
            else:
                archive(config, bundle, data)
        print(json.dumps(data))


if __name__ == "__main__":
    os.umask(0o077)
    try:
        main()
    except (OSError, ValueError) as error:
        print(json.dumps({"status": "failed", "error": str(error)}), file=sys.stderr)
        sys.exit(1)
