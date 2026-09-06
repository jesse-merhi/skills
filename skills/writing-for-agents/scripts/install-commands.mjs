import * as Schema from "effect/Schema";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { withOutputLock } from "./materialize-skill-variants.mjs";

export const commandCatalog = [
  ["ask-claude", "ask-claude", "ask-claude", ["bash"]],
  ["ask-codex", "ask-codex", "ask-codex", ["bash"]],
  ["rovodev-atlassian", "atlassian-queries", "rovodev-atlassian"],
  ["skill-cleanup-inventory", "cleanup", "inventory.mjs"],
  ["codex-review", "code-review", "codex-review"],
  ["review-findings", "code-review", "review-findings", ["node", "--disable-warning=ExperimentalWarning"]],
  ["skill-render-diagram", "design-technical-diagrams", "render-diagram.mjs"],
  ["skill-check-rendered-diagram", "design-technical-diagrams", "check-rendered-diagram.mjs"],
  ["skill-audit-layout", "frontend-ui-validation", "audit-layout.mjs"],
  ["skill-collect-context", "grill-with-docs", "collect-context.mjs"],
  ["codex-handoff-tmux", "handoff", "codex-handoff-tmux"],
  ["detect-handoff-surface", "handoff", "detect-handoff-surface", ["bash"]],
  ["skill-diff-page", "html-explanations", "diff-page.mjs"],
  ["clawhub-local-test", "clawhub-local-test", "clawhub-local-test", ["node", "--disable-warning=ExperimentalWarning"]],
  ["openclaw-stg-test", "openclaw-stg-test", "openclaw-stg-test", ["python3"]],
  ["github-verify-rendered-proof", "pr-proof-pack", "github-verify-rendered-proof", ["sh"]],
  ["pr-net-diff", "pr-proof-pack", "pr-net-diff"],
  ["proof-media", "pr-proof-pack", "proof-media"],
  ["proof-publication", "pr-proof-pack", "proof-publication.mjs"],
  ["skill-cleaner", "skill-cleaner", "skill-cleaner"],
  ["estimate-gh-wait", "wait-efficiently", "estimate-gh-wait"],
  ["quiet-wait", "wait-efficiently", "quiet-wait"],
].map(([name, skill, filename, runtime = ["node"]]) => ({ name, skill, entrypoint: `scripts/${filename}`, runtime }))
  .sort((left, right) => left.name.localeCompare(right.name, "en"));

const MARKER = "manifest.json";
const CommandName = Schema.String.pipe(Schema.check(Schema.isPattern(/^[a-z][a-z0-9-]*$/)));
const ManifestJson = Schema.fromJsonString(Schema.Struct({
  schemaVersion: Schema.Literal(1),
  sourceRoot: Schema.NonEmptyString,
  commands: Schema.Array(Schema.Struct({
    name: CommandName,
    skill: CommandName,
    target: Schema.NonEmptyString,
    runtime: Schema.Array(Schema.NonEmptyString),
  })),
}));

function launcher(command) {
  const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
  return `#!/bin/sh\nexec ${[...command.runtime, command.target].map(quote).join(" ")} "$@"\n`;
}

function assertDirectory(directory) {
  const existing = fs.lstatSync(directory, { throwIfNoEntry: false });
  if (existing !== undefined && (!existing.isDirectory() || existing.isSymbolicLink())) {
    throw new Error(`command directory must be a real directory: ${directory}`);
  }
  return existing;
}

function readManifest(outputRoot) {
  if (assertDirectory(outputRoot) === undefined) return undefined;
  const marker = path.join(outputRoot, MARKER);
  if (!fs.lstatSync(marker, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`preserving unmanaged command directory: ${outputRoot}`);
  }
  const manifest = Schema.decodeUnknownSync(ManifestJson)(fs.readFileSync(marker, "utf8"));
  const names = new Set(manifest.commands.map(command => command.name));
  if (names.size !== manifest.commands.length || fs.readdirSync(outputRoot).some(name => name !== MARKER && !names.has(name))) {
    throw new Error(`preserving unexpected command files: ${outputRoot}`);
  }
  for (const command of manifest.commands) {
    const filename = path.join(outputRoot, command.name);
    if (!fs.lstatSync(filename, { throwIfNoEntry: false })?.isFile() || fs.readFileSync(filename, "utf8") !== launcher(command)) {
      throw new Error(`preserving modified command launcher: ${filename}`);
    }
  }
  return manifest;
}

