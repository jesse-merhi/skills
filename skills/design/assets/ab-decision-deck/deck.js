function batchStorageKey(deckId) {
  return `ab-decision-deck:${deckId}`;
}

export function createDecisionStore({ deckId, getStorage = () => globalThis.localStorage }) {
  if (!deckId?.trim()) throw new Error("Supply a deckId for this batch");

  const batchKey = batchStorageKey(deckId);
  const keyFor = id => `${batchKey}:${id}`;
  const decisions = new Map();
  let storage;
  try {
    storage = getStorage();
  } catch {
    // Sandboxed frames can block access to the storage object itself.
  }
  function readDraft(key) {
    let draft;
    try {
      draft = storage?.getItem(key);
    } catch {
      storage = undefined;
      return;
    }
    if (draft == null) return draft;

    try {
      const saved = JSON.parse(draft);
      if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;
    } catch {
      // Keep the last readable decision in memory.
    }
  }

  function get(id) {
    let saved = readDraft(keyFor(id));
    if (saved === null) {
      // Older decks saved the batch together. An item key takes precedence once edited.
      const legacy = readDraft(batchKey);
      saved = legacy === undefined ? undefined : legacy?.[id] ?? {};
    }
    if (saved !== undefined) {
      const { vote, note } = saved;
      decisions.set(id, {
        vote: vote === "approve" || vote === "deny" ? vote : null,
        note: typeof note === "string" ? note : "",
      });
    }
    return { vote: null, note: "", ...decisions.get(id) };
  }

  function write(id, decision) {
    decisions.set(id, decision);
    try {
      storage?.setItem(keyFor(id), JSON.stringify(decision));
    } catch {
      // Switch to an in-memory draft so later reads keep the unsaved edit.
      storage = undefined;
    }
  }

  return {
    get,
    isPersistent: () => Boolean(storage),
    toggleVote(id, vote) {
      const previous = get(id);
      write(id, { ...previous, vote: previous.vote === vote ? null : vote });
    },
    approveScreen(ids) {
      for (const id of ids) write(id, { ...get(id), vote: "approve" });
    },
    setNote(id, note) {
      write(id, { ...get(id), note });
    },
  };
}

export function formatDecisions(items, getDecision) {
  const sections = { approve: [], deny: [], unmarked: [] };
  const seen = new Set();
  for (const { id, label } of items) {
    if (seen.has(id)) continue;
    seen.add(id);
    const { vote, note } = getDecision(id);
    const text = note.trim().replaceAll("\n", "\n  ");
    if (vote || text) {
      const line = `${id} ${label}`;
      sections[vote ?? "unmarked"].push(text ? `${line} — ${text}` : line);
    }
  }

  return [
    ["APPROVE:", sections.approve],
    ["DENY:", sections.deny],
    ["NOTES (unmarked):", sections.unmarked],
  ].filter(([, lines]) => lines.length)
    .map(([heading, lines]) => [heading, ...lines].join("\n"))
    .join("\n\n");
}

