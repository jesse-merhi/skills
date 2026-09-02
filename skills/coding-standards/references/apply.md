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

   Find, for JavaScript: the ESLint config (a legacy `.eslintrc*` means ESLint
   8, a flat `eslint.config.*` means ESLint 9), any `oxlint` or `biome` setup,
   the prettier config, the tsconfig, the `package.json` lint scripts, and the
   CI jobs that run lint. For Python: `ruff`, `mypy`, or `flake8` settings in
   `pyproject.toml` or their own files, and pre-commit hooks.

   State the finding before writing anything, then apply these rules:

   - **Legacy `.eslintrc*`:** the catalog presets are flat config, so adopting
     them requires an ESLint 9 upgrade. That is a dependency change — stop and
     ask.
   - **`oxlint` or `biome` present:** neither can run the custom rules in
     `eslint/rules`, so they stay where they are and ESLint runs alongside
     them. Say so and continue.
   - **Existing flat config:** add the presets to it. Never replace it.

   Done when the survey is stated and each of those three questions has an
   answer for this target.

3. **Select the presets.**

   Evaluate `presets.<ecosystem>[*].applies` against the target `package.json`
   `dependencies` and `devDependencies`. A preset with `applies.always` applies
   whenever its ecosystem was detected.

   Show a table: preset, why it applies, and which of its `packages` are not
   already installed at the pinned version.

   Done when every preset in each detected ecosystem is either selected with
   its reason or excluded with the dependency it was waiting for.

4. **Ask before installing anything.**

   Show the exact command for the target package manager — bun, npm, pnpm, or
   yarn chosen by lockfile, `uv add --dev` for Python — with the exact versions
   from `packages`. Then wait.

   Done when the user has answered. A refusal is not a blocker: continue to
   vendor, and carry forward which presets cannot run until those packages
   exist so steps 9 and 10 report them as blocked rather than clean.

5. **Vendor the files into `<target>/lint/standards/`.**

   - JavaScript: the whole `eslint/` directory — rules, presets, plugin, index.
   - Python: `python/ruff.toml`, `python/mypy.ini`, `python/semgrep/`, and
     `python/standards_checks/`. Not `python/tests`, `pyproject.toml`, or
     `uv.lock`; those test and build the catalog itself and mean nothing in a
     target.
   - `prettier/prettierrc.json` to `<target>/.prettierrc.json`, only when the
     target has no prettier config.
   - `tsconfig/strict.base.json` to `lint/standards/tsconfig.strict.json`, added
     to the target tsconfig `extends` only where the target does not already
     set something stricter.
   - `react-doctor/doctor.config.json` to the target root, only when the react
     preset applies and no doctor config exists.

   Done when every path above exists in the target and no file that was already
   there was overwritten.

6. **Write the config.**

   JavaScript: `eslint.config.mjs` importing the selected preset factories from
   `./lint/standards/eslint/index.mjs`, with an `ignores` entry first. Scope
   each preset with `files` naming the real source directories. Inspect the
   tree to find them — `**/*` is wrong in any repository that has `dist`,
   `build`, or generated output, because it turns vendored and generated code
   into violations nobody will fix. When the target already has a flat config,
   add the imports and entries to that file instead of creating a second one.

   Python: point the target ruff config at the vendored one with
   `extend = "lint/standards/python/ruff.toml"`, creating `ruff.toml` if the
   target has none, and point the target mypy config at
   `lint/standards/python/mypy.ini` the same way. Then define four commands, as
   package scripts or a `just` or `make` target, matching whatever the target
   already uses:

   ```
   ruff check <src dirs>
   mypy <src dirs>
   semgrep --config lint/standards/python/semgrep <src dirs>
   PYTHONPATH=lint/standards/python python -m standards_checks <src dirs>
   ```

   Done when each detected ecosystem has config naming real source directories,
   and the Python commands exist in the form the target already uses for its
   own tasks.

7. **Write the manifest `lint/standards/manifest.json`.**

   ```json
   {
     "source": { "repository": "<git remote url>", "commit": "<sha>" },
     "catalogVersion": 1,
     "ecosystems": ["javascript", "python"],
     "presets": { "javascript": ["base", "typescript"], "python": ["ruff"] },
     "files": { "lint/standards/eslint/index.mjs": "<sha256>" }
   }
   ```

   Paths in `files` are relative to the target root. Each hash is the sha256 of
   the catalog content vendored to that path, which stays true even after
   someone edits the target copy — that is what lets `sync` tell an upstream
   change from a local one.

   Done when every file step 5 wrote has an entry. `sync` can only see what the
   manifest lists, so an omitted file silently stops receiving updates.

8. **Wire the commands.**

   Add or extend the target `lint` script, plus `lint:python` when Python was
   detected, so the new enforcement runs from the entry point the target
   already uses. Then check the CI workflows: confirm an existing lint job
   picks the script up, or add the step.

   Done when one command the target already documents runs every new check, and
   either CI runs that command or the report records that the target has no CI.

9. **Run and report the baseline.**

   Run the lint commands and report violation counts grouped by rule id.

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
      the rules of the selected presets. For Python, run each command against a
      real source file and show that it inspected it.
    - the lint script exists and runs those commands.
    - CI runs that script, or the target has no CI.

    Done when all three are stated from observed output rather than from what
    the config was meant to do.
