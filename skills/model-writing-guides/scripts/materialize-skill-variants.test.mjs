import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  materializeSkillVariants,
  profiles,
  reclaimAbandonedLock,
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

function processStartIdentity(pid) {
  const result = spawnSync("ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

test("recognizes supported model identifiers and same-family fallbacks", () => {
  const fable = resolveProfile("anthropic/claude-fable-5-1[1m]");
  const configuredFable = resolveProfile("claude-fable-5[1m]");
  const futureFable = resolveProfile("claude-fable-5.2");
  const gpt = resolveProfile("azure-openai/gpt-5.6-sol");
  const futureGpt = resolveProfile("atlassian-ai-gateway-openai/gpt-5.7-terra");

  assert.deepEqual(
    [fable.profile.id, fable.exact, configuredFable.profile.id, configuredFable.exact, futureFable.profile.id, futureFable.exact],
    ["claude-fable-5.1", true, "claude-fable-5.1", true, "claude-fable-5.1", false],
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

test("does not reclaim a live lock based on its age", (t) => {
  const current = fixture(t);
  const lockRoot = current.output + ".lock";
  fs.writeFileSync(lockRoot, JSON.stringify({ pid: process.pid, startIdentity: processStartIdentity(process.pid), token: "live" }));
  fs.utimesSync(lockRoot, new Date(0), new Date(0));

  assert.equal(reclaimAbandonedLock(lockRoot), false);
  assert.equal(fs.existsSync(lockRoot), true);
});

test("reclaims a lock whose owning process has exited", (t) => {
  const current = fixture(t);
  const lockRoot = current.output + ".lock";
  const exited = spawnSync(process.execPath, ["-e", "process.stdout.write(String(process.pid))"], { encoding: "utf8" });
  assert.equal(exited.status, 0, exited.stderr);
  fs.writeFileSync(lockRoot, JSON.stringify({ pid: Number(exited.stdout), startIdentity: "exited process", token: "dead" }));

  assert.equal(reclaimAbandonedLock(lockRoot), true);
  assert.equal(fs.existsSync(lockRoot), false);
});

test("reclaims a lock after its owner PID is reused", (t) => {
  const current = fixture(t);
  const lockRoot = current.output + ".lock";
  fs.writeFileSync(lockRoot, JSON.stringify({ pid: process.pid, startIdentity: "different process start", token: "reused" }));

  assert.equal(reclaimAbandonedLock(lockRoot), true);
  assert.equal(fs.existsSync(lockRoot), false);
});

test("an interrupted owner-file preparation cannot block acquisition", (t) => {
  const current = fixture(t);
  fs.writeFileSync(current.output + ".lock.owner-interrupted", "incomplete");

  assert.equal(withOutputLock(current.output, () => "published"), "published");
  assert.equal(fs.existsSync(current.output + ".lock"), false);
});

test("restores the previous view when publication fails", (t) => {
  const current = fixture(t);
  materializeSkillVariants({ model: "gpt-5.6", outputRoot: current.output, sourceRoot: current.source });
  const previousSkill = fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8");
  const originalRenameSync = fs.renameSync;
  fs.renameSync = (source, target) => {
    if (source.startsWith(current.output + ".staging-") && target === current.output) {
      throw new Error("injected publication failure");
    }
    return originalRenameSync(source, target);
  };
  t.after(() => {
    fs.renameSync = originalRenameSync;
  });

  assert.throws(
    () => materializeSkillVariants({ model: "claude-fable-5.1", outputRoot: current.output, sourceRoot: current.source }),
    /injected publication failure/,
  );
  assert.equal(fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8"), previousSkill);
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
  assert.equal(firstResult.exact, false);
  assert.match(firstResult.notice, /not been updated for gpt-5\.7-sol/);

  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(second.stdout).notice, undefined);

  const thirdSession = materializeSkillVariants({
    model: "gpt-5.7-sol",
    outputRoot: current.output,
    sessionId: "session/two",
    sourceRoot: current.source,
  });
  assert.match(thirdSession.notice, /not been updated for gpt-5\.7-sol/);
});

test("rejects unsupported families and older same-family models", () => {
  assert.throws(() => resolveProfile("gemini-3-pro"), /unsupported model family/);
  assert.throws(() => resolveProfile("gpt-oss-120b"), /unsupported model family/);
  assert.throws(() => resolveProfile("gpt-4.1"), /older than the earliest supported/);
  assert.throws(() => resolveProfile("gpt-5.5"), /older than the earliest supported/);
  assert.throws(() => resolveProfile("claude-fable-5.0"), /older than the earliest supported/);
});

test("selects the newest profile not newer than an inexact request", (t) => {
  profiles.push({
    id: "gpt-5.7",
    family: "openai-gpt",
    version: [5, 7],
    matches: /^gpt-5\.7$/i,
  });
  t.after(() => profiles.pop());

  assert.equal(resolveProfile("gpt-5.6-high").profile.id, "gpt-5.6");
  assert.equal(resolveProfile("gpt-5.8-terra").profile.id, "gpt-5.7");
});

test("rejects skill names that could escape the generated view", (t) => {
  const current = fixture(t);
  writeSkill(current.source, "unsafe", "../escaped");

  assert.throws(
    () => materializeSkillVariants({ model: "gpt-5.6", outputRoot: current.output, sourceRoot: current.source }),
    /invalid skill name/,
  );
  assert.equal(fs.existsSync(path.join(current.temporary, "escaped")), false);
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
  fs.appendFileSync(path.join(secondRoot, "alpha", "variants", "gpt-5.6.md"), "second source\n");

  assert.throws(
    () => materializeSkillVariants({ model: "gpt-5.6", outputRoot: first.output, sourceRoot: secondRoot }),
    /refusing to replace view owned by another source/,
  );
  assert.equal(fs.readFileSync(path.join(first.output, "alpha", "SKILL.md"), "utf8").includes("second source"), false);
  const transferred = materializeSkillVariants({
    model: "gpt-5.6",
    outputRoot: first.output,
    previousSourceRoot: first.source,
    sourceRoot: secondRoot,
  });
  assert.equal(transferred.skillCount, 1);
  assert.equal(fs.readFileSync(path.join(first.output, "alpha", "SKILL.md"), "utf8").includes("second source"), true);
  const marker = JSON.parse(fs.readFileSync(path.join(first.output, ".skill-variant-view.json"), "utf8"));
  assert.equal(marker.sourceRoot, fs.realpathSync(secondRoot));
});

test("materializes the repository corpus and keeps installed links stable across profiles", (t) => {
  const current = fixture(t);
  const repositorySkills = fileURLToPath(new URL("../..", import.meta.url));
  const installedSkill = path.join(current.temporary, "installed-diagnose");

  materializeSkillVariants({ model: "gpt-5.6", outputRoot: current.output, sourceRoot: repositorySkills });
  fs.symlinkSync(path.join(current.output, "diagnose"), installedSkill);
  assert.equal(
    fs.readFileSync(path.join(installedSkill, "SKILL.md"), "utf8"),
    fs.readFileSync(path.join(repositorySkills, "diagnose", "variants", "gpt-5.6.md"), "utf8"),
  );

  materializeSkillVariants({ model: "claude-fable-5.1", outputRoot: current.output, sourceRoot: repositorySkills });
  assert.equal(
    fs.readFileSync(path.join(installedSkill, "SKILL.md"), "utf8"),
    fs.readFileSync(path.join(repositorySkills, "diagnose", "variants", "claude-fable-5.1.md"), "utf8"),
  );
});
