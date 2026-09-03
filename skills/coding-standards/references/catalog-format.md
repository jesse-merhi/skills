# Catalog format

`catalog.schema.ts` is the authoritative shape and decodes `catalog.json` on
every test run. This file is the map of what the fields mean and which
invariants a new entry has to satisfy.

## Structure

- `version` — `1`.
- `ecosystems.<name>`
  - `detect` — files whose presence at a repository root means the ecosystem is
    there.
  - `presets` — the key under `presets` holding that ecosystem presets.
  - `packages` — optional. Package name to exact version for tooling the
    ecosystem needs whatever presets are selected: `javascript` carries
    `eslint` itself. Apply step 4 installs these together with the packages of
    the selected presets.
- `presets.<ecosystem>.<preset-name>` — preset columns are keyed by ecosystem
  name, the same names `ecosystems` uses.
  - `file` — path relative to the skill directory. A config file for
    single-file presets, a directory for rule sets and check packages.
  - `packages` — package name to the exact version the preset needs installed.
    Everything the preset file imports belongs here, including a resolver it
    loads for itself: `base` imports the TypeScript import resolver, so
    `eslint-import-resolver-typescript` is ordinary `packages` content there.
  - `applies` — `always: true`, or `dependencies` and `devDependencies` naming
    packages that must appear in the target `package.json`.
- `baselines.<id>` — a config file copied whole into a target rather than
  enforced by a rule. Apply step 5 is what consumes this record.
  - `file` — path relative to the skill directory. `catalog.test.ts` checks it
    exists.
  - `target` — where the file lands in the target repository, often under
    another name: `prettier/prettierrc.json` becomes `.prettierrc.json`.
  - `applies` — the same shape as a preset `applies`.
- `standards[]`
  - `id` — stable, and the name the enforcement rows and rule filenames use.
  - `title` — the standard in one line.
  - `principle` — what to do instead and why, in the words an agent would use
    when the rule fires.
  - `scope` — one of the literals listed in `catalog.schema.ts`.
  - `origin` — where the standard came from.
  - `enforcement.<ecosystem>` — an array, one column per ecosystem, keyed by
    the same names as `ecosystems`. `script` is the one exception: it holds the
    shell twin of a rule, for file types no ecosystem linter parses. Never
    empty: a standard nothing enforces in a column takes a `not-applicable`
    entry.

## Enforcement kinds

| kind | fields | means |
| --- | --- | --- |
| `rule` | `rule`, `test`, `presets` | a custom ESLint rule under `eslint/rules`, enabled by the named presets |
| `plugin` | `package`, `rules`, `presets` | rule ids from an installed ESLint plugin |
| `script` | `file`, `languages` | a shell script covering file types ESLint does not parse |
| `ruff` | `select` | ruff rule codes |
| `mypy` | `options` | mypy option names to values |
| `semgrep` | `file`, `test` | a semgrep rule and its annotated fixture file |
| `check` | `module`, `file`, `test` | a Python check module exposing `check_source` |
| `not-applicable` | `reason` | the standard has no counterpart in that ecosystem, and why |

## Invariants

`catalog.test.ts` enforces:

- every `rule`, `test`, `script.file`, `check`/`semgrep` `file` and `test`, and
  every preset and baseline `file` resolves on disk.
- every file in `eslint/rules` is catalogued exactly once, and its `test` is the
  rule path with the `.mjs` suffix replaced by `.test.mjs`.
- every preset id named by a `rule` or `plugin` entry exists in that
  ecosystem preset column.
- every `plugin` rule id exists in the installed package.
- each preset `packages` list equals the packages that preset file imports, at
  the version installed in this repository.
- every rule id a preset emits resolves against the plugins that preset
  declares.
- every standard carries a column for every ecosystem in `ecosystems`, and no
  column is empty.

`python/tests/test_catalog.py` enforces:

- `python/ruff.toml` `lint.select` equals the union of every python `ruff`
  `select`, with no duplicates.
- `python/mypy.ini` equals the union of every python `mypy` `options`.
- every python `check` and `semgrep` `file` and `test` path exists.
- every `check` `module` imports and exposes `check_source`, and the set of
  those modules equals what `standards_checks.cli` runs.
- the `ruff` and `mypy` preset `packages` versions equal the pins in the
  `python/pyproject.toml` dev group. `semgrep` is not lock-backed: the host
  machine provides it, and its version comes from `semgrep --version`.

## Adding an entry

Add the enforcement and the file it names in the same change: both test suites
treat a catalog row with no file, and a rule file with no catalog row, as a
failure. Adding a `ruff` or `mypy` entry also means editing `python/ruff.toml`
or `python/mypy.ini`, because the union tests compare the two directly.
