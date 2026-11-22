import { expect, test } from "vitest";

import { createDecisionStore, formatDecisions } from "./assets/ab-decision-deck/deck.js";

const items = [
  { id: "1.1", label: "Link each order number" },
  { id: "1.2", label: "Label the status column" },
  { id: "2.1", label: "Move status to the order header" },
];

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

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
  const storage = memoryStorage();
  const getStorage = () => storage;
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

test("open decks export current decisions and toggle the latest saved vote", () => {
  const storage = memoryStorage();
  const batch = { deckId: "orders", getStorage: () => storage };
  const first = createDecisionStore(batch);
  const second = createDecisionStore(batch);

  first.toggleVote("1.1", "approve");
  first.setNote("1.1", "Keep the order number visible.");

  expect(formatDecisions(items, second.get)).toBe(
    "APPROVE:\n1.1 Link each order number — Keep the order number visible.",
  );

  first.toggleVote("1.1", "deny");
  second.toggleVote("1.1", "deny");
  second.setNote("2.1", "Check the narrow layout.");

  expect(formatDecisions(items, first.get)).toBe(
    "NOTES (unmarked):\n1.1 Link each order number — Keep the order number visible.\n" +
    "2.1 Move status to the order header — Check the narrow layout.",
  );
});

test("overlapping writes to unrelated items preserve both decisions", () => {
  const storage = memoryStorage();
  const batch = { deckId: "orders", getStorage: () => storage };
  const first = createDecisionStore(batch);
  const second = createDecisionStore(batch);
  first.toggleVote("1.1", "approve");
  second.toggleVote("2.1", "deny");

  const commit = storage.setItem;
  const writtenKeys = [];
  storage.setItem = (key, value) => {
    writtenKeys.push(key);
    if (writtenKeys.length === 1) second.setNote("2.1", "Check the narrow layout.");
    commit(key, value);
  };
  first.setNote("1.1", "Keep the order number visible.");

  const reopened = createDecisionStore(batch);
  expect(writtenKeys).toEqual(["ab-decision-deck:orders:1.1", "ab-decision-deck:orders:2.1"]);
  expect(reopened.get("1.1")).toEqual({ vote: "approve", note: "Keep the order number visible." });
  expect(reopened.get("2.1")).toEqual({ vote: "deny", note: "Check the narrow layout." });
});

test("keeps earlier batch drafts readable and prefers item edits on reload", () => {
  const storage = memoryStorage();
  storage.setItem("ab-decision-deck:orders", JSON.stringify({
    "1.1": { vote: "deny", note: "Keep the order number visible." },
    "2.1": { vote: null, note: "Check the narrow layout." },
  }));
  const batch = { deckId: "orders", getStorage: () => storage };
  const store = createDecisionStore(batch);
  store.toggleVote("1.1", "deny");

  const reopened = createDecisionStore(batch);
  expect(formatDecisions(items, reopened.get)).toBe(
    "NOTES (unmarked):\n1.1 Link each order number — Keep the order number visible.\n" +
    "2.1 Move status to the order header — Check the narrow layout.",
  );
});

test.each([
  ["localStorage is missing", () => undefined],
  ["the frame blocks access to localStorage", () => { throw new DOMException("Storage is blocked", "SecurityError"); }],
  ["reading localStorage is blocked", () => ({
    getItem: () => { throw new DOMException("Storage is blocked", "SecurityError"); },
    setItem: () => { throw new Error("Cannot write over an unreadable draft"); },
  })],
  ["the storage quota is exhausted", () => ({
    getItem: () => null,
    setItem: () => { throw new DOMException("Storage is full", "QuotaExceededError"); },
  })],
])("keeps decisions available to copy when %s", (_scenario, getStorage) => {
  const store = createDecisionStore({ deckId: "orders", getStorage });
  store.toggleVote("1.1", "deny");
  store.setNote("1.1", "Keep the order number visible.");

  expect(store.isPersistent()).toBe(false);
  expect(formatDecisions(items, store.get)).toBe(
    "DENY:\n1.1 Link each order number — Keep the order number visible.",
  );
});
