import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const script = new URL("./proof-media.mjs", import.meta.url);

test("inspect and cut preserve the source and retain selected audio/video intervals", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-media-test-"));
  try {
    const source = path.join(directory, "source with spaces.mp4");
    const generated = spawnSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=10:duration=3", "-f", "lavfi", "-i", "sine=frequency=440:duration=3", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", source], { encoding: "utf8" });
    assert.equal(generated.status, 0, generated.stderr);
    const original = fs.readFileSync(source);
    const inspect = spawnSync(process.execPath, [script.pathname, "inspect", source, "--output-dir", path.join(directory, "inspection")], { encoding: "utf8" });
    assert.equal(inspect.status, 0, inspect.stderr);
    const metadata = JSON.parse(inspect.stdout);
    assert.equal(metadata.width, 320);
    assert.equal(metadata.height, 180);
    assert.equal(metadata.hasAudio, true);
    assert.ok(fs.statSync(metadata.contactSheet).size > 0);
    assert.ok(metadata.frames.every(frame => fs.existsSync(frame.path) && typeof frame.time === "number"));
    const output = path.join(directory, "cut.mp4");
    const cut = spawnSync(process.execPath, [script.pathname, "cut", source, "--keep", "0-0.5", "--keep", "2-2.5", "--output", output], { encoding: "utf8" });
    assert.equal(cut.status, 0, cut.stderr);
    const edited = JSON.parse(cut.stdout);
    assert.ok(Math.abs(edited.duration - 1) < 0.15);
    assert.equal(edited.hasAudio, true);
    assert.deepEqual(fs.readFileSync(source), original);
    const collision = spawnSync(process.execPath, [script.pathname, "cut", source, "--keep", "0-1", "--output", source], { encoding: "utf8" });
    assert.notEqual(collision.status, 0);
    assert.deepEqual(fs.readFileSync(source), original);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("compare labels matching images and refuses mismatched geometry or overwrite", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-compare-test-"));
  try {
    const before = path.join(directory, "before.png");
    const after = path.join(directory, "after.png");
    const different = path.join(directory, "different.png");
    for (const [filename, dimensions, color] of [[before, "320x180", "red"], [after, "320x180", "blue"], [different, "100x100", "green"]]) {
      const created = spawnSync("magick", ["-size", dimensions, `xc:${color}`, filename], { encoding: "utf8" });
      assert.equal(created.status, 0, created.stderr);
    }
    const output = path.join(directory, "comparison.png");
    const args = [script.pathname, "compare", before, after, "--output", output];
    const compared = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(compared.status, 0, compared.stderr);
    const pixels = spawnSync("magick", ["identify", "-format", "%wx%h", output], { encoding: "utf8" });
    assert.equal(pixels.stdout, "640x220");
    const original = fs.readFileSync(output);
    const repeated = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.notEqual(repeated.status, 0);
    assert.deepEqual(fs.readFileSync(output), original);
    const rejected = spawnSync(process.execPath, [script.pathname, "compare", before, different, "--output", path.join(directory, "bad.png")], { encoding: "utf8" });
    assert.notEqual(rejected.status, 0);
    assert.equal(fs.existsSync(path.join(directory, "bad.png")), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
