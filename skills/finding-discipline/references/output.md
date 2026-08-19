# Output

Use this shape for each finding:

```md
[P0/P1/P2/P3] Imperative title under 80 characters

The changed code in `path/to/file.ts` now does <bad behavior> when <trigger>.
That breaks <contract/user-visible behavior> because <evidence>. Fix by
<specific direction>.
```

Include file and line references as tightly as the harness supports. In Codex
app reviews, emit `::code-comment{...}` findings when the user asked for review
findings.

Use exactly the severity and disposition returned by the findings CLI. Do not
choose or raise severity in prose. A severity attached to `consult` records the
stakes; it does not authorize a patch.

For a maintenance finding, use this body instead:

```md
[maintenance] Imperative title under 80 characters

The changed code in `path/to/file.ts` adds <defense or indirection>, but
<caller/producer/contract evidence> shows it has no current job. This makes
<specific reading/change/test cost> harder without preserving <behavior or
boundary>. Fix by <specific simplification>.
```

## Severity

- `P0`: likely, critical impact.
- `P1`: likely or possible high impact, or possible or rare critical impact.
- `P2`: likely or possible medium impact, or rare high impact.
- `P3`: likely, low impact.

Unknown and theoretical risks have no severity. Possible/low and rare/low or
medium risks are rejected. The CLI is authoritative when prose and memory
disagree.
