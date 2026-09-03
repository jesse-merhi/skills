# Translate

Add a new ecosystem column to `catalog.json` in the skills repository. This mode
edits the catalog itself; it changes no target repository.

`python/` is the worked example. Read it alongside these steps: it is one full
column covering all four tiers, with the drift test that keeps it honest in
`python/tests/test_catalog.py`.

## Tiers

Every standard ends up with an `enforcement.<ecosystem>` array. For each one,
take the first tier that fits.

1. **native** — a rule code or option of the ecosystem standard linter or type
   checker: ruff, mypy, clippy, golangci-lint, rubocop. Cheapest to run, and
   the maintainers already handle the edge cases.
2. **pattern** — a semgrep or ast-grep rule, when a syntactic pattern with
   metavariables catches the violation.
3. **check** — a small AST or tokenizer checker, with fixtures mirroring the
   valid and invalid cases of the ESLint rule it stands in for.
4. **not-applicable** — with a one-line reason: either why the standard has no
   meaning in this ecosystem, or what analysis a future check would need.

Write a check only where no native rule exists. A hand-written checker that
duplicates a linter rule drifts from it and loses the edge cases the linter
already handles, while costing a test suite and a CLI to maintain.

## Steps

1. **Read the existing columns for every standard.**

   The `javascript` column says what each standard actually catches, which is
   more specific than the `principle` prose. The `python` column shows how those
   same standards were split across the four tiers.

   Done when every standard id has a tier chosen and a reason, including the
   `not-applicable` ones.

2. **Build the linter config fragment.**

   Create `<ecosystem>/` in the skill directory holding the config for the
   ecosystem standard linter and type checker. Its enabled set must equal the
   union of the native entries in the catalog, with a test asserting that
   equality — `test_ruff_config_selects_exactly_the_rules_the_catalog_claims`
   is that test for ruff.

   Done when the config exists and its equality test fails if a code is added
   to either side alone.

3. **Write the pattern rules with the pattern tool native tests.**

   Semgrep reads a fixture file beside the rule, annotated `# ruleid: <id>` and
   `# ok: <id>` on the line before each case, and `semgrep --test` fails when
   any verdict is wrong. Use the tool own test format rather than inventing a
   runner.

   Done when the pattern tool test command passes with both violating and
   clean cases present for every rule.

4. **Write the checks.**

   Each check exposes the entry point the ecosystem CLI calls, with tests
   mirroring the valid and invalid cases of the ESLint rule it stands in for.
   The CLI prints one finding per line as `path:line:col: <id> <message>` and
   exits 1 when it found anything, so editors and CI parse it without a custom
   reporter.

   Done when each check has passing tests over both case sets, and the CLI
   exits 1 with parsable output on a violating file and 0 on a clean one.

5. **Add the column to `catalog.json`.**

   Add `ecosystems.<eco>` with its `detect` files, the preset column
   `presets.<eco>`, and an `enforcement.<eco>` array on every existing
   standard — `<eco>` is the ecosystem name in all three places. Read
   [catalog-format.md](catalog-format.md) for the field shapes and the
   invariants.

   Done when every existing standard carries the new column, no column is
   empty — a standard this ecosystem cannot enforce takes a `not-applicable`
   entry with its reason — and the catalog still decodes against
   `catalog.schema.ts`.

6. **Extend `catalog.test.ts`.**

   Add the new column preset `file` paths and its rule and fixture paths to the
   file-existence case.

   Done when deleting any file the new column names makes that test fail.

7. **Run the repository validation.**

   Done when the repository lint, typecheck, diagnostics, catalog tests, and
   the new ecosystem test commands all pass.

## How apply consumes the new column

`apply` reads `catalog.ecosystems` and `catalog.presets` instead of hardcoding
a list, so detection (apply step 1), preset selection (step 3), and the
dependency prompt (step 4) start working for the new ecosystem the moment the
catalog carries it.

Two things do not follow automatically, because they are per-ecosystem prose in
[apply.md](apply.md):

- **Step 5, vendoring:** which files get copied into `lint/standards/`, and
  which stay behind because they only test or build the catalog.
- **Step 6, config:** how the target config points at the vendored files, and
  which commands run the linter, the pattern tool, and the checks.

Add the new ecosystem to both lists in the same change, or `apply` will detect
it, offer its presets, and then have nothing to write.
