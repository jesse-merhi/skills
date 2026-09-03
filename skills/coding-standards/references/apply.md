# Apply

Bootstrap the catalog standards into a target repository. The target is the
current repository unless the user names another.

This mode adds a layer of enforcement and wires it to a command. It never takes
over what the target already runs: no existing config file is deleted or
replaced, only extended.

## Steps

1. **Detect the ecosystems.**

   Look at the target root for each `ecosystems.<name>.detect` file in the
   catalog.

   Done when every detected ecosystem is named. When nothing is detected, stop
   and report that — do not infer an ecosystem from file extensions, because a
   repository with no manifest has nowhere to record dependencies or scripts.

2. **Survey the enforcement already there.**

   Survey only the ecosystems step 1 detected.

   For JavaScript: the ESLint config (a legacy `.eslintrc*` means ESLint 8, a
   flat `eslint.config.*` means ESLint 9), any `oxlint` or `biome` setup, the
   prettier config, the tsconfig files, the `package.json` lint scripts, the CI
   jobs that run lint, and what is not source: the output directories
   `.gitignore` names, and the generated files in the tree (`*.gen.ts`,
   `routeTree.gen.ts`, `*.d.ts` a tool emits), which is where step 6 gets the
   contents of its `ignores`. For Python: `ruff`, `mypy`, or `flake8` settings
   in `pyproject.toml` or their own files, the task runner the target drives
   its own commands with, and pre-commit hooks.

   State the finding before writing anything, then answer the questions
   belonging to each detected ecosystem.

   JavaScript:

   - **Legacy `.eslintrc*`:** the catalog presets are flat config, so adopting
     them requires an ESLint 9 upgrade. That is a dependency change — stop and
     ask.
   - **`oxlint` or `biome` present:** neither can run the custom rules in
     `eslint/rules`, so they stay where they are and ESLint runs alongside
     them. Say so and continue.
   - **Existing flat config:** add the presets to it. Never replace it.

   Python:

   - **Existing ruff, mypy, or flake8 config:** extend it where the tool
     supports extension and merge the catalog options into it where the tool
     does not. Never replace it.

   Done when the survey is stated and every question of every detected
   ecosystem has an answer for this target — the three JavaScript questions
   only when JavaScript was detected, the Python question only when Python was.

3. **Select the presets.**

   Evaluate `presets.<ecosystem>[*].applies` against the target `package.json`
   `dependencies` and `devDependencies`. A preset with `applies.always` applies
   whenever its ecosystem was detected.

   Show a table: preset, why it applies, and which of its `packages` are not
   already installed at the pinned version.

   Done when every preset in each detected ecosystem is either selected with
   its reason or excluded with the dependency it was waiting for.

4. **Ask before installing anything.**

   The install list is `ecosystems.<name>.packages` plus the `packages` of
   every preset selected in step 3, minus what the target already has at that
   exact version. The ecosystem entry carries tooling no preset names —
   `javascript` carries `eslint` itself — so a target whose preset packages are
   already satisfied can still be missing the linter.

   Pin every version exactly. A range lets the target drift off the version the
   catalog checked its rule ids against, and the config then fails on rules
   that no longer exist. Use the form for the target package manager, chosen by
   lockfile:

   ```
   bun.lock          -> bun add -d --exact <pkg>@<version>
   package-lock.json -> npm i -D --save-exact <pkg>@<version>
   pnpm-lock.yaml    -> pnpm add -D --save-exact <pkg>@<version>
   yarn.lock         -> yarn add -D --exact <pkg>@<version>
   uv.lock           -> uv add --dev <pkg>==<version>
   poetry.lock       -> poetry add --group dev <pkg>==<version>
   pdm.lock          -> pdm add -dG dev <pkg>==<version>
   ```

   A Python target with none of those lockfiles manages its environment itself:
   add the pinned `<pkg>==<version>` line to the dev requirements file it
   already has (`requirements-dev.txt` or whatever it calls that file) rather
   than picking a manager for it. The lockfile decides because the managers are
   not interchangeable — `uv add` on a poetry project rewrites `pyproject.toml`
   into uv's dependency layout, which is a change to the target's build the user
   did not ask for.

   Show the exact command with every package and version in it. Then wait.

   Done when the user has answered. A refusal is not a blocker: continue to
   vendor, but leave every preset whose packages are missing out of the config
   in step 6 — ESLint refuses the whole config when one import fails to
   resolve — and carry the blocked presets forward so steps 9 and 10 report
   them as blocked rather than clean.

