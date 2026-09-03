#!/usr/bin/env node

import * as Schema from "effect/Schema";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const MARKER = ".skill-variant-view.json";
const LOCK_TIMEOUT_MS = 5_000;
const STALE_LOCK_MS = 30_000;
const CLAUDE_AGENT_PROFILES = new Map([
  ["opus-worker", "claude-opus-5"],
]);
const MarkerJson = Schema.fromJsonString(Schema.Struct({
  schemaVersion: Schema.Literal(1),
  sourceRoot: Schema.NonEmptyString,
  profile: Schema.NonEmptyString,
}));
const HookInputJson = Schema.fromJsonString(Schema.Struct({
  hook_event_name: Schema.optional(Schema.NonEmptyString),
  model: Schema.optional(Schema.NonEmptyString),
  to_model: Schema.optional(Schema.NonEmptyString),
  session_id: Schema.optional(Schema.NonEmptyString),
  agent_type: Schema.optional(Schema.NonEmptyString),
  tool_name: Schema.optional(Schema.NonEmptyString),
  tool_input: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
}));
const SessionStateJson = Schema.fromJsonString(Schema.Struct({
  schemaVersion: Schema.Literal(1),
  sessionId: Schema.NonEmptyString,
  model: Schema.NonEmptyString,
  exact: Schema.Boolean,
  profile: Schema.NonEmptyString,
}));

export const profiles = [
  {
    id: "gpt-5.6",
    family: "openai-gpt",
    rank: 56,
    matches: /^(?:openai\/)?gpt-5\.6(?:-(?:sol|terra|luna))?(?:-\d{4}-\d{2}-\d{2})?$/i,
  },
  {
    id: "claude-fable-5.1",
    family: "anthropic-fable",
    rank: 51,
    matches: /^(?:(?:anthropic\/)?claude-fable-5(?:(?:[.-]1)(?:\[1m\])?|\[1m\])(?:-\d{8})?|fable(?:\[1m\])?)$/i,
  },
  {
    id: "claude-opus-5",
    family: "anthropic-opus",
    rank: 50,
    matches: /^(?:(?:anthropic\/)?claude-opus-5(?:\[1m\])?(?:-\d{8})?|opus(?:\[1m\])?)$/i,
  },
];

