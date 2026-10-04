import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { installProfiles } from "./install.mjs";

const repository = fileURLToPath(new URL("../../", import.meta.url));

function fixture(t) {
  const temporary = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "codex-profiles-")));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  return { temporary, root: path.join(temporary, "codex home") };
}

test("stops a late local-file collision before installing any links", t => {
  const { root } = fixture(t);
  fs.mkdirSync(root);
  const destination = path.join(root, "orchestration.config.toml");
  fs.writeFileSync(destination, "# personal profile\n");
  const inode = fs.lstatSync(destination).ino;
  assert.throws(() => installProfiles({ root }), /preserving/);
  assert.equal(fs.lstatSync(destination).ino, inode);
  assert.deepEqual(fs.readdirSync(root), ["orchestration.config.toml"]);
});

test("transfers only links into an explicitly selected previous clone", t => {
  const { temporary, root } = fixture(t);
  const previousSource = path.join(temporary, "previous clone");
  fs.mkdirSync(previousSource);
  fs.cpSync(path.join(repository, "codex"), path.join(previousSource, "codex"), { recursive: true });
  installProfiles({ root, source: previousSource });
  assert.throws(() => installProfiles({ root }), /owned elsewhere/);
  assert.throws(() => installProfiles({ root, previousSource: temporary }), /owned elsewhere/);
  fs.rmSync(previousSource, { recursive: true });
  const result = installProfiles({ root, previousSource });
  assert.ok(result.links.every(link => link.changed));
  for (const link of result.links) assert.equal(fs.readlinkSync(link.destination), link.target);
});

test("restores previous links after a caught filesystem failure", t => {
  const { temporary, root } = fixture(t);
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, "config.toml"), "# personal config\n");
  const previousSource = path.join(temporary, "old clone");
  fs.mkdirSync(previousSource);
  fs.cpSync(path.join(repository, "codex"), path.join(previousSource, "codex"), { recursive: true });
  installProfiles({ root, source: previousSource });
  const snapshot = () => fs.readdirSync(root).map(name => {
    const filename = path.join(root, name);
    return [name, fs.lstatSync(filename).isSymbolicLink() ? fs.readlinkSync(filename) : fs.readFileSync(filename, "utf8")];
  });
  const before = snapshot();
  const symlink = fs.symlinkSync;
  let calls = 0;
  const failure = t.mock.method(fs, "symlinkSync", (...args) => {
    if (++calls === 2) throw Object.assign(new Error("filesystem I/O failure"), { code: "EIO" });
    return symlink(...args);
  });
  try {
    assert.throws(() => installProfiles({ root, previousSource }), /filesystem I\/O failure/);
    assert.deepEqual(snapshot(), before);
  } finally {
    failure.mock.restore();
  }
  assert.ok(installProfiles({ root, previousSource }).links.every(link => link.changed));
  assert.equal(fs.readFileSync(path.join(root, "config.toml"), "utf8"), "# personal config\n");
});
