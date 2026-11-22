import { expect, test } from "vitest";

import { createDecisionStore, formatDecisions } from "./assets/ab-decision-deck/deck.js";

const items = [
  { id: "1.1", label: "Link each order number" },
  { id: "1.2", label: "Label the status column" },
  { id: "2.1", label: "Move status to the order header" },
];

test("exports one decision per item and keeps a note when its vote is cleared", () => {
  const store = createDecisionStore({ deckId: "orders", getStorage: () => undefined });
  const repeatedItems = [...items, items[0]];
  store.setNote("1.1", "Keep the order number visible.");
  store.toggleVote("1.1", "approve");
  store.toggleVote("1.1", "deny");
  store.toggleVote("1.2", "approve");
  store.setNote("2.1", "Check the narrow layout.");

  expect(formatDecisions(repeatedItems, store.get)).toBe(
    "APPROVE:\n1.2 Label the status column\n\n" +
    "DENY:\n1.1 Link each order number — Keep the order number visible.\n\n" +
    "NOTES (unmarked):\n2.1 Move status to the order header — Check the narrow layout.",
  );

  store.toggleVote("1.1", "deny");

  expect(formatDecisions(repeatedItems, store.get)).toBe(
    "APPROVE:\n1.2 Label the status column\n\n" +
    "NOTES (unmarked):\n1.1 Link each order number — Keep the order number visible.\n" +
    "2.1 Move status to the order header — Check the narrow layout.",
  );
});

test("restores bulk approvals and unmarked notes for the same batch", () => {
  const values = new Map();
  const getStorage = () => ({
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  });
  const store = createDecisionStore({ deckId: "orders", getStorage });
  store.toggleVote("1.1", "deny");
  store.setNote("1.1", "Keep the order number visible.");
  store.approveScreen(["1.1", "1.2"]);
  store.setNote("2.1", "Check the narrow layout.");

  const reopened = createDecisionStore({ deckId: "orders", getStorage });
  const otherBatch = createDecisionStore({ deckId: "fulfilment", getStorage });

  expect(formatDecisions(items, reopened.get)).toBe(
    "APPROVE:\n1.1 Link each order number — Keep the order number visible.\n" +
    "1.2 Label the status column\n\n" +
    "NOTES (unmarked):\n2.1 Move status to the order header — Check the narrow layout.",
  );
  expect(formatDecisions(items, otherBatch.get)).toBe("");
});

test.each([
  ["the frame blocks access to localStorage", () => { throw new DOMException("Storage is blocked", "SecurityError"); }],
  ["the storage quota is exhausted", () => ({
    getItem: () => null,
    setItem: () => { throw new DOMException("Storage is full", "QuotaExceededError"); },
  })],
])("keeps decisions available to copy when %s", (_scenario, getStorage) => {
  const store = createDecisionStore({ deckId: "orders", getStorage });
  store.toggleVote("1.1", "deny");
  store.setNote("1.1", "Keep the order number visible.");

  expect(formatDecisions(items, store.get)).toBe(
    "DENY:\n1.1 Link each order number — Keep the order number visible.",
  );
});
