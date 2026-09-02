#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Schema from "effect/Schema";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const Family = Schema.Struct({
  id: Schema.NonEmptyString,
  match: Schema.NonEmptyString,
});
const Profile = Schema.Struct({
  id: Schema.NonEmptyString,
  family: Schema.NonEmptyString,
  match: Schema.NonEmptyString,
  fallbackRank: Schema.Number,
  guideUrl: Schema.NonEmptyString,
  reviewedOn: Schema.NonEmptyString,
  reference: Schema.NonEmptyString,
});
const Registry = Schema.Struct({
  schemaVersion: Schema.Literal(1),
  families: Schema.Array(Family),
  profiles: Schema.Array(Profile),
});
const Coverage = Schema.Struct({
  schemaVersion: Schema.Literal(1),
  skill: Schema.NonEmptyString,
  profiles: Schema.Record(Schema.String, Schema.NullOr(Schema.NonEmptyString)),
});
const RegistryJson = Schema.fromJsonString(Registry);
const CoverageJson = Schema.fromJsonString(Coverage);

function resolveOwnedFile(root, reference, label) {
  if (path.isAbsolute(reference)) {
    throw new Error(`${label} must be relative to its owning skill`);
  }

  const absoluteRoot = path.resolve(root);
  const resolved = path.resolve(absoluteRoot, reference);
  const relative = path.relative(absoluteRoot, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside its owning skill`);
  }

  const realRoot = fs.realpathSync(absoluteRoot);
  const realResolved = fs.realpathSync(resolved);
  const realRelative = path.relative(realRoot, realResolved);
  if (realRelative === ".." || realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative)) {
    throw new Error(`${label} must stay inside its owning skill`);
  }
  if (!fs.statSync(realResolved).isFile()) {
    throw new Error(`${label} must name a file`);
  }
  return resolved;
}

function compileMatch(value, label) {
  try {
    return new RegExp(value, "u");
  } catch (error) {
    throw new Error(`${label} must be a valid regular expression`, { cause: error });
  }
}

function validateRegistry(value) {
  const decoded = Schema.decodeUnknownSync(Registry)(value);

  const familyIds = new Set();
  const families = decoded.families.map((family, index) => {
    const { id } = family;
    if (familyIds.has(id)) throw new Error(`duplicate family id: ${id}`);
    familyIds.add(id);
    return { id, match: compileMatch(family.match, `families[${index}].match`) };
  });

  const profileIds = new Set();
  const profiles = decoded.profiles.map((profile, index) => {
    const { id } = profile;
    if (profileIds.has(id)) throw new Error(`duplicate profile id: ${id}`);
    profileIds.add(id);
    const { family } = profile;
    if (!familyIds.has(family)) throw new Error(`unknown family for ${id}: ${family}`);
    return {
      id,
      family,
      match: compileMatch(profile.match, `profiles[${index}].match`),
      fallbackRank: profile.fallbackRank,
      guideUrl: profile.guideUrl,
      reviewedOn: profile.reviewedOn,
      reference: profile.reference,
    };
  });

  return { families, profiles };
}

function validateCoverage(value) {
  const decoded = Schema.decodeUnknownSync(Coverage)(value);
  return { skill: decoded.skill, profiles: new Map(Object.entries(decoded.profiles)) };
}

export function resolveModelWritingGuide({ model, registry, coverage, guideRoot = skillRoot, callingSkillRoot }) {
  const checkedRegistry = validateRegistry(registry);
  const checkedCoverage = validateCoverage(coverage);
  const registryProfileIds = new Set(checkedRegistry.profiles.map((profile) => profile.id));
  const guideReferences = new Map(checkedRegistry.profiles.map((profile) => [
    profile.id,
    resolveOwnedFile(guideRoot, profile.reference, `registry reference for ${profile.id}`),
  ]));
  const adapterReferences = new Map();
  for (const profileId of checkedCoverage.profiles.keys()) {
    if (!registryProfileIds.has(profileId)) {
      throw new Error(`coverage references unknown profile: ${profileId}`);
    }
    const adapter = checkedCoverage.profiles.get(profileId);
    adapterReferences.set(
      profileId,
      adapter === null
        ? null
        : resolveOwnedFile(callingSkillRoot, adapter, `coverage adapter for ${profileId}`),
    );
  }
  const normalizedModel = typeof model === "string" ? model.trim().toLowerCase() : "";
  const currentProfile = checkedRegistry.profiles.find((profile) => profile.match.test(normalizedModel)) ?? null;
  const currentFamily = currentProfile?.family
    ?? checkedRegistry.families.find((family) => family.match.test(normalizedModel))?.id
    ?? null;
  const coveredProfileIds = new Set(checkedCoverage.profiles.keys());
  const exactCovered = currentProfile !== null && coveredProfileIds.has(currentProfile.id);
  const selectedProfile = exactCovered
    ? currentProfile
    : checkedRegistry.profiles
      .filter((profile) => profile.family === currentFamily && coveredProfileIds.has(profile.id))
      .sort((left, right) => right.fallbackRank - left.fallbackRank)[0] ?? null;
  const status = exactCovered ? "covered" : selectedProfile === null ? "shared" : "fallback";
  const reason = exactCovered
    ? null
    : normalizedModel.length === 0
      ? "model-unavailable"
      : currentProfile !== null
        ? "skill-profile-missing"
        : currentFamily !== null
          ? "unregistered-model-version"
          : "unknown-model-family";
  const noticeRequired = !exactCovered && reason !== "model-unavailable";
  const modelLabel = normalizedModel || "an unidentified model";
  const fallbackLabel = selectedProfile === null ? "shared writing guidance" : `${selectedProfile.id} guidance`;
  const notice = noticeRequired
    ? `Model-writing coverage: ${checkedCoverage.skill} has not been reviewed for ${modelLabel}; using ${fallbackLabel} for this task. Please update its model guide coverage.`
    : null;
  const adapter = selectedProfile === null ? null : adapterReferences.get(selectedProfile.id);

  return {
    skill: checkedCoverage.skill,
    currentModel: normalizedModel || null,
    currentProfile: currentProfile?.id ?? null,
    status,
    selectedProfile: selectedProfile?.id ?? null,
    guideReference: selectedProfile === null ? null : guideReferences.get(selectedProfile.id),
    skillAdapterReference: selectedProfile === null ? null : adapter,
    guideUrl: selectedProfile?.guideUrl ?? null,
    guideReviewedOn: selectedProfile?.reviewedOn ?? null,
    noticeRequired,
    reason,
    notice,
  };
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

export function pathsReferToSameFile(left, right) {
  try {
    return fs.realpathSync(left) === fs.realpathSync(right);
  } catch {
    return path.resolve(left) === path.resolve(right);
  }
}

function readJson(file, schema) {
  return Schema.decodeUnknownSync(schema)(fs.readFileSync(file, "utf8"));
}

const invokedPath = process.argv[1] === undefined ? null : path.resolve(process.argv[1]);
if (invokedPath !== null && pathsReferToSameFile(invokedPath, fileURLToPath(import.meta.url))) {
  try {
    const coveragePath = argumentValue("--coverage");
    if (coveragePath === null) throw new Error("--coverage is required");
    const absoluteCoverage = path.resolve(coveragePath);
    const result = resolveModelWritingGuide({
      model: argumentValue("--model") ?? "",
      registry: readJson(path.join(skillRoot, "references/registry.json"), RegistryJson),
      coverage: readJson(absoluteCoverage, CoverageJson),
      guideRoot: skillRoot,
      callingSkillRoot: path.dirname(absoluteCoverage),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
