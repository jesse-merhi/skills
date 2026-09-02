"""Guards against the fragment and the config files it describes drifting apart.

The fragment is the record of what each standard is enforced by; ruff.toml and
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
FRAGMENT = json.loads((CATALOG_ROOT / "catalog.python.json").read_text())
ENFORCEMENT = FRAGMENT["enforcement"]


def entries_of_kind(kind: str) -> list[dict]:
    return [
        entry
        for entries in ENFORCEMENT.values()
        for entry in entries
        if entry["kind"] == kind
    ]


def test_ruff_config_selects_exactly_the_rules_the_fragment_claims():
    configured = tomllib.loads(
        (CATALOG_ROOT / FRAGMENT["presets"]["python"]["ruff"]["file"]).read_text()
    )["lint"]["select"]
    claimed = {code for entry in entries_of_kind("ruff") for code in entry["select"]}
    assert set(configured) == claimed
    assert len(configured) == len(claimed), "ruff.toml lists a rule twice"


def test_mypy_config_sets_exactly_the_options_the_fragment_claims():
    parser = ConfigParser()
    parser.read(CATALOG_ROOT / FRAGMENT["presets"]["python"]["mypy"]["file"])
    configured = {
        option: parser.getboolean("mypy", option) for option in parser.options("mypy")
    }
    claimed = {
        option: value
        for entry in entries_of_kind("mypy")
        for option, value in entry["options"].items()
    }
    assert configured == claimed


@pytest.mark.parametrize(
    "relative_path",
    sorted(
        {preset["file"] for preset in FRAGMENT["presets"]["python"].values()}
        | {
            entry[key]
            for entries in ENFORCEMENT.values()
            for entry in entries
            for key in ("file", "test")
            if key in entry
        }
    ),
)
def test_every_path_the_fragment_names_exists(relative_path: str):
    assert (CATALOG_ROOT / relative_path).exists()


@pytest.mark.parametrize(
    "module_name", sorted(entry["module"] for entry in entries_of_kind("check"))
)
def test_every_check_module_exposes_check_source(module_name: str):
    assert callable(import_module(module_name).check_source)


def test_every_check_module_is_wired_into_the_cli():
    from standards_checks.cli import CHECKS

    claimed = {entry["module"] for entry in entries_of_kind("check")}
    assert {check.__module__ for check in CHECKS} == claimed
