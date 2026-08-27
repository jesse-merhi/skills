#!/usr/bin/env node

import * as Schema from "effect/Schema";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const checker = path.join(scriptDirectory, "check-rendered-diagram.mjs");
const directory = mkdtempSync(path.join(tmpdir(), "diagram-lint-test-"));
const LintFinding = Schema.Struct({
  category: Schema.String,
  diagram: Schema.NullOr(Schema.String),
  file: Schema.String,
  message: Schema.String,
  viewports: Schema.Array(Schema.String),
});
const LintReportJson = Schema.fromJsonString(Schema.Struct({
  browserLaunches: Schema.Number,
  contexts: Schema.Number,
  files: Schema.Number,
  findings: Schema.Array(LintFinding),
}));

const good = `<!doctype html><html><body style="margin:0">
<svg width="0" height="0" style="position:absolute"><defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z"></path></marker></defs></svg>
<svg data-diagram="true" data-diagram-id="good" viewBox="0 0 600 240" style="display:block;width:100%;height:auto">
  <rect id="source" data-node="true" x="30" y="70" width="150" height="90" rx="12" fill="#fff" stroke="#000"></rect>
  <text x="70" y="120">Source</text>
  <rect id="target" data-node="true" x="420" y="70" width="150" height="90" rx="12" fill="white" stroke="black"></rect>
  <text x="460" y="120">Target</text>
  <path id="request" data-route="request" data-label="sends request" data-from="source" data-to="target" d="M180 115H420" fill="none" stroke="black" marker-end="url(#arrow)"></path>
  <text x="270" y="95">sends request</text>
</svg></body></html>`;

const bad = `<!doctype html><html><body style="margin:0;min-width:900px"><div style="width:650px;overflow:hidden">
<svg data-diagram="true" data-diagram-id="bad" width="700" height="300">
  <defs><symbol id="empty"></symbol></defs>
  <rect id="duplicate" data-node="true" x="40" y="70" width="130" height="100"></rect>
  <rect id="duplicate" data-node="true" x="120" y="80" width="130" height="100"></rect>
  <rect id="middle" data-node="true" x="300" y="70" width="120" height="100"></rect>
  <text x="315" y="120">middle</text>
  <text x="315" y="120">collision</text>
  <text x="130" y="105">crosses both nodes</text>
  <text x="680" y="290">clipped words</text>
  <svg data-icon="true" id="blocked-icon" x="480" y="90" width="40" height="60" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>
  <path id="bad-route" data-route="bad-route" data-from="duplicate" data-to="missing" d="M20 120H560" fill="none" stroke="black" marker-end="url(#missing-marker)"></path>
  <path id="detached-route" data-route="detached-route" data-from="middle" d="M450 230H620" fill="none" stroke="black"></path>
  <use id="broken-use" href="#empty" x="600" y="80" width="24" height="24"></use>
  <foreignObject x="560" y="150" width="100" height="40"><img id="broken-image" src="missing.png"></foreignObject>
  <path id="clipped-ink" d="M-10 220H100" stroke="black"></path>
</svg></div></body></html>`;

try {
  const goodFile = path.join(directory, "good.html");
  const badFile = path.join(directory, "bad.html");
  writeFileSync(goodFile, good);
  writeFileSync(badFile, bad);

  const started = performance.now();
  const result = spawnSync(process.execPath, [
    checker,
    "--json",
    "--viewport",
    "390x844",
    "--viewport",
    "1440x900",
    goodFile,
    badFile,
  ], { encoding: "utf8", timeout: 30_000 });
  const runtimeMs = performance.now() - started;

  assert.equal(result.status, 1, result.stderr || result.stdout);
  const report = Schema.decodeUnknownSync(LintReportJson)(result.stdout);
  assert.equal(report.browserLaunches, 1);
  assert.equal(report.contexts, 4);
  assert.equal(report.findings.some((finding) => finding.file === goodFile), false, JSON.stringify(report, null, 2));

  const categories = new Set(
    report.findings
      .filter((finding) => finding.file === badFile)
      .map((finding) => finding.category),
  );
  const expected = [
    "broken-local-reference",
    "broken-use",
    "diagram-clipped",
    "diagram-horizontal-overflow",
    "duplicate-id",
    "failed-image",
    "ink-clipped",
    "missing-route-node",
    "misplaced-route-endpoint",
    "node-overlap",
    "page-horizontal-overflow",
    "route-icon-collision",
    "route-text-collision",
    "route-through-node",
    "text-clipped",
    "text-node-collision",
    "text-overlap",
  ];
  for (const category of expected) {
    assert(
      categories.has(category),
      `missing ${category}; findings: ${JSON.stringify(report.findings, null, 2)}`,
    );
  }
  assert(report.findings.every((finding) => Array.isArray(finding.viewports)));
  console.log(
    `ok - ${expected.length} objective failure types; 2 files x 2 viewports; ` +
      `1 Chrome process; ${(runtimeMs / 1000).toFixed(2)}s`,
  );
} finally {
  rmSync(directory, { force: true, recursive: true });
}
