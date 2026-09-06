import * as Schema from "effect/Schema"

import { Catalog, type DraftContent, History, isEditableFile, SaveRequest, SaveResponse, SkillDetail, type StoredDraft } from "../Model.ts"

function element<ElementType extends HTMLElement>(id: string, kind: { new(): ElementType }): ElementType {
  const found = document.getElementById(id)
  if (found instanceof kind) return found
  throw new Error(`Missing interface element: ${id}`)
}

const editor = element("editor", HTMLTextAreaElement)
const notes = element("notes", HTMLTextAreaElement)
const preview = element("preview", HTMLIFrameElement)
const decision = element("decision", HTMLSelectElement)
const status = element("status", HTMLSelectElement)
const view = element("view", HTMLSelectElement)
const historyDialog = element("history-dialog", HTMLDialogElement)
const helpDialog = element("help-dialog", HTMLDialogElement)
const copies = new Map<string, WorkingCopy>()
const clientId = crypto.randomUUID()
let catalog: Catalog
let active = ""
let activeFile = "master"
let tabs: Array<string> = []
let navigationId = 0
let previewId = 0
let previewTimer: ReturnType<typeof setTimeout> | undefined
let outboxPrefix = ""

interface WorkingCopy {
  detail: SkillDetail
  content: DraftContent
  revision: number
  savedAt: string
  pending?: SaveRequest
  saving: boolean
  conflict?: StoredDraft
  recoveryConfirmed?: boolean
  error?: string
  timer?: ReturnType<typeof setTimeout>
}

const ErrorResponse = Schema.Struct({ message: Schema.String })
const PreviewResponse = Schema.Struct({ html: Schema.String })
const BackupResponse = Schema.Struct({ path: Schema.String })
const SavedResponse = Schema.Struct({ saved: Schema.Boolean })

