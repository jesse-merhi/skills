import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { capturePersonalRoots } from "./source.mjs";

test("captures personal roots once and preserves owner paths without scanning hidden caches", context => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "personal-skills-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const name of ["alpha", "beta", ".system"]) {
    fs.mkdirSync(path.join(root, name));
    fs.writeFileSync(path.join(root, name, "SKILL.md"), `---\nname: ${name === ".system" ? "vendor" : name}\ndescription: Fixture\n---\n`);
  }
  fs.symlinkSync(path.join(root, "alpha"), path.join(root, "alias"));
  const result = capturePersonalRoots([root], [{ name: "beta", directory: path.join(root, "beta") }]);
  assert.deepEqual(result.map(source => source.name), ["alpha"]);
  assert.equal(result[0].directory, fs.realpathSync(path.join(root, "alpha")));
  assert.equal(result[0].head, "external-local-snapshot");
});
