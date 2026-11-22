export function createDecisionStore({ deckId, getStorage = () => globalThis.localStorage }) {
  if (!deckId?.trim()) throw new Error("Supply a deckId for this batch");

  const key = `ab-decision-deck:${deckId}`;
  const decisions = new Map();
  let storage;
  try {
    storage = getStorage();
    const saved = JSON.parse(storage?.getItem(key) ?? "{}");
    for (const [id, decision] of Object.entries(saved ?? {})) {
      const vote = decision?.vote;
      decisions.set(id, {
        vote: vote === "approve" || vote === "deny" ? vote : null,
        note: typeof decision?.note === "string" ? decision.note : "",
      });
    }
  } catch {
    // Storage may be blocked by the frame or contain an unreadable draft.
  }

  function get(id) {
    return { vote: null, note: "", ...decisions.get(id) };
  }

  function update(ids, change) {
    for (const id of ids) decisions.set(id, { ...get(id), ...change });
    try {
      storage?.setItem(key, JSON.stringify(Object.fromEntries(decisions)));
    } catch {
      // Keep the current draft available to copy even when storage is blocked.
    }
  }

  return {
    get,
    toggleVote(id, vote) {
      update([id], { vote: get(id).vote === vote ? null : vote });
    },
    approveScreen(ids) {
      update(ids, { vote: "approve" });
    },
    setNote(id, note) {
      update([id], { note });
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
  let current = 0;

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
          refresh();
        });
      }

      const note = controls.querySelector("textarea");
      note.setAttribute("aria-label", `Note for ${label}`);
      listen(note, "input", () => {
        store.setNote(id, note.value);
        refresh();
      });

      return { id, label, controls, buttons, note };
    });

    const ids = [...new Set(items.map(item => item.id))];
    listen(panel.querySelector("[data-approve-screen]"), "click", () => {
      store.approveScreen(ids);
      refresh();
    });
    return { panel, title, tab, items, ids };
  });

  const items = screens.flatMap(screen => screen.items);

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

  function refresh() {
    for (const { title, tab, ids } of screens) {
      const voted = ids.filter(id => store.get(id).vote).length;
      tab.textContent = `${title} · ${voted}/${ids.length}`;
    }
    for (const { id, buttons, note } of items) {
      const decision = store.get(id);
      for (const button of buttons) {
        button.setAttribute("aria-pressed", String(button.dataset.vote === decision.vote));
      }
      if (note.value !== decision.note) note.value = decision.note;
    }
    output.hidden = true;
    status.textContent = "";
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
      select(index, tabs.contains(event.target) || panels[current].contains(event.target));
    }
  });

  listen(root.querySelector("[data-copy]"), "click", async () => {
    const text = formatDecisions(items, store.get);
    if (!text) {
      status.textContent = "No decisions or notes yet.";
      return;
    }

    try {
      await doc.defaultView.navigator.clipboard.writeText(text);
      if (!controller.signal.aborted) {
        output.hidden = true;
        status.textContent = "Decisions copied.";
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
      status.textContent = "Copy the selected text with your keyboard or copy menu.";
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