async function api<Codec extends Schema.ConstraintDecoder<unknown>>(url: string, codec: Codec, body?: unknown): Promise<Codec["Type"]> {
  const response = await fetch(url, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const text = await response.text()
  if (!response.ok) {
    const decoded = Schema.decodeUnknownExit(Schema.fromJsonString(ErrorResponse))(text)
    throw new Error(decoded._tag === "Success" ? decoded.value.message : `Request failed (${response.status})`)
  }
  return Schema.decodeUnknownSync(Schema.fromJsonString(codec))(text)
}

function notice(message: string) {
  const target = element("notice", HTMLDivElement)
  target.textContent = message
  target.hidden = message.length === 0
}

function outboxKey(name: string) { return `${outboxPrefix}${clientId}:${name}` }

function preserve(copy: WorkingCopy) {
  if (!copy.pending) return
  try { localStorage.setItem(outboxKey(copy.detail.source.name), Schema.encodeSync(Schema.fromJsonString(SaveRequest))(copy.pending)) } catch {
    notice("Browser recovery storage is unavailable. Keep this page open until every draft says Saved to disk.")
  }
}

function saveStatus() {
  const copy = copies.get(active)
  if (!copy) return
  const target = element("save-status", HTMLSpanElement)
  target.dataset.state = copy.error || copy.conflict ? "error" : "saved"
  target.textContent = copy.conflict ? (copy.recoveryConfirmed ? "Save paused · both versions preserved on disk" : "Conflict · latest local edits are not confirmed on disk")
    : copy.error ? `${copy.error} · use Save now to retry`
      : copy.saving ? "Saving to disk…"
        : copy.pending ? "Unsaved changes · saving shortly…"
          : `Saved to disk · revision ${copy.revision} · ${new Date(copy.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  element("conflict", HTMLDivElement).hidden = !copy.conflict
  element("conflict-description", HTMLParagraphElement).textContent = copy.recoveryConfirmed
    ? "Your attempted save is preserved on disk in recovery history. Choose how to continue."
    : "Keep this tab open. The latest local edits are not yet confirmed in disk recovery. Save my version can retry without erasing previous revisions."
  element("load-saved", HTMLButtonElement).disabled = !copy.recoveryConfirmed
  element("save-now", HTMLButtonElement).disabled = copy.saving || !!copy.conflict || !copy.pending
  renderTabs()
}

async function save(copy: WorkingCopy): Promise<void> {
  if (!copy.pending || copy.saving || copy.conflict) return
  const request = copy.pending
  copy.saving = true
  delete copy.error
  saveStatus()
  try {
    const response = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: Schema.encodeSync(Schema.fromJsonString(SaveRequest))(request) })
    const text = await response.text()
    if (!response.ok && response.status !== 409) {
      const error = Schema.decodeUnknownExit(Schema.fromJsonString(ErrorResponse))(text)
      throw new Error(error._tag === "Success" ? error.value.message : `Save failed (${response.status})`)
    }
    const result = Schema.decodeUnknownSync(Schema.fromJsonString(SaveResponse))(text)
    if (result.outcome === "conflict") {
      copy.conflict = result.draft
      copy.recoveryConfirmed = copy.pending.operation === request.operation
      if (active === request.name) renderDocument()
      if (!copy.recoveryConfirmed) {
        const recovery = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: Schema.encodeSync(Schema.fromJsonString(SaveRequest))(copy.pending) })
        if (recovery.status !== 409) throw new Error("Latest local changes still need recovery; keep this tab open")
        const confirmed = Schema.decodeUnknownSync(Schema.fromJsonString(SaveResponse))(await recovery.text())
        if (confirmed.outcome !== "conflict") throw new Error("Recovery was not confirmed")
        copy.recoveryConfirmed = true
      }
      return
    }
    copy.revision = result.draft.revision
    copy.savedAt = result.draft.savedAt
    if (copy.pending.operation === request.operation) {
      delete copy.pending
      localStorage.removeItem(outboxKey(request.name))
    } else {
      copy.pending = { ...copy.pending, expectedRevision: result.draft.revision }
      preserve(copy)
    }
    catalog = { ...catalog, skills: catalog.skills.map((skill) => skill.name === request.name ? { ...skill, hasFeedback: result.draft.content.notes.trim().length > 0, status: result.draft.content.status, decision: result.draft.content.decision, revision: result.draft.revision } : skill) }
    renderQueue()
  } catch (error) {
    copy.error = error instanceof Error ? error.message : "Save failed"
  } finally {
    copy.saving = false
    saveStatus()
  }
  if (copy.pending && !copy.error && !copy.conflict) await save(copy)
}

function change(content: DraftContent) {
  const copy = copies.get(active)
  if (!copy) return
  copy.content = content
  copy.pending = { name: active, expectedRevision: copy.revision, operation: crypto.randomUUID(), content }
  preserve(copy)
  clearTimeout(copy.timer)
  copy.timer = setTimeout(() => { void save(copy) }, 600)
  saveStatus()
  renderQueue()
  renderFeedback()
}

function currentText(copy: WorkingCopy): string {
  if (activeFile === "master") return copy.content.master
  const source = [...copy.detail.source.files, ...(copy.detail.addedFiles ?? [])].find((file) => file.path === activeFile)
  if (!source) return "File not found in the captured source."
  if (source.encoding === "base64") return `Binary asset preserved in the source snapshot and full export.\n\n${source.path}`
  if (source.encoding === "symlink") return `Symbolic link preserved in the source snapshot.\n\n${source.path} → ${source.content}`
  return copy.detail.removedFiles.includes(activeFile) ? source.content : copy.content.files[activeFile] ?? source.content
}

const previewStyle = "body{margin:0;padding:26px;font:14px/1.8 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#343c32;overflow-wrap:anywhere}h1,h2,h3{font-family:Georgia,serif;font-weight:500;line-height:1.3;color:#283429}h1{font-size:27px;margin-top:0}h2{font-size:21px;margin-top:30px}h3{font-size:17px}pre{padding:14px;background:#f3f4ed;overflow:auto;font-size:11px;border-radius:4px}code{font:12px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;background:#f3f4ed}li{margin-bottom:7px}a{color:#8e492c;pointer-events:none}blockquote{border-left:3px solid #c7ccb9;margin-left:0;padding-left:16px;color:#63705d}table{border-collapse:collapse;display:block;overflow:auto}td,th{border:1px solid #d9ddcf;padding:7px}hr{border:0;border-top:1px solid #dde1d5;margin:24px 0}img{max-width:100%}"

function showPreview() {
  clearTimeout(previewTimer)
  const version = ++previewId
  const copy = copies.get(active)
  if (!copy) return
  const text = currentText(copy)
  const markdown = activeFile === "master" || activeFile.endsWith(".md")
  previewTimer = setTimeout(() => {
    if (document.activeElement === editor || document.activeElement === notes) return
    void (async () => {
      try {
        const code = document.createElement("pre")
        code.textContent = text
        const html = markdown ? (await api("/api/preview", PreviewResponse, { text: text.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n/, "") })).html : code.outerHTML
        if (version !== previewId || document.activeElement === editor || document.activeElement === notes) return
        preview.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><style>${previewStyle}</style></head><body>${html}</body></html>`
      } catch {
        if (version === previewId && document.activeElement !== editor && document.activeElement !== notes) preview.srcdoc = "<p>Preview is unavailable. Your text remains in the editor; check the save indicator before closing.</p>"
      }
    })()
  }, 180)
}

