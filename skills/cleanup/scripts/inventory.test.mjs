import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { inventory } from "./inventory.mjs";

test("inventory preserves untracked content and never grants deletion authority", context => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cleanup-inventory-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q", root]);
  fs.writeFileSync(path.join(root, "keep.txt"), "unfinished work");
  const result = inventory(root);
  assert.equal(fs.readFileSync(path.join(root, "keep.txt"), "utf8"), "unfinished work");
  assert.ok(result.observations.every(observation => observation.safeToDelete === false));
  assert.ok(result.observations.some(observation => observation.output.includes("keep.txt")));
});
