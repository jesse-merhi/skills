"""Guards against the catalog and the Python config files it describes drifting.

catalog.json is the record of what each standard is enforced by; ruff.toml and
mypy.ini are what actually runs. If someone adds a rule to one and forgets the
other, the catalog starts lying about the codebase.
"""

import json
import re
import tomllib
from collections.abc import Callable
from configparser import ConfigParser
from importlib import import_module
from pathlib import Path

import pytest

CATALOG_ROOT = Path(__file__).resolve().parents[2]
CATALOG = json.loads((CATALOG_ROOT / "catalog.json").read_text())
PYTHON_PRESETS = CATALOG["presets"]["python"]
PYPROJECT = tomllib.loads((CATALOG_ROOT / "python" / "pyproject.toml").read_text())
VALIDATE_PYTHON = json.loads((CATALOG_ROOT.parents[1] / "package.json").read_text())[
    "scripts"
]["validate:python"]


def listed(entry: dict[str, object], key: str) -> list[object]:
    value = entry[key]
    assert isinstance(value, list), f"{key} must be a list"
    return value


def mapping(entry: dict[str, object], key: str) -> dict[str, object]:
    value = entry[key]
    assert isinstance(value, dict), f"{key} must be a table"
    return value


def entries_of_kind(kind: str) -> list[dict[str, object]]:
    return [entry for _, entry in standard_entries_of_kind(kind)]


def standard_entries_of_kind(kind: str) -> list[tuple[str, dict[str, object]]]:
    """Every entry of one kind, paired with the id of the standard it enforces."""
    return [
        (str(standard["id"]), entry)
        for standard in CATALOG["standards"]
        for entry in standard["enforcement"]["python"]
        if entry["kind"] == kind
    ]


def dev_group_pin(package: str) -> str:
    pinned: dict[str, str] = dict(
        requirement.split("==") for requirement in PYPROJECT["dependency-groups"]["dev"]
    )
    return pinned[package]


def validate_python_pin(package: str) -> str:
    """Read the version the root `validate:python` script runs the tool at."""
    match = re.search(rf"{re.escape(package)}@(\S+)", VALIDATE_PYTHON)
    assert match is not None, f"validate:python never runs {package}"
    version: str = match[1]
    return version


# semgrep is not a project dependency: the host provides it at run time, and the
# `uvx semgrep@<version>` in the root package.json is the only pin it has.
PIN_SOURCES: dict[str, Callable[[str], str]] = {
    "ruff": dev_group_pin,
    "mypy": dev_group_pin,
    "semgrep": validate_python_pin,
}


def test_ruff_config_selects_exactly_the_rules_the_catalog_claims() -> None:
    configured = tomllib.loads(
        (CATALOG_ROOT / PYTHON_PRESETS["ruff"]["file"]).read_text()
    )["lint"]["select"]
    claimed = {
        code for entry in entries_of_kind("ruff") for code in listed(entry, "select")
    }
    assert set(configured) == claimed
    assert len(configured) == len(claimed), "ruff.toml lists a rule twice"


def test_mypy_config_sets_exactly_the_options_the_catalog_claims() -> None:
    parser = ConfigParser()
    parser.read(CATALOG_ROOT / PYTHON_PRESETS["mypy"]["file"])
    configured = {
        option: parser.getboolean("mypy", option) for option in parser.options("mypy")
    }
    claimed = {
        option: value
        for entry in entries_of_kind("mypy")
        for option, value in mapping(entry, "options").items()
    }
    assert configured == claimed


@pytest.mark.parametrize(
    ("module_name", "file"),
    sorted(
        (str(entry["module"]), str(entry["file"])) for entry in entries_of_kind("check")
    ),
)
def test_every_check_module_loads_from_the_file_its_entry_names(
    module_name: str, file: str
) -> None:
    """`module` and `file` are two hand-typed strings; tie them together."""
    loaded = import_module(module_name).__file__
    assert loaded is not None
    assert Path(loaded).resolve() == CATALOG_ROOT / file


@pytest.mark.parametrize(
    ("standard_id", "module_name"),
    sorted(
        (standard_id, str(entry["module"]))
        for standard_id, entry in standard_entries_of_kind("check")
    ),
)
def test_every_check_module_reports_the_standard_it_enforces(
    standard_id: str, module_name: str
) -> None:
    assert import_module(module_name).CHECK_ID == standard_id


@pytest.mark.parametrize(
    ("preset", "package", "version"),
    sorted(
        (preset, package, str(version))
        for preset, entry in PYTHON_PRESETS.items()
        for package, version in entry["packages"].items()
    ),
)
def test_every_python_preset_pin_matches_what_installs_it(
    preset: str, package: str, version: str
) -> None:
    source = PIN_SOURCES.get(package)
    assert source is not None, f"{preset} pins {package}, which nothing installs"
    assert source(package) == version, f"{preset} pins {package}"


def test_every_check_module_is_wired_into_the_cli() -> None:
    from standards_checks.cli import CHECKS

    claimed = {entry["module"] for entry in entries_of_kind("check")}
    assert {check.__module__ for check in CHECKS} == claimed
