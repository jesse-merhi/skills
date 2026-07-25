"use strict";

const state = {
  meta: null,
  cases: [],
  choices: new Map(),
  savedIds: new Set(),
  tags: [],
  sourceVerdicts: [],
  token: "",
  index: 0,
  saving: false,
};

const VERDICT_COPY = {
  ok: "Fine — a normal paragraph of mine",
  "too-specific": "Too specific — judging it means recalling details, not voice",
  "not-prose": "Not really prose — notes, a list, or metadata",
  "off-voice-source": "This whole article is not writing I want to sound like",
};

const byId = (id) => document.getElementById(id);
const elements = {
  shell: byId("top"),
  finish: byId("finish"),
  error: byId("error"),
  errorMessage: byId("errorMessage"),
  progressText: byId("progressText"),
  progressBar: byId("progressBar"),
  batchLabel: byId("batchLabel"),
  purposeBadge: byId("purposeBadge"),
  roleBadge: byId("roleBadge"),
  dimensionBadge: byId("dimensionBadge"),
  neutralBrief: byId("neutralBrief"),
  mustPreserve: byId("mustPreserve"),
  beforeContext: byId("beforeContext"),
  afterContext: byId("afterContext"),
  options: byId("options"),
  noneButton: byId("noneButton"),
  tags: byId("tags"),
  sourceVerdicts: byId("sourceVerdicts"),
  confidence: byId("confidence"),
  note: byId("note"),
  editPanel: byId("editPanel"),
  editedOutput: byId("editedOutput"),
  previousButton: byId("previousButton"),
  saveButton: byId("saveButton"),
  statusMessage: byId("statusMessage"),
  finishCopy: byId("finishCopy"),
  finishButton: byId("finishButton"),
  reviewButton: byId("reviewButton"),
  results: byId("results"),
};

function optionCard(option, choice) {
  const card = document.createElement("article");
  card.className = "option-card";

  const button = document.createElement("button");
  button.type = "button";
  const selected = option.label === choice.label;
  button.className = `option${selected ? " selected" : ""}`;
  button.dataset.label = option.label;
  button.setAttribute("aria-pressed", selected ? "true" : "false");

  const label = document.createElement("span");
  label.className = "option-label";
  label.textContent = option.label;

  const copy = document.createElement("p");
  copy.className = "option-copy";
  copy.textContent = option.output;

  button.append(label, copy);
  button.addEventListener("click", () => select(option.label));

  const flag = document.createElement("label");
  flag.className = "fact-flag";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.dataset.unfaithful = option.label;
  input.checked = choice.unfaithful.includes(option.label);
  input.addEventListener("change", () => {
    captureForm();
    renderSelection();
  });
  const text = document.createElement("span");
  text.textContent = `${option.label} changes or drops a fact`;
  flag.append(input, text);

  card.append(button, flag);
  return card;
}

function currentCase() {
  return state.cases[state.index];
}

function draftChoice() {
  const caseId = currentCase().case_id;
  const existing = state.choices.get(caseId) || {};
  return {
    case_id: caseId,
    label: existing.label || "",
    tags: existing.tags || [],
    unfaithful: existing.unfaithful || [],
    source_verdict: existing.source_verdict || "ok",
    confidence: existing.confidence || "medium",
    note: existing.note || "",
    edited_output: existing.edited_output || "",
  };
}

function select(label) {
  if (!currentCase()) return;
  const choice = captureForm();
  if (choice.label && choice.label !== label) choice.edited_output = "";
  choice.label = label;
  if (label === "none") choice.edited_output = "";
  state.choices.set(choice.case_id, choice);
  renderSelection();
}

function renderSelection() {
  const choice = draftChoice();
  for (const button of elements.options.querySelectorAll(".option")) {
    const selected = button.dataset.label === choice.label;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  }
  elements.noneButton.classList.toggle("selected", choice.label === "none");
  elements.noneButton.setAttribute("aria-pressed", choice.label === "none" ? "true" : "false");
  elements.editPanel.hidden = !choice.label || choice.label === "none";
  if (!elements.editPanel.hidden && !elements.editedOutput.value) {
    const option = currentCase().options.find((item) => item.label === choice.label);
    elements.editedOutput.placeholder = option ? option.output : "";
  }
  const conflicted = Boolean(choice.label) && choice.unfaithful.includes(choice.label);
  if (conflicted) {
    elements.editPanel.hidden = false;
    elements.editPanel.open = true;
    elements.statusMessage.textContent =
      `${choice.label} is your pick but is flagged as changing a fact. Edit it, or choose another option.`;
  } else if (elements.statusMessage.textContent.includes("flagged as changing a fact")) {
    elements.statusMessage.textContent = "";
  }
}

function renderSourceVerdicts(selected) {
  elements.sourceVerdicts.replaceChildren();
  for (const value of ["ok", ...state.sourceVerdicts]) {
    const option = document.createElement("label");
    option.className = "verdict";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "sourceVerdict";
    input.value = value;
    input.checked = value === selected;
    const text = document.createElement("span");
    text.textContent = VERDICT_COPY[value] || value.replaceAll("-", " ");
    option.append(input, text);
    elements.sourceVerdicts.append(option);
  }
}

function captureForm() {
  const choice = draftChoice();
  choice.tags = [...elements.tags.querySelectorAll("input:checked")].map((input) => input.value);
  choice.unfaithful = [...elements.options.querySelectorAll("input[data-unfaithful]:checked")]
    .map((input) => input.dataset.unfaithful);
  const verdict = elements.sourceVerdicts.querySelector("input:checked");
  choice.source_verdict = verdict ? verdict.value : "ok";
  choice.confidence = elements.confidence.value;
  choice.note = elements.note.value.trim();
  choice.edited_output = elements.editedOutput.value.trim();
  state.choices.set(choice.case_id, choice);
  return choice;
}

