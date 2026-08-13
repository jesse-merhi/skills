import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const proxyPath = path.join(scriptDir, "../src/shared-browser-proxy.ts");

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return address.port;
}

async function reservePort() {
  const server = net.createServer();
  const port = await listen(server);
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function request(port, requestPath, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: requestPath, ...options },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.once("end", () => resolve({ statusCode: res.statusCode, body }));
        res.once("error", reject);
        res.once("aborted", () => reject(new Error("response aborted")));
        res.once("close", () => {
          if (!res.complete) reject(new Error("response closed before completion"));
        });
      },
    );
    req.once("error", reject);
    req.setTimeout(2_000, () => req.destroy(new Error("request timed out")));
    req.end();
  });
}

async function waitForProxy(port, child) {
  let lastError;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    assert.equal(child.exitCode, null, "shared proxy exited during startup");
    try {
      return await request(port, "/healthz");
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  throw lastError ?? new Error("shared proxy did not start");
}

test("shared browser proxy survives upstream and downstream connection failures", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "openclaw-shared-proxy-test-"));
  const routeDir = path.join(tempDir, "routes");
  const upstream = http.createServer((req, res) => {
    if (req.url === "/before-headers") {
      req.socket.destroy();
      return;
    }
    if (req.url === "/after-headers") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.flushHeaders();
      res.write("partial response");
      setImmediate(() => res.destroy(new Error("forced upstream reset")));
      return;
    }
    if (req.url === "/slow") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.write("first chunk");
      const interval = setInterval(() => res.write("next chunk"), 10);
      res.once("close", () => clearInterval(interval));
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end('{"ok":true}\n');
  });
  const upstreamPort = await listen(upstream);
  const proxyPort = await reservePort();
  await writeFile(
    path.join(tempDir, "route.json"),
    JSON.stringify({
      proxyPort,
      targetHost: "127.0.0.1",
      targetPort: upstreamPort,
      gatewayPid: process.pid,
    }),
  );
  await mkdir(routeDir);
  await rename(path.join(tempDir, "route.json"), path.join(routeDir, `${proxyPort}.json`));

  let stderr = "";
  const proxy = spawn(process.execPath, [proxyPath], {
    env: {
      ...process.env,
      OPENCLAW_SHARED_PROXY_HOST: "127.0.0.1",
      OPENCLAW_SHARED_PROXY_ROUTE_DIR: routeDir,
      OPENCLAW_SHARED_PROXY_IDLE_EXIT_MS: "60000",
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  proxy.stderr.setEncoding("utf8");
  proxy.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  try {
    const initial = await waitForProxy(proxyPort, proxy);
    assert.equal(initial.statusCode, 200);

    const beforeHeaders = await request(proxyPort, "/before-headers");
    assert.equal(beforeHeaders.statusCode, 502);
    assert.match(beforeHeaders.body, /OpenClaw shared proxy error/);
    assert.equal(proxy.exitCode, null);

    await assert.rejects(request(proxyPort, "/after-headers"), /aborted|reset|socket hang up/i);
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(proxy.exitCode, null, stderr);
    assert.doesNotMatch(stderr, /ERR_HTTP_HEADERS_SENT/);

    await new Promise((resolve) => {
      const req = http.get({ host: "127.0.0.1", port: proxyPort, path: "/slow" });
      req.once("response", (res) => {
        res.once("data", () => {
          req.destroy();
          resolve();
        });
      });
      req.once("error", resolve);
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(proxy.exitCode, null, stderr);

    await new Promise((resolve) => {
      const req = http.request({
        host: "127.0.0.1",
        port: proxyPort,
        path: "/upload",
        method: "POST",
        headers: { "content-length": "1000000" },
      });
      req.once("socket", () => {
        req.write("partial upload");
        setImmediate(() => {
          req.destroy();
          resolve();
        });
      });
      req.once("error", resolve);
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(proxy.exitCode, null, stderr);

    const followUp = await request(proxyPort, "/healthz");
    assert.deepEqual(followUp, { statusCode: 200, body: '{"ok":true}\n' });
  } finally {
    proxy.kill("SIGTERM");
    await new Promise((resolve) => {
      if (proxy.exitCode !== null) {
        resolve();
        return;
      }
      proxy.once("exit", resolve);
    });
    upstream.closeAllConnections();
    await new Promise((resolve) => upstream.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});
