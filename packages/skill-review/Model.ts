import * as Schema from "effect/Schema"

const Text = Schema.String.check(Schema.isMaxLength(4_000_000))
const Revision = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0))

export const SourceFile = Schema.Struct({
  path: Schema.String,
  content: Schema.String,
  encoding: Schema.Literals(["utf8", "base64", "symlink"]),
  mode: Schema.Number
})
export const SourceBundle = Schema.Struct({
  name: Schema.String,
  directory: Schema.String,
  entry: Schema.String,
  fingerprint: Schema.String,
  capturedAt: Schema.String,
  head: Schema.String,
  files: Schema.Array(SourceFile),
  preparation: Schema.optional(Schema.Struct({ master: Schema.String, variantNotes: Schema.Array(Schema.String), checkedProfiles: Schema.Array(Schema.String) }))
})
export type SourceBundle = typeof SourceBundle.Type

export const DraftContent = Schema.Struct({
  master: Text,
  files: Schema.Record(Schema.String, Text),
  notes: Text,
  decision: Schema.Literals(["keep", "edit", "split", "delete"]),
  status: Schema.Literals(["unreviewed", "in-progress", "ready", "needs-review"]),
  applied: Schema.optional(Schema.Struct({
    feedbackRevision: Revision,
    appliedAt: Schema.String,
    summary: Text,
    reviewFocus: Schema.optional(Text)
  })),
  reviewedFiles: Schema.Array(Schema.String)
})
export type DraftContent = typeof DraftContent.Type
export const StoredDraft = Schema.Struct({
  content: DraftContent,
  revision: Revision,
  savedAt: Schema.String
})
export type StoredDraft = typeof StoredDraft.Type
export const SaveRequest = Schema.Struct({
  name: Schema.String,
  expectedRevision: Revision,
  operation: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(100)),
  content: DraftContent
})
export type SaveRequest = typeof SaveRequest.Type

export const Reference = Schema.Struct({ name: Schema.String, file: Schema.String, line: Schema.Number, excerpt: Schema.String })
export const SkillSummary = Schema.Struct({
  name: Schema.String,
  sourceAvailable: Schema.optional(Schema.Boolean),
  hasFeedback: Schema.Boolean,
  status: DraftContent.fields.status,
  decision: DraftContent.fields.decision,
  revision: Revision,
  references: Schema.Array(Reference),
  referencedBy: Schema.Array(Reference)
})
export type SkillSummary = typeof SkillSummary.Type
export const Position = Schema.Struct({ active: Schema.String, tabs: Schema.Array(Schema.String) })
export const Catalog = Schema.Struct({ skills: Schema.Array(SkillSummary), position: Position, stateDirectory: Schema.String })
export type Catalog = typeof Catalog.Type
export const SkillDetail = Schema.Struct({
  source: SourceBundle,
  draft: StoredDraft,
  sourceChanged: Schema.Boolean,
  sourceAvailable: Schema.Boolean,
  removedFiles: Schema.Array(Schema.String),
  addedFiles: Schema.optional(Schema.Array(SourceFile))
})
export type SkillDetail = typeof SkillDetail.Type
export const SaveResponse = Schema.Struct({
  outcome: Schema.Literals(["saved", "conflict"]),
  draft: StoredDraft
})
export const HistoryEntry = Schema.Struct({ revision: Revision, savedAt: Schema.String, content: DraftContent, request: Schema.optional(SaveRequest) })
export const RecoveryEntry = Schema.Struct({ request: SaveRequest, savedAt: Schema.String })
export const History = Schema.Struct({ revisions: Schema.Array(HistoryEntry), recoveries: Schema.Array(RecoveryEntry) })
export const Archive = Schema.Struct({
  format: Schema.Literal("skill-review-v1"),
  exportedAt: Schema.String,
  skills: Schema.Array(Schema.Struct({ source: SourceBundle, draft: StoredDraft, history: History })),
  position: Position
})
export type Archive = typeof Archive.Type

export const initialDraft = (source: SourceBundle): StoredDraft => ({
  content: { master: source.preparation?.master ?? source.entry, files: {}, notes: "", decision: "keep", status: "unreviewed", reviewedFiles: [] },
  revision: 0,
  savedAt: source.capturedAt
})

export const isEditableFile = (file: typeof SourceFile.Type) => file.encoding === "utf8"
  && file.path !== "SKILL.md" && !file.path.startsWith("variants/")
