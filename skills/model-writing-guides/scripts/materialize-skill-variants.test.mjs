import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  materializeSkillVariants,
  resolveProfile,
  withOutputLock,
} from "./materialize-skill-variants.mjs";

const materializer = fileURLToPath(new URL("./materialize-skill-variants.mjs", import.meta.url));
const supportedProfiles = ["gpt-5.6", "claude-fable-5.1"];

function writeSkill(root, directory, name, profileNames = supportedProfiles) {
  const skill = path.join(root, directory);
  fs.mkdirSync(path.join(skill, "variants"), { recursive: true });
  fs.mkdirSync(path.join(skill, "references"));
  fs.writeFileSync(path.join(skill, "SKILL.md"), "---\nname: " + name + "\ndescription: fixture\n---\n");
  fs.writeFileSync(path.join(skill, "references", "shared.md"), "shared\n");
  for (const profile of profileNames) {
    fs.writeFileSync(
      path.join(skill, "variants", profile + ".md"),
      "---\nname: " + name + "\ndescription: fixture\n---\n" + profile + "\n",
    );
  }
}

function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "skill-variants-"));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const source = path.join(temporary, "skills");
  const output = path.join(temporary, "view");
  fs.mkdirSync(source);
  writeSkill(source, "alpha", "alpha");
  writeSkill(source, "group/beta", "beta");
  return { output, source, temporary };
}

test("recognizes supported model identifiers and same-family fallbacks", () => {
  const fable = resolveProfile("anthropic/claude-fable-5-1[1m]");
  const futureFable = resolveProfile("claude-fable-5.2");
  const gpt = resolveProfile("azure-openai/gpt-5.6-sol");
  const futureGpt = resolveProfile("atlassian-ai-gateway-openai/gpt-5.7-terra");

  assert.deepEqual(
    [fable.profile.id, fable.exact, futureFable.profile.id, futureFable.exact],
    ["claude-fable-5.1", true, "claude-fable-5.1", false],
  );
  assert.deepEqual(
    [gpt.profile.id, gpt.exact, futureGpt.profile.id, futureGpt.exact],
    ["gpt-5.6", true, "gpt-5.6", false],
  );
});

test("materializes one contained static variant and links shared resources", (t) => {
  const current = fixture(t);
  const gpt = materializeSkillVariants({
    model: "gpt-5.6-sol",
    outputRoot: current.output,
    sourceRoot: current.source,
  });

  assert.deepEqual(gpt, {
    exact: true,
    model: "gpt-5.6-sol",
    notice: undefined,
    profile: "gpt-5.6",
    skillCount: 2,
  });
  assert.equal(fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8").endsWith("gpt-5.6\n"), true);
  assert.equal(fs.lstatSync(path.join(current.output, "alpha", "SKILL.md")).isSymbolicLink(), false);
  assert.equal(fs.readFileSync(path.join(current.output, "beta", "references", "shared.md"), "utf8"), "shared\n");
  assert.equal(fs.lstatSync(path.join(current.output, "beta", "references")).isSymbolicLink(), true);
  assert.equal(fs.existsSync(path.join(current.output, "alpha", "variants")), false);

  const fable = materializeSkillVariants({
    model: "claude-fable-5.1",
    outputRoot: current.output,
    sourceRoot: current.source,
  });
  assert.equal(fable.profile, "claude-fable-5.1");
  assert.equal(fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8").endsWith("claude-fable-5.1\n"), true);
});

test("retries when a contended output lock disappears before inspection", (t) => {
  const current = fixture(t);
  const lockRoot = current.output + ".lock";
  fs.mkdirSync(lockRoot);
  const originalStatSync = fs.statSync;
  let simulatedRace = false;
  fs.statSync = (target, ...options) => {
    if (target === lockRoot && !simulatedRace) {
      simulatedRace = true;
      fs.rmSync(lockRoot, { recursive: true, force: true });
      const error = new Error("ENOENT: no such file or directory, stat '" + lockRoot + "'");
      error.code = "ENOENT";
      throw error;
    }
    return originalStatSync(target, ...options);
  };
  t.after(() => {
    fs.statSync = originalStatSync;
  });

  assert.equal(withOutputLock(current.output, () => "published"), "published");
  assert.equal(simulatedRace, true);
});

test("prints JSON output and emits one same-family fallback notice per session", (t) => {
  const current = fixture(t);
  const run = () => spawnSync(
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
      "session/one",
      "--format",
      "json",
    ],
    { encoding: "utf8" },
  );

  const first = run();
  assert.equal(first.status, 0, first.stderr);
  const firstResult = JSON.parse(first.stdout);
  assert.equal(firstResult.profile, "gpt-5.6");
  assert.match(firstResult.notice, /not been updated for gpt-5\.7-sol/);

  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(second.stdout).notice, undefined);
});

test("rejects unsupported model families, including Opus", () => {
  assert.throws(() => resolveProfile("claude-opus-5"), /unsupported model family/);
  assert.throws(() => resolveProfile("gemini-3-pro"), /unsupported model family/);
  assert.throws(() => resolveProfile("gpt-oss-120b"), /unsupported model family/);
  assert.throws(() => resolveProfile("llama-5"), /unsupported model family/);
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
  writeSkill(secondRoot, "alpha", "alpha");

  assert.throws(
    () => materializeSkillVariants({ model: "gpt-5.6", outputRoot: first.output, sourceRoot: secondRoot }),
    /refusing to replace view owned by another source/,
  );
  const transferred = materializeSkillVariants({
    model: "gpt-5.6",
    outputRoot: first.output,
    previousSourceRoot: first.source,
    sourceRoot: secondRoot,
  });
  assert.equal(transferred.skillCount, 1);
});
