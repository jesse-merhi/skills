from pathlib import Path
from textwrap import dedent

import pytest

from standards_checks.cli import main

BANNER_AND_WRAPPER = dedent("""\
    # ==========
    def fetch(customer_id):
        return load(customer_id)
""")


def test_reports_each_finding_in_ruff_format_and_exits_one(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    target = tmp_path / "module.py"
    target.write_text(BANNER_AND_WRAPPER)

    exit_code = main([str(target)])

    assert exit_code == 1
    assert capsys.readouterr().out.splitlines() == [
        f"{target}:1:1: no-banner-comments decorative banner comment; "
        "write a plain section comment that says what the section is",
        f"{target}:2:1: no-trivial-forwarding-wrapper `fetch` only forwards its "
        "parameters to `load`; inline it unless the name marks a concept, "
        "boundary, or test seam",
    ]


def test_exits_zero_when_nothing_is_found(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    (tmp_path / "module.py").write_text("value = 1\n")

    assert main([str(tmp_path)]) == 0
    assert capsys.readouterr().out == ""


def test_checks_python_files_under_a_directory_but_skips_caches(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    (tmp_path / "pkg").mkdir()
    (tmp_path / "pkg" / "module.py").write_text("# ----------\n")
    (tmp_path / ".venv").mkdir()
    (tmp_path / ".venv" / "vendored.py").write_text("# ----------\n")
    (tmp_path / "__pycache__").mkdir()
    (tmp_path / "__pycache__" / "cached.py").write_text("# ----------\n")

    assert main([str(tmp_path)]) == 1
    reported = capsys.readouterr().out.splitlines()
    assert reported == [
        f"{tmp_path / 'pkg' / 'module.py'}:1:1: no-banner-comments "
        "decorative banner comment; write a plain section comment that says "
        "what the section is"
    ]


def test_reports_a_file_it_cannot_parse_without_pretending_it_is_clean(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    target = tmp_path / "broken.py"
    target.write_text("def fetch(:\n")

    assert main([str(target)]) == 1
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err.startswith(f"{target}: cannot read:")
