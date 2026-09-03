import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  materializeClaudeSessionView,
  materializeSkillVariants,
  recordClaudeSession,
  renderClaudeSkill,
  resolveProfile,
  routeClaudeSkill,
  withOutputLock,
} from "./materialize-skill-variants.mjs";

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
  const canonicalFable = resolveProfile("claude-fable-5-1[1m]");
  const opus = resolveProfile("opus");

  assert.equal(fable.exact, true);
  assert.equal(fable.profile.id, "claude-fable-5.1");
  assert.equal(canonicalFable.exact, true);
  assert.equal(canonicalFable.profile.id, "claude-fable-5.1");
  assert.equal(opus.exact, true);
  assert.equal(opus.profile.id, "claude-opus-5");
});

test("recognizes model families behind provider-qualified identifiers", () => {
  const exact = resolveProfile("azure-openai/gpt-5.6-sol");
  const fallback = resolveProfile("atlassian-ai-gateway-openai/gpt-5.5-2026-04-23");

  assert.equal(exact.exact, true);
  assert.equal(exact.profile.id, "gpt-5.6");
  assert.equal(fallback.exact, false);
  assert.equal(fallback.profile.id, "gpt-5.6");
  assert.throws(() => resolveProfile("gateway/gemini-opus-pro"), /unsupported model family/);
});

