import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { collectContext } from "./collect-context.mjs";

test("collects Git/worktree context and bounded Obsidian matches without changing files", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "grill-context-"));
  try {
    const repo = path.join(temporary, "repo");
    const vault = path.join(temporary, "vault");
    fs.mkdirSync(repo); fs.mkdirSync(vault);
    execFileSync("git", ["init", "-q", "-b", "main", repo]);
    fs.writeFileSync(path.join(repo, "README.md"), "# Payments\n");
    fs.writeFileSync(path.join(repo, "service.js"), "export const payments = true;\n");
    execFileSync("git", ["-C", repo, "add", "."]);
    execFileSync("git", ["-C", repo, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "fixture"]);
    fs.writeFileSync(path.join(vault, "a.md"), "payments architecture\n");
    fs.writeFileSync(path.join(vault, "b.md"), "payments decision\n");
    fs.writeFileSync(path.join(vault, "secret.txt"), "payments\n");
    const worktree = path.join(temporary, "worktree");
    execFileSync("git", ["-C", repo, "worktree", "add", "-qb", "feature", worktree]);
    const report = collectContext({ repo: worktree, vault, query: "payments", limit: 1 });
    assert.equal(report.repository.branch, "feature");
    assert.equal(report.repository.gitCommonDirectory, fs.realpathSync(path.join(repo, ".git")));
    assert.deepEqual(report.obsidian.matches, { files: [path.join(fs.realpathSync(vault), "a.md")], truncated: true });
    assert.equal(report.repository.matches.truncated, true);
    assert.equal(execFileSync("git", ["-C", worktree, "status", "--porcelain"], { encoding: "utf8" }), "");
    assert.equal(fs.readFileSync(path.join(vault, "a.md"), "utf8"), "payments architecture\n");
    assert.deepEqual(collectContext({ repo, vault, query: "unmatched" }).obsidian.matches, { files: [], truncated: false });
    assert.throws(() => collectContext({ repo, vault, limit: 0 }), /limit/);
    assert.throws(() => collectContext({ repo, vault, query: " " }), /query/);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
