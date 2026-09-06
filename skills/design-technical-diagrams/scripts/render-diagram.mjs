#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

export function renderDiagram({ input, outputDir, width = 960, direction = "TB" }) {
  if (!input || !outputDir) throw new Error("Supply a DOT input and a new --output-dir");
  if (!Number.isInteger(width) || width < 240 || width > 4000) throw new Error("width must be an integer from 240 to 4000");
  if (!["TB", "LR"].includes(direction)) throw new Error("direction must be TB or LR");
  const source = readFileSync(path.resolve(input), "utf8");
  const result = spawnSync("dot", ["-Tsvg", `-Grankdir=${direction}`, "-Gbgcolor=transparent", "-Gpad=0.25", "-Gnodesep=0.4", "-Granksep=0.65", "-Gsplines=polyline", "-Nshape=box", "-Nstyle=rounded,filled", "-Nfillcolor=#f8f8f3", "-Ncolor=#809080", "-Nfontname=Arial", "-Nfontsize=16", "-Nmargin=0.2,0.13", "-Efontname=Arial", "-Efontsize=13", "-Ecolor=#607464"], {
    input: source, cwd: path.dirname(path.resolve(input)), encoding: "utf8", timeout: 20_000, maxBuffer: 8 * 1024 * 1024
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Graphviz failed: ${result.stderr.trim()}`);
  const svg = result.stdout.slice(result.stdout.indexOf("<svg"));
  const viewBox = /viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg);
  const fontSizes = [...svg.matchAll(/font-size="([\d.]+)"/g)].map(match => Number(match[1]));
  if (!viewBox || !fontSizes.length) throw new Error("Graphviz did not produce a labeled SVG with a viewBox");
  const naturalWidth = Number(viewBox[3]);
  const displayWidth = Math.min(width, naturalWidth);
  const smallestText = Math.min(...fontSizes) * displayWidth / naturalWidth;
  if (smallestText < 12) throw new Error(`Labels would shrink to ${smallestText.toFixed(1)}px at ${displayWidth}px. Shorten labels, reduce the graph, or change direction before exporting.`);
  const directory = path.resolve(outputDir);
  mkdirSync(directory, { mode: 0o700 });
  const report = { source: path.resolve(input), svg: path.join(directory, "diagram.svg"), html: path.join(directory, "diagram.html"), displayWidth, smallestTextPx: Number(smallestText.toFixed(1)), warnings: result.stderr.trim() };
  writeFileSync(report.svg, svg, { flag: "wx", mode: 0o600 });
  writeFileSync(path.join(directory, "source.dot"), source, { flag: "wx", mode: 0o600 });
  writeFileSync(report.html, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Diagram preview</title><style>body{margin:0;background:white}main{width:min(100%,${displayWidth}px);margin:auto}svg{display:block;width:100%;height:auto}</style><main>${svg}</main></html>`, { flag: "wx", mode: 0o600 });
  writeFileSync(path.join(directory, "render.json"), JSON.stringify(report, null, 2), { flag: "wx", mode: 0o600 });
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const { values, positionals } = parseArgs({ allowPositionals: true, options: { "output-dir": { type: "string" }, width: { type: "string", default: "960" }, direction: { type: "string", default: "TB" }, help: { type: "boolean" } } });
    if (values.help) console.log("render-diagram.mjs INPUT.dot --output-dir NEW-DIRECTORY [--width 960] [--direction TB|LR]\nUses installed Graphviz for node sizing and routing. Refuses unreadably small labels at the requested width. Inspect the exported SVG/HTML; automatic layout is not visual approval.");
    else {
      if (positionals.length !== 1) throw new Error("Supply exactly one DOT file");
      console.log(JSON.stringify(renderDiagram({ input: positionals[0], outputDir: values["output-dir"], width: Number(values.width), direction: values.direction }), null, 2));
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
