from pathlib import Path
from textwrap import dedent

import pytest

from standards_checks.finding import Finding
from standards_checks.no_large_test_snapshots import check_source

SYRUPY_SOURCE = """\
def test_report(snapshot) -> None:
    assert build_report() == snapshot
"""


def check(source: str, filename: str = "test_report.py") -> list[Finding]:
    return check_source(dedent(source), filename)


def test_reports_a_bare_syrupy_snapshot_comparison() -> None:
    (finding,) = check(SYRUPY_SOURCE)
    assert (finding.line, finding.col, finding.check_id) == (
        2,
        12,
        "no-large-test-snapshots",
    )
    assert "syrupy snapshot assertion" in finding.message


def test_reports_a_configured_syrupy_snapshot_comparison() -> None:
    source = """\
    def test_report(snapshot) -> None:
        assert build_report() == snapshot(name="report")
    """
    (finding,) = check(source)
    assert "syrupy snapshot assertion" in finding.message


def test_reports_a_pytest_snapshot_assertion() -> None:
    source = """\
    def test_report(snapshot) -> None:
        snapshot.assert_match(build_report(), "report.json")
    """
    (finding,) = check(source)
    assert (finding.line, finding.col) == (2, 5)
    assert "pytest-snapshot assertion" in finding.message


@pytest.mark.parametrize(
    "filename",
    ["report_snapshot_test.py", "test_report_snapshot.py", "pkg/test_a_snapshot.py"],
)
def test_allows_snapshots_in_files_named_for_them(filename: str) -> None:
    assert check(SYRUPY_SOURCE, filename) == []


def test_allows_an_assertion_on_the_specific_facts() -> None:
    source = """\
    def test_report() -> None:
        report = build_report()
        assert report.total == 3
        assert report.currency == "GBP"
    """
    assert check(source) == []


def test_reports_a_snapshot_comparison_written_the_other_way_round() -> None:
    source = """\
    def test_report(snapshot) -> None:
        assert snapshot == build_report()
    """
    (finding,) = check(source)
    assert "syrupy snapshot assertion" in finding.message


def test_ignores_an_unrelated_name_that_only_looks_like_the_fixture() -> None:
    source = """\
    def test_report(snapshotter) -> None:
        assert build_report() == snapshotter.value
    """
    assert check(source) == []


def test_ignores_a_bare_name_that_is_not_the_fixture() -> None:
    source = """\
    def test_report(snapshotter) -> None:
        assert build_report() == snapshotter
    """
    assert check(source) == []


@pytest.mark.parametrize(
    "filename",
    ["src/state.py", "state.py", "src/testing.py"],
)
def test_allows_a_snapshot_comparison_outside_a_test_file(filename: str) -> None:
    assert check("if state == snapshot:\n    pass\n", filename) == []


@pytest.mark.parametrize(
    "filename",
    ["tests/test_state.py", "state_test.py", "test/helpers.py"],
)
def test_reports_a_snapshot_comparison_in_a_test_file(filename: str) -> None:
    (finding,) = check("if state == snapshot:\n    pass\n", filename)
    assert "syrupy snapshot assertion" in finding.message


def test_reads_directory_names_from_the_working_directory(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    repo = tmp_path / "test" / "repo"
    repo.mkdir(parents=True)
    monkeypatch.chdir(repo)

    assert check(SYRUPY_SOURCE, str(repo / "app" / "models.py")) == []
    assert check(SYRUPY_SOURCE, str(repo / "tests" / "models.py")) != []
