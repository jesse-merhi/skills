import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import test from "node:test";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const helperPath = path.join(scriptDir, "openclaw-local-test");

function run(command, args, env, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(
        new Error(
          `command timed out: ${command} ${args.join(" ")}\nstdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    }, timeoutMs);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal, stdout, stderr });
    });
  });
}

async function canListen(port) {
  const servers = [];
  try {
    for (let offset = 0; offset < 3; offset += 1) {
      const server = net.createServer();
      servers.push(server);
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port + offset, "127.0.0.1", resolve);
      });
    }
    return true;
  } catch {
    return false;
  } finally {
    await Promise.all(
      servers.map(
        (server) =>
          new Promise((resolve) => {
            if (!server.listening) return resolve();
            server.close(resolve);
          }),
      ),
    );
  }
}

async function findPortRange(start = 24_000) {
  for (let candidate = start; candidate < 48_000; candidate += 10) {
    if (await canListen(candidate)) return candidate;
  }
  throw new Error("no free local three-port range");
}

async function createFakeOpenClaw(repoDir) {
  await mkdir(repoDir, { recursive: true });
  await writeFile(
    path.join(repoDir, "openclaw.mjs"),
    `import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const args = process.argv.slice(2);
const stateDir = process.env.OPENCLAW_STATE_DIR;
const activePath = path.join(stateDir, "fake-active-wizard");
const cancelLogPath = path.join(stateDir, "fake-cancel.log");
const forceStatusFailurePath = path.join(stateDir, "force-status-failure");
const delayStatusPath = path.join(stateDir, "delay-status");
const statusStartedPath = path.join(stateDir, "fake-status-started");
const gatewayPidPath = path.join(stateDir, "fake-gateway-process.pid");
const completeStartPath = path.join(stateDir, "complete-start");
const invalidStartPath = path.join(stateDir, "invalid-start");
const invalidCancelPath = path.join(stateDir, "invalid-cancel");
const rpcLogPath = path.join(stateDir, "fake-rpc.log");

if (args[0] === "gateway" && args[1] === "run") {
  const port = Number(args[args.indexOf("--port") + 1]);
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end('{"ok":true}\\n');
  });
  fs.writeFileSync(gatewayPidPath, process.pid + "\\n");
  server.listen(port, "127.0.0.1");
  const stop = () => server.close(() => process.exit(0));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
} else if (args[0] === "gateway" && args[1] === "call") {
  const method = args[2];
  const params = JSON.parse(args[args.indexOf("--params") + 1]);
  fs.appendFileSync(rpcLogPath, method + "\\n");
  if (method === "wizard.start") {
    if (fs.existsSync(invalidStartPath)) {
      console.log(JSON.stringify({ done: true, status: "running" }));
      process.exit(0);
    }
    if (fs.existsSync(completeStartPath)) {
      console.log(JSON.stringify({ sessionId: "completed-session", done: true, status: "done" }));
      process.exit(0);
    }
    if (fs.existsSync(activePath)) {
      console.error("wizard already running");
      process.exit(1);
    }
    fs.writeFileSync(activePath, "probe-session\\n");
    console.log(JSON.stringify({
      sessionId: "probe-session",
      done: false,
      status: "running",
      step: { id: "probe-step", type: "confirm", message: "Continue?" },
    }));
  } else if (method === "wizard.status") {
    if (fs.existsSync(delayStatusPath)) {
      fs.writeFileSync(statusStartedPath, "1\\n");
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
    if (fs.existsSync(forceStatusFailurePath)) {
      fs.rmSync(forceStatusFailurePath);
      console.error("deliberate status failure");
      process.exit(1);
    }
    if (fs.readFileSync(activePath, "utf8").trim() !== params.sessionId) process.exit(1);
    console.log(JSON.stringify({ status: "running" }));
  } else if (method === "wizard.cancel") {
    fs.appendFileSync(cancelLogPath, params.sessionId + "\\n");
    fs.rmSync(activePath, { force: true });
    console.log(JSON.stringify({ status: fs.existsSync(invalidCancelPath) ? "running" : "cancelled" }));
  } else {
    process.exit(1);
  }
  process.exit(0);
} else {
  process.exit(1);
}
`,
  );
}

test("helper reports endpoint health, cancels its probe, and tears down interrupted startup", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "openclaw-local-test-helper-"));
  const repoDir = path.join(tempDir, "openclaw");
  const fakeBinDir = path.join(tempDir, "bin");
  const configPath = path.join(tempDir, "base-config.json");
  const proxyDir = path.join(tempDir, "proxy");
  const successfulState = path.join(tempDir, "successful-state");
  const failingState = path.join(tempDir, "failing-state");
  const interruptedState = path.join(tempDir, "interrupted-state");
  const completedState = path.join(tempDir, "completed-state");
  const invalidStartState = path.join(tempDir, "invalid-start-state");
  const invalidCancelState = path.join(tempDir, "invalid-cancel-state");
  const invalidTtlState = path.join(tempDir, "invalid-ttl-state");
  await createFakeOpenClaw(repoDir);
  await mkdir(fakeBinDir, { recursive: true });
  await writeFile(
    path.join(fakeBinDir, "codex"),
    `#!/usr/bin/env bash
if [[ "$1 $2" == "login status" ]]; then
  printf 'Logged in using an API key - redacted\n'
  exit 0
fi
exit 1
`,
    { mode: 0o700 },
  );
  await writeFile(configPath, "{}\n");
  await mkdir(failingState, { recursive: true });
  await writeFile(path.join(failingState, "force-status-failure"), "1\n");
  await mkdir(interruptedState, { recursive: true });
  await writeFile(path.join(interruptedState, "delay-status"), "1\n");
  await mkdir(completedState, { recursive: true });
  await writeFile(path.join(completedState, "complete-start"), "1\n");
  await mkdir(invalidStartState, { recursive: true });
  await writeFile(path.join(invalidStartState, "invalid-start"), "1\n");
  await mkdir(invalidCancelState, { recursive: true });
  await writeFile(path.join(invalidCancelState, "invalid-cancel"), "1\n");
  const previousSessions = path.join(successfulState, "agents", "main", "sessions");
  await mkdir(previousSessions, { recursive: true });
  await writeFile(path.join(previousSessions, "previous.json"), "{}\n");
  const firstPort = await findPortRange();
  const secondPort = await findPortRange(firstPort + 10);
  const thirdPort = await findPortRange(secondPort + 10);
  const fourthPort = await findPortRange(thirdPort + 10);
  const fifthPort = await findPortRange(fourthPort + 10);
  const sixthPort = await findPortRange(fifthPort + 10);
  const seventhPort = await findPortRange(sixthPort + 10);

  const baseEnv = {
    ...process.env,
    HOME: tempDir,
    PATH: `${fakeBinDir}:${process.env.PATH}`,
    OPENCLAW_LOCAL_TEST_NODE: process.execPath,
    OPENCLAW_LOCAL_TEST_PROXY_DIR: proxyDir,
  };
  const args = [
    "--repo",
    repoDir,
    "--base-config",
    configPath,
    "--no-open",
    "--no-channels",
    "--ttl",
    "60s",
  ];

  try {
    const successEnv = {
      ...baseEnv,
      OPENCLAW_LOCAL_TEST_STATE_DIR: successfulState,
      OPENCLAW_LOCAL_TEST_LOCK_DIR: path.join(tempDir, "success.lock"),
      OPENCLAW_LOCAL_TEST_PORT: String(firstPort),
    };
    const started = await run(helperPath, args, successEnv);
    if (started.code !== 0) throw new Error(JSON.stringify(started));
    await assert.rejects(access(successEnv.OPENCLAW_LOCAL_TEST_LOCK_DIR));
    await assert.rejects(access(previousSessions));
    assert.equal((await readdir(path.dirname(previousSessions))).some((name) => name.startsWith("sessions.bak.")), true);
    assert.match(started.stdout, /Gateway health: healthy/);
    assert.match(started.stdout, /browser proxy health: healthy/);
    const generatedConfig = JSON.parse(
      await readFile(path.join(successfulState, "openclaw.json"), "utf8"),
    );
    assert.equal(generatedConfig.agents.defaults.model.primary, "openai/gpt-5.6-sol");
    assert.deepEqual(
      generatedConfig.agents.defaults.models["openai/gpt-5.6-sol"].agentRuntime,
      { id: "codex" },
    );
    assert.equal(generatedConfig.plugins.entries.codex.config.appServer.homeScope, "user");
    assert.equal(await readFile(path.join(successfulState, "fake-cancel.log"), "utf8"), "probe-session\n");
    await assert.rejects(readFile(path.join(successfulState, "fake-active-wizard")));

    const status = await run(helperPath, ["--status"], successEnv);
    assert.equal(status.code, 0, status.stderr);
    assert.match(status.stdout, /Gateway health: healthy/);
    assert.match(status.stdout, /browser proxy health: healthy/);
    await run(helperPath, ["--stop"], successEnv);

    const failureEnv = {
      ...baseEnv,
      OPENCLAW_LOCAL_TEST_STATE_DIR: failingState,
      OPENCLAW_LOCAL_TEST_LOCK_DIR: path.join(tempDir, "failure.lock"),
      OPENCLAW_LOCAL_TEST_PORT: String(secondPort),
    };
    const failed = await run(helperPath, args, failureEnv);
    assert.equal(failed.code, 1, failed.stdout + failed.stderr);
    await assert.rejects(access(failureEnv.OPENCLAW_LOCAL_TEST_LOCK_DIR));
    assert.match(failed.stderr, /wizard readiness probe could not verify session/);
    assert.equal(await readFile(path.join(failingState, "fake-cancel.log"), "utf8"), "probe-session\n");
    await assert.rejects(readFile(path.join(failingState, "fake-active-wizard")));

    const interruptedEnv = {
      ...baseEnv,
      OPENCLAW_LOCAL_TEST_STATE_DIR: interruptedState,
      OPENCLAW_LOCAL_TEST_LOCK_DIR: path.join(tempDir, "interrupted.lock"),
      OPENCLAW_LOCAL_TEST_PORT: String(thirdPort),
    };
    const interrupted = spawn(helperPath, args, {
      env: interruptedEnv,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let interruptedStdout = "";
    let interruptedStderr = "";
    interrupted.stdout.setEncoding("utf8");
    interrupted.stderr.setEncoding("utf8");
    interrupted.stdout.on("data", (chunk) => {
      interruptedStdout += chunk;
    });
    interrupted.stderr.on("data", (chunk) => {
      interruptedStderr += chunk;
    });
    const statusStartedPath = path.join(interruptedState, "fake-status-started");
    for (let attempt = 0; attempt < 600; attempt += 1) {
      try {
        await readFile(statusStartedPath);
        break;
      } catch {
        if (interrupted.exitCode !== null) {
          throw new Error(
            `interrupted helper exited before wizard status probe: ${interrupted.exitCode}\n` +
              `stdout:\n${interruptedStdout}\nstderr:\n${interruptedStderr}`,
          );
        }
        if (attempt === 599) {
          throw new Error(
            `wizard status probe did not start\nstdout:\n${interruptedStdout}\nstderr:\n${interruptedStderr}`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    interrupted.kill("SIGTERM");
    const interruptedExit = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("interrupted helper did not exit")), 10_000);
      interrupted.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      interrupted.once("exit", (code, signal) => {
        clearTimeout(timeout);
        resolve({ code, signal });
      });
    });
    assert.deepEqual(interruptedExit, { code: 143, signal: null });
    await assert.rejects(access(interruptedEnv.OPENCLAW_LOCAL_TEST_LOCK_DIR));
    assert.match(interruptedStderr, /stopping gateway pid/);
    assert.equal(interruptedStdout, "");
    await assert.rejects(readFile(path.join(interruptedState, "run", "gateway.pid")));
    await assert.rejects(readFile(path.join(interruptedState, "fake-active-wizard")));
    assert.equal(await canListen(thirdPort), true, "interrupted startup must release its port range");
    assert.equal(
      await readFile(path.join(interruptedState, "fake-cancel.log"), "utf8"),
      "probe-session\n",
    );

    const completedEnv = {
      ...baseEnv,
      OPENCLAW_LOCAL_TEST_STATE_DIR: completedState,
      OPENCLAW_LOCAL_TEST_LOCK_DIR: path.join(tempDir, "completed.lock"),
      OPENCLAW_LOCAL_TEST_PORT: String(fourthPort),
    };
    const completed = await run(helperPath, args, completedEnv);
    assert.equal(completed.code, 0, completed.stdout + completed.stderr);
    await assert.rejects(access(completedEnv.OPENCLAW_LOCAL_TEST_LOCK_DIR));
    assert.equal(await readFile(path.join(completedState, "fake-rpc.log"), "utf8"), "wizard.start\n");
    await assert.rejects(readFile(path.join(completedState, "fake-active-wizard")));

    for (const [stateDir, markerPort] of [[invalidStartState, fifthPort], [invalidCancelState, sixthPort]]) {
      const invalid = await run(helperPath, args, { ...baseEnv, OPENCLAW_LOCAL_TEST_STATE_DIR: stateDir, OPENCLAW_LOCAL_TEST_LOCK_DIR: `${stateDir}.lock`, OPENCLAW_LOCAL_TEST_PORT: String(markerPort) });
      assert.equal(invalid.code, 1, invalid.stdout + invalid.stderr);
      await assert.rejects(readFile(path.join(stateDir, "run", "gateway.pid")));
      assert.equal(await canListen(markerPort), true);
    }

    const invalidTtl = await run(helperPath, [...args.slice(0, -2), "--ttl", "tomorrow"], { ...baseEnv, OPENCLAW_LOCAL_TEST_STATE_DIR: invalidTtlState, OPENCLAW_LOCAL_TEST_LOCK_DIR: `${invalidTtlState}.lock`, OPENCLAW_LOCAL_TEST_PORT: String(seventhPort) });
    assert.equal(invalidTtl.code, 1, invalidTtl.stdout + invalidTtl.stderr);
    await assert.rejects(readFile(path.join(invalidTtlState, "run", "gateway.pid")));
    assert.equal(await canListen(seventhPort), true);
  } finally {
    for (const stateDir of [successfulState, failingState, interruptedState, completedState, invalidStartState, invalidCancelState, invalidTtlState]) {
      await run(
        helperPath,
        ["--state-dir", stateDir, "--stop"],
        { ...baseEnv, OPENCLAW_LOCAL_TEST_STATE_DIR: stateDir },
      ).catch(() => undefined);
    }
    try {
      const proxyPid = Number(
        (await readFile(path.join(proxyDir, "shared-browser-proxy.pid"), "utf8")).trim(),
      );
      if (Number.isInteger(proxyPid) && proxyPid > 0) process.kill(proxyPid, "SIGTERM");
    } catch {
      // The proxy may already have exited after its final route was removed.
    }
    await rm(tempDir, { recursive: true, force: true });
  }
});
