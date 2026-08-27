#!/usr/bin/env node

import * as Schema from "effect/Schema";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const RESULT_ATTRIBUTE = "data-diagram-lint-result";
const BrowserFinding = Schema.Struct({
  category: Schema.String,
  diagram: Schema.NullOr(Schema.String),
  file: Schema.String,
  message: Schema.String,
  viewport: Schema.String,
});
const BrowserResultJson = Schema.fromJsonString(Schema.Struct({
  contexts: Schema.Number,
  findings: Schema.Array(BrowserFinding),
}));

function usage() {
  console.error(
    "Usage: check-rendered-diagram.mjs [--browser PATH] [--viewport WIDTHxHEIGHT] [--json] FILE...",
  );
}

function parseArgs(argv) {
  const options = { browser: null, files: [], json: false, timeoutMs: 20_000, viewports: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--browser") {
      options.browser = argv[++index];
    } else if (argument === "--viewport") {
      const value = argv[++index] || "";
      const match = /^(\d+)[xX](\d+)$/.exec(value);
      if (!match || Number(match[1]) < 1 || Number(match[2]) < 1) {
        throw new Error(`invalid viewport ${JSON.stringify(value)}; expected WIDTHxHEIGHT`);
      }
      options.viewports.push({
        name: value.toLowerCase(),
        width: Number(match[1]),
        height: Number(match[2]),
      });
    } else if (argument === "--timeout") {
      options.timeoutMs = Number(argv[++index]) * 1000;
      if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
        throw new Error("timeout must be a positive number of seconds");
      }
    } else if (argument === "--json") {
      options.json = true;
    } else if (argument.startsWith("-")) {
      throw new Error(`unknown option ${argument}`);
    } else {
      options.files.push(path.resolve(argument));
    }
  }
  if (!options.files.length) throw new Error("at least one HTML file is required");
  options.viewports = options.viewports.length ? options.viewports : DEFAULT_VIEWPORTS;
  return options;
}

