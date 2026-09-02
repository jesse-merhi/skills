# Output

Use this shape for each finding:

```md
[P0/P1/P2/P3] Imperative title under 80 characters

The changed code in `path/to/file.ts` now does <bad behavior> when <trigger>.
That breaks <contract/user-visible behavior> because <evidence>. Fix by
<recommended durable direction>. This intervention is justified because
<benefit compared with doing nothing and full repair cost>.
```

Include file and line references as tightly as the harness supports. In Codex
app reviews, emit `::code-comment{...}` findings when the user asked for review
findings.

For a repairless consultation, use this body instead:

```md
[P0/P1/P2] Imperative title under 80 characters

The changed code in `path/to/file.ts` causes <proven behavior> when <trigger>,
affecting <party and consequence>. The root cause belongs to <boundary>. The
repair remains unresolved because <directions checked and why none is yet
supported>. Ask the owner to decide <specific question> before editing code.
```

Use exactly the severity and disposition returned by the findings CLI. Do not
choose or raise severity in prose. A severity attached to `consult` records the
stakes. The consultation is actionable as an owner decision, not as permission
to patch.

For a maintenance finding, use this body instead:

```md
[maintenance] Imperative title under 80 characters

The changed code in `path/to/file.ts` adds <defense, duplication, or
indirection>, and <repository evidence> proves the present maintenance problem.
This adds <specific reading/change/test cost> without improving <behavior or
boundary>. Fix by <specific simplification at the owning boundary>. This
intervention is justified because <benefit compared with doing nothing and full
repair cost>.
```

## Severity

- `P0`: likely, critical impact.
- `P1`: likely or possible high impact, or possible or rare critical impact.
- `P2`: likely or possible medium impact, or rare high impact.
- `P3`: likely, low impact.

Unknown and theoretical risks have no severity. Possible/low and rare/low or
medium risks are rejected. The CLI is authoritative when prose and memory
disagree.
