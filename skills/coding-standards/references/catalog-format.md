# Catalog format

`catalog.schema.ts` is the authoritative shape and decodes `catalog.json` on
every test run. This file is for explicitly requested shared-catalog edits,
not a prerequisite for applying standards to an unrepresented stack.

The ids, titles, and principles express the owner's standards. Enforcement
columns record available implementations, not proof that a whole principle is
enforced in every target. Apply and sync establish actual coverage using
the shared adoption policy loaded by the entrypoint; native mappings may be partial, custom checks are
optional, and context-sensitive decisions remain local agent guidance.

## Structure

- `version` — `1`.
- `ecosystems.<name>`
  - `detect` — files whose presence at a repository root means the ecosystem is
    there.
  - `presets` — the key under `presets` holding that ecosystem presets.
  - `packages` — optional. Package name to exact version for tooling the
    bundled integrations need: `javascript` carries `eslint` itself. Use these
    pins when selecting those integrations, not to replace an existing native
    toolchain automatically.
- `presets.<ecosystem>.<preset-name>` — preset columns are keyed by ecosystem
  name, the same names `ecosystems` uses.
  - `file` — path relative to the skill directory. A config file for
    single-file presets, a directory for rule sets and check packages.
  - `packages` — package name to the exact version the preset needs installed.
    Everything the preset file imports belongs here, including a resolver it
    loads for itself: `base` imports the TypeScript import resolver, so
    `eslint-import-resolver-typescript` is ordinary `packages` content there.
  - `applies` — `always: true`, or `dependencies` and `devDependencies` naming
    packages that suggest relevance in the target `package.json`. `always`
    means a candidate has no package condition, not that adoption must enable
    it. These JavaScript-oriented hints do not replace inspecting the target's
    own manifests or verifying which rules are appropriate.
- `baselines.<id>` — an optional config file copied into a target rather than
  enforced by a rule. Apply considers it only when the target chooses that
  tool and has no equivalent active configuration.
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
    shell twin of a rule, for file types no ecosystem linter parses. Each
    column admits only its ecosystem's kinds. Never empty in this schema.
    Existing `not-applicable` entries also include unavailable analysis; read
    their reasons rather than copying that label into a target adoption. There,
    an unavailable check is uncovered or guidance, not automatically irrelevant.

## Enforcement kinds

| kind | fields | means |
| --- | --- | --- |
| `rule` | `rule`, `presets` | a custom ESLint rule under `eslint/rules`, enabled by the named presets |
| `plugin` | `package`, `rules`, `presets` | rule ids from an installed ESLint plugin |
| `script` | `file`, `languages` | a shell script covering file types ESLint does not parse |
| `ruff` | `select` | ruff rule codes |
| `mypy` | `options` | mypy option names to values |
| `semgrep` | `file` | a semgrep rule configuration |
| `check` | `module`, `file` | a Python check module exposing `check_source` |
| `not-applicable` | `reason` | existing placeholder for no supplied implementation; inspect the reason for actual applicability |

## Invariants

`catalog.schema.ts` rejects on decode:

- an empty `enforcement.<ecosystem>` array, so a column with no supplied
  implementation carries a reasoned `not-applicable` entry rather than `[]`, and a kind in
  the wrong column: `ruff` under `javascript`, `rule` under `python`.
- an ecosystem with no `detect` files.
- an `applies` naming no condition, and a `ruff` `select` entry
  that is empty.
- any key an enforcement kind does not define, and any value of the wrong type:
  `mypy` `options` are booleans, not the strings a config file writes.

`catalog.test.ts` enforces:

- every `rule`, `script.file`, `check`/`semgrep` `file`, and
  every preset and baseline `file` resolves on disk.
- every file in `eslint/rules` is catalogued exactly once.
- every preset id named by a `rule` or `plugin` entry exists in that
  ecosystem preset column.
- every `plugin` rule id exists in the installed package.
- each preset `packages` list equals the packages that preset file imports, at
  the version installed in this repository.
- every rule id a preset emits resolves against the plugins that preset
  declares.
- every standard carries a column for every ecosystem in `ecosystems`.

`python/tests/test_catalog.py` enforces:

- `python/ruff.toml` `lint.extend-select` equals the union of every python
  `ruff` `select`, with no duplicates.
- `python/mypy.ini` equals the union of every python `mypy` `options`.
- every `check` `module` imports, and the file it loads from is the `file` the
  same entry names.
- every `check` module `CHECK_ID` equals the id of the standard it enforces.
- the set of `check` modules equals what `standards_checks.cli` runs.
- every python preset `packages` pin equals the version that installs it:
  `ruff` and `mypy` against the `python/pyproject.toml` dev group, `semgrep`
  against the `semgrep@<version>` in the root `package.json` `validate:python`
  script. Semgrep is not a project dependency — the host provides it at run
  time through `uvx` — so that command line is the only pin it has.

## Adding an entry

Add the enforcement and the file it names in the same change: both test suites
treat a catalog row with no file, and a rule file with no catalog row, as a
failure. Adding a `ruff` or `mypy` entry also means editing `python/ruff.toml`
or `python/mypy.ini`, because the union tests compare the two directly.
