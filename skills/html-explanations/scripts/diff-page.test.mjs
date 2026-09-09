import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { diffPage } from "./diff-page.mjs";

test("renders real changed files and escapes source markup without interpreting it", context => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "diff-page-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  git(["init", "-q"]); git(["config", "user.name", "Fixture"]); git(["config", "user.email", "fixture@example.invalid"]);
  fs.writeFileSync(path.join(root, "input.txt"), "before\n");
  git(["add", "."]); git(["commit", "-qm", "before"]);
  const base = git(["rev-parse", "HEAD"]).trim();
  fs.writeFileSync(path.join(root, "input.txt"), "<script>alert(1)</script>\n");
  git(["add", "."]); git(["commit", "-qm", "after"]);
  const html = diffPage({ root, base });
  assert.ok(html.includes("input.txt"));
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(html.includes(base));
});