function renderQueue() {
  const query = element("search", HTMLInputElement).value.toLowerCase()
  const filter = element("filter", HTMLSelectElement).value
  const container = element("skill-list", HTMLElement)
  const skills = catalog.skills.map((skill) => {
    const content = copies.get(skill.name)?.content
    return content ? { ...skill, hasFeedback: content.notes.trim().length > 0, status: content.status, decision: content.decision } : skill
  })
  container.replaceChildren()
  for (const skill of skills.filter((skill) => skill.name.includes(query) && (filter === "feedback" ? skill.hasFeedback : filter === "all" || skill.status === filter))) {
    const button = document.createElement("button")
    button.className = `skill-link${skill.name === active ? " active" : ""}`
    button.dataset.status = skill.status
    button.dataset.feedback = String(skill.hasFeedback)
    button.setAttribute("aria-current", skill.name === active ? "page" : "false")
    const dot = document.createElement("span")
    dot.className = "indicator"
    dot.setAttribute("aria-hidden", "true")
    const label = document.createElement("span")
    label.textContent = skill.name
    button.append(dot, label)
    if (skill.hasFeedback) {
      const badge = document.createElement("small")
      badge.className = "review-badge"
      badge.textContent = "Outstanding feedback"
      label.append(badge)
    }
    if (skill.status === "needs-review") {
      const badge = document.createElement("small")
      badge.className = "review-badge"
      badge.textContent = "Needs re-review"
      label.append(badge)
    }
    const removal = skill.decision === "delete" ? (skill.sourceAvailable === false ? "Deleted" : "Delete requested")
      : skill.sourceAvailable === false ? "Source unavailable" : ""
    if (removal) {
      const badge = document.createElement("small")
      badge.className = "removal-badge"
      badge.textContent = removal
      label.append(badge)
      button.dataset.removed = String(skill.sourceAvailable === false)
    }
    button.title = `${skill.name} · ${removal || skill.status}${skill.hasFeedback ? " · Outstanding feedback" : ""}`
    button.onclick = () => { void openSkill(skill.name) }
    container.append(button)
  }
  if (!container.childElementCount) container.textContent = "No matching skills."
  element("skill-count", HTMLSpanElement).textContent = String(catalog.skills.length)
  element("progress", HTMLSpanElement).textContent = `${skills.filter((skill) => skill.hasFeedback).length} with feedback · ${skills.filter((skill) => skill.status === "needs-review").length} to re-review · ${skills.filter((skill) => skill.status === "ready").length} ready`
}

function renderFeedback() {
  const content = copies.get(active)?.content
  if (!content) return
  const feedback = content.notes.trim()
  const applied = element("applied-feedback", HTMLDivElement)
  applied.hidden = !content.applied
  if (content.applied) {
    element("applied-heading", HTMLElement).textContent = feedback ? "Earlier feedback applied — outstanding notes remain"
      : content.status === "needs-review" ? "Feedback applied — needs re-review" : "Previously applied feedback"
    element("applied-summary", HTMLSpanElement).textContent = content.applied.summary
    element("applied-review", HTMLParagraphElement).hidden = !content.applied.reviewFocus
    element("applied-review-focus", HTMLSpanElement).textContent = content.applied.reviewFocus ?? ""
    element("applied-meta", HTMLElement).textContent = `${new Date(content.applied.appliedAt).toLocaleString()} · Feedback revision ${content.applied.feedbackRevision} · Original feedback saved in History`
  }
}

