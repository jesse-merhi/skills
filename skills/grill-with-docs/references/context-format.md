# CONTEXT.md format

## Structure

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
{A one or two sentence description of the term}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

## Rules

- Be opinionated. When multiple words exist for the same concept, pick the best
  one and list the others as aliases to avoid.
- Flag conflicts explicitly. If a term is used ambiguously, call it out in
  `Flagged ambiguities` with a clear resolution.
- Keep definitions tight. One or two sentences max. Define what the term is.
- Show relationships. Use bold term names and express cardinality where obvious.
- Only include terms specific to this project's context. General programming
  concepts do not belong.
- Group terms under subheadings when natural clusters emerge. If all terms
  belong to one area, a flat list is fine.
- Write an example dialogue when it clarifies boundaries between related
  concepts.

## Storage

Store this in the user's Obsidian-backed project notes, not in the product repo,
unless the user explicitly asks for repo-local docs.

The preferred shape is:

```text
repos/
  <host>__<owner>__<repo>/
    CONTEXT.md
```

If write access or the target path is unclear, return the proposed note body and
path instead of writing into the product repo.

## Single vs multi-context notes

Most repos have one note-backed `CONTEXT.md`.

Repos with multiple contexts may use a note-backed `CONTEXT-MAP.md`:

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md): receives and tracks customer orders
- [Billing](./src/billing/CONTEXT.md): generates invoices and processes payments
- [Fulfillment](./src/fulfillment/CONTEXT.md): manages warehouse picking and shipping

## Relationships

- **Ordering -> Fulfillment**: Ordering emits `OrderPlaced` events; Fulfillment consumes them to start picking
- **Fulfillment -> Billing**: Fulfillment emits `ShipmentDispatched` events; Billing consumes them to generate invoices
- **Ordering <-> Billing**: Shared types for `CustomerId` and `Money`
```

Infer which structure applies in the target notes:

- If `CONTEXT-MAP.md` exists, read it to find contexts.
- If only a root `CONTEXT.md` exists, treat it as a single context.
- If neither exists, create or propose a root `CONTEXT.md` lazily when the first
  term is resolved.
- When multiple contexts exist, infer which one the current topic relates to. If
  unclear, ask.
