import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { installSkills } from "./install-skills.mjs";

function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "install-model-skills-"));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const sourceRoot = path.join(temporary, "source");
  for (const name of ["alpha", "group/beta"]) {
    const skill = path.join(sourceRoot, name);
    fs.mkdirSync(path.join(skill, "variants"), { recursive: true });
    fs.writeFileSync(path.join(skill, "SKILL.md"), `---\nname: ${path.basename(name)}\ndescription: fixture\n---\n`);
    for (const model of ["gpt-5.6", "gpt-6-astra", "claude-fable-5.1", "claude-opus-5"]) {
      fs.writeFileSync(path.join(skill, "variants", `${model}.md`), `selected:${model}\n`);
    }
  }
  const root = path.join(temporary, "harness");
  return { temporary, sourceRoot, root };
}

function selected(root) {
  return fs.readFileSync(path.join(root, "skills", "alpha", "SKILL.md"), "utf8");
}

test("switches Fable to Opus through stable links without changing other skills or settings", (t) => {
  const current = fixture(t);
  fs.mkdirSync(path.join(current.root, "skills", "personal"), { recursive: true });
  fs.writeFileSync(path.join(current.root, "skills", "personal", "SKILL.md"), "my instructions");
  fs.writeFileSync(path.join(current.root, "settings.json"), '{"model":"claude-fable-5[1m]"}\n');
  installSkills({ ...current, harness: "claude", model: "fable", requireExact: true });
  assert.equal(selected(current.root), "selected:claude-fable-5.1\n");
  const before = fs.readlinkSync(path.join(current.root, "skills", "alpha"));
  const result = installSkills({ ...current, harness: "claude", model: "opus", requireExact: true });
  assert.equal(selected(current.root), "selected:claude-opus-5\n");
  assert.equal(fs.readlinkSync(path.join(current.root, "skills", "alpha")), before);
  assert.equal(result.linksChanged, 0);
  assert.equal(fs.readFileSync(path.join(current.root, "skills", "personal", "SKILL.md"), "utf8"), "my instructions");
  assert.equal(fs.readFileSync(path.join(current.root, "settings.json"), "utf8"), '{"model":"claude-fable-5[1m]"}\n');
});

test("keeps different harness roots isolated while switching GPT profiles", (t) => {
  const current = fixture(t);
  const second = path.join(current.temporary, "another-codex");
  installSkills({ ...current, harness: "codex", model: "gpt-5.6" });
  installSkills({ ...current, root: second, harness: "codex", model: "gpt-5.6" });
  installSkills({ ...current, harness: "codex", model: "astra" });
  assert.equal(selected(current.root), "selected:gpt-6-astra\n");
  assert.equal(selected(second), "selected:gpt-5.6\n");
});

test("refuses collisions before changing any installed prompt or link", (t) => {
  const current = fixture(t);
  installSkills({ ...current, harness: "codex", model: "gpt-5.6" });
  fs.unlinkSync(path.join(current.root, "skills", "beta"));
  fs.mkdirSync(path.join(current.root, "skills", "beta"));
  fs.writeFileSync(path.join(current.root, "skills", "beta", "SKILL.md"), "user copy");
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "astra" }), /preserving existing local skill/);
  assert.equal(selected(current.root), "selected:gpt-5.6\n");
  assert.equal(fs.readFileSync(path.join(current.root, "skills", "beta", "SKILL.md"), "utf8"), "user copy");
});

test("dry run validates coverage and collisions without creating an installation", (t) => {
  const current = fixture(t);
  const result = installSkills({ ...current, harness: "codex", model: "astra", dryRun: true, requireExact: true });
  assert.equal(result.profile, "gpt-6-astra");
  assert.equal(result.linksToChange, 2);
  assert.equal(fs.existsSync(current.root), false);
  fs.unlinkSync(path.join(current.sourceRoot, "alpha", "variants", "gpt-6-astra.md"));
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "astra", dryRun: true, requireExact: true }), /complete exact skill coverage/);
  assert.equal(fs.existsSync(current.root), false);
});

test("rejects a model from the other harness without creating files", (t) => {
  const current = fixture(t);
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "opus" }), /not a supported codex model/);
  assert.equal(fs.existsSync(current.root), false);
});

test("retires only links owned by this installation", (t) => {
  const current = fixture(t);
  const first = installSkills({ ...current, harness: "claude", model: "fable" });
  fs.symlinkSync(path.join(first.viewRoot, "retired"), path.join(current.root, "skills", "retired"));
  fs.symlinkSync(path.join(current.temporary, "elsewhere"), path.join(current.root, "skills", "foreign"));
  const result = installSkills({ ...current, harness: "claude", model: "opus" });
  assert.equal(result.linksRetired, 1);
  assert.equal(fs.lstatSync(path.join(current.root, "skills", "retired"), { throwIfNoEntry: false }), undefined);
  assert.equal(fs.readlinkSync(path.join(current.root, "skills", "foreign")), path.join(current.temporary, "elsewhere"));
});

test("restores migrated and retired links when view publication fails", (t) => {
  const current = fixture(t);
  const first = installSkills({ ...current, harness: "codex", model: "gpt-5.6" });
  const alpha = path.join(current.root, "skills", "alpha");
  const legacy = path.join(current.sourceRoot, "alpha");
  fs.unlinkSync(alpha);
  fs.symlinkSync(legacy, alpha);
  const retired = path.join(current.root, "skills", "retired");
  fs.symlinkSync(path.join(first.viewRoot, "retired"), retired);
  const originalRename = fs.renameSync;
  t.after(() => { fs.renameSync = originalRename; });
  fs.renameSync = (source, destination) => {
    if (source.startsWith(first.viewRoot + ".staging-") && destination === first.viewRoot) throw new Error("injected publication failure");
    return originalRename(source, destination);
  };
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "astra" }), /injected publication failure/);
  assert.equal(fs.readlinkSync(alpha), legacy);
  assert.equal(fs.readlinkSync(retired), path.join(first.viewRoot, "retired"));
  assert.equal(fs.readFileSync(path.join(first.viewRoot, "alpha", "SKILL.md"), "utf8"), "selected:gpt-5.6\n");
});