function renderTabs() {
  const container = element("tabs", HTMLDivElement)
  container.replaceChildren()
  for (const name of tabs) {
    const button = document.createElement("button")
    button.className = "tab"
    button.setAttribute("role", "tab")
    button.setAttribute("aria-selected", String(name === active))
    button.tabIndex = name === active ? 0 : -1
    button.textContent = `${copies.get(name)?.pending ? "• " : ""}${name}`
    button.onclick = () => { void openSkill(name) }
    button.onkeydown = (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return
      event.preventDefault()
      const next = tabs[(tabs.indexOf(name) + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]
      if (next) void openSkill(next).then(() => container.querySelector<HTMLElement>('[aria-selected="true"]')?.focus())
    }
    container.append(button)
  }
}

function related(id: string, references: Catalog["skills"][number]["references"]) {
  const container = element(id, HTMLDivElement)
  container.replaceChildren()
  if (!references.length) {
    const empty = document.createElement("p")
    empty.className = "empty"
    empty.textContent = "No named references found."
    container.append(empty)
  }
  for (const reference of references) {
    const button = document.createElement("button")
    button.className = "related-link"
    button.textContent = `${reference.name} ↗`
    button.title = `${reference.file}:${reference.line}\n${reference.excerpt}`
    button.onclick = () => { void openSkill(reference.name) }
    container.append(button)
  }
}

function renderFiles() {
  const copy = copies.get(active)
  if (!copy) return
  const files = element("files", HTMLDivElement)
  const variants = element("variants", HTMLDivElement)
  const removed = element("removed-files", HTMLDivElement)
  const code = element("code-files", HTMLDivElement)
  files.replaceChildren()
  variants.replaceChildren()
  removed.replaceChildren()
  code.replaceChildren()
  const isDocument = (path: string) => !path.startsWith("variants/") && (path.endsWith(".md") || path.endsWith(".txt") || path.endsWith(".rst") || path === "agents/openai.yaml")
  element("master-file", HTMLButtonElement).classList.toggle("selected", activeFile === "master")
  for (const file of [...copy.detail.source.files, ...(copy.detail.addedFiles ?? [])].filter((file) => file.path !== "SKILL.md")) {
    const button = document.createElement("button")
    button.className = `file-button${activeFile === file.path ? " selected" : ""}`
    button.textContent = `${copy.content.reviewedFiles.includes(file.path) ? "✓ " : ""}${file.path}${copy.detail.addedFiles?.some(added => added.path === file.path) ? " · new" : ""}`
    button.onclick = () => { activeFile = file.path; renderDocument() }
    const container = copy.detail.removedFiles.includes(file.path) ? removed : file.path.startsWith("variants/") ? variants : isDocument(file.path) ? files : code
    container.append(button)
  }
  element("removed-sources", HTMLDetailsElement).hidden = !removed.childElementCount
  element("code-sources", HTMLDetailsElement).hidden = !code.childElementCount
  const validFiles = new Set(["master", ...[...copy.detail.source.files, ...(copy.detail.addedFiles ?? [])].filter((file) => file.path !== "SKILL.md" && isDocument(file.path) && !copy.detail.removedFiles.includes(file.path)).map((file) => file.path)])
  element("file-progress", HTMLSpanElement).textContent = `${copy.content.reviewedFiles.filter((file) => validFiles.has(file)).length}/${validFiles.size}`
  element("file-reviewed", HTMLInputElement).checked = copy.content.reviewedFiles.includes(activeFile)
}

function renderDocument() {
  const copy = copies.get(active)
  if (!copy) return
  const file = [...copy.detail.source.files, ...(copy.detail.addedFiles ?? [])].find((file) => file.path === activeFile)
  const removed = copy.detail.removedFiles.includes(activeFile)
  const added = copy.detail.addedFiles?.some(file => file.path === activeFile) ?? false
  editor.disabled = false
  editor.readOnly = !!copy.conflict || removed || (activeFile !== "master" && (!file || !isEditableFile(file)))
  notes.readOnly = !!copy.conflict
  decision.disabled = !!copy.conflict
  status.disabled = !!copy.conflict
  element("file-reviewed", HTMLInputElement).disabled = !!copy.conflict || removed
  editor.value = currentText(copy)
  element("file-label", HTMLElement).textContent = activeFile === "master" ? "Review master" : activeFile
  element("file-kind", HTMLSpanElement).textContent = removed ? "Removed from source · preserved original · read-only"
    : added ? (editor.readOnly ? "New source file · read-only" : "New supporting-file draft · edits saved in history")
    : editor.readOnly ? "Original snapshot · read-only" : activeFile === "master" ? "One editable draft · original variants retained" : "Supporting-file draft · original retained"
  notes.value = copy.content.notes
  decision.value = copy.content.decision
  status.value = copy.content.status
  renderFeedback()
  renderFiles()
  showPreview()
  saveStatus()
}

async function openSkill(name: string) {
  const navigation = ++navigationId
  try {
    let copy = copies.get(name)
    if (!copy) {
      const detail = await api(`/api/skill?name=${encodeURIComponent(name)}`, SkillDetail)
      copy = { detail, content: detail.draft.content, revision: detail.draft.revision, savedAt: detail.draft.savedAt, saving: false }
      copies.set(name, copy)
    }
    if (navigation !== navigationId) return
    active = name
    activeFile = "master"
    if (!tabs.includes(name)) tabs.push(name)
    const index = catalog.skills.findIndex((skill) => skill.name === name)
    const summary = catalog.skills[index]
    element("skill-title", HTMLHeadingElement).textContent = name
    element("skill-number", HTMLDivElement).textContent = `SKILL ${index + 1} OF ${catalog.skills.length}`
    element("source-status", HTMLParagraphElement).textContent = `Original captured ${new Date(copy.detail.source.capturedAt).toLocaleDateString()} · ${copy.detail.source.head === "external-local-snapshot" ? "External personal skill" : `source ${copy.detail.source.head.slice(0, 8)}`} · drafts only`
    element("source-status", HTMLParagraphElement).title = copy.detail.source.directory
    element("previous", HTMLButtonElement).disabled = index <= 0
    element("next", HTMLButtonElement).disabled = index >= catalog.skills.length - 1
    const drift = element("drift", HTMLDivElement)
    drift.hidden = !copy.detail.sourceChanged
    drift.textContent = copy.detail.sourceAvailable ? "Source files changed after this snapshot. Your review is preserved; reconcile against the current source before applying."
      : copy.content.decision === "delete" ? "Deleted from source. The original skill, drafts, and feedback history are preserved here."
        : "Source files are unavailable. The complete captured skill and your drafts are still available here."
    related("references", summary?.references ?? [])
    related("referenced-by", summary?.referencedBy ?? [])
    const variantNotes = element("variant-notes", HTMLDivElement)
    variantNotes.replaceChildren()
    for (const text of copy.detail.source.preparation?.variantNotes ?? []) {
      const paragraph = document.createElement("p")
      paragraph.className = "muted"
      paragraph.textContent = text
      variantNotes.append(paragraph)
    }
    element("variant-differences", HTMLDetailsElement).hidden = !variantNotes.childElementCount
    document.body.dataset.library = "closed"
    renderQueue()
    renderTabs()
    renderDocument()
    void api("/api/position", SavedResponse, { active, tabs }).catch(() => notice("Could not save your navigation position. Skill drafts have their own save status."))
  } catch (error) { notice(error instanceof Error ? error.message : "Could not open this skill") }
}

function updateFromEditor() {
  const copy = copies.get(active)
  if (!copy || editor.readOnly) return
  change({ ...copy.content, ...(activeFile === "master" ? { master: editor.value } : { files: { ...copy.content.files, [activeFile]: editor.value } }), decision: copy.content.decision === "keep" ? "edit" : copy.content.decision, status: "in-progress" })
  decision.value = copy.content.decision
  status.value = copy.content.status
  showPreview()
}

function historyRow(title: string, timestamp: string, content: DraftContent, callback: (content: DraftContent) => void) {
  const row = document.createElement("div")
  row.className = "history-row"
  const description = document.createElement("div")
  description.textContent = title
  const small = document.createElement("small")
  small.textContent = `${new Date(timestamp).toLocaleString()} · ${content.decision} · ${content.status}`
  description.append(small)
  const button = document.createElement("button")
  button.textContent = "Load as draft"
  button.onclick = () => callback(content)
  row.append(description, button)
  return row
}

editor.addEventListener("input", updateFromEditor)
editor.addEventListener("blur", showPreview)
notes.addEventListener("blur", showPreview)
notes.addEventListener("input", () => { const copy = copies.get(active); if (copy) change({ ...copy.content, notes: notes.value }) })
for (const control of [decision, status]) control.addEventListener("change", () => {
  const copy = copies.get(active)
  if (!copy) return
  change({ ...copy.content, decision: Schema.decodeUnknownSync(SaveRequest.fields.content.fields.decision)(decision.value), status: Schema.decodeUnknownSync(SaveRequest.fields.content.fields.status)(status.value) })
})
element("file-reviewed", HTMLInputElement).onchange = () => {
  const copy = copies.get(active)
  if (!copy) return
  const checked = element("file-reviewed", HTMLInputElement).checked
  change({ ...copy.content, reviewedFiles: [...new Set([...copy.content.reviewedFiles.filter((file) => file !== activeFile), ...(checked ? [activeFile] : [])])] })
  renderFiles()
}
element("search", HTMLInputElement).oninput = renderQueue
element("filter", HTMLSelectElement).onchange = renderQueue
element("master-file", HTMLButtonElement).onclick = () => { activeFile = "master"; renderDocument() }
element("save-now", HTMLButtonElement).onclick = () => { const copy = copies.get(active); if (copy) void save(copy) }
view.value = innerWidth > 1000 ? "split" : "write"
element("editor-area", HTMLDivElement).dataset.view = view.value
view.onchange = () => { element("editor-area", HTMLDivElement).dataset.view = view.value }
for (const [id, offset] of [["previous", -1], ["next", 1]] as const) element(id, HTMLButtonElement).onclick = () => {
  const next = catalog.skills[catalog.skills.findIndex((skill) => skill.name === active) + offset]
  if (next) void openSkill(next.name)
}
element("show-library", HTMLButtonElement).onclick = () => { document.body.dataset.library = document.body.dataset.library === "open" ? "closed" : "open"; document.body.dataset.details = "closed" }
element("show-details", HTMLButtonElement).onclick = () => { document.body.dataset.details = document.body.dataset.details === "open" ? "closed" : "open"; document.body.dataset.library = "closed" }
element("help-button", HTMLButtonElement).onclick = () => helpDialog.showModal()
element("close-help", HTMLButtonElement).onclick = () => helpDialog.close()
element("close-history", HTMLButtonElement).onclick = () => historyDialog.close()
element("backup", HTMLButtonElement).onclick = () => {
  void api("/api/backup", BackupResponse, {}).then((result) => notice(`Backup created: ${result.path}`)).catch((error: unknown) => notice(error instanceof Error ? error.message : "Backup failed"))
}
element("history-button", HTMLButtonElement).onclick = () => {
  const name = active
  historyDialog.showModal()
  const container = element("history-list", HTMLDivElement)
  container.textContent = "Loading saved revisions…"
  void api(`/api/history?name=${encodeURIComponent(name)}`, History).then((history) => {
    container.replaceChildren()
    const load = (content: DraftContent) => {
      const copy = copies.get(name)
      if (active !== name || !copy) return
      void save(copy).then(() => {
        if (copy.pending || copy.conflict) { notice("Save or resolve your current draft before loading another revision."); return }
        change({ ...content, status: "in-progress" }); renderDocument(); historyDialog.close()
      })
    }
    for (const item of history.recoveries) container.append(historyRow("Recovered conflicting save", item.savedAt, item.request.content, load))
    for (const item of history.revisions) container.append(historyRow(`Revision ${item.revision}`, item.savedAt, item.content, load))
  }).catch((error: unknown) => { container.textContent = error instanceof Error ? error.message : "History unavailable" })
}
element("load-saved", HTMLButtonElement).onclick = () => {
  const copy = copies.get(active)
  if (!copy?.conflict || copy.saving || !copy.recoveryConfirmed) return
  copy.content = copy.conflict.content
  copy.revision = copy.conflict.revision
  copy.savedAt = copy.conflict.savedAt
  delete copy.pending
  delete copy.conflict
  delete copy.recoveryConfirmed
  localStorage.removeItem(outboxKey(active))
  renderQueue()
  renderDocument()
}
element("use-mine", HTMLButtonElement).onclick = () => {
  const copy = copies.get(active)
  if (!copy?.conflict) return
  copy.revision = copy.conflict.revision
  delete copy.conflict
  delete copy.recoveryConfirmed
  change({ ...copy.content, status: "in-progress" })
  renderDocument()
  void save(copy)
}
element("recover-browser", HTMLButtonElement).onclick = () => {
  const container = element("browser-recoveries", HTMLDivElement)
  container.replaceChildren()
  try {
    for (const key of Object.keys(localStorage).filter((key) => key.startsWith(outboxPrefix))) {
      const decoded = Schema.decodeUnknownExit(Schema.fromJsonString(SaveRequest))(localStorage.getItem(key))
      if (decoded._tag === "Failure") continue
      const request = decoded.value
      const row = document.createElement("div")
      row.className = "history-row"
      const label = document.createElement("span")
      label.textContent = `${request.name} · unsent browser draft`
      const button = document.createElement("button")
      button.textContent = "Recover"
      button.onclick = () => {
        void openSkill(request.name).then(async () => {
          const copy = copies.get(request.name)
          if (!copy) return
          await save(copy)
          if (copy.pending || copy.conflict) { notice("Save or resolve the open draft before loading a browser recovery."); return }
          copy.content = request.content
          copy.pending = request
          preserve(copy)
          renderDocument()
          helpDialog.close()
          void save(copy).then(() => { if (!copy.pending) localStorage.removeItem(key) })
        })
      }
      row.append(label, button)
      container.append(row)
    }
    if (!container.childElementCount) container.textContent = "No unsent browser drafts."
  } catch { container.textContent = "Browser recovery storage is unavailable." }
}
addEventListener("beforeunload", (event) => {
  if ([...copies.values()].some((copy) => copy.pending)) { event.preventDefault(); event.returnValue = "" }
})
document.addEventListener("visibilitychange", () => { if (document.hidden) for (const copy of copies.values()) void save(copy) })
addEventListener("online", () => { for (const copy of copies.values()) void save(copy) })
addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "s") { event.preventDefault(); const copy = copies.get(active); if (copy) void save(copy) }
})

async function start() {
  try {
    catalog = await api("/api/catalog", Catalog)
    outboxPrefix = `skill-review:${catalog.stateDirectory}:outbox:`
    element("storage-path", HTMLParagraphElement).textContent = catalog.stateDirectory
    tabs = catalog.position.tabs.filter((name) => catalog.skills.some((skill) => skill.name === name))
    renderQueue()
    const name = catalog.skills.some((skill) => skill.name === catalog.position.active) ? catalog.position.active : catalog.skills[0]?.name
    if (name) await openSkill(name)
    else { element("skill-title", HTMLHeadingElement).textContent = "No skills captured"; notice("There are no skills in this repository’s skills directory.") }
    try {
      if (Object.keys(localStorage).some((key) => key.startsWith(outboxPrefix))) notice("Unsent browser drafts are available. Open ? → Find browser recovery drafts before continuing.")
    } catch { notice("Browser recovery storage is unavailable. Wait for Saved to disk before leaving.") }
  } catch (error) { notice(error instanceof Error ? error.message : "Could not load the review. Check that the local server is running.") }
}

void start()
