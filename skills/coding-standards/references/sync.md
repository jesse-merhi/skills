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

   - **catalog:** sha256 of that file in the resolved catalog directory now.
   - **manifest:** the hash recorded when it was vendored.
   - **local:** sha256 of the file in the target now.

   | catalog vs manifest | local vs manifest | class |
   | --- | --- | --- |
   | same | same | unchanged |
   | differs | same | upstream-changed |
   | same | differs | locally-modified |
   | differs | differs | both |

   A manifest entry with no file in the catalog was removed upstream; one with
   no file in the target was deleted locally. Report each rather than guessing
   which side is right.

   Done when every manifest entry carries exactly one class.

3. **Apply the upstream changes.**

   Overwrite each `upstream-changed` file with the catalog content. Leave every
   `locally-modified` file alone. For each `both`, show what changed upstream,
   what changed locally, and ask which to keep. Never overwrite a local
   modification silently — the target edited it for a reason the catalog cannot
   see.

   Done when every `upstream-changed` file matches the catalog byte for byte,
   and every `both` file has an explicit decision from the user.

4. **Offer newly applicable presets.**

   Re-run the `applies` evaluation from apply step 3 against the target current
   dependencies. Dependencies added since vendoring can make presets apply that
   did not before.

   Done when every preset that now applies but is absent from the manifest is
   either vendored, with permission asked for its packages, or declined and
   recorded.

5. **Update the manifest.**

   Write the new source commit, and update each file hash to the sha256 of the
   catalog content that path was synced from. Leave the old hash on any file
   kept as a local modification: setting it to the local bytes would make the
   next run read that file as pristine and overwrite it.

   Done when re-running step 2 classes every file `unchanged`, apart from the
   files deliberately kept as local modifications, which still class as
   `locally-modified` or `both`.

6. **Rerun the lint commands and report the delta.**

   Done when each command shows its new violation count beside the count from
   before the sync, and every rule id that newly fires is named.