function modelFamily(model) {
  const normalized = model.slice(model.lastIndexOf("/") + 1).toLowerCase();
  if (/^(?:(?:anthropic\/)?claude-)?opus(?:[-.]\d|\[)/.test(normalized)) return "anthropic-opus";
  if (/^(?:(?:anthropic\/)?claude-)?fable(?:[-.]\d|\[)/.test(normalized)) return "anthropic-fable";
  if (/^(?:openai\/)?gpt-\d/.test(normalized)) return "openai-gpt";
  return undefined;
}

export function resolveProfile(model) {
  const unqualifiedModel = model.slice(model.lastIndexOf("/") + 1);
  const exact = profiles.find((profile) => profile.matches.test(unqualifiedModel));
  const family = exact?.family ?? modelFamily(model);
  if (family === undefined) {
    throw new Error(`unsupported model family for ${model}`);
  }
  const fallback = profiles
    .filter((profile) => profile.family === family)
    .sort((left, right) => right.rank - left.rank)[0];
  if (fallback === undefined) {
    throw new Error(`no skill profile is available for model family ${family}`);
  }
  return { exact: exact !== undefined, profile: exact ?? fallback };
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

export function withOutputLock(outputRoot, operation) {
  const lockRoot = `${outputRoot}.lock`;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  fs.mkdirSync(path.dirname(outputRoot), { recursive: true });
  while (true) {
    try {
      fs.mkdirSync(lockRoot);
      break;
    } catch (error) {
      if (!(error instanceof Error) || !Object.hasOwn(error, "code") || error.code !== "EEXIST") throw error;
      let lockStat;
      try {
        lockStat = fs.statSync(lockRoot);
      } catch (statError) {
        if (statError instanceof Error && Object.hasOwn(statError, "code") && statError.code === "ENOENT") continue;
        throw statError;
      }
      const age = Date.now() - lockStat.mtimeMs;
      if (age > STALE_LOCK_MS) {
        fs.rmSync(lockRoot, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= deadline) throw new Error(`timed out waiting for model view lock ${lockRoot}`);
      sleep(25);
    }
  }
  try {
    return operation();
  } finally {
    fs.rmSync(lockRoot, { recursive: true, force: true });
  }
}

function parseSkillName(skillFile) {
  const source = fs.readFileSync(skillFile, "utf8");
  const match = source.match(/^---\n[\s\S]*?^name:\s*['"]?([^'"\n]+)['"]?\s*$[\s\S]*?^---$/m);
  if (match === null) throw new Error(`missing skill name in ${skillFile}`);
  return match[1].trim();
}

function splitSkillDocument(skillFile) {
  const source = fs.readFileSync(skillFile, "utf8");
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (match === null) throw new Error(`invalid skill document ${skillFile}`);
  return { frontmatter: match[1], body: match[2] };
}

function quoteShell(value) {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function sessionStatePath(stateRoot, sessionId) {
  const key = createHash("sha256").update(sessionId).digest("hex");
  return path.join(path.resolve(stateRoot), `${key}.json`);
}

function claudeAliasName(profileId, skillName) {
  return `model-variant-${profileId}--${skillName}`;
}

function aliasSkillDocument(skillFile, aliasName) {
  const { frontmatter, body } = splitSkillDocument(skillFile);
  const aliasedFrontmatter = frontmatter.replace(/^name:.*$/m, `name: ${aliasName}`);
  // The public Skill passes invocation policy before routeClaudeSkill rewrites its allowed call.
  // This keeps aliases out of model discovery without blocking the routed invocation.
  return `---\n${aliasedFrontmatter}\ndisable-model-invocation: true\n---\n${body}`;
}

export function discoverSkills(sourceRoot) {
  const found = [];
  const visit = (directory) => {
    const skillFile = path.join(directory, "SKILL.md");
    if (fs.existsSync(skillFile)) {
      found.push({ directory, name: parseSkillName(skillFile) });
      return;
    }
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== "variants") {
        visit(path.join(directory, entry.name));
      }
    }
  };
  visit(sourceRoot);
  const names = new Set();
  for (const skill of found) {
    if (names.has(skill.name)) throw new Error(`duplicate skill name ${skill.name}`);
    names.add(skill.name);
  }
  return found.sort((left, right) => left.name.localeCompare(right.name));
}

function availableVariant(skill, profile) {
  const candidate = path.join(skill.directory, "variants", `${profile.id}.md`);
  return fs.existsSync(candidate) ? candidate : undefined;
}

function selectVariant(skill, requestedProfile) {
  const exact = availableVariant(skill, requestedProfile);
  if (exact !== undefined) return { path: exact, profile: requestedProfile };
  const fallback = profiles
    .filter((profile) => profile.family === requestedProfile.family)
    .sort((left, right) => right.rank - left.rank)
    .find((profile) => availableVariant(skill, profile) !== undefined);
  if (fallback === undefined) {
    throw new Error(`${skill.name} has no ${requestedProfile.family} variant`);
  }
  return { path: availableVariant(skill, fallback), profile: fallback };
}

function linkSharedEntries(skill, outputDirectory) {
  for (const entry of fs.readdirSync(skill.directory, { withFileTypes: true })) {
    if (["SKILL.md", "variants"].includes(entry.name)) continue;
    fs.symlinkSync(path.join(skill.directory, entry.name), path.join(outputDirectory, entry.name));
  }
}

function assertManagedOutput(outputRoot, sourceRoot, previousSourceRoot) {
  if (!fs.existsSync(outputRoot)) return;
  const markerPath = path.join(outputRoot, MARKER);
  if (!fs.existsSync(markerPath)) {
    throw new Error(`refusing to replace unmanaged directory ${outputRoot}`);
  }
  const marker = Schema.decodeUnknownSync(MarkerJson)(fs.readFileSync(markerPath, "utf8"));
  const approvedPreviousSource = previousSourceRoot === undefined
    ? undefined
    : fs.existsSync(previousSourceRoot)
      ? fs.realpathSync(previousSourceRoot)
      : path.resolve(previousSourceRoot);
  if (marker.sourceRoot !== sourceRoot && marker.sourceRoot !== approvedPreviousSource) {
    throw new Error(`refusing to replace view owned by another source: ${outputRoot}`);
  }
}

function publishView(stagingRoot, outputRoot) {
  const backupRoot = `${outputRoot}.previous-${process.pid}`;
  if (fs.existsSync(outputRoot)) fs.renameSync(outputRoot, backupRoot);
  try {
    fs.renameSync(stagingRoot, outputRoot);
    if (fs.existsSync(backupRoot)) fs.rmSync(backupRoot, { recursive: true, force: true });
  } catch (error) {
    if (fs.existsSync(backupRoot) && !fs.existsSync(outputRoot)) {
      fs.renameSync(backupRoot, outputRoot);
    }
    throw error;
  }
}

function noticeOnce({ notice, outputRoot, sessionId }) {
  if (notice === undefined || sessionId === undefined || sessionId === "") return notice;
  const noticeRoot = path.join(path.dirname(outputRoot), ".skill-variant-notices");
  fs.mkdirSync(noticeRoot, { recursive: true });
  const safeSessionId = sessionId.replace(/[^a-zA-Z0-9._-]/g, "_");
  const marker = path.join(noticeRoot, safeSessionId);
  try {
    fs.writeFileSync(marker, "notified\n", { flag: "wx" });
  } catch (error) {
    if (error instanceof Error && Object.hasOwn(error, "code") && error.code === "EEXIST") return undefined;
    throw error;
  }
  return notice;
}

export function materializeSkillVariants({ sourceRoot, outputRoot, model, previousSourceRoot, sessionId }) {
  const resolvedSource = fs.realpathSync(sourceRoot);
  const resolvedOutput = path.resolve(outputRoot);
  const { exact, profile } = resolveProfile(model);
  const skills = discoverSkills(resolvedSource);
  const fallbackSkills = withOutputLock(resolvedOutput, () => {
    assertManagedOutput(resolvedOutput, resolvedSource, previousSourceRoot);
    const stagingRoot = `${resolvedOutput}.staging-${process.pid}`;
    fs.rmSync(stagingRoot, { recursive: true, force: true });
    fs.mkdirSync(stagingRoot, { recursive: true });
    try {
      const missing = [];
      for (const skill of skills) {
        const selection = selectVariant(skill, profile);
        if (selection.profile.id !== profile.id) missing.push(skill.name);
        const skillOutput = path.join(stagingRoot, skill.name);
        fs.mkdirSync(skillOutput);
        fs.copyFileSync(selection.path, path.join(skillOutput, "SKILL.md"));
        linkSharedEntries(skill, skillOutput);
      }

      fs.writeFileSync(
        path.join(stagingRoot, MARKER),
        `${JSON.stringify({ schemaVersion: 1, sourceRoot: resolvedSource, profile: profile.id })}\n`,
      );
      publishView(stagingRoot, resolvedOutput);
      return missing;
    } catch (error) {
      fs.rmSync(stagingRoot, { recursive: true, force: true });
      throw error;
    }
  });

  const stale = !exact || fallbackSkills.length > 0;
  const detail = fallbackSkills.length > 0 ? `; missing variants: ${fallbackSkills.join(", ")}` : "";
  const notice = stale
    ? `Skill variants have not been updated for ${model}; using ${profile.id}${detail}. Tell the user once in this session, then continue.`
    : undefined;
  return {
    exact: !stale,
    model,
    notice: noticeOnce({ notice, outputRoot: resolvedOutput, sessionId }),
    profile: profile.id,
    skillCount: skills.length,
  };
}

export function materializeClaudeSessionView({ sourceRoot, outputRoot, previousSourceRoot, stateRoot }) {
  const resolvedSource = fs.realpathSync(sourceRoot);
  const resolvedOutput = path.resolve(outputRoot);
  const resolvedState = path.resolve(stateRoot);
  const skills = discoverSkills(resolvedSource);
  const loader = fileURLToPath(import.meta.url);
  withOutputLock(resolvedOutput, () => {
    assertManagedOutput(resolvedOutput, resolvedSource, previousSourceRoot);
    const stagingRoot = `${resolvedOutput}.staging-${process.pid}`;
    fs.rmSync(stagingRoot, { recursive: true, force: true });
    fs.mkdirSync(stagingRoot, { recursive: true });
    try {
      for (const skill of skills) {
        const skillOutput = path.join(stagingRoot, skill.name);
        fs.mkdirSync(skillOutput);
        const { frontmatter } = splitSkillDocument(path.join(skill.directory, "variants", "gpt-5.6.md"));
        const command = [
          "node",
          '"${CLAUDE_SKILL_DIR}/.model-variant-loader"',
          "--action render-skill",
          `--skill ${quoteShell(skill.name)}`,
          `--source ${quoteShell(resolvedSource)}`,
          `--state-root ${quoteShell(resolvedState)}`,
          `--session ${quoteShell("${CLAUDE_SESSION_ID}")}`,
        ].join(" ");
        fs.writeFileSync(
          path.join(skillOutput, "SKILL.md"),
          `---\n${frontmatter}\nallowed-tools: Bash(node "\${CLAUDE_SKILL_DIR}/.model-variant-loader" *)\n---\n\n!\`${command}\`\n`,
        );
        fs.symlinkSync(loader, path.join(skillOutput, ".model-variant-loader"));
        linkSharedEntries(skill, skillOutput);
      }
      for (const profileId of new Set(CLAUDE_AGENT_PROFILES.values())) {
        const profile = profiles.find((candidate) => candidate.id === profileId);
        if (profile === undefined) throw new Error(`unknown Claude agent profile ${profileId}`);
        for (const skill of skills) {
          const aliasName = claudeAliasName(profile.id, skill.name);
          const skillOutput = path.join(stagingRoot, aliasName);
          fs.mkdirSync(skillOutput);
          const selection = selectVariant(skill, profile);
          fs.writeFileSync(path.join(skillOutput, "SKILL.md"), aliasSkillDocument(selection.path, aliasName));
          linkSharedEntries(skill, skillOutput);
        }
      }
      fs.writeFileSync(
        path.join(stagingRoot, MARKER),
        `${JSON.stringify({ schemaVersion: 1, sourceRoot: resolvedSource, profile: "claude-session" })}\n`,
      );
      publishView(stagingRoot, resolvedOutput);
    } catch (error) {
      fs.rmSync(stagingRoot, { recursive: true, force: true });
      throw error;
    }
  });
  fs.mkdirSync(resolvedState, { recursive: true });
  return {
    profile: "claude-session",
    routedSkillCount: skills.length * new Set(CLAUDE_AGENT_PROFILES.values()).size,
    skillCount: skills.length,
    stateRoot: resolvedState,
  };
}

export function routeClaudeSkill({ sourceRoot, hook }) {
  if (hook.tool_name !== "Skill" || hook.agent_type === undefined || hook.tool_input === undefined) return undefined;
  const profileId = CLAUDE_AGENT_PROFILES.get(hook.agent_type);
  const skillName = hook.tool_input.skill;
  if (profileId === undefined || typeof skillName !== "string") return undefined;
  const repoSkillNames = new Set(discoverSkills(fs.realpathSync(sourceRoot)).map((skill) => skill.name));
  if (!repoSkillNames.has(skillName)) return undefined;
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: `Use the ${profileId} prompt selected for ${hook.agent_type}.`,
      updatedInput: { ...hook.tool_input, skill: claudeAliasName(profileId, skillName) },
    },
  };
}

export function recordClaudeSession({ stateRoot, sessionId, model }) {
  const { exact, profile } = resolveProfile(model);
  const resolvedState = path.resolve(stateRoot);
  fs.mkdirSync(resolvedState, { recursive: true });
  const target = sessionStatePath(resolvedState, sessionId);
  const staging = `${target}.staging-${process.pid}`;
  const state = { schemaVersion: 1, sessionId, model, exact, profile: profile.id };
  fs.writeFileSync(staging, `${JSON.stringify(state)}\n`, { flag: "wx" });
  fs.renameSync(staging, target);
  return state;
}

export function renderClaudeSkill({ sourceRoot, stateRoot, sessionId, skillName }) {
  const resolvedSource = fs.realpathSync(sourceRoot);
  const stateFile = sessionStatePath(stateRoot, sessionId);
  if (!fs.existsSync(stateFile)) {
    throw new Error(`no model profile was recorded for Claude session ${sessionId}`);
  }
  const state = Schema.decodeUnknownSync(SessionStateJson)(fs.readFileSync(stateFile, "utf8"));
  if (state.sessionId !== sessionId) throw new Error("Claude session state does not match the requested session");
  const profile = profiles.find((candidate) => candidate.id === state.profile);
  if (profile === undefined) throw new Error(`unknown recorded skill profile ${state.profile}`);
  const skill = discoverSkills(resolvedSource).find((candidate) => candidate.name === skillName);
  if (skill === undefined) throw new Error(`unknown skill ${skillName}`);
  const selection = selectVariant(skill, profile);
  const { body } = splitSkillDocument(selection.path);
  const stale = !state.exact || selection.profile.id !== profile.id;
  const detail = selection.profile.id === profile.id ? "" : `; using ${selection.profile.id} for ${skillName}`;
  const notice = stale
    ? `Skill variants have not been updated for ${state.model}${detail}. Tell the user once in this session, then continue.`
    : undefined;
  const visibleNotice = noticeOnce({ notice, outputRoot: path.join(path.resolve(stateRoot), "session"), sessionId });
  return visibleNotice === undefined ? body : `${visibleNotice}\n\n${body}`;
}

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("expected --source, --output, and optional --model or --session arguments");
    }
    values[key.slice(2)] = value;
  }
  return values;
}

