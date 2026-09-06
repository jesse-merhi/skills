import type { SkillSummary, SourceBundle, StoredDraft } from "./Model.ts"

export function buildCatalog(bundles: ReadonlyArray<SourceBundle>, drafts: ReadonlyMap<string, StoredDraft>): Array<SkillSummary> {
  const summaries = bundles.map((bundle): SkillSummary => {
    const references: Array<SkillSummary["references"][number]> = []
    const draft = drafts.get(bundle.name)
    const texts = [
      { path: "SKILL.md", content: draft?.content.master ?? bundle.entry },
      ...bundle.files.filter((file) => file.encoding === "utf8" && file.path.endsWith(".md") && file.path !== "SKILL.md" && !file.path.startsWith("variants/"))
        .map((file) => ({ path: file.path, content: draft?.content.files[file.path] ?? file.content }))
    ]
    for (const target of bundles) {
      if (target.name === bundle.name) continue
      const pattern = new RegExp("(?:`" + target.name + "`|\\$" + target.name + "\\b|/" + target.name + "/SKILL\\.md)")
      for (const file of texts) {
        const lines = file.content.split("\n")
        const line = lines.findIndex((text) => pattern.test(text))
        if (line < 0) continue
        references.push({ name: target.name, file: file.path, line: line + 1, excerpt: lines[line]?.trim() ?? "" })
        break
      }
    }
    return { name: bundle.name, references, referencedBy: [], hasFeedback: (draft?.content.notes.trim().length ?? 0) > 0, status: draft?.content.status ?? "unreviewed", decision: draft?.content.decision ?? "keep", revision: draft?.revision ?? 0 }
  })
  const linked = summaries.map((skill): SkillSummary => ({
    ...skill,
    referencedBy: summaries.flatMap((caller) => caller.references.filter((reference) => reference.name === skill.name).map((reference) => ({ ...reference, name: caller.name })))
  }))
  const remaining = new Map(linked.map((skill) => [skill.name, skill]))
  const primaryReferences = new Map(linked.map((skill) => [skill.name, new Set(skill.references.filter((reference) => reference.file === "SKILL.md").map((reference) => reference.name))]))
  const ordered: Array<SkillSummary> = []
  while (remaining.size > 0) {
    const incoming = (skill: SkillSummary) => skill.referencedBy.filter((reference) => remaining.has(reference.name) && primaryReferences.get(reference.name)?.has(skill.name)).length
    const candidates = [...remaining.values()].sort((left, right) => incoming(left) - incoming(right)
      || right.references.length - left.references.length || left.name.localeCompare(right.name))
    const next = candidates[0]
    if (next === undefined) break
    ordered.push(next)
    remaining.delete(next.name)
  }
  return ordered
}
