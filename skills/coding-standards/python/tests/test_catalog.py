"""Guards against the catalog and the Python config files it describes drifting.

catalog.json is the record of what each standard is enforced by; ruff.toml and
mypy.ini are what actually runs. If someone adds a rule to one and forgets the
other, the catalog starts lying about the codebase.
"""

import json
import tomllib
from configparser import ConfigParser
from importlib import import_module
from pathlib import Path

import pytest

CATALOG_ROOT = Path(__file__).resolve().parents[2]
CATALOG = json.loads((CATALOG_ROOT / "catalog.json").read_text())
PYTHON_PRESETS = CATALOG["presets"]["python"]
PYPROJECT = tomllib.loads((CATALOG_ROOT / "python" / "pyproject.toml").read_text())


def listed(entry: dict[str, object], key: str) -> list[object]:
    value = entry[key]
    assert isinstance(value, list), f"{key} must be a list"
    return value


def mapping(entry: dict[str, object], key: str) -> dict[str, object]:
    value = entry[key]
    assert isinstance(value, dict), f"{key} must be a table"
    return value


def entries_of_kind(kind: str) -> list[dict[str, object]]:
    return [
        entry
        for standard in CATALOG["standards"]
        for entry in standard["enforcement"]["python"]
        if entry["kind"] == kind
    ]


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
    "module_name", sorted(str(entry["module"]) for entry in entries_of_kind("check"))
)
def test_every_check_module_exposes_check_source(module_name: str) -> None:
    assert callable(import_module(module_name).check_source)


def test_python_preset_pins_match_the_dev_dependency_group() -> None:
    pinned = dict(
        requirement.split("==") for requirement in PYPROJECT["dependency-groups"]["dev"]
    )
    for tool in ("ruff", "mypy"):
        assert PYTHON_PRESETS[tool]["packages"][tool] == pinned[tool]


def test_every_check_module_is_wired_into_the_cli() -> None:
    from standards_checks.cli import CHECKS

    claimed = {entry["module"] for entry in entries_of_kind("check")}
    assert {check.__module__ for check in CHECKS} == claimed
