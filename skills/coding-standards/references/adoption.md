# Choose the adoption

Start from each standard's `principle`, the target's code and conventions, and
what the user wants enforced. The catalog's implementation columns are useful
starting points, not language-independent guarantees. Inspect the actual tool
behavior before claiming that a mapping covers a principle.

## Decide how each principle applies

| Disposition | Meaning | Record |
| --- | --- | --- |
| Enforced | An active check reliably covers the stated requirement in its declared scope. | Tool/rule, version, source scope, command, and observed evidence. |
| Partial | A check covers a specific part, but not the whole principle. | Covered behavior, missing behavior, and guidance for the remainder. |
| Guidance | The decision requires context or engineering judgment. | A short local instruction with a useful decision criterion. |
| Uncovered | A mechanical requirement is relevant but no reliable check is active. | Why: unavailable tool, declined install, uncertain mapping, or missing capability. |
| Not applicable | The principle has no relevant counterpart in this target. | The concrete reason, not merely absence of a checker. |

An exception is an explicit user choice recorded alongside the disposition,
not a claim that the rule is enforced. Preserve its scope and reason. Do not
invent an exception on the user's behalf or silently re-enable one during sync.

Prefer tools already owned by the repository, then installed dependencies,
then a proposed native tool with permission to install it. Consult the exact
installed version's source or primary documentation. Avoid adding a second
linter when the existing one can express the selected check. Bundled assets
are optional implementations, not a default extra toolchain.

Examples of the distinction:

- A native prohibition on explicit `any` can enforce that particular typing
  rule. It does not prove every boundary validates its inputs.
- "Avoid pointless wrappers" becomes guidance to keep a wrapper only when it
  names a useful concept, enforces an invariant, or marks a boundary. Matching
  a forwarding function's syntax does not decide those questions.
- Pytest-style checks can provide partial test hygiene. Do not infer that they
  prevent skipped tests or establish that assertions prove useful behavior.
- An unavailable linter is an uncovered requirement, not evidence that its
  underlying standard is irrelevant to the language.

The Node implementations show concrete enforcement intent for other stacks.
During apply, if existing tools cannot express a selected mechanical check,
implement a small equivalent in the target repository using its established
extension or scripting approach. Explain why native options are insufficient,
keep the check's scope explicit, and verify actual passing and failing cases.
Ask before dependency changes. Do not mechanically port AST code, approximate
judgment with syntax bans, or create a shared language package. If reliable
enforcement needs a larger project, propose it and record the gap rather than
expanding adoption. Keep existing checks unless the user decides otherwise.

Done when every relevant principle has a defensible disposition and no coverage
claim depends only on a similarly named rule or a green command.

## Leave guidance and an adoption record

Keep one target-owned record at `lint/standards/ADOPTION.md`. Update it in place;
do not overwrite existing local decisions. It contains:

- The catalog source and the target ecosystems or subprojects considered.
- **Agent guidance:** short, actionable instructions for judgment calls and
  partial coverage, using the target's names and conventions. Do not paste the
  entire catalog or duplicate commands that existing docs already explain.
- **Coverage:** a compact table of standard id, disposition, actual check or
  local guidance, remaining gap, and evidence. Group genuinely inapplicable
  standards with a shared reason rather than inflating the guidance section.
- **Exceptions:** the user's decisions, their scope, and reasons.

Each active-check entry names its rule or option, config location, tool version,
source scope, and runnable command. Native configurations and locally translated
files belong to the target, not to the catalog's vendored-file hash table.

Add a short pointer in the target's existing scoped agent instructions to read
the record's Agent guidance when implementing or reviewing code. Preserve the
rest of those instructions. If none exist, create a minimal `AGENTS.md` with
that pointer. Link existing equivalent guidance instead of copying it into a
second authority. Respect a user request not to write agent instructions and
report the missing discovery path.

Keep `manifest.json` for provenance of actual catalog copies, using the schema below. The adoption record holds project decisions and active
coverage; hashes alone cannot represent those. Even an adoption that vendors
no files can record `files: {}` and empty bundled-preset lists.

Done when future agents can find the short guidance, maintainers can tell which
checks actually run, and neither prose guidance nor inactive files are counted
as mechanical enforcement.

## Provenance manifest

`lint/standards/manifest.json` tracks copies of catalog files, not project
decisions or native config written in place:

```json
{
  "source": { "repository": "<catalog remote>", "commit": "<catalog sha>" },
  "catalogVersion": 1,
  "ecosystems": ["javascript"],
  "presets": { "javascript": [] },
  "files": {}
}
```

List the actual target ecosystems, including locally translated ones. Preset
lists contain only active bundled factories; native rules
configured directly are described in `ADOPTION.md` instead.

For each copied file, key `files` by its target-relative path and record
`{ "source": "<catalog-relative path>", "sha256": "<copied upstream hash>" }`.
Use the catalog-relative source even when a baseline is renamed on the way in.
Take runtime copy lists from `git ls-files`, not directory walks that include
caches. Never overwrite pre-existing files while establishing provenance.

Keep the adoption record, agent instructions, target config, and locally
translated assets out of `files`: they are target-owned, not catalog bytes
that sync may replace. A file modified locally after vendoring retains its
recorded upstream hash so sync can detect the modification.
