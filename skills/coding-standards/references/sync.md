# Sync

Bring standards already vendored in a target repository up to the current
catalog, without discarding anything the target changed on purpose.

Requires `lint/standards/manifest.json`. Without it the repository was never
bootstrapped by this skill, and there is no record of what the vendored files
started as — use `apply` instead.

## Steps

1. **Read the manifest.**

   Done when the source repository, source commit, vendored preset list, and
   file table are recovered, and the source commit is compared against the
   catalog commit recorded in the shared locate step.

2. **Classify every file in `files` by three hashes.**

   - **catalog:** sha256 of the entry `source` path in the resolved catalog
     directory now.
   - **manifest:** the entry `sha256`, recorded when it was vendored.
   - **local:** sha256 of the file in the target now.

   | catalog vs manifest | local vs manifest | class |
   | --- | --- | --- |
   | same | same | unchanged |
   | differs | same | upstream-changed |
   | same | differs | locally-modified |
   | differs | differs | both |

   A manifest entry whose `source` is gone from the catalog was removed
   upstream; one with no file in the target was deleted locally. Report each
   rather than guessing which side is right.

   A file added upstream has no manifest entry at all, so the table cannot see
   it. Find those separately: for every vendored root of apply's **Vendor the
   files** step — `eslint/` for JavaScript, each `presets.python.*.file` for
   Python — take `git ls-files <root>` in the catalog, drop the files apply
   never vendors (every `*.test.mjs` and `python/semgrep/*.py`), and compare
   what is left against the `source` of every manifest entry. Manifest keys
   are target paths (`lint/standards/...`) and `git ls-files` yields catalog
   paths, so matching on keys matches nothing and classes every vendored file
   as new. Anything upstream, unexcluded, and matching no `source` is **new
   upstream**.
   Walk the roots rather than the preset entries: a JavaScript preset entry is a
   single `.mjs` file, so a rule added under `eslint/rules/` is invisible to a
   scan that only descends preset entries naming a directory. Skipping this
   leaves a target that no longer runs: upstream adds a module and imports it
   from the updated `standards-plugin.mjs` or `cli.py`, sync copies the importer
   alone, and the target now imports a module that is not there.

   Done when every manifest entry carries exactly one class and every new
   upstream file is named.

3. **Apply the upstream changes.**

   Overwrite each `upstream-changed` file with the catalog content, and copy
   each `new upstream` file in. Leave every `locally-modified` file alone. For
   each `both`, show what changed upstream, what changed locally, and ask which
   to keep. Never overwrite a local modification silently — the target edited
   it for a reason the catalog cannot see.

   Done when every `upstream-changed` and `new upstream` file matches the
   catalog byte for byte, and every `both` file has an explicit decision from
   the user.

4. **Offer newly applicable presets.**

   Re-run the `applies` evaluation from apply's **Select the presets** step against the target current
   dependencies. Dependencies added since vendoring can make presets apply that
   did not before.

   Done when every preset that now applies but is absent from the manifest is
   either vendored, with permission asked for its packages, or declined and
   recorded.

5. **Update the manifest.**

   Write the new source commit, add an entry for every `new upstream` file step
   3 copied in, and update each existing entry `sha256` to the sha256 of the
   catalog content that path was synced from, leaving its `source` unchanged.
   Leave the old hash on any file kept as a local modification: setting it to
   the local bytes would make the next run read that file as pristine and
   overwrite it.

   Done when re-running step 2 classes every file `unchanged`, apart from the
   files deliberately kept as local modifications, which still class as
   `locally-modified` or `both`.

6. **Rerun the lint commands and report the delta.**

   Done when each command shows its new violation count beside the count from
   before the sync, and every rule id that newly fires is named.
