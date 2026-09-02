import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { resolveModelWritingGuide } from "./resolve-model-writing-guide.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(skillRoot, "../..");
const registry = JSON.parse(fs.readFileSync(path.join(skillRoot, "references/registry.json"), "utf8"));
const speakRoot = path.join(repoRoot, "skills/speak-fking-english");
const speakCoverage = JSON.parse(fs.readFileSync(path.join(speakRoot, "model-writing.json"), "utf8"));

function resolve(model, coverage = speakCoverage, callingSkillRoot = speakRoot) {
  return resolveModelWritingGuide({ model, registry, coverage, guideRoot: skillRoot, callingSkillRoot });
}

test("covered model variants select their reviewed profile without a notice", () => {
  const gpt = resolve("gpt-5.6-sol");
  assert.equal(gpt.status, "covered");
  assert.equal(gpt.selectedProfile, "gpt-5.6");
  assert.equal(gpt.noticeRequired, false);
  assert.match(gpt.skillAdapterReference, /gpt-5\.6\.md$/u);

  const fable = resolve("claude-fable-5[1m]");
  assert.equal(fable.status, "covered");
  assert.equal(fable.selectedProfile, "claude-fable-5.1");
});

test("a new model version falls back within its family and requires one notice", () => {
  const result = resolve("gpt-5.7-sol");
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
