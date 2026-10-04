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
    for (const model of ["gpt-6", "claude-fable-5.1", "claude-opus-5.5"]) {
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
  for (const [skill, commands] of [["cleanup", ["inventory.mjs"]], ["wait-efficiently", ["quiet-wait", "estimate-gh-wait"]]]) {
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

function launcher(command) {
  const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
  return `#!/bin/sh\nexec ${[...command.runtime, command.target].map(quote).join(" ")} "$@"\n`;
}

function addRetiredReviewCommands(current) {
  const owner = path.join(current.binDir, ".jesse-merhi-skills-commands");
  const manifestFile = path.join(owner, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const retired = [
    { name: "codex-review", skill: "code-review", target: path.join(current.sourceRoot, "code-review", "scripts", "codex-review"), runtime: ["node"] },
    { name: "review-findings", skill: "code-review", target: path.join(current.sourceRoot, "code-review", "scripts", "review-findings"), runtime: ["node", "--disable-warning=ExperimentalWarning"] },
  ];
  manifest.commands.push(...retired);
  manifest.commands.sort((left, right) => left.name.localeCompare(right.name, "en"));
  fs.writeFileSync(manifestFile, JSON.stringify(manifest));
  for (const command of retired) {
    fs.writeFileSync(path.join(owner, command.name), launcher(command), { mode: 0o755 });
    fs.symlinkSync(path.join(owner, command.name), path.join(current.binDir, command.name));
  }
}

test("publishes explicit commands on PATH with arguments, cwd, environment and exit status intact", (context) => {
  const current = commandFixture(context);
  installSkills({ ...current, harness: "codex", model: "astra" });
  const execution = spawnSync("skill-cleanup-inventory", ["two words", "'quoted'", "$HOME", ""], {
    cwd: current.temporary, encoding: "utf8",
    env: { ...process.env, PATH: `${current.binDir}${path.delimiter}${process.env.PATH}`, INSTALL_TEST_VALUE: "retained" },
  });
  assert.equal(execution.status, 7, execution.stderr);
  assert.deepEqual(JSON.parse(execution.stdout), { command: "inventory.mjs", args: ["two words", "'quoted'", "$HOME", ""], cwd: fs.realpathSync(current.temporary), value: "retained" });
});

test("full installs retire stale managed aliases but preserve foreign replacements and third-party skills", (context) => {
  const current = commandFixture(context);
  installSkills({ ...current, harness: "codex", model: "astra" });
  addRetiredReviewCommands(current);
  const foreign = path.join(current.binDir, "codex-review");
  fs.unlinkSync(foreign);
  fs.symlinkSync(process.execPath, foreign);
  fs.mkdirSync(path.join(current.root, "skills", "personal"));
  fs.writeFileSync(path.join(current.root, "skills", "personal", "SKILL.md"), "personal");
  const result = installSkills({ ...current, harness: "codex", model: "astra" });
  assert.equal(result.commandsRetired, 1);
  assert.equal(result.linksRetired, 0);
  assert.equal(fs.readlinkSync(foreign), process.execPath);
  assert.equal(fs.lstatSync(path.join(current.binDir, "review-findings"), { throwIfNoEntry: false }), undefined);
  assert.deepEqual(result.commands.map(command => command.name), ["estimate-gh-wait", "quiet-wait", "skill-cleanup-inventory"]);
  assert.equal(fs.readFileSync(path.join(current.root, "skills", "personal", "SKILL.md"), "utf8"), "personal");
});

test("view failure rolls back new aliases and restores retired aliases and the command catalog", (context) => {
  const current = commandFixture(context);
  const first = installSkills({ ...current, harness: "codex", model: "astra" });
  fs.writeFileSync(path.join(current.sourceRoot, "alpha/variants/gpt-6.md"), "updated\n");
  const alias = path.join(current.binDir, "skill-cleanup-inventory");
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
  assert.equal(selected(current.root), "selected:gpt-6\n");
  assert.equal(fs.lstatSync(alias, { throwIfNoEntry: false }), undefined);
  assert.equal(fs.readFileSync(manifest, "utf8"), before);
  assert.equal(fs.readlinkSync(path.join(current.binDir, "quiet-wait")), path.join(current.binDir, ".jesse-merhi-skills-commands", "quiet-wait"));
});

test("a binary created after preflight is not overwritten and earlier new aliases roll back", (context) => {
  const current = commandFixture(context);
  const originalSymlink = fs.symlinkSync;
  const collision = path.join(current.binDir, "quiet-wait");
  context.mock.method(fs, "symlinkSync", (target, destination, ...rest) => {
    if (destination === collision) fs.writeFileSync(destination, "racing user binary", { flag: "wx" });
    return originalSymlink(target, destination, ...rest);
  });
  assert.throws(() => installSkills({ ...current, harness: "codex", model: "astra" }), /EEXIST/);
  assert.equal(fs.readFileSync(collision, "utf8"), "racing user binary");
  assert.deepEqual(fs.readdirSync(current.binDir), ["quiet-wait"]);
  assert.equal(fs.existsSync(path.join(current.root, "skills")), false);
});

test("concurrent harness installs serialize command publication under one owner", async (context) => {
  const current = commandFixture(context);
  const installer = new URL("./install-skills.mjs", import.meta.url).href;
  const options = [
    { ...current, harness: "codex", model: "astra" },
    { ...current, root: path.join(current.temporary, "claude"), harness: "claude", model: "opus" },
  ];
  const alias = path.join(current.binDir, "estimate-gh-wait");
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
  assert.deepEqual(runs.map(run => JSON.parse(run.stdout).commandsChanged).sort(), [0, 3]);
  assert.equal(fs.readFileSync(path.join(options[0].root, "skills", "cleanup", "SKILL.md"), "utf8"), "selected:gpt-6\n");
  assert.equal(fs.readFileSync(path.join(options[1].root, "skills", "cleanup", "SKILL.md"), "utf8"), "selected:claude-opus-5.5\n");
  assert.equal(fs.readdirSync(current.binDir).some(name => name.endsWith(".lock") || name.includes(".previous-")), false);
});

test("targeted installation updates only the selected prompt", (context) => {
  const current = fixture(context);
  installSkills({ ...current, harness: "codex", model: "astra" });
  const beta = path.join(current.root, "skills", "beta", "SKILL.md");
  const originalBeta = fs.readFileSync(beta, "utf8");
  for (const name of ["alpha", "group/beta"]) {
    fs.writeFileSync(path.join(current.sourceRoot, name, "variants/gpt-6.md"), "updated\n");
  }
  const options = { ...current, harness: "codex", model: "astra", skillNames: ["alpha"] };
  installSkills(options);
  assert.equal(selected(current.root), "updated\n");
  assert.equal(fs.readFileSync(beta, "utf8"), originalBeta);
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
  assert.equal(selected(current.root), "selected:claude-opus-5.5\n");
  assert.equal(fs.readlinkSync(path.join(current.root, "skills", "alpha")), before);
  assert.equal(result.linksChanged, 0);
  assert.equal(fs.readFileSync(path.join(current.root, "skills", "personal", "SKILL.md"), "utf8"), "my instructions");
  assert.equal(fs.readFileSync(path.join(current.root, "settings.json"), "utf8"), '{"model":"claude-fable-5[1m]"}\n');
});

test("restores migrated and retired links when view publication fails", (t) => {
  const current = fixture(t);
  const first = installSkills({ ...current, harness: "codex", model: "sol" });
  fs.writeFileSync(path.join(current.sourceRoot, "alpha/variants/gpt-6.md"), "updated\n");
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
  assert.equal(fs.readFileSync(path.join(first.viewRoot, "alpha", "SKILL.md"), "utf8"), "selected:gpt-6\n");
});

test("keeps published prompts and links when the fallback notice cannot be saved", (t) => {
  const current = fixture(t);
  const first = installSkills({ ...current, harness: "codex", model: "sol" });
  for (const name of ["alpha", "group/beta"]) {
    fs.writeFileSync(path.join(current.sourceRoot, name, "variants/gpt-6.md"), "updated\n");
  }
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
  assert.equal(result.profile, "gpt-6");
  assert.match(result.notice, /gpt-6.1/);
  assert.equal(fs.readlinkSync(alpha), path.join(first.viewRoot, "alpha"));
  for (const name of ["alpha", "beta"]) {
    assert.equal(fs.readFileSync(path.join(current.root, "skills", name, "SKILL.md"), "utf8"), "updated\n");
  }
  assert.equal(fs.lstatSync(retired, { throwIfNoEntry: false }), undefined);
});
