from textwrap import dedent

import pytest

from standards_checks.no_large_test_snapshots import check_source

SYRUPY_SOURCE = """\
def test_report(snapshot):
    assert build_report() == snapshot
"""


def check(source: str, filename: str = "test_report.py"):
    return check_source(dedent(source), filename)


def test_reports_a_bare_syrupy_snapshot_comparison():
    (finding,) = check(SYRUPY_SOURCE)
    assert (finding.line, finding.col, finding.check_id) == (
        2,
        12,
        "no-large-test-snapshots",
    )
    assert "syrupy snapshot assertion" in finding.message


def test_reports_a_configured_syrupy_snapshot_comparison():
    source = """\
    def test_report(snapshot):
        assert build_report() == snapshot(name="report")
    """
    (finding,) = check(source)
    assert "syrupy snapshot assertion" in finding.message


def test_reports_a_pytest_snapshot_assertion():
    source = """\
    def test_report(snapshot):
        snapshot.assert_match(build_report(), "report.json")
    """
    (finding,) = check(source)
    assert (finding.line, finding.col) == (2, 5)
    assert "pytest-snapshot assertion" in finding.message


@pytest.mark.parametrize(
    "filename",
    ["report_snapshot_test.py", "test_report_snapshot.py", "pkg/test_a_snapshot.py"],
)
def test_allows_snapshots_in_files_named_for_them(filename: str):
    assert check(SYRUPY_SOURCE, filename) == []


def test_allows_an_assertion_on_the_specific_facts():
    source = """\
    def test_report():
        report = build_report()
        assert report.total == 3
        assert report.currency == "GBP"
    """
    assert check(source) == []


def test_ignores_an_unrelated_name_that_only_looks_like_the_fixture():
    source = """\
    def test_report(snapshotter):
        assert build_report() == snapshotter.value
    """
    assert check(source) == []
