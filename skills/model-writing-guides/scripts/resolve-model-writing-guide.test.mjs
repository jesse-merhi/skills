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
    assert.equal(gpt.mode, "prose-revision");
    assert.match(gpt.guideReference, /prose-revision\/gpt-5\.6\.md$/u);
    assert.equal(gpt.skillAdapterReference, null);
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
  assert.match(result.notice, /speak-fking-english/u);
  assert.match(result.notice, /openai\/gpt-5\.7-sol/u);
  assert.match(result.notice, /gpt-5\.6 guidance/u);
});

test("same-family fallback selects the highest covered rank", () => {
  const rankedRegistry = structuredClone(registry);
  const current = rankedRegistry.profiles.find((profile) => profile.id === "gpt-5.6");
  rankedRegistry.profiles.unshift({
    ...structuredClone(current),
    id: "gpt-5.5",
    match: "^(?:openai/)?gpt-5\\.5$",
    fallbackRank: 55,
  });
  const coverage = structuredClone(speakCoverage);
  coverage.profiles = { "gpt-5.5": null, ...coverage.profiles };
  const result = resolveModelWritingGuide({
    model: "openai/gpt-5.7-sol",
    registry: rankedRegistry,
    coverage,
    guideRoot: skillRoot,
    callingSkillRoot: speakRoot,
  });
  assert.equal(result.selectedProfile, "gpt-5.6");
});

test("a known profile omitted by the calling skill does not bypass its coverage", () => {
  const result = resolve("claude-opus-5", {
    schemaVersion: 1,
    skill: "fable-only",
    mode: "execution",
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
  assert.equal(output.guideReference, path.join(skillRoot, "references/prose-revision/gpt-5.6.md"));
  assert.equal(output.skillAdapterReference, null);

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
  unsafeRegistry.profiles[0].references["prose-revision"] = "../writing-for-agents/SKILL.md";
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

test("guide and adapter symlinks cannot escape their owning skills", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "model-writing-guide-containment-"));
  const guideRoot = path.join(directory, "guide");
  const callingSkillRoot = path.join(directory, "caller");
  const external = path.join(directory, "external.md");
  fs.mkdirSync(path.join(guideRoot, "references"), { recursive: true });
  fs.mkdirSync(path.join(callingSkillRoot, "references"), { recursive: true });
  fs.writeFileSync(external, "outside\n");
  fs.symlinkSync(external, path.join(guideRoot, "references/escape.md"));
  fs.symlinkSync(external, path.join(callingSkillRoot, "references/escape.md"));
  const minimalRegistry = {
    schemaVersion: 1,
    modes: ["execution"],
    families: [{ id: "openai-gpt", match: "^gpt-" }],
    profiles: [{
      id: "gpt-5.6",
      family: "openai-gpt",
      match: "^gpt-5\\.6$",
      fallbackRank: 56,
      guideUrl: "https://example.test/guide",
      reviewedOn: "2026-09-02",
      references: { execution: "references/escape.md" },
    }],
  };
  const coverage = {
    schemaVersion: 1,
    skill: "caller",
    mode: "execution",
    profiles: { "gpt-5.6": null },
  };
  try {
    assert.throws(() => resolveModelWritingGuide({
      model: "gpt-5.6", registry: minimalRegistry, coverage, guideRoot, callingSkillRoot,
    }), /must stay inside its owning skill/u);
    fs.unlinkSync(path.join(guideRoot, "references/escape.md"));
    fs.writeFileSync(path.join(guideRoot, "references/escape.md"), "inside\n");
    coverage.profiles["gpt-5.6"] = "references/escape.md";
    assert.throws(() => resolveModelWritingGuide({
      model: "gpt-5.6", registry: minimalRegistry, coverage, guideRoot, callingSkillRoot,
    }), /must stay inside its owning skill/u);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("registry semantic invariants reject malformed configuration", () => {
  const cases = [
    ["duplicate mode", (value) => value.modes.push(value.modes[0]), /duplicate mode/u],
    ["duplicate family", (value) => value.families.push(structuredClone(value.families[0])), /duplicate family id/u],
    ["invalid family match", (value) => { value.families[0].match = "["; }, /valid regular expression/u],
    ["duplicate profile", (value) => value.profiles.push(structuredClone(value.profiles[0])), /duplicate profile id/u],
    ["invalid profile match", (value) => { value.profiles[0].match = "["; }, /valid regular expression/u],
    ["unknown family", (value) => { value.profiles[0].family = "missing"; }, /unknown family/u],
    ["missing mode reference", (value) => { delete value.profiles[0].references.execution; }, /has no reference for mode/u],
    ["extra mode reference", (value) => { value.profiles[0].references.imaginary = value.profiles[0].references.execution; }, /references unknown mode/u],
  ];
  for (const [name, mutate, pattern] of cases) {
    const malformed = structuredClone(registry);
    mutate(malformed);
    assert.throws(() => resolveModelWritingGuide({
      model: "gpt-5.6-sol",
      registry: malformed,
      coverage: speakCoverage,
      guideRoot: skillRoot,
      callingSkillRoot: speakRoot,
    }), pattern, name);
  }
});

test("every skill except the registry declares valid coverage and resolves its mode", () => {
  const manifests = fs.globSync("skills/**/model-writing.json", { cwd: repoRoot }).sort();
  const skillFiles = fs.globSync("skills/**/SKILL.md", { cwd: repoRoot });
  const expectedManifests = skillFiles
    .filter((file) => file !== "skills/model-writing-guides/SKILL.md")
    .map((file) => path.join(path.dirname(file), "model-writing.json"))
    .sort();
  assert.deepEqual(manifests, expectedManifests);
  for (const manifest of manifests) {
    const callingSkillRoot = path.dirname(path.join(repoRoot, manifest));
    const coverage = JSON.parse(fs.readFileSync(path.join(repoRoot, manifest), "utf8"));
    assert.equal(coverage.skill, path.basename(callingSkillRoot));
    assert.doesNotThrow(() => resolveModelWritingGuide({
      model: "gpt-5.6-sol", registry, coverage, guideRoot: skillRoot, callingSkillRoot,
    }));
  }
});

test("execution and instruction-authoring skills select their own mode variants", () => {
  for (const [skill, expectedMode, expectedPath] of [
    ["ask-codex", "execution", "execution/gpt-5.6.md"],
    ["writing-for-agents", "instruction-authoring", "gpt-5.6.md"],
  ]) {
    const callingSkillRoot = path.join(repoRoot, "skills", skill);
    const coverage = JSON.parse(fs.readFileSync(path.join(callingSkillRoot, "model-writing.json"), "utf8"));
    const result = resolveModelWritingGuide({
      model: "gpt-5.6-sol", registry, coverage, guideRoot: skillRoot, callingSkillRoot,
    });
    assert.equal(result.mode, expectedMode);
    assert.match(result.guideReference, new RegExp(`${expectedPath.replaceAll(".", "\\.")}$`, "u"));
  }
});

test("coverage cannot select an unregistered mode", () => {
  const coverage = structuredClone(speakCoverage);
  coverage.mode = "imaginary";
  assert.throws(() => resolve("gpt-5.6-sol", coverage), /unknown mode: imaginary/u);
});
