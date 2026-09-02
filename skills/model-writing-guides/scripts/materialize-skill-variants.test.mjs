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

function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "skill-variants-"));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
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

test("materializes one direct variant and links shared resources", (t) => {
  const current = fixture(t);
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
  assert.equal(fs.lstatSync(path.join(current.output, "beta", "references")).isSymbolicLink(), true);
  assert.equal(fs.existsSync(path.join(current.output, "alpha", "variants")), false);
});

test("switches the active view without changing installed skill paths", (t) => {
  const current = fixture(t);
  materializeSkillVariants({ model: "gpt-5.6", outputRoot: current.output, sourceRoot: current.source });
  const installedSkill = path.join(current.temporary, "installed-alpha");
  fs.symlinkSync(path.join(current.output, "alpha"), installedSkill);

  materializeSkillVariants({ model: "claude-opus-5", outputRoot: current.output, sourceRoot: current.source });

  assert.equal(fs.readFileSync(path.join(installedSkill, "SKILL.md"), "utf8").endsWith("claude-opus-5\n"), true);
});

test("accepts SessionStart and PostModelSwitch hook input", (t) => {
  const current = fixture(t);
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

test("prints documented JSON output and emits one fallback notice per session", (t) => {
  const current = fixture(t);
  const cli = spawnSync(
    process.execPath,
    [
      materializer,
      "--source",
      current.source,
      "--output",
      current.output,
      "--model",
      "gpt-5.7-sol",
      "--session",
      "cli-session",
      "--format",
      "json",
    ],
    { encoding: "utf8" },
  );
  assert.equal(cli.status, 0, cli.stderr);
  const cliResult = JSON.parse(cli.stdout);
  assert.equal(cliResult.profile, "gpt-5.6");
  assert.match(cliResult.notice, /not been updated for gpt-5\.7-sol/);

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
  assert.throws(() => resolveProfile("gemini-opus-pro"), /unsupported model family/);
  assert.throws(() => resolveProfile("my-fable-model"), /unsupported model family/);
});

test("refuses to overwrite a directory it did not create", (t) => {
  const current = fixture(t);
  fs.mkdirSync(current.output);
  fs.writeFileSync(path.join(current.output, "keep.txt"), "mine\n");

  assert.throws(
    () => materializeSkillVariants({ model: "gpt-5.6", outputRoot: current.output, sourceRoot: current.source }),
    /refusing to replace unmanaged directory/,
  );
  assert.equal(fs.readFileSync(path.join(current.output, "keep.txt"), "utf8"), "mine\n");
});

test("requires explicit ownership transfer when the repository moves", (t) => {
  const first = fixture(t);
  materializeSkillVariants({ model: "gpt-5.6", outputRoot: first.output, sourceRoot: first.source });

  const secondRoot = fs.mkdtempSync(path.join(os.tmpdir(), "skill-variants-source-"));
  t.after(() => fs.rmSync(secondRoot, { recursive: true, force: true }));
  writeSkill(secondRoot, "alpha", "alpha", ["gpt-5.6", "claude-fable-5.1", "claude-opus-5"]);

  assert.throws(
    () => materializeSkillVariants({ model: "gpt-5.6", outputRoot: first.output, sourceRoot: secondRoot }),
    /refusing to replace view owned by another source/,
  );
  assert.equal(fs.readFileSync(path.join(first.output, "alpha", "SKILL.md"), "utf8").endsWith("gpt-5.6\n"), true);

  const transferred = materializeSkillVariants({
    model: "gpt-5.6",
    outputRoot: first.output,
    previousSourceRoot: first.source,
    sourceRoot: secondRoot,
  });
  assert.equal(transferred.skillCount, 1);
});
