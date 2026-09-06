import { NodeRuntime, NodeServices } from "@effect/platform-node";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import { Command, Flag } from "effect/unstable/cli";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { commandSummary, planCommands, withInstalledCommands } from "./install-commands.mjs";
import { assertManagedOutput, assertTargetedView, materializeSkillVariants, planSkillVariants, withOutputLock } from "./materialize-skill-variants.mjs";

const sourceDefault = fileURLToPath(new URL("../../", import.meta.url));

function harnessDirectory(harness) {
  switch (harness) {
    case "codex": return process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
    case "claude": return process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), ".claude");
    default: throw new Error(`unsupported harness: ${harness}`);
  }
}

function inspectLinks(skillsDirectory, viewRoot, skills, sourceRoot, previousSourceRoot, targeted) {
  const directory = fs.lstatSync(skillsDirectory, { throwIfNoEntry: false });
  if (directory !== undefined && (!directory.isDirectory() || directory.isSymbolicLink())) {
    throw new Error(`skills directory must be a real directory: ${skillsDirectory}`);
  }
  const links = [];
  const retired = [];
  const names = new Set(skills.map((skill) => skill.name));
  for (const skill of skills) {
    const destination = path.join(skillsDirectory, skill.name);
    const expected = path.join(viewRoot, skill.name);
    const existing = fs.lstatSync(destination, { throwIfNoEntry: false });
    if (existing === undefined) {
      links.push({ destination, expected });
      continue;
    }
    if (!existing.isSymbolicLink()) throw new Error(`preserving existing local skill: ${destination}`);
    const original = fs.readlinkSync(destination);
    const target = path.resolve(skillsDirectory, original);
    if (target === expected) continue;
    const canonicalTarget = fs.existsSync(target) ? fs.realpathSync(target) : target;
    const previous = previousSourceRoot === undefined ? undefined : path.resolve(previousSourceRoot, path.relative(sourceRoot, skill.directory));
    if (canonicalTarget !== skill.directory && target !== previous) throw new Error(`preserving skill owned elsewhere: ${destination}`);
    links.push({ destination, expected, original });
  }
  if (directory !== undefined && !targeted) {
    for (const entry of fs.readdirSync(skillsDirectory, { withFileTypes: true })) {
      if (!entry.isSymbolicLink() || names.has(entry.name)) continue;
      const destination = path.join(skillsDirectory, entry.name);
      const target = path.resolve(skillsDirectory, fs.readlinkSync(destination));
      if (target === path.join(viewRoot, entry.name)) retired.push(destination);
    }
  }
  return { links, retired };
}

export function installSkills({ harness, model, root, sourceRoot = sourceDefault, previousSourceRoot, requireExact = false, sessionId, dryRun = false, skillNames, binDir = path.join(os.homedir(), ".local", "bin") }) {
  const defaultRoot = harnessDirectory(harness);
  const harnessRoot = path.resolve(root ?? defaultRoot);
  const plan = planSkillVariants({ sourceRoot, model, requireExact, skillNames });
  const compatible = harness === "codex" ? plan.profile.family === "openai-gpt" : plan.profile.family.startsWith("anthropic-");
  if (!compatible) throw new Error(`${model} is not a supported ${harness} model`);
  const skillsDirectory = path.join(harnessRoot, "skills");
  const viewRoot = path.join(harnessRoot, ".skill-variants", "jesse-merhi-skills");
  const preflight = () => {
    assertManagedOutput(viewRoot, plan.sourceRoot, previousSourceRoot);
    assertTargetedView(viewRoot, plan.sourceRoot, plan.profile.id, skillNames);
    return inspectLinks(skillsDirectory, viewRoot, plan.skills, plan.sourceRoot, previousSourceRoot, skillNames !== undefined);
  };
  const preview = preflight();
  const commandOptions = { binDir, sourceRoot: plan.sourceRoot, previousSourceRoot, skills: plan.skills, skillNames };
  const commandPreview = planCommands(commandOptions);
  if (dryRun) return {
    dryRun: true, harness, root: harnessRoot, model, profile: plan.profile.id,
    exact: plan.exact && plan.fallbackSkills.length === 0, skillCount: plan.skills.length,
    linksToChange: preview.links.length, linksToRetire: preview.retired.length,
    ...commandSummary(commandPreview),
  };
  return withOutputLock(path.join(harnessRoot, ".skills-installation"), () => withInstalledCommands(commandOptions, () => {
    const { links, retired } = preflight();
    fs.mkdirSync(skillsDirectory, { recursive: true });
    const changed = [];
    try {
      // Prepare stable links first; a failed view publication restores their old targets.
      for (const link of links) {
        const temporary = `${link.destination}.install-${crypto.randomUUID()}`;
        try {
          fs.symlinkSync(link.expected, temporary, "dir");
          fs.renameSync(temporary, link.destination);
          changed.push(link);
        } finally {
          fs.rmSync(temporary, { force: true });
        }
      }
      for (const destination of retired) {
        const original = fs.readlinkSync(destination);
        fs.unlinkSync(destination);
        changed.push({ destination, original, removed: true });
      }
      const result = materializeSkillVariants({
        sourceRoot: plan.sourceRoot, outputRoot: viewRoot, model, previousSourceRoot, requireExact, skillNames,
        sessionId: sessionId ?? process.env.CODEX_THREAD_ID ?? process.env.CLAUDE_SESSION_ID,
      });
      return { ...result, harness, root: harnessRoot, viewRoot, linksChanged: links.length, linksRetired: retired.length };
    } catch (error) {
      for (const link of changed.reverse()) {
        if (!link.removed) fs.unlinkSync(link.destination);
        if (link.original !== undefined) fs.symlinkSync(link.original, link.destination, "dir");
      }
      throw error;
    }
  }));
}

