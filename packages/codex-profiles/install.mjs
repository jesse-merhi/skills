import { NodeRuntime, NodeServices } from "@effect/platform-node";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import { Command, Flag } from "effect/unstable/cli";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { withOutputLock } from "../../skills/writing-for-agents/scripts/materialize-skill-variants.mjs";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const entries = ["orchestration", "findings-reviewer.config.toml", "orchestration.config.toml"];

function planLinks(root, source, previousSource) {
  const directory = fs.lstatSync(root, { throwIfNoEntry: false });
  if (directory !== undefined && !directory.isDirectory()) {
    throw new Error(`Codex root must be a real directory: ${root}`);
  }
  return entries.map(name => {
    const target = path.join(source, "codex", name);
    const destination = path.join(root, name);
    const sourceEntry = fs.statSync(target, { throwIfNoEntry: false });
    if (name === "orchestration" ? !sourceEntry?.isDirectory() : !sourceEntry?.isFile()) {
      throw new Error(`missing profile source: ${target}`);
    }
    const existing = fs.lstatSync(destination, { throwIfNoEntry: false });
    if (existing === undefined) return { destination, target };
    if (!existing.isSymbolicLink()) throw new Error(`preserving existing local configuration: ${destination}`);
    const original = fs.readlinkSync(destination);
    const resolved = path.resolve(root, original);
    if (resolved === target) return { destination, target, original, unchanged: true };
    if (previousSource === undefined || resolved !== path.join(previousSource, "codex", name)) {
      throw new Error(`preserving configuration owned elsewhere: ${destination}; use --previous-source only for a verified earlier clone`);
    }
    return { destination, target, original };
  });
}

export function installProfiles({ root = process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex"), source = repository, previousSource, dryRun = false } = {}) {
  root = path.resolve(root);
  source = fs.realpathSync(source);
  previousSource = previousSource === undefined ? undefined : path.resolve(previousSource);
  const preview = planLinks(root, source, previousSource);
  const summary = links => ({ root, dryRun, links: links.map(({ destination, target, unchanged }) => ({ destination, target, changed: !unchanged })) });
  if (dryRun) return summary(preview);
  return withOutputLock(path.join(root, ".orchestration-installation"), () => {
    const links = planLinks(root, source, previousSource);
    const changed = [];
    try {
      for (const link of links) {
        if (link.unchanged) continue;
        if (link.original !== undefined) fs.unlinkSync(link.destination);
        changed.push(link);
        fs.symlinkSync(link.target, link.destination, link.destination.endsWith(".toml") ? "file" : "dir");
      }
    } catch (error) {
      for (const link of changed.reverse()) {
        const entry = fs.lstatSync(link.destination, { throwIfNoEntry: false });
        if (entry?.isSymbolicLink() && fs.readlinkSync(link.destination) === link.target) fs.unlinkSync(link.destination);
        if (link.original !== undefined && fs.lstatSync(link.destination, { throwIfNoEntry: false }) === undefined) {
          fs.symlinkSync(link.original, link.destination, link.destination.endsWith(".toml") ? "file" : "dir");
        }
      }
      throw error;
    }
    return summary(links);
  });
}

export function runInstaller() {
  const command = Command.make("install-codex-profiles", {
    root: Flag.string("root").pipe(Flag.optional, Flag.withDescription("Codex configuration directory; defaults to CODEX_HOME or ~/.codex")),
    previousSource: Flag.string("previous-source").pipe(Flag.optional, Flag.withDescription("Verified previous repository root whose profile links may be replaced")),
    dryRun: Flag.boolean("dry-run"),
  }, Effect.fn("installCodexProfiles")(function* (options) {
    const result = yield* Effect.try(() => installProfiles({
      root: Option.getOrUndefined(options.root),
      previousSource: Option.getOrUndefined(options.previousSource),
      dryRun: options.dryRun,
    }));
    for (const link of result.links) {
      yield* Console.log(`${link.changed ? result.dryRun ? "Would link" : "Linked" : "Unchanged"}: ${link.destination} -> ${link.target}`);
    }
    yield* Console.log("Select explicitly: codex --profile orchestration");
    yield* Console.log("Base config, skills, permissions and active sessions were not changed.");
  })).pipe(Command.withDescription("Install opt-in Codex orchestration and findings-reviewer profiles without editing config.toml."));
  command.pipe(Command.run({ version: "1.0.0" }), Effect.provide(NodeServices.layer), NodeRuntime.runMain);
}
