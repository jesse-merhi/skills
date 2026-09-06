#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 10_000, maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0 && !(command === "rg" && result.status === 1)) {
    throw new Error(`${command} failed: ${result.stderr.trim() || result.status}`);
  }
  return result.stdout.trim();
}

function matches(root, query, limit, markdownOnly) {
  const output = run("rg", ["--files-with-matches", "--fixed-strings", "--ignore-case", ...(markdownOnly ? ["--glob", "*.md"] : []), "--", query, "."], root);
  const files = output ? output.split("\n").sort() : [];
  return { files: files.slice(0, limit).map(file => path.resolve(root, file)), truncated: files.length > limit };
}

export function collectContext({ repo = process.cwd(), query, vault, limit = 10 } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("limit must be an integer from 1 to 100");
  const root = realpathSync(run("git", ["rev-parse", "--show-toplevel"], path.resolve(repo)));
  const term = query ?? path.basename(root);
  if (!term.trim()) throw new Error("query must not be empty");
  const warnings = [];
  let vaultRoot;
  if (vault) {
    vaultRoot = realpathSync(vault);
    if (!statSync(vaultRoot).isDirectory()) throw new Error("vault must be a directory");
  } else {
    try {
      const configured = run("obsidian-cli", ["print-default", "--path-only"], root);
      if (configured && statSync(configured).isDirectory()) vaultRoot = realpathSync(configured);
    } catch {
      warnings.push("No default Obsidian vault is available; pass --vault PATH or use an available Obsidian connector.");
    }
    if (!vaultRoot && warnings.length === 0) warnings.push("No default Obsidian vault is configured; pass --vault PATH.");
  }
  return {
    repository: {
      root,
      head: run("git", ["rev-parse", "HEAD"], root),
      branch: run("git", ["branch", "--show-current"], root),
      gitCommonDirectory: path.resolve(root, run("git", ["rev-parse", "--git-common-dir"], root)),
      documents: ["AGENTS.md", "CLAUDE.md", "README.md"].map(file => path.join(root, file)).filter(existsSync),
      matches: matches(root, term, limit, false)
    },
    query: term,
    obsidian: vaultRoot ? { root: vaultRoot, matches: matches(vaultRoot, term, limit, true) } : null,
    warnings
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { repo: { type: "string" }, query: { type: "string" }, vault: { type: "string" }, limit: { type: "string", default: "10" }, help: { type: "boolean" } } });
    if (values.help) console.log("collect-context.mjs [--repo PATH] [--query TEXT] [--vault PATH] [--limit 10]\nRead-only Git context and matching repository/Obsidian paths. Uses the configured Obsidian vault when available; never opens or writes notes.");
    else console.log(JSON.stringify(collectContext({ ...values, limit: Number(values.limit) }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