export function runInstaller() {
  const command = Command.make("install-skills", {
    harness: Flag.choice("harness", ["codex", "claude"]),
    model: Flag.string("model").pipe(Flag.withDescription("gpt-5.6, astra, fable, opus, or a full model ID")),
    root: Flag.string("root").pipe(Flag.optional, Flag.withDescription("Harness configuration root; defaults to CODEX_HOME or CLAUDE_CONFIG_DIR")),
    binDir: Flag.string("bin-dir").pipe(Flag.optional, Flag.withDescription("Shared command directory; defaults to ~/.local/bin, independently of --root")),
    previousSource: Flag.string("previous-source").pipe(Flag.optional),
    session: Flag.string("session").pipe(Flag.optional),
    skills: Flag.string("skill").pipe(Flag.atLeast(0), Flag.withDescription("Update only these skills; repeat for multiple names. Requires the same installed model and source.")),
    requireExact: Flag.boolean("require-exact").pipe(Flag.withDescription("Refuse fallback if the model or any skill lacks an exact variant")),
    dryRun: Flag.boolean("dry-run"),
    json: Flag.boolean("json"),
  }, Effect.fn(function* (options) {
    const result = yield* Effect.try(() => installSkills({
      harness: options.harness, model: options.model,
      root: Option.getOrUndefined(options.root), previousSourceRoot: Option.getOrUndefined(options.previousSource),
      binDir: Option.getOrUndefined(options.binDir),
      sessionId: Option.getOrUndefined(options.session), requireExact: options.requireExact, dryRun: options.dryRun,
      skillNames: options.skills.length === 0 ? undefined : options.skills,
    }));
    if (options.json) return yield* Console.log(JSON.stringify(result));
    yield* Console.log(`${options.dryRun ? "Would install" : "Installed"} ${result.skillCount} skills for ${result.harness}: ${result.profile}\nRoot: ${result.root}`);
    yield* Console.log(`Commands: ${result.commands.length} in ${result.binDir} (${result.commandsChanged} changed, ${result.commandsRetired} retired)`);
    if (!(process.env.PATH ?? "").split(path.delimiter).some(directory => path.resolve(directory) === result.binDir)) yield* Console.log(`Command directory is not on PATH: ${result.binDir}. No shell configuration was changed.`);
    if (result.commandCleanupWarning !== undefined) yield* Console.log(result.commandCleanupWarning);
    if (result.notice !== undefined) yield* Console.log(result.notice);
    if (!options.dryRun) yield* Console.log("This changes skills for sessions using this root, not the harness model. Already-loaded prompts remain in conversation history; start a fresh session for a clean switch.");
  })).pipe(Command.withDescription("Install or switch this repository's complete model-specific skills. Other skills and harness settings are preserved."));
  command.pipe(Command.run({ version: "1.0.0" }), Effect.provide(NodeServices.layer), NodeRuntime.runMain);
}
