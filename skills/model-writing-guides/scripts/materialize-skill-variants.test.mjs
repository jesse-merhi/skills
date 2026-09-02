import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { materializeSkillVariants, resolveProfile } from "./materialize-skill-variants.mjs";

const materializer = fileURLToPath(new URL("./materialize-skill-variants.mjs", import.meta.url));

function writeSkill(root, directory, name, profiles) {
  const skill = path.join(root, directory);
  fs.mkdirSync(path.join(skill, "variants"), { recursive: true });
  fs.mkdirSync(path.join(skill, "references"));
  fs.writeFileSync(path.join(skill, "SKILL.md"), `---\nname: ${name}\ndescription: fixture\n---\n`);
  fs.writeFileSync(path.join(skill, "references", "shared.md"), "shared\n");
  for (const profile of profiles) {
    fs.writeFileSync(
      path.join(skill, "variants", `${profile}.md`),
      `---\nname: ${name}\ndescription: fixture\n---\n${profile}\n`,
    );
  }
}

function fixture() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "skill-variants-"));
  const source = path.join(temporary, "skills");
  const output = path.join(temporary, "view");
  fs.mkdirSync(source);
  writeSkill(source, "alpha", "alpha", ["gpt-5.6", "claude-fable-5.1", "claude-opus-5"]);
  writeSkill(source, "group/beta", "beta", ["gpt-5.6", "claude-fable-5.1", "claude-opus-5"]);
  return { output, source, temporary };
}

test("recognizes Claude Code family aliases as exact profiles", () => {
  const fable = resolveProfile("fable[1m]");
  const opus = resolveProfile("opus");

  assert.equal(fable.exact, true);
  assert.equal(fable.profile.id, "claude-fable-5.1");
  assert.equal(opus.exact, true);
  assert.equal(opus.profile.id, "claude-opus-5");
});

test("materializes one direct variant and links shared resources", () => {
  const current = fixture();
  const result = materializeSkillVariants({
    model: "gpt-5.6-sol",
    outputRoot: current.output,
    sourceRoot: current.source,
  });

  assert.deepEqual(result, {
    exact: true,
    model: "gpt-5.6-sol",
    notice: undefined,
    profile: "gpt-5.6",
    skillCount: 2,
  });
  assert.equal(fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8").endsWith("gpt-5.6\n"), true);
  assert.equal(fs.readFileSync(path.join(current.output, "beta", "references", "shared.md"), "utf8"), "shared\n");
  assert.equal(fs.existsSync(path.join(current.output, "alpha", "variants")), false);
});

test("switches the active view without changing installed skill paths", () => {
  const current = fixture();
  materializeSkillVariants({ model: "gpt-5.6", outputRoot: current.output, sourceRoot: current.source });
  const installedSkill = path.join(current.temporary, "installed-alpha");
  fs.symlinkSync(path.join(current.output, "alpha"), installedSkill);

  materializeSkillVariants({ model: "claude-opus-5", outputRoot: current.output, sourceRoot: current.source });

  assert.equal(fs.readFileSync(path.join(installedSkill, "SKILL.md"), "utf8").endsWith("claude-opus-5\n"), true);
});

test("accepts SessionStart and PostModelSwitch hook input", () => {
  const current = fixture();
  const runHook = (input) =>
    spawnSync(
      process.execPath,
      [materializer, "--source", current.source, "--output", current.output],
      { encoding: "utf8", input: JSON.stringify(input) },
    );

  const started = runHook({ model: "claude-fable-5.1", session_id: "session-one" });
  assert.equal(started.status, 0, started.stderr);
  assert.equal(fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8").endsWith("claude-fable-5.1\n"), true);

  const switched = runHook({ to_model: "claude-opus-5", session_id: "session-one" });
  assert.equal(switched.status, 0, switched.stderr);
  assert.equal(fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8").endsWith("claude-opus-5\n"), true);
});

test("falls back and emits one notice per session", () => {
  const current = fixture();
  const first = materializeSkillVariants({
    model: "gpt-5.7-sol",
    outputRoot: current.output,
    sessionId: "session/one",
    sourceRoot: current.source,
  });
  const second = materializeSkillVariants({
    model: "gpt-5.7-sol",
    outputRoot: current.output,
    sessionId: "session/one",
    sourceRoot: current.source,
  });

  assert.equal(first.profile, "gpt-5.6");
  assert.match(first.notice, /not been updated for gpt-5\.7-sol/);
  assert.equal(second.notice, undefined);
});

test("rejects an unsupported model family instead of using an unrelated prompt", () => {
  assert.throws(() => resolveProfile("gemini-3-pro"), /unsupported model family/);
  assert.throws(() => resolveProfile("gpt-oss-120b"), /unsupported model family/);
  assert.throws(() => resolveProfile("llama-5"), /unsupported model family/);
});

test("refuses to overwrite a directory it did not create", () => {
  const current = fixture();
  fs.mkdirSync(current.output);
  fs.writeFileSync(path.join(current.output, "keep.txt"), "mine\n");

  assert.throws(
    () => materializeSkillVariants({ model: "gpt-5.6", outputRoot: current.output, sourceRoot: current.source }),
    /refusing to replace unmanaged directory/,
  );
  assert.equal(fs.readFileSync(path.join(current.output, "keep.txt"), "utf8"), "mine\n");
});
