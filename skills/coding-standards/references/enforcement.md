# Enforcement requests

Use this only for an explicit request to apply, sync or translate enforcement; [coding-standards](../SKILL.md) links each mode's reference. The `catalog.json` principles govern; enforcement entries and presets are candidates, not proof of coverage or a mandate to install everything. For non-Node targets, find equivalent checks rather than copying JavaScript syntax or adding language packages to the catalog.

## Apply, sync, or translate

Resolve `catalog.json`'s real path to its Git checkout; a materialized `SKILL.md` may be a copy. Record the source remote URL and commit. Disclose a dirty source or a commit with no containing remote-tracking branch.

Use the adoption reference for enforcement, guidance, partial coverage, gaps and exceptions. Resolve routine choices from the target; ask only about decisions requiring user authority or materially changing the result, and continue independent work meanwhile. Then follow the requested mode:

- **Apply:** inspect the stack; leave working checks, local guidance and an adoption record.
- **Sync:** reconcile the adoption, vendored files, target choices and active configuration. Sync reuses apply's dependency, wiring and verification contracts.
- **Translate:** map principles to existing tools in the requested ecosystem. During apply, translate unrepresented stacks then resume. Standalone translation proposes a mapping unless application was also requested.

Apply and sync change the target, not the catalog. A reusable catalog contribution requires a separate explicit request and follows the catalog format reference.

## Boundaries

- Prefer repository- or dependency-owned tools; record declined tools as gaps.
- Preserve existing checks, source code, configuration, and user exceptions. Do not silently weaken enforcement to fit the new adoption model.
- During apply, create a small target-owned check only for a selected reliable mechanical requirement existing tools cannot express. Follow adoption policy; judgment calls stay guidance.
- Existing bundled checkers are optional: use one only when its actual behavior fits the target and adds reliable coverage worth maintaining.

Verify active checks and wiring per the chosen mode's reference. Ground unfamiliar tooling in installed source or current primary documentation; do not expand into unrelated audits or a lint framework.

## Done

Report the source commit, active checks and results, local guidance location, and gaps or exceptions. Distinguish active enforcement, partial checks, guidance and uncovered requirements; a green command alone is not full coverage. Record every relevant principle's disposition, not necessarily a linter. Label standalone translation as a proposal, not installed coverage.
