"""Snapshot assertions record accidents as requirements.

A snapshot passes because the output equals whatever it happened to be when the
file was written, so every incidental detail becomes a thing that must not
change. Assert the specific facts the test is about instead.

Only test files are checked: a basename pytest collects (``test_*.py`` or
``*_test.py``), or any file under a ``tests``/``test`` directory inside the
working directory. Elsewhere
``snapshot`` is an ordinary name, and comparing against it says nothing about
snapshot testing.

Snapshots still earn their keep in files whose name says that is all they do,
so ``*_snapshot_test.py`` and ``test_*_snapshot.py`` are exempt.

No ruff rule knows about syrupy or pytest-snapshot, so this is a custom AST
check. It recognises the two call shapes those libraries document:
``assert value == snapshot`` / ``== snapshot(...)`` for syrupy, and
``snapshot.assert_match(...)`` for pytest-snapshot.
Only unreassigned function parameters named ``snapshot`` are treated as fixtures;
local expected values and references in nested expression scopes are not inferred.
"""

import ast
import symtable
from collections.abc import Iterator
from fnmatch import fnmatch
from pathlib import Path, PurePath

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
    # Directory names count from the working directory, the target root when
    # the CLI runs from its wired task, so a checkout under a directory called
    # `test` does not turn its whole tree into test files. A path outside the
    # working directory keeps every ancestor.
    path = Path(filename)
    if path.is_absolute() and path.is_relative_to(Path.cwd()):
        path = path.relative_to(Path.cwd())
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


def _is_syrupy_comparison(node: ast.Compare) -> bool:
    left = node.left
    for operator, right in zip(node.ops, node.comparators, strict=True):
        if isinstance(operator, ast.Eq) and (
            _is_syrupy_snapshot(left) or _is_syrupy_snapshot(right)
        ):
            return True
        left = right
    return False


def _fixture_nodes(module: ast.Module, source: str, filename: str) -> Iterator[ast.AST]:
    function_tables: dict[tuple[str, int], symtable.SymbolTable] = {}
    pending_tables = [symtable.symtable(source, filename, "exec")]
    while pending_tables:
        table = pending_tables.pop()
        if table.get_type() == "function":
            function_tables[(table.get_name(), table.get_lineno())] = table
        pending_tables.extend(table.get_children())
    for function in ast.walk(module):
        if not isinstance(function, ast.FunctionDef | ast.AsyncFunctionDef):
            continue
        function_table = function_tables.get((function.name, function.lineno))
        if (
            function_table is None
            or SNAPSHOT_FIXTURE not in function_table.get_identifiers()
        ):
            continue
        symbol = function_table.lookup(SNAPSHOT_FIXTURE)
        if not symbol.is_parameter() or symbol.is_assigned() or symbol.is_imported():
            continue
        pending_nodes: list[ast.AST] = list(function.body)
        while pending_nodes:
            node = pending_nodes.pop()
            if isinstance(
                node,
                ast.FunctionDef
                | ast.AsyncFunctionDef
                | ast.ClassDef
                | ast.Lambda
                | ast.ListComp
                | ast.SetComp
                | ast.DictComp
                | ast.GeneratorExp,
            ):
                continue
            yield node
            pending_nodes.extend(ast.iter_child_nodes(node))


def check_source(source: str, filename: str) -> list[Finding]:
    """Report syrupy and pytest-snapshot assertions outside snapshot-only files."""
    if not _is_test_file(filename) or _is_snapshot_allowed(filename):
        return []
    findings: list[Finding] = []
    for node in _fixture_nodes(ast.parse(source), source, filename):
        if isinstance(node, ast.Compare) and _is_syrupy_comparison(node):
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