test("materializes one contained static variant and links shared resources", (t) => {
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
  assert.equal(fs.lstatSync(path.join(current.output, "alpha", "SKILL.md")).isSymbolicLink(), false);
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

test("retries when a contended output lock disappears before inspection", (t) => {
  const current = fixture(t);
  const lockRoot = `${current.output}.lock`;
  fs.mkdirSync(lockRoot);
  const originalStatSync = fs.statSync;
  let simulatedRace = false;
  fs.statSync = (target, ...options) => {
    if (target === lockRoot && !simulatedRace) {
      simulatedRace = true;
      fs.rmSync(lockRoot, { recursive: true, force: true });
      const error = new Error(`ENOENT: no such file or directory, stat '${lockRoot}'`);
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

test("renders the selected variant independently for concurrent Claude sessions", (t) => {
  const current = fixture(t);
  const stateRoot = path.join(current.temporary, "sessions");
  materializeClaudeSessionView({ outputRoot: current.output, sourceRoot: current.source, stateRoot });
  recordClaudeSession({ model: "claude-fable-5.1", sessionId: "fable-session", stateRoot });
  recordClaudeSession({ model: "claude-opus-5", sessionId: "opus-session", stateRoot });

  assert.equal(renderClaudeSkill({ sourceRoot: current.source, stateRoot, sessionId: "fable-session", skillName: "alpha" }), "claude-fable-5.1\n");
  assert.equal(renderClaudeSkill({ sourceRoot: current.source, stateRoot, sessionId: "opus-session", skillName: "alpha" }), "claude-opus-5\n");

  recordClaudeSession({ model: "claude-opus-5", sessionId: "fable-session", stateRoot });
  assert.equal(renderClaudeSkill({ sourceRoot: current.source, stateRoot, sessionId: "fable-session", skillName: "alpha" }), "claude-opus-5\n");
  assert.equal(renderClaudeSkill({ sourceRoot: current.source, stateRoot, sessionId: "opus-session", skillName: "alpha" }), "claude-opus-5\n");
});

test("Claude loader injects the recorded session variant without mutating the shared view", (t) => {
  const current = fixture(t);
  const stateRoot = path.join(current.temporary, "sessions");
  materializeClaudeSessionView({ outputRoot: current.output, sourceRoot: current.source, stateRoot });
  recordClaudeSession({ model: "claude-fable-5.1", sessionId: "session-one", stateRoot });

  const loaderSkill = path.join(current.output, "alpha", "SKILL.md");
  const loaderBefore = fs.readFileSync(loaderSkill, "utf8");
  assert.match(loaderBefore, /allowed-tools: Bash\(node "\$\{CLAUDE_SKILL_DIR\}\/\.model-variant-loader" \*\)/);
  const command = loaderBefore.match(/!`(.+)`/)?.[1]
    .replaceAll("${CLAUDE_SKILL_DIR}", path.dirname(loaderSkill))
    .replaceAll("${CLAUDE_SESSION_ID}", "session-one");
  assert.notEqual(command, undefined);
  const rendered = spawnSync("bash", ["-lc", command], { encoding: "utf8" });
  assert.equal(rendered.status, 0, rendered.stderr);
  assert.equal(rendered.stdout, "claude-fable-5.1\n");
  assert.equal(fs.readFileSync(loaderSkill, "utf8"), loaderBefore);
});

test("Claude loader works when the generated view path contains whitespace", (t) => {
  const current = fixture(t);
  const outputRoot = path.join(current.temporary, "generated view");
  const stateRoot = path.join(current.temporary, "sessions");
  materializeClaudeSessionView({ outputRoot, sourceRoot: current.source, stateRoot });
  recordClaudeSession({ model: "claude-fable-5.1", sessionId: "session-one", stateRoot });

  const loaderSkill = path.join(outputRoot, "alpha", "SKILL.md");
  const loader = fs.readFileSync(loaderSkill, "utf8");
  const command = loader.match(/!`(.+)`/)?.[1]
    .replaceAll("${CLAUDE_SKILL_DIR}", path.dirname(loaderSkill))
    .replaceAll("${CLAUDE_SESSION_ID}", "session-one");
  assert.notEqual(command, undefined);
  const rendered = spawnSync("bash", ["-lc", command], { encoding: "utf8" });
  assert.equal(rendered.status, 0, rendered.stderr);
  assert.equal(rendered.stdout, "claude-fable-5.1\n");
});

test("routes an Opus worker to a contained model-qualified skill", (t) => {
  const current = fixture(t);
  const stateRoot = path.join(current.temporary, "sessions");
  const result = materializeClaudeSessionView({ outputRoot: current.output, sourceRoot: current.source, stateRoot });
  const alias = "model-variant-claude-opus-5--alpha";
  const aliasSkill = path.join(current.output, alias, "SKILL.md");

  assert.equal(result.routedSkillCount, 2);
  assert.equal(fs.lstatSync(aliasSkill).isSymbolicLink(), false);
  assert.match(fs.readFileSync(aliasSkill, "utf8"), new RegExp(`name: ${alias}`));
  assert.match(fs.readFileSync(aliasSkill, "utf8"), /disable-model-invocation: true/);
  assert.equal(fs.readFileSync(aliasSkill, "utf8").endsWith("claude-opus-5\n"), true);

  const routed = routeClaudeSkill({
    sourceRoot: current.source,
    hook: {
      agent_type: "opus-worker",
      tool_input: { args: "keep this", skill: "alpha" },
      tool_name: "Skill",
    },
  });
  assert.deepEqual(routed?.hookSpecificOutput.updatedInput, { args: "keep this", skill: alias });
  assert.equal(routeClaudeSkill({
    sourceRoot: current.source,
    hook: { agent_type: "opus-worker", tool_input: { skill: "third-party" }, tool_name: "Skill" },
  }), undefined);
  assert.equal(routeClaudeSkill({
    sourceRoot: current.source,
    hook: { agent_type: "Explore", tool_input: { skill: "alpha" }, tool_name: "Skill" },
  }), undefined);

  const cli = spawnSync(
    process.execPath,
    [materializer, "--action", "route-skill", "--source", current.source],
    {
      encoding: "utf8",
      input: JSON.stringify({ agent_type: "opus-worker", tool_input: { skill: "alpha" }, tool_name: "Skill" }),
    },
  );
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(JSON.parse(cli.stdout).hookSpecificOutput.updatedInput.skill, alias);
});

test("Claude hooks update only their session and retain it when model data is unavailable", (t) => {
  const current = fixture(t);
  const stateRoot = path.join(current.temporary, "sessions");
  const runHook = (input) => spawnSync(
    process.execPath,
    [materializer, "--action", "record-session", "--state-root", stateRoot],
    { encoding: "utf8", input: JSON.stringify(input) },
  );

  const started = runHook({ hook_event_name: "SessionStart", model: "claude-fable-5.1", session_id: "session-one" });
  assert.equal(started.status, 0, started.stderr);
  const missingModel = runHook({ hook_event_name: "SessionStart", session_id: "session-one", source: "clear" });
  assert.equal(missingModel.status, 0, missingModel.stderr);
  assert.equal(renderClaudeSkill({ sourceRoot: current.source, stateRoot, sessionId: "session-one", skillName: "alpha" }), "claude-fable-5.1\n");

  const unsupported = runHook({ hook_event_name: "PostModelSwitch", to_model: "gemini-3-pro", session_id: "session-one" });
  assert.equal(unsupported.status, 1);
  assert.match(unsupported.stderr, /unsupported model family/);
  assert.equal(renderClaudeSkill({ sourceRoot: current.source, stateRoot, sessionId: "session-one", skillName: "alpha" }), "claude-fable-5.1\n");

  const fallback = runHook({ hook_event_name: "SessionStart", model: "claude-fable-5.2", session_id: "future-session" });
  assert.equal(fallback.status, 0, fallback.stderr);
  assert.equal(fallback.stdout, "");
  const repeated = runHook({ hook_event_name: "PostModelSwitch", to_model: "claude-fable-5.2", session_id: "future-session" });
  assert.equal(repeated.status, 0, repeated.stderr);
  assert.equal(repeated.stdout, "");
  assert.match(
    renderClaudeSkill({ sourceRoot: current.source, stateRoot, sessionId: "future-session", skillName: "alpha" }),
    /not been updated for claude-fable-5\.2[\s\S]*claude-fable-5\.1/,
  );
  assert.equal(renderClaudeSkill({ sourceRoot: current.source, stateRoot, sessionId: "future-session", skillName: "alpha" }), "claude-fable-5.1\n");
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
