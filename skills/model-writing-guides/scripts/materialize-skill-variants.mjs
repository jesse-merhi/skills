#!/usr/bin/env node

import * as Schema from "effect/Schema";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const MARKER = ".skill-variant-view.json";
const LOCK_TIMEOUT_MS = 5_000;
const MarkerJson = Schema.fromJsonString(Schema.Struct({
  schemaVersion: Schema.Literal(1),
  sourceRoot: Schema.NonEmptyString,
  profile: Schema.NonEmptyString,
}));
const LockOwnerJson = Schema.fromJsonString(Schema.Struct({
  pid: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0))),
  startIdentity: Schema.NonEmptyString,
  token: Schema.NonEmptyString,
}));

export const profiles = [
  {
    id: "gpt-5.6",
    family: "openai-gpt",
    version: [5, 6],
    matches: /^(?:openai\/)?gpt-5\.6(?:-(?:sol|terra|luna))?(?:-\d{4}-\d{2}-\d{2})?$/i,
  },
  {
    id: "gpt-6-astra",
    family: "openai-gpt",
    version: [6, 0],
    matches: /^(?:gpt-6-astra(?:-\d{4}-\d{2}-\d{2})?|astra)$/i,
  },
  {
    id: "claude-fable-5.1",
    family: "anthropic-fable",
    version: [5, 1],
    matches: /^(?:(?:anthropic\/)?claude-fable-5(?:(?:[.-]1)(?:\[1m\])?|\[1m\])(?:-\d{8})?|fable(?:\[1m\])?)$/i,
  },
  {
    id: "claude-opus-5",
    family: "anthropic-opus",
    version: [5, 0],
    matches: /^(?:claude-opus-5(?:-\d{8})?|opus)$/i,
  },
];