async function readHookInput() {
  if (process.stdin.isTTY) return {};
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8").trim();
  return text === "" ? {} : Schema.decodeUnknownSync(HookInputJson)(text);
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const hook = await readHookInput();
  const action = args.action ?? "materialize";
  const model = args.model ?? hook.to_model ?? hook.model;
  const sessionId = args.session ?? hook.session_id;
  if (action === "route-skill") {
    if (args.source === undefined) throw new Error("route-skill requires --source");
    const result = routeClaudeSkill({ sourceRoot: args.source, hook });
    if (result !== undefined) process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  if (action === "claude-view") {
    if (args.source === undefined || args.output === undefined || args["state-root"] === undefined) {
      throw new Error("claude-view requires --source, --output, and --state-root");
    }
    const result = materializeClaudeSessionView({
      sourceRoot: args.source,
      outputRoot: args.output,
      previousSourceRoot: args["previous-source"],
      stateRoot: args["state-root"],
    });
    if (args.format === "json") process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  if (action === "record-session") {
    if (args["state-root"] === undefined || sessionId === undefined) {
      throw new Error("record-session requires --state-root and a session ID");
    }
    if (model === undefined && hook.hook_event_name === "SessionStart") return;
    if (model === undefined) throw new Error("record-session requires a model");
    recordClaudeSession({ stateRoot: args["state-root"], sessionId, model });
    return;
  }
  if (action === "render-skill") {
    if (args.source === undefined || args["state-root"] === undefined || sessionId === undefined || args.skill === undefined) {
      throw new Error("render-skill requires --source, --state-root, --session, and --skill");
    }
    process.stdout.write(renderClaudeSkill({
      sourceRoot: args.source,
      stateRoot: args["state-root"],
      sessionId,
      skillName: args.skill,
    }));
    return;
  }
  if (args.source === undefined || args.output === undefined || model === undefined) {
    throw new Error("materialize requires --source, --output, and a model");
  }
  const result = materializeSkillVariants({
    sourceRoot: args.source,
    outputRoot: args.output,
    model,
    previousSourceRoot: args["previous-source"],
    sessionId,
  });
  if (args.format === "json") process.stdout.write(`${JSON.stringify(result)}\n`);
  else if (result.notice !== undefined) process.stdout.write(`${result.notice}\n`);
}

const invokedPath = process.argv[1] === undefined ? undefined : path.resolve(process.argv[1]);
const invokedSource = invokedPath !== undefined && fs.existsSync(invokedPath) ? fs.realpathSync(invokedPath) : invokedPath;
if (invokedSource === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
