#!/usr/bin/env node

import * as Schema from "effect/Schema";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const MARKER = ".skill-variant-view.json";
const MarkerJson = Schema.fromJsonString(Schema.Struct({
  schemaVersion: Schema.Literal(1),
  sourceRoot: Schema.NonEmptyString,
  profile: Schema.NonEmptyString,
}));
const HookInputJson = Schema.fromJsonString(Schema.Struct({
  model: Schema.optional(Schema.NonEmptyString),
  to_model: Schema.optional(Schema.NonEmptyString),
  session_id: Schema.optional(Schema.NonEmptyString),
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
    matches: /^(?:(?:anthropic\/)?claude-fable-5(?:[.-]1|\[1m\])(?:-\d{8})?|fable(?:\[1m\])?)$/i,
  },
  {
    id: "claude-opus-5",
    family: "anthropic-opus",
    rank: 50,
    matches: /^(?:(?:anthropic\/)?claude-opus-5(?:\[1m\])?(?:-\d{8})?|opus(?:\[1m\])?)$/i,
  },
];

function modelFamily(model) {
  const normalized = model.toLowerCase();
  if (normalized.includes("opus")) return "anthropic-opus";
  if (normalized.includes("fable")) return "anthropic-fable";
  if (/^(?:openai\/)?gpt-\d/.test(normalized)) return "openai-gpt";
  return undefined;
}

export function resolveProfile(model) {
  const exact = profiles.find((profile) => profile.matches.test(model));
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

function parseSkillName(skillFile) {
  const source = fs.readFileSync(skillFile, "utf8");
  const match = source.match(/^---\n[\s\S]*?^name:\s*['"]?([^'"\n]+)['"]?\s*$[\s\S]*?^---$/m);
  if (match === null) throw new Error(`missing skill name in ${skillFile}`);
  return match[1].trim();
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

function assertManagedOutput(outputRoot, sourceRoot) {
  if (!fs.existsSync(outputRoot)) return;
  const markerPath = path.join(outputRoot, MARKER);
  if (!fs.existsSync(markerPath)) {
    throw new Error(`refusing to replace unmanaged directory ${outputRoot}`);
  }
  const marker = Schema.decodeUnknownSync(MarkerJson)(fs.readFileSync(markerPath, "utf8"));
  if (marker.sourceRoot !== sourceRoot) {
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
  if (fs.existsSync(marker)) return undefined;
  fs.writeFileSync(marker, "notified\n");
  return notice;
}

export function materializeSkillVariants({ sourceRoot, outputRoot, model, sessionId }) {
  const resolvedSource = fs.realpathSync(sourceRoot);
  const resolvedOutput = path.resolve(outputRoot);
  assertManagedOutput(resolvedOutput, resolvedSource);
  const { exact, profile } = resolveProfile(model);
  const skills = discoverSkills(resolvedSource);
  const stagingRoot = `${resolvedOutput}.staging-${process.pid}`;
  fs.rmSync(stagingRoot, { recursive: true, force: true });
  fs.mkdirSync(stagingRoot, { recursive: true });

  const fallbackSkills = [];
  for (const skill of skills) {
    const selection = selectVariant(skill, profile);
    if (selection.profile.id !== profile.id) fallbackSkills.push(skill.name);
    const skillOutput = path.join(stagingRoot, skill.name);
    fs.mkdirSync(skillOutput);
    fs.symlinkSync(selection.path, path.join(skillOutput, "SKILL.md"));
    linkSharedEntries(skill, skillOutput);
  }

  fs.writeFileSync(
    path.join(stagingRoot, MARKER),
    `${JSON.stringify({ schemaVersion: 1, sourceRoot: resolvedSource, profile: profile.id })}\n`,
  );
  publishView(stagingRoot, resolvedOutput);

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
  const model = args.model ?? hook.to_model ?? hook.model;
  const sessionId = args.session ?? hook.session_id;
  if (args.source === undefined || args.output === undefined || model === undefined) {
    throw new Error("--source, --output, and a model are required");
  }
  const result = materializeSkillVariants({
    sourceRoot: args.source,
    outputRoot: args.output,
    model,
    sessionId,
  });
  if (args.format === "json") process.stdout.write(`${JSON.stringify(result)}\n`);
  else if (result.notice !== undefined) process.stdout.write(`${result.notice}\n`);
}

const invokedPath = process.argv[1] === undefined ? undefined : path.resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
