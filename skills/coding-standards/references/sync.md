# Sync an adoption

Reconcile the target's active standards and guidance with the current catalog
without discarding local decisions. Updating copied files is only part of sync.
The source of the target's choices is `lint/standards/ADOPTION.md`; the manifest
records provenance of files copied from the catalog.

## Steps

1. **Read the current adoption and actual configuration.**

   Read the adoption record, `lint/standards/manifest.json`, agent-instruction
   pointer, lint commands, and effective configuration. Inspect installed tools
   and the present stack. Compare the manifest source with the resolved catalog
   source; do not silently switch repositories.

   If no manifest exists, use apply rather than guessing copied-file history.
   If an existing adoption has only a manifest, establish its actual checks
   from the target before writing the record. Do not infer active coverage from
   preset files being present, or silently remove its existing checkers.

   Done when current enforcement, guidance, exceptions, and provenance are
   understood from the repository rather than reconstructed from filenames.

2. **Reconsider the mapping, not the owner's choices.**

   Follow the shared adoption policy loaded by the entrypoint for changed principles and newly relevant
   parts of the stack. Translate unrepresented ecosystems with
   the translation workflow loaded by the entrypoint. Existing exceptions remain decisions; new
   catalog coverage does not revoke them.

   Show the proposed changes to active rules, configuration, guidance, and gaps.
   A newly applicable bundled preset is an option, not an automatic import.
   Inspect what an updated preset enables before adopting its new contents.

   Done when the update plan names effective behavior changes and distinguishes
   them from file-only changes. Ask before replacing tools, changing dependencies,
   weakening existing checks, or overriding a local decision.

3. **Reconcile copied files.**

   For each manifest entry compare its recorded `sha256` with the current
   catalog `source` bytes and local target bytes:

   | Catalog vs recorded | Local vs recorded | Action |
   | --- | --- | --- |
   | Same | Same | Leave unchanged. |
   | Different | Same | Update when included in the adoption plan. |
   | Same | Different | Preserve the local modification. |
   | Different | Different | Show both changes and ask before replacing local work. |

   Report upstream removals and local deletions instead of recreating or
   deleting them automatically. Find new runtime dependencies of selected
   bundled files using apply's vendoring rules; compare catalog-relative paths
   with manifest `source` values, not target-path keys. Never overwrite an
   existing untracked target file just because its path is new to the manifest.

   Done when accepted file changes include their runtime dependencies and local
   modifications remain protected. Files created by target translation and the
   adoption record are target-owned; do not replace them with catalog bytes.

4. **Update the active integration.**

   Reuse apply's dependency approval and configuration wiring. Check versions
   and package requirements for existing integrations as well as new ones.
   If an installation is declined, leave dependent updates unapplied and record
   the gap rather than loading an unresolvable configuration.

   Add imports and scoped config entries for newly selected presets. Reconcile
   copied settings in target-owned files, such as rule selections or options;
   replacing a reference fragment does not update those settings. Preserve
   unrelated options and resolve conflicting owner choices explicitly. Keep the
   selected checks wired into the target's normal command and CI, when present.

   Done when the accepted plan is reflected in active configuration, not merely
   in the vendor directory. Preserve pre-sync violation counts for comparison.

5. **Verify and update the records.**

   Follow apply's verification step. Show effective rule settings and behavior
   on representative source; report newly enforced coverage, changed violation
   counts, and remaining guidance or gaps. Do not auto-fix target source or add
   suppressions to buy a clean run.

   Update the adoption record and its guidance pointer. Record only active
   bundled presets in the manifest, add actual catalog copies with their source
   paths, and update hashes only for content accepted from the catalog. Preserve
   the old upstream hash for files kept as local modifications. Advance the
   source commit without implying that declined changes were installed; name
   those decisions in the adoption record.

   Done when the records match observed enforcement, local choices remain
   intact, and a later sync can distinguish remaining gaps from completed work.
