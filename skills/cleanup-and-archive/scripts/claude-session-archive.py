#!/usr/bin/env python3
"""Reversibly archive a stopped Claude CLI session, or queue it until exit."""

import argparse
import json
import os
from pathlib import Path
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


def session_pids(config, session_id):
    pids = set()
    for record in (config / "sessions").glob("*.json"):
        data = json.loads(record.read_text())
        if data.get("sessionId") == session_id:
            pid = data.get("pid")
            if not isinstance(pid, int) or pid <= 0 or record.stem != str(pid):
                raise ValueError(f"Invalid live-session record: {record}")
            if running(pid):
                pids.add(pid)
    return pids


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
        raise ValueError("Session is running; use archive --defer and then /exit")
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
        epilog="Current session: archive SESSION_ID --defer, then /exit. "
        "Use status to confirm, cancel to revoke a queued archive, "
        "or restore before claude --resume SESSION_ID. "
        "Archives only the transcript and its adjacent session directory. "
        "Other Claude state and Git worktrees stay in place. macOS/Linux only.",
    )
    parser.add_argument("command", choices=["archive", "restore", "status", "cancel"])
    parser.add_argument("session_id", help="Full Claude CLI transcript UUID")
    parser.add_argument("--config-dir", type=Path, default=Path(os.environ.get("CLAUDE_CONFIG_DIR", "~/.claude")).expanduser())
    parser.add_argument("--defer", action="store_true", help="Wait in a detached process for this session to exit (up to 24 hours)")
    parser.add_argument("--wait", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
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
                raise ValueError("Session is running; use archive --defer and then /exit")
            bundle.mkdir(mode=0o700, exist_ok=True)
            data = {"session_id": session_id, "project": transcript.parent.name,
                    "companion": transcript.with_suffix("").exists(), "status": "queued"}
            save_manifest(bundle, data)
            if pids:
                with (bundle / "worker.log").open("a") as log:
                    worker = subprocess.Popen(
                        [sys.executable, str(Path(__file__).resolve()), "archive", session_id,
                         "--config-dir", str(config), "--wait"],
                        stdin=subprocess.DEVNULL, stdout=log, stderr=log,
                        cwd=root, start_new_session=True,
                    )
                data.update(worker_pid=worker.pid, waiting_for_pids=sorted(pids))
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