5. **Vendor the files into `<target>/lint/standards/`.**

   Copy only files the catalog repository tracks. Take the list from
   `git -C <catalog dir> ls-files <paths>` rather than walking the directory:
   the catalog is a working repository and carries `__pycache__`, `.venv`, and
   tool caches from its own test runs, and a wholesale directory copy drags
   them into the target.

   The catalog names what to copy through the **vendored roots** of each
   detected ecosystem, and `sync` walks these same roots to find files added
   upstream:

   - JavaScript: one root, `eslint/`. The preset files import `eslint/rules/`
     and `eslint/standards-plugin.mjs`, so the whole directory is vendored
     rather than the individual `presets.javascript.*.file` entries. That
     deliberately brings presets this target did not select: the config never
     imports them, so they are inert until their packages exist, and holding
     them under the manifest lets `sync` keep them current so enabling one
     later is a single import line.
   - Python: each `presets.python.*.file` is a root — that file when the entry
     names a file, the directory when it names one. No preset entry names
     `python/tests`, `pyproject.toml`, or `uv.lock`, and none should — those
     test and build the catalog itself and mean nothing in a target. The
     vendored checks need Python 3.10 or newer; when the target
     `requires-python` allows less, stop and say so.

   Copy every tracked file under those roots except the ones that only test the
   catalog itself: every `*.test.mjs`, whose rule tests import vitest that the
   target has no reason to install, and every `python/semgrep/*.py`, the
   fixture semgrep's `--test` reads — deliberately injectable SQL that a
   target's own scanners would flag, and nothing semgrep loads at run time.
   `sync` applies the same two exclusions. Read the Python roots out of
   `catalog.json`; a list written here drifts the first time a preset is added.

   Then every baseline in `catalog.baselines` whose `applies` matches the
   target, evaluated exactly as the presets in step 3: copy its `file` to the
   `target` path it names, and only when nothing is there already.

   The `tsconfig-strict` baseline lands at
   `lint/standards/tsconfig.strict.json` and then goes into the `extends` of
   every tsconfig that compiles something — one that lists `files` or
   `include`. A tsconfig's own `compilerOptions` override what it extends, so
   an option the target already sets equal or stricter needs no change, and a
   looser one is the target's choice to keep or drop: report it rather than
   silently overriding it. A solution-style `tsconfig.json` holding
   `files: []` and `references` compiles nothing, so extend the configs it
   references instead. Any JSON config the target keeps may carry comments,
   tsconfig files especially; edit it as text rather than parsing and
   rewriting it as JSON, which strips the comments.

   A baseline is never worth installing its tool for. When the dependency its
   `applies` names is absent, leave the file out and name it in the report as
   available once the target adopts the tool.

   Done when every path above exists in the target, no file that was already
   there was overwritten, and nothing the catalog repository does not track was
   copied.

