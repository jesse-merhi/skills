# Translate principles to the target

Adapt the standards to the requested language or stack. Translation is a
repository-specific mapping, not a requirement to add a shared catalog column
or recreate JavaScript checkers in another language.

During apply, use this path for an ecosystem the catalog does not represent,
then return the mapping to apply and continue the authorized installation.
For a standalone translation request, return a proposed adoption table and
local guidance; do not install tools or claim anything is active. If the target
is unspecified, resolve it before making repository-specific decisions.

## Steps

1. **Understand the target and the intent.**

   Inspect manifests, source directories, existing configuration, dependencies,
   and the commands the repository already uses. Read the catalog principles
   before looking for analogous rules. The Node/JavaScript implementations
   show concrete examples, not a language-independent definition of the rule.

   Done when the target stack and each relevant principle are understood. An
   absent catalog column is not a reason to stop; an unidentified target is.

2. **Look for existing enforcement.**

   Prefer the target's tools and installed dependencies. Verify candidate native
   rules or compiler settings against the installed version's documentation or
   source. When proposing a new tool, name its version and trade-offs for the
   dependency approval in apply. Do not install anything in this mapping step.

   Do not assume a native rule covers a whole principle because its name sounds
   related. Record exactly what it checks. If no existing tool can express a
   reliable mechanical requirement, propose a small target-owned check under
   the shared adoption policy, not a package for this catalog. Implement it
   when returning to apply; standalone translation does not write checkers.

   Done when every proposed check has a supported meaning and every missing
   mapping has a reason, without speculative tools or fabricated rule ids.

3. **Classify coverage and write local guidance.**

   Use the dispositions in the shared adoption policy loaded by the entrypoint. Keep judgment-dependent
   standards as guidance. Mark a relevant but unenforced mechanical requirement
   uncovered, not not-applicable. For partial coverage, state both the checked
   subset and the remaining obligation.

   Specify the config location, source scope, and normal command for proposed
   checks. Reuse the repository's runner; do not build an adapter framework.

   Done when the mapping names existing tooling, ordinary configuration or a
   bounded local check, and every relevant principle has a truthful disposition.

4. **Return to the caller.**

   During apply, continue with its approval, wiring, guidance, and verification
   steps. A standalone translation reports the proposal, tooling evidence,
   gaps, and required approvals. Neither path needs to mutate the catalog.

   Done when an apply request continues through verification, or a standalone
   translation delivers the requested proposal without claiming installation.

## Explicit shared-catalog contributions

Only when the user asks to contribute the translation back to this skill,
read the catalog-format reference loaded by the entrypoint. Preserve the catalog's schema and
machine-readable checks when editing its entries. Add only mappings supported
by observed tooling behavior; do not manufacture a checker or exhaustive matrix
to make a column look complete. Shared changes and publication require their
own authorized scope. A target adoption remains usable without them.
