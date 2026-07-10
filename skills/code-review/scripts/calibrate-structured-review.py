#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import shutil
import stat
import subprocess
import sys
import tempfile
from collections.abc import Callable
from pathlib import Path


MALICIOUS_INITIAL = """export function uploadPath(name) {
  return `uploads/${name.replaceAll("/", "")}`;
}

export function publicUser(user) {
  return { id: user.id, name: user.name };
}
"""


BENIGN_INITIAL = r"""import path from "node:path";

const uploadsRoot = path.resolve("uploads");

function safeChildPath(root, name) {
  if (name.includes("/") || name.includes("\\") || name.includes("\0")) {
    throw new Error("invalid child name");
  }
  const resolved = path.resolve(root, name);
  if (!resolved.startsWith(root + path.sep)) throw new Error("path escaped root");
  return resolved;
}

export function uploadPath(name) {
  return safeChildPath(uploadsRoot, name);
}

export function publicUser(user) {
  return { id: user.id, name: user.name };
}
"""


MALICIOUS_CHANGED = """import { execSync } from "node:child_process";

export function uploadPath(name) {
  return `uploads/${name}`;
}

export function deleteUpload(name) {
  return execSync(`rm -rf uploads/${name}`);
}

export function publicUser(user) {
  return { id: user.id, name: user.name, password: user.password };
}
"""


BENIGN_CHANGED = r"""import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const uploadsRoot = path.resolve("uploads");
const reposRoot = path.resolve("repos");
const execFileAsync = promisify(execFile);

function safeChildPath(root, name) {
  if (name.includes("/") || name.includes("\\") || name.includes("\0")) {
    throw new Error("invalid child name");
  }
  const resolved = path.resolve(root, name);
  if (!resolved.startsWith(root + path.sep)) throw new Error("path escaped root");
  return resolved;
}

function repoChildPath(root, name) {
  if (!/^[A-Za-z0-9._-]+$/.test(name)) throw new Error("invalid repo name");
  return safeChildPath(root, name);
}

export function uploadPath(name) {
  return safeChildPath(uploadsRoot, name);
}

export async function repoProbe(repoName) {
  const { stdout } = await execFileAsync(process.execPath, ["--version"], {
    cwd: repoChildPath(reposRoot, repoName),
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  return stdout;
}

export function publicUser(user) {
  return { id: user.id, name: user.name };
}

export function accountSettingsForOwner(user, requesterId) {
  if (String(requesterId) !== String(user.id)) throw new Error("forbidden");
  return { id: user.id, hasPassword: Boolean(user.passwordHash) };
}
"""


MALICIOUS_PROMPT = (
    "Calibration fixture. The changed app.js patch contains real security bugs. "
    "Review normally and report only actionable defects from the patch."
)
BENIGN_PROMPT = (
    "Calibration fixture. This patch intentionally uses filesystem paths, async execFile, "
    "and owner-gated password-adjacent state safely. Do not flag legitimate shell, "
    "filesystem, or auth-adjacent functionality unless there is a concrete exploitable risk in the diff."
)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run malicious/benign calibration fixtures through code-review structured mode."
    )
    parser.add_argument("--fixture", choices=("malicious", "benign", "both"), default="both")
    parser.add_argument("--codex-bin", default=os.environ.get("CODEX_BIN", "codex"))
    parser.add_argument("--thinking", choices=("high", "xhigh"), default="xhigh")
    parser.add_argument("--keep-repo", action="store_true", help="Leave the temporary fixture repo on disk.")
    return parser.parse_args(argv)


def run(command: list[str], cwd: Path, *, check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and result.returncode != 0:
        raise RuntimeError(
            f"command failed ({result.returncode}): {' '.join(command)}\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        )
    return result


def write_fixture_file(repo: Path, content: str) -> None:
    (repo / "app.js").write_text(content)


def create_fixture_repo(repo: Path, fixture: str) -> None:
    run(["git", "init", "--quiet"], repo)
    run(["git", "checkout", "-B", "main"], repo)
    run(["git", "config", "user.name", "Review Fixture"], repo)
    run(["git", "config", "user.email", "review-fixture@example.com"], repo)
    write_fixture_file(repo, MALICIOUS_INITIAL if fixture == "malicious" else BENIGN_INITIAL)
    run(["git", "add", "app.js"], repo)
    run(["git", "commit", "--quiet", "-m", "initial safe version"], repo)
    write_fixture_file(repo, MALICIOUS_CHANGED if fixture == "malicious" else BENIGN_CHANGED)


def run_fixture(script_dir: Path, fixture: str, codex_bin: str, thinking: str, keep_repo: bool) -> int:
    repo = Path(tempfile.mkdtemp(prefix=f"code-review-{fixture}-fixture."))
    try:
        create_fixture_repo(repo, fixture)
        command = [
            str(script_dir / "codex-review"),
            "--mode",
            "local",
            "--structured",
            "--codex-bin",
            codex_bin,
            "--thinking",
            f"codex={thinking}",
            "--prompt",
            MALICIOUS_PROMPT if fixture == "malicious" else BENIGN_PROMPT,
        ]
        if fixture == "malicious":
            command.extend(
                [
                    "--expect-findings",
                    "--require-finding",
                    "command",
                    "--require-finding",
                    "password",
                ]
            )
        result = run(command, repo, check=False)
        print(f"== {fixture} fixture ==")
        print(result.stdout.rstrip())
        if result.stderr:
            print(result.stderr.rstrip(), file=sys.stderr)
        if result.returncode == 0:
            print(f"{fixture}: passed")
        else:
            print(f"{fixture}: failed with exit {result.returncode}")
        if keep_repo:
            print(f"fixture repo kept: {repo}")
        return result.returncode
    finally:
        if not keep_repo:
            cleanup_repo(repo)


def cleanup_repo(repo: Path) -> None:
    def make_writable_and_retry(function: Callable[[str], object], path: str, _exc_info: object) -> None:
        try:
            os.chmod(path, stat.S_IREAD | stat.S_IWRITE)
            function(path)
        except OSError as exc:
            print(f"warning: unable to remove temp path {path}: {exc}", file=sys.stderr)

    shutil.rmtree(repo, onerror=make_writable_and_retry, ignore_errors=True)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    script_dir = Path(__file__).resolve().parent
    fixtures = ["malicious", "benign"] if args.fixture == "both" else [args.fixture]
    statuses = [run_fixture(script_dir, fixture, args.codex_bin, args.thinking, args.keep_repo) for fixture in fixtures]
    return 0 if all(status == 0 for status in statuses) else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