export function mountAbDecisionDeck(root, { deckId }) {
  const panels = [...root.querySelectorAll("[data-screen]")];
  if (panels.length < 1 || panels.length > 5) throw new Error("Supply one to five screens per deck");

  const store = createDecisionStore({ deckId });
  const doc = root.ownerDocument;
  const controller = new AbortController();
  const listen = (element, event, handler) => element.addEventListener(event, handler, { signal: controller.signal });
  const tabs = root.querySelector("[data-deck-tabs]");
  const prev = root.querySelector("[data-prev]");
  const next = root.querySelector("[data-next]");
  const status = root.querySelector("[data-copy-status]");
  const output = root.querySelector("[data-decisions]");
  const keyPrefix = `${batchStorageKey(deckId)}:`;
  let current = 0;
  let copyMessage = "";

  const screens = panels.map((panel, index) => {
    const title = panel.querySelector("h2").textContent.trim();
    const tab = doc.createElement("button");
    tab.type = "button";
    tab.id = `${panel.id}-tab`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panel.id);
    panel.setAttribute("aria-labelledby", tab.id);
    tabs.append(tab);
    listen(tab, "click", () => select(index));

    const items = [...panel.querySelectorAll("[data-item]")].map(item => {
      const id = item.dataset.item;
      const label = item.querySelector("h3").textContent.trim();
      const controls = doc.createElement("div");
      controls.className = "ab-deck-controls";
      controls.innerHTML = `
        <button type="button" data-vote="approve">Approve</button>
        <button type="button" data-vote="deny">Deny</button>
        <textarea rows="1" placeholder="Add a note"></textarea>`;
      item.append(controls);

      const buttons = [...controls.querySelectorAll("[data-vote]")];
      for (const button of buttons) {
        button.setAttribute("aria-label", `${button.textContent} ${label}`);
        listen(button, "click", () => {
          store.toggleVote(id, button.dataset.vote);
          refresh({ clearCopy: true });
        });
      }

      const note = controls.querySelector("textarea");
      note.setAttribute("aria-label", `Note for ${label}`);
      listen(note, "input", () => {
        store.setNote(id, note.value);
        refresh({ clearCopy: true });
      });

      return { id, label, controls, buttons, note };
    });

    const ids = [...new Set(items.map(item => item.id))];
    listen(panel.querySelector("[data-approve-screen]"), "click", () => {
      store.approveScreen(ids);
      refresh({ clearCopy: true });
    });
    return { panel, title, tab, items, ids };
  });

  const items = screens.flatMap(screen => screen.items);
  const itemIds = [...new Set(items.map(item => item.id))];

  function select(index, focusTab = false) {
    current = index;
    screens.forEach(({ tab, panel }, screenIndex) => {
      const active = screenIndex === current;
      panel.hidden = !active;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    prev.disabled = current === 0;
    next.disabled = current === screens.length - 1;
    if (focusTab) screens[current].tab.focus();
  }

  function refresh({ clearCopy = false } = {}) {
    const decisions = new Map(itemIds.map(id => [id, store.get(id)]));
    for (const { title, tab, ids } of screens) {
      const voted = ids.filter(id => decisions.get(id).vote).length;
      const tally = `${title} · ${voted}/${ids.length}`;
      if (tab.textContent !== tally) tab.textContent = tally;
    }
    for (const { id, buttons, note } of items) {
      const decision = decisions.get(id);
      for (const button of buttons) {
        button.setAttribute("aria-pressed", String(button.dataset.vote === decision.vote));
      }
      if (note.value !== decision.note) note.value = decision.note;
    }
    if (clearCopy) {
      copyMessage = "";
      output.hidden = true;
    }
    const message = copyMessage || (store.isPersistent() ? "" : "Draft is temporary here — copy decisions before leaving.");
    if (status.textContent !== message) status.textContent = message;
  }

  function showCopyMessage(message) {
    copyMessage = message;
    status.textContent = message;
  }

  listen(prev, "click", () => select(current - 1, current === 1));
  listen(next, "click", () => select(current + 1, current === screens.length - 2));
  listen(doc, "keydown", event => {
    if (event.defaultPrevented || event.isComposing || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (event.target.closest?.("input,textarea,select")
      || event.target.closest?.("[contenteditable]")?.isContentEditable) return;
    // Arrow keys also work before the reviewer has focused a control.
    if (event.target !== doc.body && !root.contains(event.target)) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    const index = current + (event.key === "ArrowLeft" ? -1 : 1);
    event.preventDefault();
    if (index >= 0 && index < screens.length) {
      const disablesFocusedButton = (event.target === prev && index === 0)
        || (event.target === next && index === screens.length - 1);
      select(index, disablesFocusedButton || tabs.contains(event.target) || panels[current].contains(event.target));
    }
  });

  doc.defaultView?.addEventListener("storage", event => {
    if (event.key === null || event.key.startsWith(keyPrefix)) refresh();
  }, { signal: controller.signal });

  listen(root.querySelector("[data-copy]"), "click", async () => {
    const text = formatDecisions(items, store.get);
    if (!text) {
      output.hidden = true;
      showCopyMessage("No decisions or notes yet.");
      return;
    }

    try {
      await doc.defaultView.navigator.clipboard.writeText(text);
      if (!controller.signal.aborted) {
        output.hidden = true;
        showCopyMessage("Decisions copied.");
      }
    } catch {
      if (controller.signal.aborted) return;
      output.textContent = text;
      output.hidden = false;
      output.focus();
      const range = doc.createRange();
      range.selectNodeContents(output);
      const selection = doc.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      showCopyMessage("Copy the selected text with your keyboard or copy menu.");
    }
  });

  select(0);
  refresh();

  return {
    dispose() {
      controller.abort();
      for (const { tab } of screens) tab.remove();
      for (const { controls } of items) controls.remove();
    },
  };
}