6. **Write the config.**

   JavaScript: `eslint.config.mjs` importing each selected preset factory from
   its own file, `./lint/standards/eslint/presets/<name>.mjs`, and
   `./lint/standards/eslint/standards-plugin.mjs` only when the config needs
   the plugin object itself. There is no index to import.

   Make the first config object `{ ignores: [...] }` on its own — an `ignores`
   key sharing an object with other keys filters only that entry, while an
   object holding nothing else applies to the whole run. Name in it the build
   output the survey found (`dist`, `build`, `out`, `.next`, `coverage`),
   `node_modules`, the generated files the survey found, and
   `lint/standards/**`.

   Scope every preset, `base` included, with `files` naming the real source
   directories. Inspect the tree to find them — `**/*` is wrong in any
   repository that has `dist`, `build`, or generated output, because it turns
   vendored and generated code into violations nobody will fix.

   `base` also takes `tsconfigPaths`: pass the same compiling tsconfigs step 5
   found. Its default `./tsconfig.json` is a solution file that compiles nothing
   in a Vite-style repository, so the import resolver resolves nothing. `base`
   takes `internalPattern` too, for a repository whose path aliases are
   something other than `@/`, `~/`, or `#`.

   Every preset factory takes one options object, and the factory itself is the
   list of what it accepts. Named here are only the ones a target has to supply:
   `tailwind({ elevationModuleFiles })` turns the elevation rule off in the
   module that defines the tokens, `reactNative({ colorModuleFiles })` does the
   same for the palette module, and `typescript({ typeChecked: true })` enables
   the project service only when the target wants type-aware rules (with it on,
   a `.ts` file outside every tsconfig is a fatal parse error).
   `typescript({ tsconfigRootDir })` rides with it and means nothing without it:
   it tells the project service which directory to resolve tsconfigs from. Find
   those modules in the survey and pass them; leave `typeChecked` off unless a
   type-aware rule is enabled.

   When the target already has a flat config, add the imports and entries to
   that file instead of creating a second one. When the survey found `oxlint`
   or `biome`, add `lint/standards` to that tool's ignore configuration as
   well — oxlint's `ignorePatterns` in `.oxlintrc.json`, biome's `files` ignore
   setting — so the tool that cannot run these rules also stops reporting on
   the files that hold them. Edit those configs as text for the reason step 5
   gives.

   Python: ruff first. Find the config ruff actually reads — `.ruff.toml`,
   `ruff.toml`, or `[tool.ruff]` in `pyproject.toml`, the first one present in
   that order — and wire it one of two ways, decided by whether it sets
   `select`:

   - No `select` (neither `lint.select` nor the older top-level `select`): add
     `extend = "lint/standards/python/ruff.toml"`. The vendored file uses
     `lint.extend-select`, and ruff resolves the chain base first, so the
     catalog codes land on top of ruff's defaults and whatever else the target
     enables.
   - A `select`: `extend` is inert, because a child `select` resets every code
     the chain enabled before it — ruff 0.16.5 with the `extend` plus
     `select = ["E", "W"]` enables E, W, and nothing from the catalog. Copy the
     `lint.extend-select` list out of `lint/standards/python/ruff.toml` into
     the target's own `lint.extend-select`, merged with any codes already
     there. The vendored file then plays the part `mypy.ini` plays below: the
     manifest-tracked reference the codes were copied from.

   Create `ruff.toml` only when the target has no ruff config at all. Beside a
   `pyproject.toml` that already holds `[tool.ruff]`, a new `ruff.toml` wins
   outright and that table stops applying — exactly the replacement this mode
   never makes.

   mypy has no `extend` at all — no mypy config file can extend another — so
   write the options from `lint/standards/python/mypy.ini` into the target's
   `[tool.mypy]` table in `pyproject.toml`, or into `[mypy]` in the mypy config
   file the target already has. In `pyproject.toml` that means TOML spelling,
   `strict = true`: `True` is not a TOML value, and one such line breaks the
   file for every tool that reads it. An option the target already sets equal
   or stricter needs no change; one it sets looser — `strict = false`,
   `disallow_any_explicit = false` — is the target's choice to keep or drop,
   as with tsconfig in step 5: report it rather than overriding it. The
   vendored file stays as the manifest-tracked reference the options were
   copied from, which is what lets `sync` show that they drifted.

   Whichever way ruff was wired, add `lint/standards` to that ruff config's
   `extend-exclude` and to mypy's `exclude` (`^lint/standards/`), as the
   JavaScript config ignores `lint/standards/**`: the vendored package is not
   the target's code, a target task like `ruff check .` or `ruff format .`
   would otherwise lint it under the target's own rules and rewrite it, and a
   rewritten file is one `sync` then classes as locally modified.

   Then define one command per selected `presets.python` entry, each run
   through the target's own runner: `uv run` in a uv project, bare where the
   target manages its own environment. An environment assignment goes before
   the runner, never after it: `uv run PYTHONPATH=… python` tries to spawn a
   program named `PYTHONPATH=…` and fails.

   ```
   ruff check <src dirs>
   mypy <src dirs>
   semgrep --error --config lint/standards/python/semgrep <src dirs>
   PYTHONPATH=lint/standards/python python -m standards_checks <src dirs>
   ```

   In a uv project the last one is
   `PYTHONPATH=lint/standards/python uv run python -m standards_checks <src dirs>`.

   Put them where the target already keeps tasks — package scripts, a `just`
   recipe, a `make` target — and follow that runner's naming. When the target
   has no task runner at all, add a `Makefile` with a `lint` target; a make
   target name cannot contain a colon, so the Python entry point there is
   `lint-python`, not `lint:python`.

   `semgrep` carries `--error` because without it semgrep prints its findings
   and still exits 0, so a CI job that runs it stays green over every violation.

   A wired entry point stops at the first command that fails, so step 9 runs
   each command separately to get every count.

   Done when each detected ecosystem has config naming real source directories,
   the mypy options live in a file mypy itself reads, and the Python commands
   exist in the form the target already uses for its own tasks.

