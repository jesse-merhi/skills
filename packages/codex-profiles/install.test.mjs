import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { installProfiles } from "./install.mjs";

const repository = fileURLToPath(new URL("../../", import.meta.url));

function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "codex-profiles-"));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  return { temporary, root: path.join(temporary, "codex home") };
}

test("installs selectable model roles and preserves base configuration and global agents", t => {
  const { root } = fixture(t);
  fs.mkdirSync(path.join(root, "agents"), { recursive: true });
  const base = 'model = "gpt-5.6-terra"\napproval_policy = "on-request"\n';
  fs.writeFileSync(path.join(root, "config.toml"), base);
  fs.writeFileSync(path.join(root, "agents", "personal.toml"), "# user-owned\n");
  installProfiles({ root });
  const execution = spawnSync("bun", ["--eval", `
    import assert from "node:assert/strict";
    import path from "node:path";
    const root = process.argv[1];
    const { default: profile } = await import(path.join(root, "orchestration.config.toml"));
    assert.equal(profile.model, "gpt-6-astra");
    assert.equal(profile.model_reasoning_effort, "medium");
    assert.equal(profile.agents.enabled, true);
    assert.equal(profile.agents.max_concurrent_threads_per_session, 4);
    assert.equal(profile.agents.default_subagent_model, "gpt-5.6-sol");
    assert.equal(profile.agents.default_subagent_reasoning_effort, "high");
    const expected = [
      ["implementer", "gpt-5.6-sol", "high"],
      ["investigator", "gpt-5.6-luna", "max"],
      ["findings_reviewer", "gpt-6-astra", "xhigh"],
    ];
    for (const [name, model, effort] of expected) {
      const { default: role } = await import(path.join(root, profile.agents[name].config_file));
      assert.equal(role.model, model);
      assert.equal(role.model_reasoning_effort, effort);
      assert.equal(typeof role.developer_instructions, "string");
      for (const key of ["approval_policy", "sandbox_mode", "model_provider", "mcp_servers"]) {
        assert.equal(Object.hasOwn(role, key), false);
      }
    }
    assert.deepEqual(Object.keys(profile).sort(), ["agents", "model", "model_reasoning_effort"]);
    const { default: reviewer } = await import(path.join(root, "findings-reviewer.config.toml"));
    assert.deepEqual(reviewer.memories, { use_memories: false, generate_memories: false, dedicated_tools: false });
    assert.ok(reviewer.skills.config.some(entry => entry.name === "code-review" && entry.enabled === false));
  `, root], { encoding: "utf8" });
  assert.equal(execution.status, 0, execution.stderr);
  assert.equal(fs.readFileSync(path.join(root, "config.toml"), "utf8"), base);
  assert.deepEqual(fs.readdirSync(path.join(root, "agents")), ["personal.toml"]);
  assert.equal(fs.existsSync(path.join(root, "skills")), false);
  assert.equal(fs.realpathSync(path.join(root, "findings-reviewer.config.toml")), path.join(repository, "codex/findings-reviewer.config.toml"));
  const inode = fs.lstatSync(path.join(root, "orchestration.config.toml")).ino;
  assert.ok(installProfiles({ root }).links.every(link => !link.changed));
  assert.equal(fs.lstatSync(path.join(root, "orchestration.config.toml")).ino, inode);
});

test("CLI dry run reports destinations without creating the configuration root", t => {
  const { root } = fixture(t);
  const result = spawnSync(process.execPath, [path.join(repository, "install-codex-profiles"), "--root", root, "--dry-run"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Would link:/);
  assert.match(result.stdout, /codex --profile orchestration/);
  assert.equal(fs.existsSync(root), false);
});

test("preserves local files, directories and foreign links before installing anything", t => {
  for (const kind of ["file", "directory", "foreign-link", "dangling-link"]) {
    const { temporary, root } = fixture(t);
    fs.mkdirSync(root);
    const destination = path.join(root, "orchestration.config.toml");
    if (kind === "file") fs.writeFileSync(destination, "# personal profile\n");
    else if (kind === "directory") fs.mkdirSync(destination);
    else {
      const foreign = path.join(temporary, "foreign.toml");
      if (kind === "foreign-link") fs.writeFileSync(foreign, "# foreign profile\n");
      fs.symlinkSync(foreign, destination);
    }
    const inode = fs.lstatSync(destination).ino;
    assert.throws(() => installProfiles({ root }), /preserving/);
    assert.equal(fs.lstatSync(destination).ino, inode);
    assert.deepEqual(fs.readdirSync(root), ["orchestration.config.toml"]);
  }
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

test("refuses a symlinked root without writing through it", t => {
  const { temporary, root } = fixture(t);
  const elsewhere = path.join(temporary, "elsewhere");
  fs.mkdirSync(elsewhere);
  fs.symlinkSync(elsewhere, root, "dir");
  assert.throws(() => installProfiles({ root }), /real directory/);
  assert.deepEqual(fs.readdirSync(elsewhere), []);
});

for (const migrating of [false, true]) {
  test(`restores ${migrating ? "previous links" : "a fresh root"} after a caught filesystem failure`, t => {
    const { temporary, root } = fixture(t);
    fs.mkdirSync(root);
    fs.writeFileSync(path.join(root, "config.toml"), "# personal config\n");
    let previousSource;
    if (migrating) {
      previousSource = path.join(temporary, "old clone");
      fs.mkdirSync(previousSource);
      fs.cpSync(path.join(repository, "codex"), path.join(previousSource, "codex"), { recursive: true });
      installProfiles({ root, source: previousSource });
    }
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
}
