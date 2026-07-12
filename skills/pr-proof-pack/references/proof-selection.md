# Proof Selection

Pick the smallest proof that explains the net diff.

Use Mermaid for:

- workflows, state transitions, dedupe, cleanup, queues, crons, migrations;
- API or integration boundaries;
- permission/access decisions;
- multi-step behavior reviewers would otherwise reconstruct from code.

Use API examples or small before/after tables for:

- response shape, ranking, scoring, sorting, counters, flags;
- backend-only behavior;
- data migration or cleanup effects.

Use screenshots for reviewer-visible UI behavior:

- changed pages, panels, cards, lists, modals, forms, empty/loading/error states;
- changed filtering, sorting, pagination, auth, permissions, responsive layout;
- UI proof a command, table, or diagram cannot make clear.

If the PR changes or makes reachable human-visible UI, the default is a
PR-visible screenshot. Load [screenshots.md](screenshots.md) for the upload
path, inline annotation format, crop rules, before/after rules, and acceptable
no-screenshot rationales.

Do not use screenshots for backend-only behavior when diagrams, API examples,
or tables are clearer. If a screenshot only proves that an unrelated route
loads, omit it and explain why no screenshot is needed for that unchanged UI.

Load [body-shape.md](body-shape.md) before using tables in the PR body. Do not
use a generic net-diff table as proof when it only groups code areas without
explaining behavior.
