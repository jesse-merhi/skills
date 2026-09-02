import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { resolveModelWritingGuide } from "./resolve-model-writing-guide.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(skillRoot, "../..");
const resolverPath = path.join(skillRoot, "scripts/resolve-model-writing-guide.mjs");
const registry = JSON.parse(fs.readFileSync(path.join(skillRoot, "references/registry.json"), "utf8"));
const speakRoot = path.join(repoRoot, "skills/speak-fking-english");
const speakCoverage = JSON.parse(fs.readFileSync(path.join(speakRoot, "model-writing.json"), "utf8"));

function resolve(model, coverage = speakCoverage, callingSkillRoot = speakRoot) {
  return resolveModelWritingGuide({ model, registry, coverage, guideRoot: skillRoot, callingSkillRoot });
}

test("covered model variants select their reviewed profile without a notice", () => {
  for (const model of ["gpt-5.6-sol", "openai/gpt-5.6-sol"]) {
    const gpt = resolve(model);
    assert.equal(gpt.status, "covered");
    assert.equal(gpt.selectedProfile, "gpt-5.6");
    assert.equal(gpt.noticeRequired, false);
    assert.match(gpt.skillAdapterReference, /gpt-5\.6\.md$/u);
  }

  const fable = resolve("anthropic/claude-fable-5[1m]");
  assert.equal(fable.status, "covered");
  assert.equal(fable.selectedProfile, "claude-fable-5.1");
});

test("a new model version falls back within its family and requires one notice", () => {
  const result = resolve("openai/gpt-5.7-sol");
  assert.equal(result.currentProfile, null);
  assert.equal(result.status, "fallback");
  assert.equal(result.selectedProfile, "gpt-5.6");
  assert.equal(result.reason, "unregistered-model-version");
  assert.equal(result.noticeRequired, true);
});

test("a known profile omitted by the calling skill does not bypass its coverage", () => {
  const result = resolve("claude-opus-5", {
    schemaVersion: 1,
    skill: "fable-only",
    profiles: { "claude-fable-5.1": null },
  });
  assert.equal(result.status, "shared");
  assert.equal(result.selectedProfile, null);
  assert.equal(result.reason, "skill-profile-missing");
  assert.equal(result.noticeRequired, true);
});

test("an unknown model family keeps shared behavior and requires a notice", () => {
  const result = resolve("gemini-3-pro");
  assert.equal(result.status, "shared");
  assert.equal(result.guideReference, null);
  assert.equal(result.skillAdapterReference, null);
  assert.equal(result.reason, "unknown-model-family");
  assert.equal(result.noticeRequired, true);
});

test("an unavailable model identifier keeps shared behavior without a stale notice", () => {
  const result = resolve("");
  assert.equal(result.status, "shared");
  assert.equal(result.reason, "model-unavailable");
  assert.equal(result.noticeRequired, false);
  assert.equal(result.notice, null);
});

test("the documented CLI returns the resolved profile and reports argument errors", () => {
  const coveragePath = path.join(speakRoot, "model-writing.json");
  const success = spawnSync(process.execPath, [
    resolverPath,
    "--model",
    "gpt-5.6-sol",
    "--coverage",
    coveragePath,
  ], { encoding: "utf8" });
  assert.equal(success.status, 0, success.stderr);
  const output = JSON.parse(success.stdout);
  assert.equal(output.status, "covered");
  assert.equal(output.guideReference, path.join(skillRoot, "references/gpt-5.6.md"));
  assert.equal(output.skillAdapterReference, path.join(speakRoot, "references/models/gpt-5.6.md"));

  const missingCoverage = spawnSync(process.execPath, [resolverPath, "--model", "gpt-5.6-sol"], { encoding: "utf8" });
  assert.equal(missingCoverage.status, 1);
  assert.match(missingCoverage.stderr, /--coverage is required/u);
});

test("the documented CLI runs through an installed skill symlink", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "model-writing-guide-symlink-"));
  const linkedResolver = path.join(directory, "resolve-model-writing-guide.mjs");
  fs.symlinkSync(resolverPath, linkedResolver);
  try {
    const result = spawnSync(process.execPath, [
      linkedResolver,
      "--model",
      "openai/gpt-5.6-sol",
      "--coverage",
      path.join(speakRoot, "model-writing.json"),
    ], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).selectedProfile, "gpt-5.6");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("guide and adapter references cannot escape their owning skills", () => {
  const unsafeRegistry = structuredClone(registry);
  unsafeRegistry.profiles[0].reference = "../writing-for-agents/SKILL.md";
  assert.throws(() => resolveModelWritingGuide({
    model: "gpt-5.6-sol",
    registry: unsafeRegistry,
    coverage: speakCoverage,
    guideRoot: skillRoot,
    callingSkillRoot: speakRoot,
  }), /must stay inside its owning skill/u);

  const unsafeCoverage = structuredClone(speakCoverage);
  unsafeCoverage.profiles["gpt-5.6"] = "../writing-for-agents/SKILL.md";
  assert.throws(() => resolve("gpt-5.6-sol", unsafeCoverage), /must stay inside its owning skill/u);
});

test("every coverage manifest belongs to its skill and resolves", () => {
  const manifests = fs.globSync("skills/**/model-writing.json", { cwd: repoRoot });
  assert.ok(manifests.length > 0);
  for (const manifest of manifests) {
    const callingSkillRoot = path.dirname(path.join(repoRoot, manifest));
    const coverage = JSON.parse(fs.readFileSync(path.join(repoRoot, manifest), "utf8"));
    assert.equal(coverage.skill, path.basename(callingSkillRoot));
    assert.doesNotThrow(() => resolveModelWritingGuide({
      model: "gpt-5.6-sol", registry, coverage, guideRoot: skillRoot, callingSkillRoot,
    }));
  }
});
