import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { installSkills } from "./install-skills.mjs";

function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "install-model-skills-"));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const sourceRoot = path.join(temporary, "source");
  for (const name of ["alpha", "group/beta"]) {
    const skill = path.join(sourceRoot, name);
    fs.mkdirSync(path.join(skill, "variants"), { recursive: true });
    fs.writeFileSync(path.join(skill, "SKILL.md"), `---\nname: ${path.basename(name)}\ndescription: fixture\n---\n`);
    for (const model of ["gpt-6-astra", "gpt-6-sol", "gpt-6-luna", "claude-fable-5.1", "claude-opus-5"]) {
      fs.writeFileSync(path.join(skill, "variants", `${model}.md`), `selected:${model}\n`);
    }
  }
  const root = path.join(temporary, "harness");
  return { temporary, sourceRoot, root, binDir: path.join(temporary, "bin") };
}

function selected(root) {
  return fs.readFileSync(path.join(root, "skills", "alpha", "SKILL.md"), "utf8");
}

function spawnInstaller(installer, installation, barrier, environment) {
  const script = `
    import fs from "node:fs";
    import { installSkills } from ${JSON.stringify(installer)};

    if (${JSON.stringify(barrier)} === "publisher") {
      const originalSymlink = fs.symlinkSync.bind(fs);
      fs.symlinkSync = (target, destination, ...rest) => {
        const result = originalSymlink(target, destination, ...rest);
        if (destination === process.env.INSTALL_TEST_ALIAS) {
          fs.writeFileSync(process.env.INSTALL_TEST_PUBLISHED, "published", { flag: "wx" });
          const deadline = Date.now() + 5_000;
          while (!fs.existsSync(process.env.INSTALL_TEST_RELEASE)) {
            if (Date.now() >= deadline) throw new Error("timed out waiting to release partial command publication");
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
          }
        }
        return result;
      };
    } else {
      const originalMkdtemp = fs.mkdtempSync.bind(fs);
      fs.mkdtempSync = (prefix, ...rest) => {
        const result = originalMkdtemp(prefix, ...rest);
        if (prefix === process.env.INSTALL_TEST_CANDIDATE_PREFIX) {
          fs.writeFileSync(process.env.INSTALL_TEST_WAITING, "waiting", { flag: "wx" });
        }
        return result;
      };
    }

    console.log(JSON.stringify(installSkills(${JSON.stringify(installation)})));
  `;
  const child = spawn(process.execPath, ["--input-type=module", "-e", script], {
    timeout: 15_000,
    env: { ...process.env, ...environment },
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  const completed = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", code => resolve({ code, stdout, stderr }));
  });
  return { completed };
}

