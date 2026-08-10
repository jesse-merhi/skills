#!/usr/bin/env python3
import argparse
import json
import shutil
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--codex-home", type=Path, required=True)
    parser.add_argument("--claude-config-dir", type=Path, required=True)
    parser.add_argument("--destination", type=Path, required=True)
    parser.add_argument("--max-files", type=int, required=True)
    parser.add_argument("--max-bytes", type=int, required=True)
    args = parser.parse_args()
    if args.max_files <= 0:
        parser.error("--max-files must be positive")
    if args.max_bytes <= 0:
        parser.error("--max-bytes must be positive")
    return args


def candidates(roots: list[tuple[Path, Path]]) -> list[tuple[Path, Path, int, float]]:
    found: list[tuple[Path, Path, int, float]] = []
    for source_root, destination_root in roots:
        if not source_root.is_dir():
            continue
        for source in source_root.rglob("*"):
            if source.is_symlink() or not source.is_file():
                continue
            try:
                stat = source.stat()
            except OSError:
                continue
            found.append(
                (
                    source,
                    destination_root / source.relative_to(source_root),
                    stat.st_size,
                    stat.st_mtime,
                )
            )
    return sorted(found, key=lambda item: item[3], reverse=True)


def copy_recent(
    roots: list[tuple[Path, Path]],
    destination: Path,
    max_files: int,
    max_bytes: int,
) -> dict[str, int]:
    copied_files = 0
    copied_bytes = 0
    skipped_oversize = 0
    for source, relative, size, _mtime in candidates(roots):
        if copied_files >= max_files:
            break
        if size > max_bytes - copied_bytes:
            skipped_oversize += 1
            continue
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target, follow_symlinks=False)
        target.chmod(0o600)
        copied_files += 1
        copied_bytes += size
    return {
        "copiedFiles": copied_files,
        "copiedBytes": copied_bytes,
        "skippedOversize": skipped_oversize,
    }


def main() -> None:
    args = parse_args()
    args.destination.mkdir(parents=True, exist_ok=True)
    codex = copy_recent(
        [
            (args.codex_home / "sessions", Path("codex/sessions")),
            (
                args.codex_home / "archived_sessions",
                Path("codex/archived_sessions"),
            ),
        ],
        args.destination,
        args.max_files,
        args.max_bytes,
    )
    claude = copy_recent(
        [
            (
                args.claude_config_dir / "projects",
                Path("claude/projects"),
            )
        ],
        args.destination,
        args.max_files,
        args.max_bytes,
    )
    print(json.dumps({"codex": codex, "claude": claude}, sort_keys=True))


if __name__ == "__main__":
    main()
