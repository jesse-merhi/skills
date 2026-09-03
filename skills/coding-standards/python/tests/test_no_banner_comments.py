from textwrap import dedent

from standards_checks.no_banner_comments import check_source


def check(source: str) -> list[tuple[int, int, str]]:
    return [
        (finding.line, finding.col, finding.check_id)
        for finding in check_source(dedent(source), "module.py")
    ]


def test_reports_a_dash_banner_at_its_own_position() -> None:
    source = """\
    value = 1
    # ----------
    other = 2
    """
    assert check(source) == [(2, 1, "no-banner-comments")]


def test_reports_an_equals_banner() -> None:
    source = """\
    # ==========
    value = 1
    """
    assert check(source) == [(1, 1, "no-banner-comments")]


def test_reports_a_trailing_banner_at_its_column() -> None:
    source = """\
    value = 1  # ------------
    """
    assert check(source) == [(1, 12, "no-banner-comments")]


def test_allows_a_divider_shorter_than_the_banner_threshold() -> None:
    source = """\
    # ---------
    value = 1
    """
    assert check(source) == []


def test_allows_a_comment_that_says_something() -> None:
    source = """\
    # --- parsing ---
    # Retry once: the upstream index is eventually consistent.
    value = 1
    """
    assert check(source) == []


def test_ignores_dashes_inside_a_string_literal() -> None:
    source = """\
    separator = "-------------------"
    """
    assert check(source) == []