async function waitForPath(file, run, description) {
  let completed;
  run.completed.then(result => { completed = result; });
  const deadline = Date.now() + 5_000;
  while (!fs.existsSync(file)) {
    if (completed !== undefined) throw new Error(`${description} exited before reaching its barrier:\n${completed.stderr}`);
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${description}`);
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

function commandFixture(context) {
  const current = fixture(context);
  const sourceRoot = path.join(current.temporary, "source with ' quotes");
  fs.renameSync(current.sourceRoot, sourceRoot);
  for (const [skill, commands] of [["code-review", ["codex-review", "review-findings"]], ["wait-efficiently", ["quiet-wait", "estimate-gh-wait"]]]) {
    const directory = path.join(sourceRoot, skill);
    fs.cpSync(path.join(sourceRoot, "alpha"), directory, { recursive: true });
    fs.writeFileSync(path.join(directory, "SKILL.md"), `---\nname: ${skill}\ndescription: fixture\n---\n`);
    fs.mkdirSync(path.join(directory, "scripts"));
    for (const command of commands) {
      fs.writeFileSync(path.join(directory, "scripts", command), `console.log(JSON.stringify({ command: ${JSON.stringify(command)}, args: process.argv.slice(2), cwd: process.cwd(), value: process.env.INSTALL_TEST_VALUE })); process.exitCode = 7;\n`);
    }
    fs.writeFileSync(path.join(directory, "scripts", "internal.test.mjs"), "throw new Error('not a command');\n");
  }
  return { ...current, sourceRoot };
}

test("publishes explicit commands on PATH with arguments, cwd, environment and exit status intact", (context) => {
  const current = commandFixture(context);
  const result = installSkills({ ...current, harness: "codex", model: "astra" });
  assert.equal(result.commands.length, 4);
  assert.deepEqual(fs.readdirSync(current.binDir).filter(name => !name.startsWith(".")), ["codex-review", "estimate-gh-wait", "quiet-wait", "review-findings"]);
  const execution = spawnSync("codex-review", ["two words", "'quoted'", "$HOME", ""], {
    cwd: current.temporary, encoding: "utf8",
    env: { ...process.env, PATH: `${current.binDir}${path.delimiter}${process.env.PATH}`, INSTALL_TEST_VALUE: "retained" },
  });
  assert.equal(execution.status, 7, execution.stderr);
  assert.deepEqual(JSON.parse(execution.stdout), { command: "codex-review", args: ["two words", "'quoted'", "$HOME", ""], cwd: fs.realpathSync(current.temporary), value: "retained" });
  const alias = path.join(current.binDir, "codex-review");
  const before = fs.lstatSync(alias).ino;
  assert.equal(installSkills({ ...current, harness: "codex", model: "astra" }).commandsChanged, 0);
  assert.equal(fs.lstatSync(alias).ino, before);
});

test("command dry runs list the catalog without creating commands or prompts", (context) => {
  const current = commandFixture(context);
  const result = installSkills({ ...current, harness: "codex", model: "astra", dryRun: true });
  assert.deepEqual(result.commands.map(command => command.name), ["codex-review", "estimate-gh-wait", "quiet-wait", "review-findings"]);
  assert.equal(result.commandsChanged, 4);
  assert.equal(fs.existsSync(current.binDir), false);
  assert.equal(fs.existsSync(current.root), false);
});

test("preserves unmanaged command files, directories and symlinks before changing prompts", (context) => {
  for (const kind of ["file", "directory", "foreign-link", "dangling-link", "unowned-link"]) {
    const current = commandFixture(context);
    fs.mkdirSync(current.binDir);
    const destination = path.join(current.binDir, "codex-review");
    if (kind === "file") fs.writeFileSync(destination, "user binary");
    else if (kind === "directory") fs.mkdirSync(destination);
    else fs.symlinkSync(kind === "foreign-link" ? process.execPath : kind === "dangling-link" ? "/missing-command" : path.join(current.binDir, ".jesse-merhi-skills-commands", "codex-review"), destination);
    const original = fs.lstatSync(destination).ino;
    assert.throws(() => installSkills({ ...current, harness: "codex", model: "astra" }), /preserving unmanaged command/);
    assert.equal(fs.lstatSync(destination).ino, original);
    assert.deepEqual(fs.readdirSync(current.binDir), ["codex-review"]);
    assert.equal(fs.existsSync(current.root), false);
  }
});

test("Codex and Claude share repo-owned commands without retargeting or deleting unselected aliases", (context) => {
  const current = commandFixture(context);
  installSkills({ ...current, harness: "codex", model: "astra" });
  const alias = path.join(current.binDir, "codex-review");
  const original = fs.readlinkSync(alias);
  const claude = { ...current, root: path.join(current.temporary, "claude"), harness: "claude", model: "opus" };
  assert.equal(installSkills(claude).commandsChanged, 0);
  fs.unlinkSync(alias);
  const waitAlias = path.join(current.binDir, "quiet-wait");
  const waitInode = fs.lstatSync(waitAlias).ino;
  const result = installSkills({ ...claude, skillNames: ["code-review"] });
  assert.equal(result.commandsChanged, 1);
  assert.equal(fs.readlinkSync(alias), original);
  assert.equal(fs.lstatSync(waitAlias).ino, waitInode);
  assert.equal(result.commandsRetired, 0);
  assert.equal(fs.readFileSync(path.join(current.root, "skills", "code-review", "SKILL.md"), "utf8"), "selected:gpt-6-astra\n");
  assert.equal(fs.readFileSync(path.join(claude.root, "skills", "code-review", "SKILL.md"), "utf8"), "selected:claude-opus-5\n");
});

test("full installs retire removed commands but preserve foreign replacements and third-party skills", (context) => {
  const current = commandFixture(context);
  installSkills({ ...current, harness: "codex", model: "astra" });
  const foreign = path.join(current.binDir, "codex-review");
  fs.unlinkSync(foreign);
  fs.symlinkSync(process.execPath, foreign);
  fs.mkdirSync(path.join(current.root, "skills", "personal"));
  fs.writeFileSync(path.join(current.root, "skills", "personal", "SKILL.md"), "personal");
  fs.rmSync(path.join(current.sourceRoot, "code-review"), { recursive: true });
  const result = installSkills({ ...current, harness: "codex", model: "astra" });
  assert.equal(result.commandsRetired, 1);
  assert.equal(result.linksRetired, 1);
  assert.equal(fs.readlinkSync(foreign), process.execPath);
  assert.equal(fs.lstatSync(path.join(current.binDir, "review-findings"), { throwIfNoEntry: false }), undefined);
  assert.equal(fs.existsSync(path.join(result.viewRoot, "code-review")), false);
  assert.equal(fs.readFileSync(path.join(current.root, "skills", "personal", "SKILL.md"), "utf8"), "personal");
});

test("another clone cannot claim shared commands without explicit full ownership transfer", (context) => {
  const current = commandFixture(context);
  installSkills({ ...current, harness: "codex", model: "astra" });
  const sourceRoot = path.join(current.temporary, "second-source");
  fs.cpSync(current.sourceRoot, sourceRoot, { recursive: true });
  const second = { ...current, sourceRoot, root: path.join(current.temporary, "claude"), harness: "claude", model: "opus" };
  assert.throws(() => installSkills(second), /commands owned by another source/);
  assert.equal(fs.existsSync(second.root), false);
  const result = installSkills({ ...second, previousSourceRoot: current.sourceRoot });
  assert.equal(result.commandsChanged, 4);
  assert.ok(result.commands.every(command => command.target.startsWith(fs.realpathSync(sourceRoot) + path.sep)));
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "astra" }), /commands owned by another source/);
  assert.equal(selected(current.root), "selected:gpt-6-astra\n");
});

test("missing entrypoints fail preflight rather than installing a broken command", (context) => {
  const current = commandFixture(context);
  fs.unlinkSync(path.join(current.sourceRoot, "code-review", "scripts", "codex-review"));
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "astra" }), /missing or external command entrypoint/);
  assert.equal(fs.existsSync(current.binDir), false);
  assert.equal(fs.existsSync(current.root), false);
});

test("modified owned launchers and malformed manifests are preserved", (context) => {
  for (const kind of ["launcher", "manifest"]) {
    const current = commandFixture(context);
    installSkills({ ...current, harness: "codex", model: "astra" });
    const owner = path.join(current.binDir, ".jesse-merhi-skills-commands");
    const file = path.join(owner, kind === "launcher" ? "codex-review" : "manifest.json");
    const contents = kind === "launcher" ? "user changes\n" : '{"schemaVersion":1,"sourceRoot":"/elsewhere","commands":[{"name":"../escape","skill":"code-review","target":"/bin/sh","runtime":[]}]}';
    fs.writeFileSync(file, contents);
    assert.throws(() => installSkills({ ...current, harness: "codex", model: "sol" }));
    assert.equal(fs.readFileSync(file, "utf8"), contents);
    assert.equal(selected(current.root), "selected:gpt-6-astra\n");
  }
});

test("command publication failure restores commands and leaves prompts unchanged", (context) => {
  const current = commandFixture(context);
  installSkills({ ...current, harness: "codex", model: "astra" });
  const alias = path.join(current.binDir, "codex-review");
  fs.unlinkSync(alias);
  const originalRename = fs.renameSync;
  context.mock.method(fs, "renameSync", (source, destination) => {
    if (source.includes(".jesse-merhi-skills-commands.staging-")) throw new Error("injected command publication failure");
    return originalRename(source, destination);
  });
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "sol" }), /injected command publication failure/);
  assert.equal(selected(current.root), "selected:gpt-6-astra\n");
  assert.equal(fs.lstatSync(alias, { throwIfNoEntry: false }), undefined);
  assert.match(fs.readFileSync(path.join(current.binDir, "review-findings"), "utf8"), /review-findings/);
  assert.equal(fs.readdirSync(current.binDir).some(name => name.includes(".previous-") || name.includes(".staging-")), false);
});

test("view failure rolls back new aliases and restores retired aliases and the command catalog", (context) => {
  const current = commandFixture(context);
  const first = installSkills({ ...current, harness: "codex", model: "astra" });
  const alias = path.join(current.binDir, "codex-review");
  fs.unlinkSync(alias);
  const manifest = path.join(current.binDir, ".jesse-merhi-skills-commands", "manifest.json");
  const before = fs.readFileSync(manifest, "utf8");
  fs.rmSync(path.join(current.sourceRoot, "wait-efficiently"), { recursive: true });
  const originalRename = fs.renameSync;
  context.mock.method(fs, "renameSync", (source, destination) => {
    if (source.startsWith(first.viewRoot + ".staging-") && destination === first.viewRoot) throw new Error("injected view failure");
    return originalRename(source, destination);
  });
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "sol" }), /injected view failure/);
  assert.equal(selected(current.root), "selected:gpt-6-astra\n");
  assert.equal(fs.lstatSync(alias, { throwIfNoEntry: false }), undefined);
  assert.equal(fs.readFileSync(manifest, "utf8"), before);
  assert.equal(fs.readlinkSync(path.join(current.binDir, "quiet-wait")), path.join(current.binDir, ".jesse-merhi-skills-commands", "quiet-wait"));
});

test("a binary created after preflight is not overwritten and earlier new aliases roll back", (context) => {
  const current = commandFixture(context);
  const originalSymlink = fs.symlinkSync;
  const collision = path.join(current.binDir, "estimate-gh-wait");
  context.mock.method(fs, "symlinkSync", (target, destination, ...rest) => {
    if (destination === collision) fs.writeFileSync(destination, "racing user binary", { flag: "wx" });
    return originalSymlink(target, destination, ...rest);
  });
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "astra" }), /EEXIST/);
  assert.equal(fs.readFileSync(collision, "utf8"), "racing user binary");
  assert.deepEqual(fs.readdirSync(current.binDir), ["estimate-gh-wait"]);
  assert.equal(fs.existsSync(path.join(current.root, "skills")), false);
});

test("concurrent harness installs serialize command publication under one owner", async (context) => {
  const current = commandFixture(context);
  const installer = new URL("./install-skills.mjs", import.meta.url).href;
  const options = [
    { ...current, harness: "codex", model: "astra" },
    { ...current, root: path.join(current.temporary, "claude"), harness: "claude", model: "opus" },
  ];
  const alias = path.join(current.binDir, "codex-review");
  const published = path.join(current.temporary, "command-published");
  const waiting = path.join(current.temporary, "command-waiting");
  const release = path.join(current.temporary, "release-command-publication");
  const candidatePrefix = path.join(current.binDir, ".jesse-merhi-skills-commands.lock.candidate-");
  const publisher = spawnInstaller(installer, options[0], "publisher", {
    INSTALL_TEST_ALIAS: alias,
    INSTALL_TEST_PUBLISHED: published,
    INSTALL_TEST_RELEASE: release,
  });
  const processes = [publisher];
  let barrierError;
  try {
    await waitForPath(published, publisher, "partial command publication");
    assert.equal(fs.lstatSync(alias).isSymbolicLink(), true);
    assert.equal(fs.existsSync(path.join(current.binDir, ".jesse-merhi-skills-commands")), false);
    const waiter = spawnInstaller(installer, options[1], "waiter", {
      INSTALL_TEST_CANDIDATE_PREFIX: candidatePrefix,
      INSTALL_TEST_WAITING: waiting,
    });
    processes.push(waiter);
    await waitForPath(waiting, waiter, "competing command lock acquisition");
  } catch (error) {
    barrierError = error;
  } finally {
    fs.writeFileSync(release, "release", { flag: "wx" });
  }
  const runs = await Promise.all(processes.map(run => run.completed));
  if (barrierError !== undefined) throw barrierError;
  for (const run of runs) assert.equal(run.code, 0, run.stderr);
  assert.deepEqual(runs.map(run => JSON.parse(run.stdout).commandsChanged).sort(), [0, 4]);
  assert.equal(fs.readFileSync(path.join(options[0].root, "skills", "code-review", "SKILL.md"), "utf8"), "selected:gpt-6-astra\n");
  assert.equal(fs.readFileSync(path.join(options[1].root, "skills", "code-review", "SKILL.md"), "utf8"), "selected:claude-opus-5\n");
  assert.equal(fs.readdirSync(current.binDir).some(name => name.endsWith(".lock") || name.includes(".previous-")), false);
});

test("a failed first view publication removes the new command owner and aliases", (context) => {
  const current = commandFixture(context);
  const view = path.join(current.root, ".skill-variants", "jesse-merhi-skills");
  const originalRename = fs.renameSync;
  context.mock.method(fs, "renameSync", (source, destination) => {
    if (source.startsWith(view + ".staging-") && destination === view) throw new Error("injected first view failure");
    return originalRename(source, destination);
  });
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "astra" }), /injected first view failure/);
  assert.deepEqual(fs.readdirSync(current.binDir), []);
  assert.deepEqual(fs.readdirSync(path.join(current.root, "skills")), []);
  assert.equal(fs.existsSync(view), false);
});

test("targeted installation preserves other prompts and rejects partial model switches", (context) => {
  const current = fixture(context);
  installSkills({ ...current, harness: "codex", model: "astra" });
  const beta = path.join(current.root, "skills", "beta", "SKILL.md");
  const originalBeta = fs.readFileSync(beta, "utf8");
  for (const name of ["alpha", "group/beta"]) {
    fs.writeFileSync(path.join(current.sourceRoot, name, "variants/gpt-6-astra.md"), "updated\n");
  }
  const options = { ...current, harness: "codex", model: "astra", skillNames: ["alpha"] };
  const result = installSkills(options);
  assert.equal(result.skillCount, 1);
  assert.equal(result.linksRetired, 0);
  assert.equal(selected(current.root), "updated\n");
  assert.equal(fs.readFileSync(beta, "utf8"), originalBeta);
  assert.throws(() => installSkills({ ...options, model: "sol" }), /cannot switch model or source/);
  assert.throws(() => installSkills({ ...options, skillNames: ["missing"] }), /known skill names/);
  assert.throws(() => installSkills({ ...options, skillNames: [] }), /known skill names/);
  assert.equal(fs.readFileSync(beta, "utf8"), originalBeta);
  assert.equal(selected(current.root), "updated\n");
});

test("switches Fable to Opus through stable links without changing other skills or settings", (t) => {
  const current = fixture(t);
  fs.mkdirSync(path.join(current.root, "skills", "personal"), { recursive: true });
  fs.writeFileSync(path.join(current.root, "skills", "personal", "SKILL.md"), "my instructions");
  fs.writeFileSync(path.join(current.root, "settings.json"), '{"model":"claude-fable-5[1m]"}\n');
  installSkills({ ...current, harness: "claude", model: "fable", requireExact: true });
  assert.equal(selected(current.root), "selected:claude-fable-5.1\n");
  const before = fs.readlinkSync(path.join(current.root, "skills", "alpha"));
  const result = installSkills({ ...current, harness: "claude", model: "opus", requireExact: true });
  assert.equal(selected(current.root), "selected:claude-opus-5\n");
  assert.equal(fs.readlinkSync(path.join(current.root, "skills", "alpha")), before);
  assert.equal(result.linksChanged, 0);
  assert.equal(fs.readFileSync(path.join(current.root, "skills", "personal", "SKILL.md"), "utf8"), "my instructions");
  assert.equal(fs.readFileSync(path.join(current.root, "settings.json"), "utf8"), '{"model":"claude-fable-5[1m]"}\n');
});

test("keeps different harness roots isolated while switching GPT profiles", (t) => {
  const current = fixture(t);
  const second = path.join(current.temporary, "another-codex");
  installSkills({ ...current, harness: "codex", model: "gpt-6-astra" });
  installSkills({ ...current, root: second, harness: "codex", model: "gpt-6-astra" });
  installSkills({ ...current, harness: "codex", model: "openai/gpt-6-sol-2026-09-23", requireExact: true });
  assert.equal(selected(current.root), "selected:gpt-6-sol\n");
  assert.equal(selected(second), "selected:gpt-6-astra\n");
  installSkills({ ...current, harness: "codex", model: "luna", requireExact: true });
  assert.equal(selected(current.root), "selected:gpt-6-luna\n");
});

test("installer safely falls back for a missing worker variant and can require exact coverage", (t) => {
  const current = fixture(t);
  fs.unlinkSync(path.join(current.sourceRoot, "alpha", "variants", "gpt-6-luna.md"));

  const installed = installSkills({ ...current, harness: "codex", model: "luna" });

  assert.equal(installed.profile, "gpt-6-luna");
  assert.equal(installed.exact, false);
  assert.equal(selected(current.root), "selected:gpt-6-astra\n");
  assert.equal(fs.readFileSync(path.join(current.root, "skills", "beta", "SKILL.md"), "utf8"), "selected:gpt-6-luna\n");
  assert.throws(() => installSkills({
    ...current, harness: "codex", model: "luna", requireExact: true,
  }), /complete exact skill coverage/);
});

test("refuses collisions before changing any installed prompt or link", (t) => {
  const current = fixture(t);
  installSkills({ ...current, harness: "codex", model: "sol" });
  fs.unlinkSync(path.join(current.root, "skills", "beta"));
  fs.mkdirSync(path.join(current.root, "skills", "beta"));
  fs.writeFileSync(path.join(current.root, "skills", "beta", "SKILL.md"), "user copy");
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "astra" }), /preserving existing local skill/);
  assert.equal(selected(current.root), "selected:gpt-6-sol\n");
  assert.equal(fs.readFileSync(path.join(current.root, "skills", "beta", "SKILL.md"), "utf8"), "user copy");
});

test("dry run validates coverage and collisions without creating an installation", (t) => {
  const current = fixture(t);
  const result = installSkills({ ...current, harness: "codex", model: "astra", dryRun: true, requireExact: true });
  assert.equal(result.profile, "gpt-6-astra");
  assert.equal(result.linksToChange, 2);
  assert.equal(fs.existsSync(current.root), false);
  fs.unlinkSync(path.join(current.sourceRoot, "alpha", "variants", "gpt-6-sol.md"));
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "sol", dryRun: true, requireExact: true }), /complete exact skill coverage/);
  assert.equal(fs.existsSync(current.root), false);
});

test("rejects a model from the other harness without creating files", (t) => {
  const current = fixture(t);
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "opus" }), /not a supported codex model/);
  assert.equal(fs.existsSync(current.root), false);
});

test("rejects retired GPT-5.6 identifiers before creating an installation", (t) => {
  const current = fixture(t);
  for (const model of ["gpt-5.6", "gpt-5.6-sol", "gpt-5.6-luna", "gpt-5.6-terra", "openai/gpt-5.6", "azure-openai/gpt-5.6-sol-2026-09-01"]) {
    assert.throws(() => installSkills({ ...current, harness: "codex", model }), /earliest supported openai-gpt profile \(gpt-6-astra\)/);
    assert.equal(fs.existsSync(current.root), false);
    assert.equal(fs.existsSync(current.binDir), false);
  }
});

test("migrates a stored GPT-5.6 view through stable links without changing model settings", (t) => {
  const current = fixture(t);
  const first = installSkills({ ...current, harness: "codex", model: "astra" });
  const marker = path.join(first.viewRoot, ".skill-variant-view.json");
  const legacyMarker = JSON.stringify({ schemaVersion: 1, sourceRoot: fs.realpathSync(current.sourceRoot), profile: "gpt-5.6" }) + "\n";
  fs.writeFileSync(marker, legacyMarker);
  for (const name of ["alpha", "beta"]) fs.writeFileSync(path.join(first.viewRoot, name, "SKILL.md"), "selected:gpt-5.6\n");
  const config = path.join(current.root, "config.toml");
  const settings = 'model = "gpt-5.6-sol"\n';
  fs.writeFileSync(config, settings);
  const alpha = path.join(current.root, "skills", "alpha");
  const originalLink = fs.readlinkSync(alpha);

  assert.throws(() => installSkills({ ...current, harness: "codex", model: "gpt-5.6-sol" }), /earliest supported/);
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "sol", skillNames: ["alpha"] }), /cannot switch model or source/);
  assert.equal(selected(current.root), "selected:gpt-5.6\n");
  assert.equal(fs.readFileSync(marker, "utf8"), legacyMarker);

  const migrated = installSkills({ ...current, harness: "codex", model: "sol", requireExact: true });
  assert.equal(migrated.exact, true);
  assert.equal(migrated.profile, "gpt-6-sol");
  assert.equal(migrated.linksChanged, 0);
  assert.equal(fs.readlinkSync(alpha), originalLink);
  for (const name of ["alpha", "beta"]) {
    assert.equal(fs.readFileSync(path.join(current.root, "skills", name, "SKILL.md"), "utf8"), "selected:gpt-6-sol\n");
  }
  assert.equal(JSON.parse(fs.readFileSync(marker, "utf8")).profile, "gpt-6-sol");
  assert.equal(fs.readFileSync(config, "utf8"), settings);
});

test("retires only links owned by this installation", (t) => {
  const current = fixture(t);
  const first = installSkills({ ...current, harness: "claude", model: "fable" });
  fs.symlinkSync(path.join(first.viewRoot, "retired"), path.join(current.root, "skills", "retired"));
  fs.symlinkSync(path.join(current.temporary, "elsewhere"), path.join(current.root, "skills", "foreign"));
  const result = installSkills({ ...current, harness: "claude", model: "opus" });
  assert.equal(result.linksRetired, 1);
  assert.equal(fs.lstatSync(path.join(current.root, "skills", "retired"), { throwIfNoEntry: false }), undefined);
  assert.equal(fs.readlinkSync(path.join(current.root, "skills", "foreign")), path.join(current.temporary, "elsewhere"));
});

test("restores migrated and retired links when view publication fails", (t) => {
  const current = fixture(t);
  const first = installSkills({ ...current, harness: "codex", model: "sol" });
  const alpha = path.join(current.root, "skills", "alpha");
  const legacy = path.join(current.sourceRoot, "alpha");
  fs.unlinkSync(alpha);
  fs.symlinkSync(legacy, alpha);
  const retired = path.join(current.root, "skills", "retired");
  fs.symlinkSync(path.join(first.viewRoot, "retired"), retired);
  const originalRename = fs.renameSync;
  t.after(() => { fs.renameSync = originalRename; });
  fs.renameSync = (source, destination) => {
    if (source.startsWith(first.viewRoot + ".staging-") && destination === first.viewRoot) throw new Error("injected publication failure");
    return originalRename(source, destination);
  };
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "astra" }), /injected publication failure/);
  assert.equal(fs.readlinkSync(alpha), legacy);
  assert.equal(fs.readlinkSync(retired), path.join(first.viewRoot, "retired"));
  assert.equal(fs.readFileSync(path.join(first.viewRoot, "alpha", "SKILL.md"), "utf8"), "selected:gpt-6-sol\n");
});

test("keeps published prompts and links when the fallback notice cannot be saved", (t) => {
  const current = fixture(t);
  const first = installSkills({ ...current, harness: "codex", model: "sol" });
  const alpha = path.join(current.root, "skills", "alpha");
  fs.unlinkSync(alpha);
  fs.symlinkSync(path.join(current.sourceRoot, "alpha"), alpha);
  const retired = path.join(current.root, "skills", "retired");
  fs.symlinkSync(path.join(first.viewRoot, "retired"), retired);
  const originalWrite = fs.writeFileSync;
  t.mock.method(fs, "writeFileSync", (file, ...args) => {
    if (file.includes(".skill-variant-notices")) throw new Error("injected notice write failure");
    return originalWrite(file, ...args);
  });
  const result = installSkills({ ...current, harness: "codex", model: "gpt-6.1", sessionId: "notice-failure" });
  assert.equal(result.profile, "gpt-6-astra");
  assert.match(result.notice, /gpt-6.1/);
  assert.equal(fs.readlinkSync(alpha), path.join(first.viewRoot, "alpha"));
  for (const name of ["alpha", "beta"]) {
    assert.equal(fs.readFileSync(path.join(current.root, "skills", name, "SKILL.md"), "utf8"), "selected:gpt-6-astra\n");
  }
  assert.equal(fs.lstatSync(retired, { throwIfNoEntry: false }), undefined);
});