function modelFamily(model) {
  const normalized = model.slice(model.lastIndexOf("/") + 1).toLowerCase();
  if (/^(?:(?:anthropic\/)?claude-)?fable(?:[-.]\d|\[)/.test(normalized)) return "anthropic-fable";
  if (/^(?:claude-)?opus[-.]\d/.test(normalized)) return "anthropic-opus";
  if (/^(?:openai\/)?gpt-\d/.test(normalized)) return "openai-gpt";
  return undefined;
}

function modelVersion(model, family) {
  const snapshotSuffix = family === "openai-gpt" ? /-\d{4}-\d{2}-\d{2}$/ : /-\d{8}$/;
  const normalized = model.slice(model.lastIndexOf("/") + 1).toLowerCase().replace(snapshotSuffix, "");
  if (family === "openai-gpt") {
    const match = normalized.match(/^gpt-(\d+)(?:[.-](\d+))?/);
    return match === null ? undefined : [Number(match[1]), Number(match[2] ?? 0)];
  }
  if (normalized === "fable[1m]" || normalized === "claude-fable-5[1m]") return [5, 1];
  const match = normalized.match(/^(?:claude-)?(?:fable|opus)-(\d+)(?:[.-](\d+))?/);
  return match === null ? undefined : [Number(match[1]), Number(match[2] ?? 0)];
}

function compareVersions(left, right) {
  return left[0] - right[0] || left[1] - right[1];
}

export function resolveProfile(model) {
  const unqualifiedModel = model.slice(model.lastIndexOf("/") + 1);
  const exact = profiles.find((profile) => profile.matches.test(unqualifiedModel));
  const family = exact?.family ?? modelFamily(model);
  if (family === undefined) {
    throw new Error(`unsupported model family for ${model}`);
  }
  const familyProfiles = profiles
    .filter((profile) => profile.family === family)
    .sort((left, right) => compareVersions(left.version, right.version));
  const earliest = familyProfiles[0];
  if (earliest === undefined) {
    throw new Error(`no skill profile is available for model family ${family}`);
  }
  const requestedVersion = modelVersion(model, family);
  if (exact === undefined && (requestedVersion === undefined || compareVersions(requestedVersion, earliest.version) < 0)) {
    throw new Error(`model ${model} is older than the earliest supported ${family} profile`);
  }
  const fallback = exact ?? familyProfiles.findLast((profile) => compareVersions(profile.version, requestedVersion) <= 0);
  if (fallback === undefined) throw new Error(`no compatible skill profile is available for model ${model}`);
  return { exact: exact !== undefined, profile: exact ?? fallback };
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function processStartIdentity(pid) {
  const result = spawnSync("ps", ["-o", "lstart=", "-p", String(pid)], {
    encoding: "utf8", env: { ...process.env, TZ: "UTC", LC_ALL: "C" },
  });
  if (result.status !== 0 || result.stdout.trim().length === 0) return undefined;
  return result.stdout.trim();
}

export function withOutputLock(outputRoot, operation) {
  const lockRoot = `${outputRoot}.lock`;
  const startIdentity = processStartIdentity(process.pid);
  if (startIdentity === undefined) throw new Error(`unable to identify model view lock process ${process.pid}`);
  const owner = { pid: process.pid, startIdentity, token: crypto.randomUUID() };
  const ownerFile = `owner-${owner.token}.json`;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  fs.mkdirSync(path.dirname(outputRoot), { recursive: true });
  const candidate = fs.mkdtempSync(`${lockRoot}.candidate-`);
  let acquired = false;
  try {
    fs.writeFileSync(path.join(candidate, ownerFile), Schema.encodeSync(LockOwnerJson)(owner), { flag: "wx" });
    while (true) {
      try {
        fs.renameSync(candidate, lockRoot);
        acquired = true;
        break;
      } catch (error) {
        if (!(error instanceof Error) || !Object.hasOwn(error, "code") || !["EEXIST", "ENOTEMPTY"].includes(error.code)) throw error;
        if (reclaimAbandonedLock(lockRoot)) continue;
        if (Date.now() >= deadline) throw new Error(`timed out waiting for model view lock ${lockRoot}`);
        sleep(25);
      }
    }
    return operation();
  } finally {
    if (acquired) removeLockOwner(lockRoot, ownerFile);
    fs.rmSync(candidate, { recursive: true, force: true });
  }
}

export function reclaimAbandonedLock(lockRoot) {
  let owner;
  let ownerFile;
  try {
    const entries = fs.readdirSync(lockRoot);
    if (entries.length === 0) return removeLockOwner(lockRoot);
    ownerFile = entries.find((entry) => entry.startsWith("owner-") && entry.endsWith(".json"));
    if (ownerFile === undefined) return false;
    owner = Schema.decodeUnknownSync(LockOwnerJson)(fs.readFileSync(path.join(lockRoot, ownerFile), "utf8"));
  } catch (error) {
    if (error instanceof Error && Object.hasOwn(error, "code") && error.code === "ENOENT") return false;
    return false;
  }
  if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0) return false;
  try {
    process.kill(owner.pid, 0);
  } catch (error) {
    if (!(error instanceof Error) || !Object.hasOwn(error, "code") || error.code !== "ESRCH") return false;
    return removeLockOwner(lockRoot, ownerFile);
  }
  const currentStartIdentity = processStartIdentity(owner.pid);
  if (currentStartIdentity === undefined || currentStartIdentity === owner.startIdentity) return false;
  return removeLockOwner(lockRoot, ownerFile);
}

function removeLockOwner(lockRoot, ownerFile) {
  if (ownerFile !== undefined) fs.rmSync(path.join(lockRoot, ownerFile), { force: true });
  // A replacement owner has a different file. Non-recursive removal preserves it.
  try {
    fs.rmdirSync(lockRoot);
  } catch (error) {
    if (error instanceof Error && Object.hasOwn(error, "code") && ["ENOENT", "ENOTEMPTY", "EEXIST"].includes(error.code)) return false;
    throw error;
  }
  return true;
}

function parseSkillName(skillFile) {
  const source = fs.readFileSync(skillFile, "utf8");
  const match = source.match(/^---\n[\s\S]*?^name:\s*['"]?([^'"\n]+)['"]?\s*$[\s\S]*?^---$/m);
  if (match === null) throw new Error(`missing skill name in ${skillFile}`);
  const name = match[1].trim();
  if (name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`invalid skill name in ${skillFile}: ${name}`);
  }
  return name;
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

export function selectVariant(skill, requestedProfile) {
  const exact = availableVariant(skill, requestedProfile);
  if (exact !== undefined) return { path: exact, profile: requestedProfile };
  const fallback = profiles
    .filter((profile) => profile.family === requestedProfile.family && compareVersions(profile.version, requestedProfile.version) <= 0)
    .sort((left, right) => compareVersions(right.version, left.version))
    .find((profile) => availableVariant(skill, profile) !== undefined);
  if (fallback === undefined) {
    throw new Error(`${skill.name} has no ${requestedProfile.family} variant`);
  }
  return { path: availableVariant(skill, fallback), profile: fallback };
}

function materializeSharedEntries(skill, outputDirectory) {
  for (const entry of fs.readdirSync(skill.directory, { withFileTypes: true })) {
    if (["SKILL.md", "variants"].includes(entry.name)) continue;
    const source = path.join(skill.directory, entry.name);
    const destination = path.join(outputDirectory, entry.name);
    if (entry.name === "references") {
      fs.cpSync(source, destination, { recursive: true, dereference: true });
    } else {
      fs.symlinkSync(source, destination);
    }
  }
}

export function assertManagedOutput(outputRoot, sourceRoot, previousSourceRoot) {
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
  const safeSessionId = sessionId.replace(/[^a-zA-Z0-9._-]/g, "_");
  const marker = path.join(noticeRoot, safeSessionId);
  try {
    fs.mkdirSync(noticeRoot, { recursive: true });
    fs.writeFileSync(marker, "notified\n", { flag: "wx" });
  } catch (error) {
    if (error instanceof Error && error.code === "EEXIST" && error.path === marker) return undefined;
    // Notice deduplication must not fail an already-published installation.
  }
  return notice;
}

export function planSkillVariants({ sourceRoot, model, requireExact = false }) {
  const resolvedSource = fs.realpathSync(sourceRoot);
  const { exact, profile } = resolveProfile(model);
  const skills = discoverSkills(resolvedSource).map((skill) => ({ ...skill, selection: selectVariant(skill, profile) }));
  const fallbackSkills = skills.filter((skill) => skill.selection.profile.id !== profile.id).map((skill) => skill.name);
  if (requireExact && (!exact || fallbackSkills.length > 0)) {
    throw new Error(`complete exact skill coverage is required for ${model}`);
  }
  return { exact, profile, skills, fallbackSkills, sourceRoot: resolvedSource };
}

export function materializeSkillVariants({ sourceRoot, outputRoot, model, previousSourceRoot, sessionId, requireExact = false }) {
  const { exact, profile, skills, fallbackSkills, sourceRoot: resolvedSource } = planSkillVariants({ sourceRoot, model, requireExact });
  const resolvedOutput = path.resolve(outputRoot);
  withOutputLock(resolvedOutput, () => {
    assertManagedOutput(resolvedOutput, resolvedSource, previousSourceRoot);
    const stagingRoot = `${resolvedOutput}.staging-${process.pid}`;
    fs.rmSync(stagingRoot, { recursive: true, force: true });
    fs.mkdirSync(stagingRoot, { recursive: true });
    try {
      for (const skill of skills) {
        const skillOutput = path.join(stagingRoot, skill.name);
        fs.mkdirSync(skillOutput);
        fs.copyFileSync(skill.selection.path, path.join(skillOutput, "SKILL.md"));
        materializeSharedEntries(skill, skillOutput);
      }
      fs.writeFileSync(
        path.join(stagingRoot, MARKER),
        `${JSON.stringify({ schemaVersion: 1, sourceRoot: resolvedSource, profile: profile.id })}\n`,
      );
      publishView(stagingRoot, resolvedOutput);
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