function findChrome(explicitPath) {
  const candidates = [
    explicitPath,
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const browser = candidates.find(existsSync);
  if (!browser) {
    throw new Error("Chrome was not found; pass --browser PATH or set CHROME_PATH");
  }
  return browser;
}

function encodedFile(file) {
  return {
    file,
    baseHref: pathToFileURL(`${path.dirname(file)}${path.sep}`).href,
    source: readFileSync(file).toString("base64"),
  };
}

function harnessSource(files, viewports) {
  const payload = JSON.stringify({ files, viewports });
  return String.raw`<!doctype html>
<html ${RESULT_ATTRIBUTE}="pending">
<head><meta charset="utf-8"><title>Diagram lint harness</title></head>
<body>
<script>
const payload = ${payload};

const decode = (value) => new TextDecoder().decode(
  Uint8Array.from(atob(value), (character) => character.charCodeAt(0)),
);
const encode = (value) => btoa(
  [...new TextEncoder().encode(value)].map((byte) => String.fromCharCode(byte)).join(''),
);
const escapeAttribute = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;');
const box = (element) => {
  const value = element.getBoundingClientRect();
  return {
    left: value.left,
    right: value.right,
    top: value.top,
    bottom: value.bottom,
    width: value.width,
    height: value.height,
  };
};
const intersection = (left, right) => ({
  width: Math.min(left.right, right.right) - Math.max(left.left, right.left),
  height: Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top),
});
const contains = (outer, inner, tolerance = 0) =>
  outer.left <= inner.left + tolerance && outer.right >= inner.right - tolerance &&
  outer.top <= inner.top + tolerance && outer.bottom >= inner.bottom - tolerance;
const inside = (point, value, tolerance = 0) =>
  point.x > value.left + tolerance && point.x < value.right - tolerance &&
  point.y > value.top + tolerance && point.y < value.bottom - tolerance;
const styleFor = (element) => element.ownerDocument.defaultView.getComputedStyle(element);
const displayed = (element) => {
  const style = styleFor(element);
  return style.display !== 'none' && style.visibility !== 'hidden' &&
    style.visibility !== 'collapse' && Number(style.opacity) !== 0;
};
const visibleBox = (element) => {
  if (!displayed(element)) return false;
  const value = box(element);
  return value.width > 0 || value.height > 0;
};
const diagramName = (diagram, index) =>
  diagram.dataset.diagramId || diagram.id || 'diagram#' + (index + 1);
const elementName = (element, fallback) =>
  element.id || element.getAttribute('data-route') || element.getAttribute('data-node') || fallback;
const belongsTo = (diagram, element) => element.closest('svg') === diagram;
const nestedIconBelongsTo = (diagram, icon) => icon.parentElement?.closest('svg') === diagram;

function localReferences(element) {
  const values = ['fill', 'stroke', 'filter', 'clip-path', 'mask', 'marker-start', 'marker-mid', 'marker-end']
    .flatMap((name) => [element.getAttribute(name), element.style?.getPropertyValue(name)])
    .filter(Boolean);
  const references = values.flatMap((value) => {
    const references = [];
    for (const match of value.matchAll(/url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)/g)) references.push(match[1]);
    return references;
  });
  if (element.matches('use, image, textPath, mpath')) {
    for (const value of [element.getAttribute('href'), element.getAttribute('xlink:href')].filter(Boolean)) {
      if (value.startsWith('#')) references.push(value.slice(1));
    }
  }
  return references;
}

function textRuns(diagram) {
  const runs = [];
  const document = diagram.ownerDocument;
  const walker = document.createTreeWalker(
    diagram,
    document.defaultView.NodeFilter.SHOW_TEXT,
  );
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim()) continue;
    const owner = node.parentElement?.closest('text, foreignObject');
    if (!owner || !belongsTo(diagram, owner) || !displayed(owner)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const value of range.getClientRects()) {
      if (value.width <= 0 || value.height <= 0) continue;
      runs.push({
        owner,
        text: node.textContent.replace(/\s+/g, ' ').trim(),
        value: {
          left: value.left,
          right: value.right,
          top: value.top,
          bottom: value.bottom,
          width: value.width,
          height: value.height,
        },
      });
    }
  }
  return runs;
}

function routePoints(route) {
  let length;
  let matrix;
  try {
    length = route.getTotalLength();
    matrix = route.getScreenCTM();
  } catch {
    return [];
  }
  if (!matrix || length <= 0) return [];
  const scale = Math.max(
    Math.hypot(matrix.a, matrix.b),
    Math.hypot(matrix.c, matrix.d),
    0.1,
  );
  const count = Math.min(1000, Math.max(12, Math.ceil((length * scale) / 3)));
  const points = [];
  for (let index = 0; index <= count; index += 1) {
    const local = route.getPointAtLength((index / count) * length);
    const screen = new route.ownerDocument.defaultView.DOMPoint(local.x, local.y).matrixTransform(matrix);
    points.push({ x: screen.x, y: screen.y });
  }
  return points;
}

function distanceToBoxBoundary(point, value) {
  const withinX = point.x >= value.left && point.x <= value.right;
  const withinY = point.y >= value.top && point.y <= value.bottom;
  if (withinX && withinY) {
    return Math.min(
      Math.abs(point.x - value.left),
      Math.abs(point.x - value.right),
      Math.abs(point.y - value.top),
      Math.abs(point.y - value.bottom),
    );
  }
  const x = Math.max(value.left, Math.min(value.right, point.x));
  const y = Math.max(value.top, Math.min(value.bottom, point.y));
  return Math.hypot(point.x - x, point.y - y);
}

function distanceToNodeBoundary(node, point) {
  try {
    const length = node.getTotalLength();
    const matrix = node.getScreenCTM();
    if (length > 0 && matrix) {
      const count = Math.min(500, Math.max(24, Math.ceil(length / 2)));
      let minimum = Infinity;
      for (let index = 0; index <= count; index += 1) {
        const local = node.getPointAtLength((index / count) * length);
        const screen = new node.ownerDocument.defaultView.DOMPoint(local.x, local.y).matrixTransform(matrix);
        minimum = Math.min(minimum, Math.hypot(point.x - screen.x, point.y - screen.y));
      }
      return minimum;
    }
  } catch {}
  return distanceToBoxBoundary(point, box(node));
}

function clippedByAncestor(element, allowHorizontalScroll) {
  const elementBox = box(element);
  for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
    const style = styleFor(ancestor);
    const clipsX = ['hidden', 'clip'].includes(style.overflowX) && !allowHorizontalScroll;
    const clipsY = ['hidden', 'clip'].includes(style.overflowY);
    if (!clipsX && !clipsY) continue;
    const ancestorBox = box(ancestor);
    if (clipsX && (elementBox.left < ancestorBox.left - 0.5 || elementBox.right > ancestorBox.right + 0.5)) return true;
    if (clipsY && (elementBox.top < ancestorBox.top - 0.5 || elementBox.bottom > ancestorBox.bottom + 0.5)) return true;
  }
  return false;
}

function lintFrame(frame, input, viewport) {
  const document = frame.contentDocument;
  const findings = [];
  const add = (category, message, diagram = null) => findings.push({
    category,
    diagram,
    file: input.file,
    message,
    viewport: viewport.name,
  });

  const ids = new Map();
  for (const element of document.querySelectorAll('[id]')) {
    ids.set(element.id, (ids.get(element.id) || 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) add('duplicate-id', 'id ' + JSON.stringify(id) + ' appears ' + count + ' times');
  }

  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
    add(
      'page-horizontal-overflow',
      'page is ' + document.documentElement.scrollWidth + 'px wide in a ' +
        document.documentElement.clientWidth + 'px viewport',
    );
  }

  const roots = [...document.querySelectorAll('svg')].filter((svg) =>
    !svg.parentElement?.closest('svg') && svg.dataset.icon !== 'true' && visibleBox(svg) &&
    (svg.dataset.diagram === 'true' || svg.querySelector('text, foreignObject, [data-route], [data-node]')),
  );

  roots.forEach((diagram, diagramIndex) => {
    const name = diagramName(diagram, diagramIndex);
    const diagramBox = box(diagram);
    const allowHorizontalScroll = diagram.dataset.allowHorizontalScroll === 'true';
    if (!allowHorizontalScroll &&
        (diagramBox.left < -0.5 || diagramBox.right > frame.contentWindow.innerWidth + 0.5)) {
      add('diagram-horizontal-overflow', name + ' leaves the viewport', name);
    }
    if (clippedByAncestor(diagram, allowHorizontalScroll)) {
      add('diagram-clipped', name + ' is clipped by an overflow ancestor', name);
    }

    const diagramElements = [...diagram.querySelectorAll('*')].filter((element) => belongsTo(diagram, element));
    for (const element of diagramElements) {
      for (const reference of localReferences(element)) {
        const matches = document.querySelectorAll('#' + CSS.escape(reference));
        if (matches.length !== 1) {
          add(
            'broken-local-reference',
            elementName(element, element.tagName.toLowerCase()) + ' references #' + reference +
              ', which does not resolve once',
            name,
          );
        }
      }
    }

    for (const [index, use] of [...diagram.querySelectorAll('use')].filter((element) => belongsTo(diagram, element)).entries()) {
      if (!displayed(use)) continue;
      let value;
      try { value = use.getBBox(); } catch { value = null; }
      if (!value || (value.width === 0 && value.height === 0)) {
        add('broken-use', elementName(use, 'use#' + (index + 1)) + ' has no rendered geometry', name);
      }
    }

    for (const [index, image] of [...diagram.querySelectorAll('foreignObject img')].entries()) {
      if (displayed(image) && image.complete && image.naturalWidth === 0) {
        add('failed-image', elementName(image, 'image#' + (index + 1)) + ' did not load', name);
      }
    }

    const nodes = [...diagram.querySelectorAll('[data-node]')]
      .filter((element) => belongsTo(diagram, element) && visibleBox(element));
    nodes.forEach((left, leftIndex) => {
      nodes.slice(leftIndex + 1).forEach((right) => {
        const overlap = intersection(box(left), box(right));
        if (overlap.width > 2 && overlap.height > 2 &&
            !contains(box(left), box(right), 1) && !contains(box(right), box(left), 1)) {
          add(
            'node-overlap',
            elementName(left, 'node#' + (leftIndex + 1)) + ' overlaps ' + elementName(right, 'node'),
            name,
          );
        }
      });
    });

    const runs = textRuns(diagram);
    runs.forEach((left, leftIndex) => {
      runs.slice(leftIndex + 1).forEach((right) => {
        if (left.owner === right.owner) return;
        const overlap = intersection(left.value, right.value);
        if (overlap.width > 0.5 && overlap.height > 0.5) {
          add('text-overlap', JSON.stringify(left.text) + ' overlaps ' + JSON.stringify(right.text), name);
        }
      });
      if (!contains(diagramBox, left.value, 0.5)) {
        add('text-clipped', JSON.stringify(left.text) + ' leaves ' + name, name);
      }
      const containers = nodes.filter((node) => contains(box(node), left.value, 1));
      const container = containers.sort((a, b) => {
        const leftBox = box(a);
        const rightBox = box(b);
        return leftBox.width * leftBox.height - rightBox.width * rightBox.height;
      })[0];
      nodes.forEach((node) => {
        if (node === container) return;
        const overlap = intersection(left.value, box(node));
        if (overlap.width > 0.5 && overlap.height > 0.5) {
          add(
            'text-node-collision',
            JSON.stringify(left.text) + ' overlaps ' + elementName(node, 'node'),
            name,
          );
        }
      });
    });

    const icons = [...diagram.querySelectorAll('svg[data-icon="true"]')]
      .filter((icon) => nestedIconBelongsTo(diagram, icon) && visibleBox(icon));
    const routeSelector = [
      '[data-route]',
      'path.route',
      'line.route',
      'polyline.route',
      'path[marker-start]',
      'path[marker-end]',
      'line[marker-start]',
      'line[marker-end]',
      'polyline[marker-start]',
      'polyline[marker-end]',
    ].join(',');
    const routes = [...diagram.querySelectorAll(routeSelector)]
      .filter((route) => belongsTo(diagram, route) && displayed(route));

    routes.forEach((route, routeIndex) => {
      const routeName = elementName(route, 'route#' + (routeIndex + 1));
      const points = routePoints(route);
      if (!points.length) return;
      const endpointNames = [route.getAttribute('data-from'), route.getAttribute('data-to')];
      endpointNames.forEach((nodeName, endpointIndex) => {
        if (!nodeName) return;
        const matches = nodes.filter((node) =>
          node.id === nodeName || (node.getAttribute('data-node') !== 'true' && node.getAttribute('data-node') === nodeName),
        );
        if (matches.length !== 1) {
          add('missing-route-node', routeName + ' references missing node ' + JSON.stringify(nodeName), name);
          return;
        }
        const endpoint = endpointIndex === 0 ? points[0] : points[points.length - 1];
        if (distanceToNodeBoundary(matches[0], endpoint) > 6) {
          add('misplaced-route-endpoint', routeName + ' is detached from ' + nodeName, name);
        }
      });

      const connected = new Set(endpointNames.filter(Boolean));
      nodes.forEach((node, nodeIndex) => {
        const nodeName = elementName(node, 'node#' + (nodeIndex + 1));
        if (connected.has(nodeName)) return;
        if (points.some((point) => inside(point, box(node), 1))) {
          add('route-through-node', routeName + ' passes through unrelated node ' + nodeName, name);
        }
      });
      runs.forEach((run) => {
        const expectedLabel = (route.getAttribute('data-label') || '').replace(/\s+/g, ' ').trim();
        if (expectedLabel && expectedLabel.includes(run.text)) return;
        if (points.some((point) => inside(point, run.value, -1))) {
          add('route-text-collision', routeName + ' runs through ' + JSON.stringify(run.text), name);
        }
      });
      icons.forEach((icon, iconIndex) => {
        if (points.some((point) => inside(point, box(icon), 1))) {
          add(
            'route-icon-collision',
            routeName + ' passes through ' + elementName(icon, 'icon#' + (iconIndex + 1)),
            name,
          );
        }
      });
    });

    const ink = [...diagram.querySelectorAll('rect, circle, ellipse, polygon, polyline, path, line, image, use')]
      .filter((element) => belongsTo(diagram, element) && visibleBox(element))
      .filter((element) => !element.closest('defs, clipPath, mask'));
    ink.forEach((element, index) => {
      const value = box(element);
      const style = styleFor(element);
      const strokeVisible = style.stroke !== 'none' && style.stroke !== 'transparent' &&
        Number(style.strokeOpacity) > 0 && Number.parseFloat(style.strokeWidth) > 0;
      const matrix = element.getScreenCTM?.();
      const scale = matrix ? Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d)) : 1;
      const stroke = strokeVisible ? (Number.parseFloat(style.strokeWidth) * scale) / 2 : 0;
      const painted = {
        left: value.left - stroke,
        right: value.right + stroke,
        top: value.top - stroke,
        bottom: value.bottom + stroke,
      };
      if (!contains(diagramBox, painted, 0.5)) {
        add('ink-clipped', elementName(element, 'ink#' + (index + 1)) + ' leaves ' + name, name);
      }
    });
  });

  return findings;
}

const tasks = payload.files.flatMap((input) => payload.viewports.map((viewport) => ({ input, viewport })));
const findings = [];
let completed = 0;
for (const task of tasks) {
  const frame = document.createElement('iframe');
  frame.width = task.viewport.width;
  frame.height = task.viewport.height;
  frame.style.display = 'block';
  frame.style.border = '0';
  frame.addEventListener('load', async () => {
    try {
      await Promise.race([
        frame.contentDocument.fonts?.ready || Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
      findings.push(...lintFrame(frame, task.input, task.viewport));
    } catch (error) {
      findings.push({
        category: 'lint-failed',
        diagram: null,
        file: task.input.file,
        message: error?.stack || String(error),
        viewport: task.viewport.name,
      });
    } finally {
      completed += 1;
      if (completed === tasks.length) {
        const result = JSON.stringify({ contexts: tasks.length, findings });
        document.documentElement.setAttribute('${RESULT_ATTRIBUTE}', encode(result));
      }
    }
  }, { once: true });
  frame.srcdoc = '<base href="' + escapeAttribute(task.input.baseHref) + '">' + decode(task.input.source);
  document.body.append(frame);
}
</script>
</body>
</html>`;
}

function extractResult(dump) {
  const match = new RegExp(`${RESULT_ATTRIBUTE}="([^"]+)"`).exec(dump);
  if (!match || match[1] === "pending") {
    throw new Error("Chrome finished before the diagram audit returned a result");
  }
  return Schema.decodeUnknownSync(BrowserResultJson)(Buffer.from(match[1], "base64").toString("utf8"));
}

function runChrome(chrome, arguments_, timeoutMs) {
  return new Promise((resolve, reject) => {
    const browser = spawn(chrome, arguments_, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let resultSeen = false;
    let failure;
    let forceKill;
    const stop = (error) => {
      if (failure || resultSeen) return;
      failure = error;
      browser.kill("SIGTERM");
      forceKill = setTimeout(() => browser.kill("SIGKILL"), 1000);
    };
    const timeout = setTimeout(
      () => stop(new Error(`Chrome did not return a lint result within ${timeoutMs / 1000}s`)),
      timeoutMs,
    );

    browser.stdout.setEncoding("utf8");
    browser.stderr.setEncoding("utf8");
    browser.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > 20 * 1024 * 1024) {
        stop(new Error("Chrome returned more than 20 MB of output"));
        return;
      }
      const match = new RegExp(`${RESULT_ATTRIBUTE}="([^"]+)"`).exec(stdout);
      if (match && match[1] !== "pending" && !resultSeen) {
        resultSeen = true;
        browser.kill("SIGTERM");
        forceKill = setTimeout(() => browser.kill("SIGKILL"), 1000);
      }
    });
    browser.stderr.on("data", (chunk) => { stderr += chunk; });
    browser.on("error", (error) => {
      clearTimeout(timeout);
      clearTimeout(forceKill);
      reject(error);
    });
    browser.on("close", (code) => {
      clearTimeout(timeout);
      clearTimeout(forceKill);
      if (resultSeen) resolve(stdout);
      else reject(failure || new Error(stderr.trim() || `Chrome exited with status ${code}`));
    });
  });
}

