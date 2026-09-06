import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkPublication, remainingAssets } from "./proof-publication.mjs";

test("blocks concurrent PR or asset edits and identifies only remaining exact local references", context => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "proof-publication-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const assetPath = path.join(root, "proof.png");
  fs.writeFileSync(assetPath, "fixture bytes");
  const baseline = { url: "https://github.com/example/example/pull/1", headRefOid: "head", title: "Title", body: "Original" };
  const receipt = { baseline, draft: "![proof](proof.png)", assets: [{ reference: "proof.png", path: assetPath, sha256: createHash("sha256").update("fixture bytes").digest("hex") }] };
  assert.equal(checkPublication(receipt, baseline).safeToAttempt, true);
  assert.equal(checkPublication(receipt, { ...baseline, body: "Human change" }).safeToAttempt, false);
  assert.equal(checkPublication(receipt, { ...baseline, headRefOid: "new head" }).safeToAttempt, false);
  fs.writeFileSync(assetPath, "changed bytes");
  assert.equal(checkPublication(receipt, baseline).safeToAttempt, false);
  assert.equal(remainingAssets(receipt, { ...baseline, body: "![proof](proof.png)" }).length, 1);
  assert.equal(remainingAssets(receipt, { ...baseline, body: "Human removed proof" }).length, 0);
});
