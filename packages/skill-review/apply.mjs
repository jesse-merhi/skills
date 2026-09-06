import * as Schema from "effect/Schema";
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

import { planSkillVariants, withOutputLock } from "../../skills/writing-for-agents/scripts/materialize-skill-variants.mjs";
import { SkillDetail } from "./Model.ts";
import { captureSkill } from "./source.mjs";

const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const Plan = Schema.fromJsonString(Schema.Struct({
  name: Schema.String, revision: Schema.Number, draftDigest: Schema.String,
  directory: Schema.String, fingerprint: Schema.String, root: Schema.String
}));
const profiles = ["gpt-5.6", "gpt-6-astra", "claude-fable-5.1", "claude-opus-5"];
const detail = async name => {
  const response = await fetch(`http://127.0.0.1:4317/api/skill?name=${encodeURIComponent(name)}`);
  if (!response.ok) throw new Error("Cannot read the live audit; no source changes made");
  return Schema.decodeUnknownSync(SkillDetail)(await response.json());
};
const writeNew = (filename, value) => fs.writeFileSync(filename, JSON.stringify(value, null, 2), { flag: "wx", mode: 0o600 });

export async function prepareApply({ name, revision, directory, root, readDetail = detail }) {
  const record = await readDetail(name);
  if (record.draft.revision !== revision || record.draft.content.status !== "ready") throw new Error("Select the exact ready draft revision");
  if (!["keep", "edit"].includes(record.draft.content.decision)) throw new Error("Splits/deletions require an explicit multi-skill change plan; this command only replaces one skill");
  const sourceRoot = fs.realpathSync(path.join(root, "skills"));
  const sourceDirectory = fs.realpathSync(record.source.directory);
  if (!sourceDirectory.startsWith(sourceRoot + path.sep)) throw new Error("External skill: apply through its owning source repository, not this installer");
  const source = captureSkill({ name, directory: sourceDirectory }, record.source.head);
  fs.mkdirSync(directory, { mode: 0o700 });
  fs.cpSync(sourceDirectory, path.join(directory, "original"), { recursive: true, dereference: false, verbatimSymlinks: true });
  fs.cpSync(sourceDirectory, path.join(directory, "candidate"), { recursive: true, dereference: false, verbatimSymlinks: true });
  const candidateEntry = path.join(directory, "candidate/SKILL.md");
  if (fs.lstatSync(candidateEntry).isSymbolicLink()) {
    const originalEntry = fs.realpathSync(path.join(sourceDirectory, "SKILL.md"));
    fs.unlinkSync(candidateEntry);
    fs.symlinkSync(path.relative(sourceDirectory, originalEntry), candidateEntry);
  }
  writeNew(path.join(directory, "draft.json"), record);
  writeNew(path.join(directory, "plan.json"), {
    name, revision, directory: sourceDirectory, root: fs.realpathSync(root),
    fingerprint: source.fingerprint, draftDigest: digest(record.draft.content)
  });
  return { directory, revision, sourceDrift: source.fingerprint !== record.source.fingerprint, next: "Reconcile source drift, apply this draft to candidate, produce all four complete variants, and independently exercise them. Then apply this pinned plan." };
}

export async function applyPlan(directory, readDetail = detail) {
  const plan = Schema.decodeUnknownSync(Plan)(fs.readFileSync(path.join(directory, "plan.json"), "utf8"));
  const record = await readDetail(plan.name);
  if (record.draft.revision !== plan.revision || digest(record.draft.content) !== plan.draftDigest) throw new Error("Audit draft changed; prepare a new plan without overwriting the old one");
  const candidate = path.join(directory, "candidate");
  for (const model of profiles) {
    const selected = planSkillVariants({ sourceRoot: candidate, model, requireExact: true });
    if (selected.skills.length !== 1 || selected.skills[0].name !== plan.name) throw new Error("Candidate must contain exactly the selected skill");
  }
  const candidateSnapshot = captureSkill({ name: plan.name, directory: candidate }, record.source.head);
  return withOutputLock(plan.directory, () => {
    const current = captureSkill({ name: plan.name, directory: plan.directory }, record.source.head);
    if (current.fingerprint !== plan.fingerprint) throw new Error("Source changed; refusing to overwrite intervening work");
    const stage = `${plan.directory}.apply-${randomUUID()}`;
    const previous = `${stage}.previous`;
    fs.cpSync(candidate, stage, { recursive: true, dereference: false, verbatimSymlinks: true });
    writeNew(path.join(directory, "transaction.json"), { target: plan.directory, stage, previous, before: current.fingerprint, after: candidateSnapshot.fingerprint });
    try {
      fs.renameSync(plan.directory, previous);
      fs.renameSync(stage, plan.directory);
      writeNew(path.join(directory, "applied.json"), { name: plan.name, revision: plan.revision, fingerprint: candidateSnapshot.fingerprint, appliedAt: new Date().toISOString(), previous });
    } catch (error) {
      if (fs.existsSync(previous)) {
        if (fs.existsSync(plan.directory)) fs.renameSync(plan.directory, stage);
        fs.renameSync(previous, plan.directory);
      }
      throw error;
    }
    return { name: plan.name, revision: plan.revision, backup: previous, next: "Source replaced. Install only this skill with --skill on each matching managed model view. Drafts and comments are unchanged." };
  });
}

export function rollbackPlan(directory) {
  const transaction = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Struct({
    target: Schema.String, stage: Schema.String, previous: Schema.String, before: Schema.String, after: Schema.String
  })))(fs.readFileSync(path.join(directory, "transaction.json"), "utf8"));
  return withOutputLock(transaction.target, () => {
    if (!fs.existsSync(transaction.previous)) throw new Error("No retained pre-apply directory; nothing to restore");
    if (fs.existsSync(transaction.target)) {
      const current = captureSkill({ directory: transaction.target, name: path.basename(transaction.target) }, "rollback");
      if (current.fingerprint !== transaction.after) throw new Error("Applied source was edited later; reconcile instead of overwriting it");
      fs.renameSync(transaction.target, `${transaction.stage}.rolled-back`);
    }
    fs.renameSync(transaction.previous, transaction.target);
    return { restored: transaction.target, next: "Reinstall this skill only if its installed views were updated. Review history is untouched." };
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    name: { type: "string" }, revision: { type: "string" }, plan: { type: "string" },
    root: { type: "string", default: path.resolve(import.meta.dirname, "../..") }, help: { type: "boolean" }
  } });
  if (values.help) console.log("bun apply.mjs prepare --name SKILL --revision N --plan NEW-DIRECTORY\nbun apply.mjs apply --plan DIRECTORY\nbun apply.mjs rollback --plan DIRECTORY\nLocal source replacement only. Prepare preserves the draft and source; the agent edits candidate and validates all variants. No automatic model generation, installation, deletion, splitting, or publication.");
  else {
    if (!values.plan) throw new Error("Supply --plan");
    const directory = path.resolve(values.plan);
    const result = positionals[0] === "prepare" ? await prepareApply({ name: values.name, revision: Number(values.revision), directory, root: values.root })
      : positionals[0] === "apply" ? await applyPlan(directory)
      : positionals[0] === "rollback" ? rollbackPlan(directory)
      : (() => { throw new Error("Choose prepare, apply, or rollback"); })();
    console.log(JSON.stringify(result, null, 2));
  }
}