7. **Write the manifest `lint/standards/manifest.json`.**

   ```json
   {
     "source": { "repository": "<git remote url>", "commit": "<sha>" },
     "catalogVersion": 1,
     "ecosystems": ["javascript", "python"],
     "presets": {
       "javascript": ["base", "typescript"],
       "python": ["ruff", "mypy", "semgrep", "checks"]
     },
     "files": {
       "lint/standards/eslint/presets/base.mjs": {
         "source": "eslint/presets/base.mjs",
         "sha256": "<sha256>"
       }
     }
   }
   ```

   `presets` uses the same ecosystem names as `catalog.ecosystems`.

   `files` lists every file step 5 vendored, baselines included. It does not
   list the target's own files apply edited in place — tsconfigs,
   `.oxlintrc.json`, `package.json` — because those belong to the target
   rather than being catalog content `sync` can update.

   Each key is a path relative to the target root, and its `source` is where
   that content came from, relative to the catalog directory:
   `eslint/presets/base.mjs` for a plain vendored file,
   `prettier/prettierrc.json` for a baseline that lands under another name.
   Every baseline whose `target` differs from its `file` is renamed on the way
   in, and without `source` `sync` has no way back to the catalog file to hash.
   Each `sha256` is the hash of the catalog content vendored to that path,
   which stays true even after someone edits the target copy — that is what
   lets `sync` tell an upstream change from a local one.

   Done when every file step 5 wrote has an entry. `sync` can only see what the
   manifest lists, so an omitted file silently stops receiving updates.

8. **Wire the commands.**

   Add or extend the target `lint` script, plus the Python entry point step 6
   named when Python was detected, so the new enforcement runs from the command
   the target already uses. Then check the CI workflows: confirm an existing lint job
   picks the script up, or add the step.

   Done when one command the target already documents runs every new check, and
   either CI runs that command or the report records that the target has no CI.

9. **Run and report the baseline.**

   Run each configured command on its own, not through the entry point that
   chains them, and report violation counts grouped by rule id. Chained
   commands stop at the first failure, and every command after it goes
   uncounted. Take the counts from machine output rather than by eye:
   `eslint . -f json` piped through `jq` grouping `.[].messages[].ruleId`, and
   ruff's `--output-format json` or its `--statistics`.

   Do not auto-fix, add disables, or edit target source to make lint pass. The
   baseline is the finding, and a clean run bought with disables hides it. List
   the highest-count rules and offer to work through them as a follow-up.

   Done when every configured command has run and its count is reported, or is
   named as blocked on a dependency the user declined in step 4.

10. **Prove the config reaches the code.**

    A config is real only when it is explicit, resolvable, reaching the target
    source files, and wired to a command CI runs. Report these three facts with
    the output that shows each:

    - `eslint --print-config <a real source file>` lists `standards/*` rules and
      the rules of the selected presets. For ruff, the equivalent is
      `ruff check --show-settings <a real source file> | grep -A40 'linter.rules.enabled'`,
      which lists the rules enabled for that file: the catalog codes have to be
      among them, since an `extend` the target config never reads, or one a
      later `select` reset, is silently inert. For the rest, run each command
      against a real source file.
      A tool that prints nothing on a clean file — the checks CLI — proves
      nothing that way, so run it against a file holding a known violation and
      show the finding it reports.
    - the lint script exists and runs those commands.
    - CI runs that script, or the target has no CI.

    Done when all three are stated from observed output rather than from what
    the config was meant to do.
