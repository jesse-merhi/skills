"""Run every check over the given files and directories.

Output is one finding per line in ruff's shape, so editors and CI already know
how to read it::

    path/to/file.py:12:1: no-banner-comments decorative banner comment; ...
"""

import argparse
import sys
import tokenize
from collections.abc import Callable, Iterable, Iterator, Sequence
from pathlib import Path

from standards_checks import (
    no_banner_comments,
    no_large_test_snapshots,
    no_trivial_forwarding_wrapper,
)
from standards_checks.finding import Finding

CheckSource = Callable[[str, str], list[Finding]]

CHECKS: tuple[CheckSource, ...] = (
    no_banner_comments.check_source,
    no_large_test_snapshots.check_source,
    no_trivial_forwarding_wrapper.check_source,
)

IGNORED_DIRECTORY_NAMES = frozenset(
    {
        ".bzr",
        ".direnv",
        ".eggs",
        ".git",
        ".git-rewrite",
        ".hg",
        ".ipynb_checkpoints",
        ".mypy_cache",
        ".nox",
        ".pants.d",
        ".pyenv",
        ".pytest_cache",
        ".pytype",
        ".ruff_cache",
        ".svn",
        ".tox",
        ".venv",
        "__pycache__",
        "__pypackages__",
        "_build",
        "buck-out",
        "dist",
        "node_modules",
        "site-packages",
        "venv",
    }
)


def python_files(paths: Iterable[str]) -> Iterator[Path]:
    """Yield the Python files named directly, plus those under named directories."""
    for raw in paths:
        path = Path(raw)
        if not path.is_dir():
            yield path
            continue
        for directory, directory_names, filenames in path.walk():
            directory_names[:] = sorted(
                name for name in directory_names if name not in IGNORED_DIRECTORY_NAMES
            )
            for filename in sorted(filenames):
                if filename.endswith(".py"):
                    yield directory / filename


def check_file(path: Path) -> list[Finding]:
    """Run every check over one file, ordered by position."""
    with tokenize.open(path) as source_file:
        source = source_file.read()
    findings = [finding for check in CHECKS for finding in check(source, str(path))]
    return sorted(findings, key=lambda finding: (finding.line, finding.col))


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m standards_checks",
        description="Report coding-standards violations that no ruff rule covers.",
    )
    parser.add_argument("paths", nargs="+", help="files or directories to check")
    arguments = parser.parse_args(argv)

    failed = False
    for path in python_files(arguments.paths):
        try:
            findings = check_file(path)
        except (
            OSError,
            SyntaxError,
            UnicodeDecodeError,
            tokenize.TokenError,
        ) as error:
            print(f"{path}: cannot read: {error}", file=sys.stderr)
            failed = True
            continue
        for finding in findings:
            print(finding.format(str(path)))
            failed = True
    return 1 if failed else 0
