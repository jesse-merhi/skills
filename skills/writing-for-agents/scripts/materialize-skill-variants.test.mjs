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
const supportedProfiles = ["gpt-6", "claude-fable-5.1"];

function writeSkill(root, directory, name, profileNames = supportedProfiles) {
  const skill = path.join(root, directory);
  fs.mkdirSync(path.join(skill, "variants"), { recursive: true });
  fs.mkdirSync(path.join(skill, "references"));
  fs.writeFileSync(path.join(skill, "SKILL.md"), "---\nname: " + name + "\ndescription: fixture\n---\n");
  fs.writeFileSync(path.join(skill, "BASE.md"), "Human-owned baseline, not the runtime prompt.\n");
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
  const result = spawnSync("ps", ["-o", "lstart=", "-p", String(pid)], {
    encoding: "utf8", env: { ...process.env, TZ: "UTC", LC_ALL: "C" },
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function writeLock(lockRoot, owner) {
  fs.mkdirSync(lockRoot);
  const ownerPath = path.join(lockRoot, `owner-${owner.token}.json`);
  fs.writeFileSync(ownerPath, JSON.stringify(owner));
  return ownerPath;
}

test("recognizes supported model identifiers and same-family fallbacks", () => {
  assert.deepEqual(profiles.filter(profile => profile.family === "openai-gpt").map(profile => profile.id), ["gpt-6"]);
  for (const model of [
    "gpt-6", "openai/gpt-6", "openai/gpt-6-2026-09-23",
    "astra", "openai/astra", "openai/gpt-6-astra", "azure-openai/gpt-6-astra-2026-09-23",
    "sol", "openai/sol", "openai/gpt-6-sol", "azure-openai/gpt-6-sol-2026-09-23",
    "luna", "openai/luna", "openai/gpt-6-luna", "atlassian-ai-gateway-openai/gpt-6-luna-2026-09-23",
  ]) {
    const resolved = resolveProfile(model);
    assert.equal(resolved.profile.id, "gpt-6", model);
    assert.equal(resolved.exact, true);
  }
  for (const model of ["gpt-6-high", "gpt-6.1"]) {
    const resolved = resolveProfile(model);
    assert.equal(resolved.profile.id, "gpt-6");
    assert.equal(resolved.exact, false);
  }
  for (const model of ["opus", "claude-opus-5-5", "claude-opus-5.5", "anthropic/claude-opus-5-5", "anthropic/claude-opus-5-5-20260922"]) {
    const resolved = resolveProfile(model);
    assert.equal(resolved.profile.id, "claude-opus-5.5", model);
    assert.equal(resolved.exact, true);
  }
  const futureOpus = resolveProfile("claude-opus-5-6");
  assert.equal(futureOpus.profile.id, "claude-opus-5.5");
  assert.equal(futureOpus.exact, false);
  const fable = resolveProfile("anthropic/claude-fable-5-1[1m]");
  const configuredFable = resolveProfile("claude-fable-5[1m]");
  const futureFable = resolveProfile("claude-fable-5.2");
  const gpt = resolveProfile("azure-openai/gpt-6-astra");
  const futureGpt = resolveProfile("atlassian-ai-gateway-openai/gpt-6.1-sol");

  assert.deepEqual(
    [fable.profile.id, fable.exact, configuredFable.profile.id, configuredFable.exact, futureFable.profile.id, futureFable.exact],
    ["claude-fable-5.1", true, "claude-fable-5.1", true, "claude-fable-5.1", false],
  );
  assert.deepEqual(
    [gpt.profile.id, gpt.exact, futureGpt.profile.id, futureGpt.exact],
    ["gpt-6", true, "gpt-6", false],
  );
});

test("required exact coverage rejects a future model without changing the view", (t) => {
  const current = fixture(t);
  materializeSkillVariants({ model: "gpt-6-astra", outputRoot: current.output, sourceRoot: current.source });
  const previous = fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8");
  assert.throws(() => materializeSkillVariants({
    model: "gpt-6.1", outputRoot: current.output, sourceRoot: current.source, requireExact: true,
  }), /complete exact skill coverage/);
  assert.equal(fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8"), previous);
});

test("missing shared variant cannot fall back to a legacy tier", (t) => {
  const current = fixture(t);
  materializeSkillVariants({ model: "astra", outputRoot: current.output, sourceRoot: current.source });
  const previous = fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8");
  fs.unlinkSync(path.join(current.source, "alpha", "variants", "gpt-6.md"));
  fs.writeFileSync(path.join(current.source, "alpha", "variants", "gpt-6-sol.md"), "legacy\n");
  assert.throws(() => materializeSkillVariants({
    model: "sol", outputRoot: current.output, sourceRoot: current.source,
  }), /alpha has no openai-gpt variant/);
  assert.equal(fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8"), previous);
});

test("dangling skill entrypoint rejects materialization without replacing the view", (t) => {
  const current = fixture(t);
  const entrypoint = path.join(current.source, "alpha", "SKILL.md");
  fs.unlinkSync(entrypoint);
  fs.symlinkSync("variants/gpt-6.md", entrypoint);
  materializeSkillVariants({ model: "astra", outputRoot: current.output, sourceRoot: current.source });
  const prompt = path.join(current.output, "alpha", "SKILL.md");
  const previousPrompt = fs.readFileSync(prompt, "utf8");
  const marker = path.join(current.output, ".skill-variant-view.json");
  const previousMarker = fs.readFileSync(marker, "utf8");

  fs.unlinkSync(path.join(current.source, "alpha", "variants", "gpt-6.md"));
  assert.equal(fs.lstatSync(entrypoint).isSymbolicLink(), true);
  assert.equal(fs.existsSync(entrypoint), false);
  assert.throws(
    () => materializeSkillVariants({ model: "sol", outputRoot: current.output, sourceRoot: current.source }),
    { code: "ENOENT", path: path.join(fs.realpathSync(path.dirname(entrypoint)), "SKILL.md") },
  );
  assert.equal(fs.readFileSync(prompt, "utf8"), previousPrompt);
  assert.equal(fs.readFileSync(marker, "utf8"), previousMarker);
  assert.equal(fs.readFileSync(path.join(current.output, "beta", "SKILL.md"), "utf8").endsWith("gpt-6\n"), true);
});

test("materializes one contained static variant and links shared resources", (t) => {
  const current = fixture(t);
  const gpt = materializeSkillVariants({
    model: "gpt-6-astra",
    outputRoot: current.output,
    sourceRoot: current.source,
  });

  assert.deepEqual(gpt, {
    exact: true,
    model: "gpt-6-astra",
    notice: undefined,
    profile: "gpt-6",
    skillCount: 2,
  });
  assert.equal(fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8").endsWith("gpt-6\n"), true);
  assert.equal(fs.lstatSync(path.join(current.output, "alpha", "SKILL.md")).isSymbolicLink(), false);
  assert.equal(fs.readFileSync(path.join(current.output, "beta", "references", "shared.md"), "utf8"), "shared\n");
  assert.equal(fs.existsSync(path.join(current.output, "alpha", "variants")), false);
  assert.equal(fs.existsSync(path.join(current.output, "alpha", "BASE.md")), false);

  const fable = materializeSkillVariants({
    model: "claude-fable-5.1",
    outputRoot: current.output,
    sourceRoot: current.source,
  });
  assert.equal(fable.profile, "claude-fable-5.1");
  assert.equal(fs.existsSync(path.join(current.output, "alpha", "BASE.md")), false);
  assert.equal(fs.readFileSync(path.join(current.output, "alpha", "SKILL.md"), "utf8").endsWith("claude-fable-5.1\n"), true);
  assert.equal(
    fs.readFileSync(`${current.output}/beta/references/../SKILL.md`, "utf8"),
    fs.readFileSync(path.join(current.source, "group", "beta", "variants", "claude-fable-5.1.md"), "utf8"),
  );
});

for (const model of ["gpt-6-astra", "gpt-6-sol", "gpt-6-luna"]) {
  test(`materializes the one shared prompt as an exact ${model} selection`, (t) => {
    const current = fixture(t);
    const result = materializeSkillVariants({
      model, outputRoot: current.output, sourceRoot: current.source, requireExact: true,
    });
    assert.equal(result.exact, true);
    assert.equal(result.profile, "gpt-6");
    assert.equal(result.notice, undefined);
    const installed = path.join(current.output, "alpha", "SKILL.md");
    assert.equal(fs.lstatSync(installed).isFile(), true);
    assert.equal(fs.readFileSync(installed, "utf8"), fs.readFileSync(path.join(current.source, "alpha/variants/gpt-6.md"), "utf8"));
  });
}

test("does not reclaim a live lock based on its age", (t) => {
  const current = fixture(t);
  const lockRoot = current.output + ".lock";
  writeLock(lockRoot, { pid: process.pid, startIdentity: processStartIdentity(process.pid), token: "live" });
  fs.utimesSync(lockRoot, new Date(0), new Date(0));

  assert.equal(reclaimAbandonedLock(lockRoot), false);
  assert.equal(fs.existsSync(lockRoot), true);
});

test("preserves a held lock when another process uses a different timezone", (t) => {
  const current = fixture(t);
  const lockRoot = current.output + ".lock";
  const contender = `
    import { reclaimAbandonedLock } from ${JSON.stringify(new URL("./materialize-skill-variants.mjs", import.meta.url).href)};
    process.stdout.write(String(reclaimAbandonedLock(process.argv[1])));
  `;
  withOutputLock(current.output, () => {
    const ownerFiles = fs.readdirSync(lockRoot);
    for (const timezone of ["UTC", "Australia/Sydney"]) {
      const result = spawnSync(process.execPath, ["--input-type=module", "-e", contender, lockRoot], {
        encoding: "utf8",
        env: { ...process.env, TZ: timezone, LC_ALL: "C" },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, "false", timezone);
      assert.deepEqual(fs.readdirSync(lockRoot), ownerFiles);
    }
  });
});

test("reclaims a lock whose owning process has exited", (t) => {
  const current = fixture(t);
  const lockRoot = current.output + ".lock";
  const exited = spawnSync(process.execPath, ["-e", "process.stdout.write(String(process.pid))"], { encoding: "utf8" });
  assert.equal(exited.status, 0, exited.stderr);
  writeLock(lockRoot, { pid: Number(exited.stdout), startIdentity: "exited process", token: "dead" });

  assert.equal(reclaimAbandonedLock(lockRoot), true);
  assert.equal(fs.existsSync(lockRoot), false);
});

test("reclaims a lock after its owner PID is reused", (t) => {
  const current = fixture(t);
  const lockRoot = current.output + ".lock";
  writeLock(lockRoot, { pid: process.pid, startIdentity: "different process start", token: "reused" });

  assert.equal(reclaimAbandonedLock(lockRoot), true);
  assert.equal(fs.existsSync(lockRoot), false);
});

test("an interrupted owner-file preparation cannot block acquisition", (t) => {
  const current = fixture(t);
  fs.mkdirSync(current.output + ".lock.candidate-interrupted");

  assert.equal(withOutputLock(current.output, () => "published"), "published");
  assert.equal(fs.existsSync(current.output + ".lock"), false);
});

test("a stale reclaimer cannot remove a replacement live owner's lock", (t) => {
  const current = fixture(t);
  const lockRoot = current.output + ".lock";
  const staleOwnerPath = writeLock(lockRoot, { pid: process.pid, startIdentity: "different process start", token: "stale" });
  const liveOwner = { pid: process.pid, startIdentity: processStartIdentity(process.pid), token: "live" };
  const originalReadFileSync = fs.readFileSync;
  t.after(() => { fs.readFileSync = originalReadFileSync; });
  fs.readFileSync = (file, ...options) => {
    const result = originalReadFileSync(file, ...options);
    if (file === staleOwnerPath) {
      fs.readFileSync = originalReadFileSync;
      assert.equal(reclaimAbandonedLock(lockRoot), true);
      writeLock(lockRoot, liveOwner);
    }
    return result;
  };

  assert.equal(reclaimAbandonedLock(lockRoot), false);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(lockRoot, "owner-live.json"), "utf8")), liveOwner);
});

test("restores the previous view when publication fails", (t) => {
  const current = fixture(t);
  materializeSkillVariants({ model: "gpt-6-astra", outputRoot: current.output, sourceRoot: current.source });
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
      "gpt-6.1",
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
  assert.equal(firstResult.profile, "gpt-6");
  assert.equal(firstResult.exact, false);
  assert.match(firstResult.notice, /not been updated for gpt-6\.1/);

  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(second.stdout).notice, undefined);

  const thirdSession = materializeSkillVariants({
    model: "gpt-6.1",
    outputRoot: current.output,
    sessionId: "session/two",
    sourceRoot: current.source,
  });
  assert.match(thirdSession.notice, /not been updated for gpt-6\.1/);
});

test("rejects unsupported families and older same-family models", () => {
  assert.throws(() => resolveProfile("gemini-3-pro"), /unsupported model family/);
  assert.throws(() => resolveProfile("gpt-oss-120b"), /unsupported model family/);
  assert.throws(() => resolveProfile("gpt-4.1"), /older than the earliest supported/);
  assert.throws(() => resolveProfile("gpt-5.5"), /older than the earliest supported/);
  assert.throws(() => resolveProfile("gpt-5-2025-08-07"), /older than the earliest supported/);
  assert.throws(() => resolveProfile("claude-fable-5.0"), /older than the earliest supported/);
  assert.throws(() => resolveProfile("claude-fable-5-20260801"), /older than the earliest supported/);
});

test("selects the newest profile not newer than an inexact request", (t) => {
  profiles.push({
    id: "gpt-6.1",
    family: "openai-gpt",
    version: [6, 1],
    matches: /^gpt-6\.1$/i,
  });
  t.after(() => profiles.pop());

  assert.equal(resolveProfile("gpt-6-high").profile.id, "gpt-6");
  assert.equal(resolveProfile("gpt-6.2-sol").profile.id, "gpt-6.1");
});

test("rejects skill names that could escape the generated view", (t) => {
  const current = fixture(t);
  writeSkill(current.source, "unsafe", "../escaped");

  assert.throws(
    () => materializeSkillVariants({ model: "gpt-6-astra", outputRoot: current.output, sourceRoot: current.source }),
    /invalid skill name/,
  );
  assert.equal(fs.existsSync(path.join(current.temporary, "escaped")), false);
});

test("refuses to overwrite a directory it did not create", (t) => {
  const current = fixture(t);
  fs.mkdirSync(current.output);
  fs.writeFileSync(path.join(current.output, "keep.txt"), "mine\n");

  assert.throws(
    () => materializeSkillVariants({ model: "gpt-6-astra", outputRoot: current.output, sourceRoot: current.source }),
    /refusing to replace unmanaged directory/,
  );
  assert.equal(fs.readFileSync(path.join(current.output, "keep.txt"), "utf8"), "mine\n");
});

test("requires explicit ownership transfer when the repository moves", (t) => {
  const first = fixture(t);
  materializeSkillVariants({ model: "gpt-6-astra", outputRoot: first.output, sourceRoot: first.source });

  const secondRoot = fs.mkdtempSync(path.join(os.tmpdir(), "skill-variants-source-"));
  t.after(() => fs.rmSync(secondRoot, { recursive: true, force: true }));
  writeSkill(secondRoot, "alpha", "alpha");
  fs.appendFileSync(path.join(secondRoot, "alpha", "variants", "gpt-6.md"), "second source\n");

  assert.throws(
    () => materializeSkillVariants({ model: "gpt-6-astra", outputRoot: first.output, sourceRoot: secondRoot }),
    /refusing to replace view owned by another source/,
  );
  assert.equal(fs.readFileSync(path.join(first.output, "alpha", "SKILL.md"), "utf8").includes("second source"), false);
  const transferred = materializeSkillVariants({
    model: "gpt-6-astra",
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
  const installedSkill = path.join(current.temporary, "installed-cleanup");

  materializeSkillVariants({ model: "gpt-6-astra", outputRoot: current.output, sourceRoot: repositorySkills });
  fs.symlinkSync(path.join(current.output, "cleanup"), installedSkill);
  assert.equal(
    fs.readFileSync(path.join(installedSkill, "SKILL.md"), "utf8"),
    fs.readFileSync(path.join(repositorySkills, "cleanup", "variants", "gpt-6.md"), "utf8"),
  );

  for (const model of ["gpt-6-sol", "gpt-6-luna", "claude-fable-5.1", "claude-opus-5-5"]) {
    materializeSkillVariants({ model, outputRoot: current.output, sourceRoot: repositorySkills, requireExact: true });
    const profile = resolveProfile(model).profile.id;
    assert.equal(
      fs.readFileSync(path.join(installedSkill, "SKILL.md"), "utf8"),
      fs.readFileSync(path.join(repositorySkills, "cleanup", "variants", `${profile}.md`), "utf8"),
    );
  }
});
