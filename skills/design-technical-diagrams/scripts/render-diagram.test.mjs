import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { renderDiagram } from "./render-diagram.mjs";

test("renders a labeled graph and preserves source and existing outputs", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "diagram-render-"));
  try {
    const input = path.join(temporary, "flow.dot");
    const source = 'digraph { user [label="User"]; api [label="Validate request"]; user -> api [label="submit"]; }';
    fs.writeFileSync(input, source);
    const outputDir = path.join(temporary, "output");
    const report = renderDiagram({ input, outputDir, width: 720 });
    assert.match(fs.readFileSync(report.svg, "utf8"), /Validate request/);
    assert.ok(report.smallestTextPx >= 12);
    assert.equal(fs.readFileSync(path.join(outputDir, "source.dot"), "utf8"), source);
    assert.equal(fs.readFileSync(input, "utf8"), source);
    assert.throws(() => renderDiagram({ input, outputDir }), /EEXIST/);
    assert.equal(fs.readFileSync(input, "utf8"), source);
    fs.writeFileSync(input, 'digraph { a [label="This intentionally very long label cannot remain legible when squeezed into a narrow diagram"]; }');
    assert.throws(() => renderDiagram({ input, outputDir: path.join(temporary, "small"), width: 240 }), /shrink/);
    assert.equal(fs.existsSync(path.join(temporary, "small")), false);
    fs.writeFileSync(input, "not a graph");
    assert.throws(() => renderDiagram({ input, outputDir: path.join(temporary, "invalid") }), /Graphviz failed/);
    assert.equal(fs.existsSync(path.join(temporary, "invalid")), false);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