function completedCount() {
  return state.savedIds.size;
}

function updateProgress() {
  const complete = completedCount();
  const total = state.cases.length;
  elements.progressText.textContent = `${complete} of ${total} saved`;
  elements.progressBar.style.width = `${total ? (complete / total) * 100 : 0}%`;
  elements.batchLabel.textContent = state.meta ? state.meta.name : "";
}

function renderTags(selected) {
  elements.tags.replaceChildren();
  for (const tag of state.tags) {
    const label = document.createElement("label");
    label.className = "tag";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = tag;
    input.checked = selected.includes(tag);
    const span = document.createElement("span");
    span.textContent = tag.replaceAll("-", " ");
    label.append(input, span);
    elements.tags.append(label);
  }
}

function render() {
  if (state.index >= state.cases.length) {
    showFinish();
    return;
  }
  elements.finish.hidden = true;
  elements.shell.hidden = false;
  const item = currentCase();
  const choice = draftChoice();
  elements.purposeBadge.textContent = state.meta.purpose === "eval" ? "Held-out evaluation" : "Training preference";
  elements.roleBadge.textContent = item.rhetorical_role;
  elements.dimensionBadge.textContent = item.voice_dimension ? `leans on ${item.voice_dimension}` : "";
  elements.dimensionBadge.hidden = !item.voice_dimension;
  elements.neutralBrief.textContent = item.neutral_brief;
  elements.mustPreserve.replaceChildren(...item.must_preserve.map((fact) => {
    const li = document.createElement("li");
    li.textContent = fact;
    return li;
  }));
  elements.beforeContext.textContent = item.preceding_context || "No preceding passage.";
  elements.afterContext.textContent = item.following_context || "No following passage.";
  elements.options.replaceChildren(...item.options.map((option) => optionCard(option, choice)));
  elements.confidence.value = choice.confidence;
  elements.note.value = choice.note;
  elements.editedOutput.value = choice.edited_output;
  elements.editPanel.open = Boolean(choice.edited_output);
  renderTags(choice.tags);
  renderSourceVerdicts(choice.source_verdict);
  elements.previousButton.disabled = state.index === 0;
  elements.statusMessage.textContent = "";
  updateProgress();
  renderSelection();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveAndMove(direction = 1) {
  if (state.saving || !currentCase()) return;
  const choice = captureForm();
  if (!choice.label) {
    elements.statusMessage.textContent = "Choose an option or mark none acceptable.";
    return;
  }
  state.saving = true;
  elements.saveButton.disabled = true;
  elements.statusMessage.textContent = "Saving locally…";
  try {
    const response = await fetch("/api/choice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...choice, token: state.token }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || `Save failed (${response.status})`);
    elements.statusMessage.textContent = "Saved on this machine.";
    state.savedIds.add(choice.case_id);
    updateProgress();
    state.index = Math.max(0, Math.min(state.cases.length, state.index + direction));
    render();
  } catch (error) {
    elements.statusMessage.textContent = error.message;
  } finally {
    state.saving = false;
    elements.saveButton.disabled = false;
  }
}

function showFinish() {
  elements.shell.hidden = true;
  elements.finish.hidden = false;
  const preference = state.meta.purpose === "preference";
  elements.finishCopy.textContent = preference
    ? "Finish to convert your blind selections into local preference pairs. Held-out evaluation data is not involved."
    : "Finish to reveal the aggregate system scores. This held-out batch will never be exported into training data.";
  elements.finishButton.textContent = preference ? "Export preference pairs" : "Reveal held-out score";
  updateProgress();
}

async function finishBatch() {
  elements.finishButton.disabled = true;
  try {
    const response = await fetch("/api/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: state.token }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || `Finish failed (${response.status})`);
    elements.results.textContent = JSON.stringify(body, null, 2);
    elements.results.hidden = false;
    elements.finishButton.hidden = true;
  } catch (error) {
    elements.finishCopy.textContent = error.message;
    elements.finishButton.disabled = false;
  }
}

async function boot() {
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) throw new Error(`Local server returned ${response.status}`);
    const body = await response.json();
    state.meta = body.meta;
    state.cases = body.cases;
    state.tags = body.tags;
    state.sourceVerdicts = body.source_verdicts || [];
    state.token = body.token;
    state.choices = new Map(body.choices.map((choice) => [choice.case_id, choice]));
    state.savedIds = new Set(body.choices.map((choice) => choice.case_id));
    const firstIncomplete = state.cases.findIndex((item) => !state.choices.get(item.case_id)?.label);
    state.index = firstIncomplete === -1 ? state.cases.length : firstIncomplete;
    render();
  } catch (error) {
    elements.errorMessage.textContent = error.message;
    elements.error.hidden = false;
  }
}

elements.noneButton.addEventListener("click", () => select("none"));
elements.previousButton.addEventListener("click", () => {
  captureForm();
  state.index = Math.max(0, state.index - 1);
  render();
});
elements.saveButton.addEventListener("click", () => saveAndMove(1));
elements.finishButton.addEventListener("click", finishBatch);
elements.reviewButton.addEventListener("click", () => {
  state.index = Math.max(0, state.cases.length - 1);
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
  if (event.target instanceof HTMLInputElement) return;
  if (event.key >= "1" && event.key <= "9") {
    const option = currentCase()?.options[Number(event.key) - 1];
    if (option) select(option.label);
  } else if (event.key.toLowerCase() === "n") {
    select("none");
  } else if (event.key === "Enter") {
    event.preventDefault();
    saveAndMove(1);
  } else if (event.key === "ArrowLeft" && state.index > 0) {
    captureForm();
    state.index -= 1;
    render();
  }
});

boot();
