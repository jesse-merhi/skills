import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  reclaimAbandonedLock,
  withOutputLock,
} from "./materialize-skill-variants.mjs";

function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "skill-variants-"));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  return { output: path.join(temporary, "view") };
}

function processStartIdentity(pid) {
  const result = spawnSync("ps", ["-o", "lstart=", "-p", String(pid)], {
    encoding: "utf8", env: { ...process.env, TZ: "UTC", LC_ALL: "C" },
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function writeLock(lockRoot, owner) {
  fs.mkdirSync(lockRoot);
  const ownerPath = path.join(lockRoot, `owner-${owner.token}.json`);
  fs.writeFileSync(ownerPath, JSON.stringify(owner));
  return ownerPath;
}

test("preserves a held lock when another process uses a different timezone", (t) => {
  const current = fixture(t);
  const lockRoot = current.output + ".lock";
  const contender = `
    import { reclaimAbandonedLock } from ${JSON.stringify(new URL("./materialize-skill-variants.mjs", import.meta.url).href)};
    process.stdout.write(String(reclaimAbandonedLock(process.argv[1])));
  `;
  withOutputLock(current.output, () => {
    const ownerFiles = fs.readdirSync(lockRoot);
    for (const timezone of ["UTC", "Australia/Sydney"]) {
      const result = spawnSync(process.execPath, ["--input-type=module", "-e", contender, lockRoot], {
        encoding: "utf8",
        env: { ...process.env, TZ: timezone, LC_ALL: "C" },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, "false", timezone);
      assert.deepEqual(fs.readdirSync(lockRoot), ownerFiles);
    }
  });
});

test("a stale reclaimer cannot remove a replacement live owner's lock", (t) => {
  const current = fixture(t);
  const lockRoot = current.output + ".lock";
  const staleOwnerPath = writeLock(lockRoot, { pid: process.pid, startIdentity: "different process start", token: "stale" });
  const liveOwner = { pid: process.pid, startIdentity: processStartIdentity(process.pid), token: "live" };
  const originalReadFileSync = fs.readFileSync;
  t.after(() => { fs.readFileSync = originalReadFileSync; });
  fs.readFileSync = (file, ...options) => {
    const result = originalReadFileSync(file, ...options);
    if (file === staleOwnerPath) {
      fs.readFileSync = originalReadFileSync;
      assert.equal(reclaimAbandonedLock(lockRoot), true);
      writeLock(lockRoot, liveOwner);
    }
    return result;
  };

  assert.equal(reclaimAbandonedLock(lockRoot), false);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(lockRoot, "owner-live.json"), "utf8")), liveOwner);
});