export function planCommands({ binDir, sourceRoot, skills, skillNames, previousSourceRoot }) {
  const directory = path.resolve(binDir);
  assertDirectory(directory);
  const outputRoot = path.join(directory, ".jesse-merhi-skills-commands");
  const previous = readManifest(outputRoot);
  const approvedPrevious = previousSourceRoot === undefined ? undefined
    : fs.existsSync(previousSourceRoot) ? fs.realpathSync(previousSourceRoot) : path.resolve(previousSourceRoot);
  if (previous !== undefined && previous.sourceRoot !== sourceRoot && (skillNames !== undefined || previous.sourceRoot !== approvedPrevious)) {
    throw new Error(`commands owned by another source: ${previous.sourceRoot}; use a full install with --previous-source to transfer ownership`);
  }
  const commands = skillNames === undefined ? [] : (previous?.commands ?? []).filter(command => !skillNames.includes(command.skill));
  for (const entry of commandCatalog) {
    const skill = skills.find(candidate => candidate.name === entry.skill);
    if (skill === undefined) continue;
    const target = path.join(skill.directory, entry.entrypoint);
    if (!fs.statSync(target, { throwIfNoEntry: false })?.isFile() || !fs.realpathSync(target).startsWith(`${fs.realpathSync(skill.directory)}${path.sep}`)) {
      throw new Error(`missing or external command entrypoint: ${target}`);
    }
    commands.push({ name: entry.name, skill: entry.skill, target, runtime: entry.runtime });
  }
  commands.sort((left, right) => left.name.localeCompare(right.name, "en"));
  const names = new Set(commands.map(command => command.name));
  if (names.size !== commands.length) throw new Error("duplicate command aliases in catalog");
  const links = [];
  const retired = [];
  for (const command of commands) {
    const destination = path.join(directory, command.name);
    const expected = path.join(outputRoot, command.name);
    const existing = fs.lstatSync(destination, { throwIfNoEntry: false });
    if (existing === undefined) links.push({ destination, expected });
    else if (!existing.isSymbolicLink() || fs.readlinkSync(destination) !== expected || !previous?.commands.some(prior => prior.name === command.name)) {
      throw new Error(`preserving unmanaged command: ${destination}`);
    }
  }
  for (const command of previous?.commands ?? []) {
    if (names.has(command.name)) continue;
    const destination = path.join(directory, command.name);
    const expected = path.join(outputRoot, command.name);
    if (fs.lstatSync(destination, { throwIfNoEntry: false })?.isSymbolicLink() && fs.readlinkSync(destination) === expected) {
      retired.push({ destination, expected });
    }
  }
  const manifest = { schemaVersion: 1, sourceRoot, commands };
  const commandsChanged = commands.filter(command => links.some(link => path.basename(link.destination) === command.name)
    || !previous?.commands.some(prior => prior.name === command.name && launcher(prior) === launcher(command))).length;
  return { directory, outputRoot, previous, manifest, links, retired, commandsChanged };
}

export function commandSummary(plan) {
  return { binDir: plan.directory, commands: plan.manifest.commands, commandsChanged: plan.commandsChanged, commandsRetired: plan.retired.length };
}

export function withInstalledCommands(options, operation) {
  const preview = planCommands(options);
  if (preview.previous === undefined && preview.manifest.commands.length === 0) return { ...operation(), ...commandSummary(preview) };
  return withOutputLock(preview.outputRoot, () => {
    const plan = planCommands(options);
    const summary = commandSummary(plan);
    if (JSON.stringify(plan.previous) === JSON.stringify(plan.manifest) && plan.links.length === 0 && plan.retired.length === 0) {
      return { ...operation(), ...summary };
    }
    const staging = fs.mkdtempSync(`${plan.outputRoot}.staging-`);
    const backup = `${plan.outputRoot}.previous-${crypto.randomUUID()}`;
    const linked = [];
    const removed = [];
    let backedUp = false;
    let published = false;
    let result;
    try {
      for (const command of plan.manifest.commands) fs.writeFileSync(path.join(staging, command.name), launcher(command), { mode: 0o755, flag: "wx" });
      fs.writeFileSync(path.join(staging, MARKER), Schema.encodeSync(ManifestJson)(plan.manifest), { flag: "wx" });
      for (const link of plan.links) {
        fs.symlinkSync(link.expected, link.destination);
        linked.push(link);
      }
      for (const link of plan.retired) {
        if (!fs.lstatSync(link.destination, { throwIfNoEntry: false })?.isSymbolicLink() || fs.readlinkSync(link.destination) !== link.expected) {
          throw new Error(`command changed during installation: ${link.destination}`);
        }
        fs.unlinkSync(link.destination);
        removed.push(link);
      }
      if (plan.previous !== undefined) {
        fs.renameSync(plan.outputRoot, backup);
        backedUp = true;
      }
      fs.renameSync(staging, plan.outputRoot);
      published = true;
      result = operation();
    } catch (error) {
      if (published) fs.rmSync(plan.outputRoot, { recursive: true, force: true });
      if (backedUp) fs.renameSync(backup, plan.outputRoot);
      for (const link of linked.reverse()) {
        if (fs.lstatSync(link.destination, { throwIfNoEntry: false })?.isSymbolicLink() && fs.readlinkSync(link.destination) === link.expected) fs.unlinkSync(link.destination);
      }
      for (const link of removed) fs.symlinkSync(link.expected, link.destination);
      throw error;
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
    try {
      if (backedUp) fs.rmSync(backup, { recursive: true, force: true });
    } catch {
      summary.commandCleanupWarning = `Installed successfully; old command backup remains at ${backup}`;
    }
    return { ...result, ...summary };
  });
}
