"""Snapshot assertions record accidents as requirements.

A snapshot passes because the output equals whatever it happened to be when the
file was written, so every incidental detail becomes a thing that must not
change. Assert the specific facts the test is about instead.

Only test files are checked: a basename pytest collects (``test_*.py`` or
``*_test.py``), or any file under a ``tests``/``test`` directory. Elsewhere
``snapshot`` is an ordinary name, and comparing against it says nothing about
snapshot testing.

Snapshots still earn their keep in files whose name says that is all they do,
so ``*_snapshot_test.py`` and ``test_*_snapshot.py`` are exempt.

No ruff rule knows about syrupy or pytest-snapshot, so this is a custom AST
check. It recognises the two call shapes those libraries document:
``assert value == snapshot`` / ``== snapshot(...)`` for syrupy, and
``snapshot.assert_match(...)`` for pytest-snapshot.
"""

import ast
from fnmatch import fnmatch
from pathlib import PurePath

from standards_checks.finding import Finding

CHECK_ID = "no-large-test-snapshots"
SNAPSHOT_FIXTURE = "snapshot"
ALLOWED_FILENAME_PATTERNS = ("*_snapshot_test.py", "test_*_snapshot.py")
TEST_FILENAME_PATTERNS = ("test_*.py", "*_test.py")
TEST_DIRECTORY_NAMES = frozenset({"tests", "test"})
_ADVICE = "assert the specific facts the test is about"


def _is_snapshot_allowed(filename: str) -> bool:
    name = PurePath(filename).name
    return any(fnmatch(name, pattern) for pattern in ALLOWED_FILENAME_PATTERNS)


def _is_test_file(filename: str) -> bool:
    path = PurePath(filename)
    return any(
        fnmatch(path.name, pattern) for pattern in TEST_FILENAME_PATTERNS
    ) or bool(TEST_DIRECTORY_NAMES.intersection(path.parts[:-1]))


def _is_syrupy_snapshot(node: ast.expr) -> bool:
    if isinstance(node, ast.Name):
        return node.id == SNAPSHOT_FIXTURE
    return (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == SNAPSHOT_FIXTURE
    )


def _is_pytest_snapshot_call(node: ast.Call) -> bool:
    return (
        isinstance(node.func, ast.Attribute)
        and node.func.attr == "assert_match"
        and isinstance(node.func.value, ast.Name)
        and node.func.value.id == SNAPSHOT_FIXTURE
    )


def check_source(source: str, filename: str) -> list[Finding]:
    """Report syrupy and pytest-snapshot assertions outside snapshot-only files."""
    if not _is_test_file(filename) or _is_snapshot_allowed(filename):
        return []
    findings: list[Finding] = []
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Compare) and any(
            _is_syrupy_snapshot(operand) for operand in (node.left, *node.comparators)
        ):
            findings.append(
                Finding(
                    check_id=CHECK_ID,
                    line=node.lineno,
                    col=node.col_offset + 1,
                    message=f"syrupy snapshot assertion; {_ADVICE}",
                )
            )
        elif isinstance(node, ast.Call) and _is_pytest_snapshot_call(node):
            findings.append(
                Finding(
                    check_id=CHECK_ID,
                    line=node.lineno,
                    col=node.col_offset + 1,
                    message=f"pytest-snapshot assertion; {_ADVICE}",
                )
            )
    return sorted(findings, key=lambda finding: (finding.line, finding.col))
