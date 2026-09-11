import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

import { parsePullRequestUrl } from "../src/GitHubAttachment.ts";

const PullRequest = Schema.Struct({ url: Schema.String, headRefOid: Schema.String, title: Schema.String, body: Schema.String });
const Receipt = Schema.fromJsonString(Schema.Struct({
  baseline: PullRequest, draft: Schema.String,
  assets: Schema.Array(Schema.Struct({ reference: Schema.String, path: Schema.String, sha256: Schema.String }))
}));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const readPr = async pr => {
  await Effect.runPromise(parsePullRequestUrl(pr));
  const result = spawnSync("gh", ["pr", "view", pr, "--json", "url,headRefOid,title,body"], { encoding: "utf8", timeout: 60_000, maxBuffer: 8_000_000 });
  if (result.error || result.status !== 0) throw new Error("GitHub read failed; no publication was attempted");
  return Schema.decodeUnknownSync(Schema.fromJsonString(PullRequest))(result.stdout);
};

export function checkPublication(receipt, current) {
  const drift = ["url", "headRefOid", "title", "body"].filter(key => receipt.baseline[key] !== current[key]);
  const changedAssets = receipt.assets.filter(asset => !fs.existsSync(asset.path) || hash(fs.readFileSync(asset.path)) !== asset.sha256).map(asset => asset.path);
  return { safeToAttempt: drift.length === 0 && changedAssets.length === 0, drift, changedAssets };
}

export function remainingAssets(receipt, current) {
  return receipt.assets.filter(asset => current.body.includes(asset.reference));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    pr: { type: "string" }, body: { type: "string" }, asset: { type: "string", multiple: true },
    state: { type: "string" }, help: { type: "boolean" }
  } });
  if (values.help) console.log("bun proof-publication.mjs prepare --pr URL --body DRAFT.md [--asset LOCAL-REFERENCE] --state NEW-DIRECTORY\nbun proof-publication.mjs check --state DIRECTORY\nbun proof-publication.mjs observe --state DIRECTORY\nRead-only GitHub bookkeeping. Use native gh --attach only after caller authorization and a fresh check; observe saves readback and pending references, never retries or overwrites the PR.");
  else {
    if (!values.state) throw new Error("Supply --state");
    const state = path.resolve(values.state);
    if (positionals[0] === "prepare") {
      if (!values.pr || !values.body) throw new Error("Supply --pr and --body");
      const baseline = await readPr(values.pr);
      const draft = fs.readFileSync(values.body, "utf8");
      const references = [...new Set(values.asset ?? [])];
      if (references.length > 50) throw new Error("Native gh supports at most 50 attachments");
      const assets = references.map(reference => {
        if (!draft.includes(reference)) throw new Error(`Draft has no exact local reference for ${reference}`);
        const filename = fs.realpathSync(reference);
        return { reference, path: filename, sha256: hash(fs.readFileSync(filename)) };
      });
      fs.mkdirSync(state, { mode: 0o700 });
      fs.writeFileSync(path.join(state, "publication.json"), JSON.stringify({ baseline, draft, assets }, null, 2), { flag: "wx", mode: 0o600 });
      fs.writeFileSync(path.join(state, "draft.md"), draft, { flag: "wx", mode: 0o600 });
      console.log(JSON.stringify({ state, head: baseline.headRefOid, assets: assets.length, next: "Check immediately before the authorized native gh edit. Original draft and baseline remain here." }));
    } else {
      const receipt = Schema.decodeUnknownSync(Receipt)(fs.readFileSync(path.join(state, "publication.json"), "utf8"));
      const current = await readPr(receipt.baseline.url);
      if (positionals[0] === "check") {
        const result = checkPublication(receipt, current);
        console.log(JSON.stringify(result));
        if (!result.safeToAttempt) process.exitCode = 1;
      } else if (positionals[0] === "observe") {
        const directory = fs.mkdtempSync(path.join(state, "readback-"));
        fs.writeFileSync(path.join(directory, "body.md"), current.body, { mode: 0o600 });
        const pending = remainingAssets(receipt, current);
        fs.writeFileSync(path.join(directory, "observation.json"), JSON.stringify({ current, pending, headChanged: current.headRefOid !== receipt.baseline.headRefOid }, null, 2), { mode: 0o600 });
        console.log(JSON.stringify({ directory, pending, next: "Reconcile this current body with human edits. Retry only confirmed remaining attachments from a new prepared baseline. Absent local references are not upload verification; run github-verify-rendered-proof and inspect visuals." }));
      } else throw new Error("Choose prepare, check, or observe");
    }
  }
}
