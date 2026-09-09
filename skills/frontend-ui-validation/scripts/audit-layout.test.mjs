import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const project = process.env.UI_VALIDATION_PROJECT;
const helper = fileURLToPath(new URL("./audit-layout.mjs", import.meta.url));

test("captures explicit readiness with ongoing traffic and preserves failed states before continuing", { skip: !project, timeout: 30_000 }, async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "layout-capture-test-"));
  const output = path.join(directory, "captures");
  const server = createServer((request, response) => {
    if (request.url === "/stream") {
      response.writeHead(200, { "Content-Type": "text/event-stream" });
      response.write("data: connected\n\n");
      return;
    }
    if (request.url === "/redirect") {
      response.writeHead(302, { Location: "/ready" }).end();
      return;
    }
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(request.url === "/missing" ? "<p>No ready control</p>" : `<!doctype html><style>button{width:160px;height:48px}</style><script>fetch('/stream');setTimeout(()=>{document.body.innerHTML='<button id="ready">Ready to continue</button>'},300)</script><body></body>`);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    const child = spawn(process.execPath, [helper, `${origin}/redirect`, "--state", `missing=${origin}/missing`, "--state", `recovered=${origin}/ready`, "--viewport", "640x480", "--wait-for", "#ready", "--timeout-ms", "2000", "--output-dir", output], { cwd: project, stdio: ["ignore", "pipe", "pipe"] });
    let diagnostics = "";
    child.stdout.on("data", chunk => { diagnostics += chunk; });
    child.stderr.on("data", chunk => { diagnostics += chunk; });
    const code = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", resolve);
    });
    assert.equal(code, 1, diagnostics);
    const captures = JSON.parse(await fs.readFile(path.join(output, "captures.json"), "utf8"));
    assert.equal(captures.length, 3);
    assert.equal(captures[0].finalUrl, `${origin}/ready`);
    assert.equal(captures[0].captureError, undefined);
    assert.ok(captures[1].captureError);
    assert.equal(captures[1].screenshot, undefined);
    assert.equal(captures[2].state, "recovered");
    assert.equal(captures[2].captureError, undefined);
    for (const capture of [captures[0], captures[2]]) {
      assert.ok(Number.isFinite(Date.parse(capture.capturedAt)));
      const image = await fs.readFile(capture.screenshot);
      assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(directory, { recursive: true, force: true });
  }
});
