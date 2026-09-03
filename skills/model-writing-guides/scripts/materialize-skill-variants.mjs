#!/usr/bin/env node

import * as Schema from "effect/Schema";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const MARKER = ".skill-variant-view.json";
const LOCK_TIMEOUT_MS = 5_000;
const STALE_LOCK_MS = 30_000;
const MarkerJson = Schema.fromJsonString(Schema.Struct({
  schemaVersion: Schema.Literal(1),
  sourceRoot: Schema.NonEmptyString,
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
];

function modelFamily(model) {
  const normalized = model.slice(model.lastIndexOf("/") + 1).toLowerCase();
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
      if (Date.now() - lockStat.mtimeMs > STALE_LOCK_MS) {
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

function main() {
  const args = parseArguments(process.argv.slice(2));
  if (args.source === undefined || args.output === undefined || args.model === undefined) {
    throw new Error("materialize requires --source, --output, and a model");
  }
  const result = materializeSkillVariants({
    sourceRoot: args.source,
    outputRoot: args.output,
    model: args.model,
    previousSourceRoot: args["previous-source"],
    sessionId: args.session,
  });
  if (args.format === "json") process.stdout.write(`${JSON.stringify(result)}\n`);
  else if (result.notice !== undefined) process.stdout.write(`${result.notice}\n`);
}

const invokedPath = process.argv[1] === undefined ? undefined : path.resolve(process.argv[1]);
const invokedSource = invokedPath !== undefined && fs.existsSync(invokedPath) ? fs.realpathSync(invokedPath) : invokedPath;
if (invokedSource === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