function aggregate(findings) {
  const grouped = new Map();
  for (const finding of findings) {
    const key = JSON.stringify([
      finding.file,
      finding.diagram,
      finding.category,
      finding.message,
    ]);
    const current = grouped.get(key) || { ...finding, viewports: [] };
    if (!current.viewports.includes(finding.viewport)) current.viewports.push(finding.viewport);
    delete current.viewport;
    grouped.set(key, current);
  }
  return [...grouped.values()];
}

function printHuman(result) {
  for (const finding of result.findings) {
    const location = finding.diagram ? `${path.basename(finding.file)}:${finding.diagram}` : path.basename(finding.file);
    console.log(
      `ERROR ${finding.category.padEnd(27)} ${location} [${finding.viewports.join(", ")}] ${finding.message}`,
    );
  }
  console.log(
    `\n${result.files} file(s); ${result.contexts} isolated context(s); ` +
      `${result.findings.length} unique error(s); 1 Chrome process`,
  );
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
    for (const file of options.files) {
      if (!existsSync(file)) throw new Error(`input does not exist: ${file}`);
    }
  } catch (error) {
    usage();
    console.error(error.message);
    return 2;
  }

  let temporaryDirectory;
  try {
    const chrome = findChrome(options.browser);
    const files = options.files.map(encodedFile);
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), "diagram-lint-"));
    const harness = path.join(temporaryDirectory, "harness.html");
    const profile = path.join(temporaryDirectory, "chrome-profile");
    writeFileSync(harness, harnessSource(files, options.viewports));
    const dump = await runChrome(chrome, [
      "--headless",
      "--disable-gpu",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-extensions",
      "--disable-sync",
      "--no-first-run",
      "--no-default-browser-check",
      "--proxy-server=http://127.0.0.1:9",
      "--proxy-bypass-list=<-loopback>",
      `--user-data-dir=${profile}`,
      "--virtual-time-budget=2000",
      "--dump-dom",
      pathToFileURL(harness).href,
    ], options.timeoutMs);
    const raw = extractResult(dump);
    const result = {
      browserLaunches: 1,
      contexts: raw.contexts,
      files: options.files.length,
      findings: aggregate(raw.findings),
    };
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else printHuman(result);
    return result.findings.length ? 1 : 0;
  } catch (error) {
    console.error(`diagram lint failed: ${error.message}`);
    return 2;
  } finally {
    if (temporaryDirectory) rmSync(temporaryDirectory, { force: true, recursive: true });
  }
}

process.exitCode = await main();
