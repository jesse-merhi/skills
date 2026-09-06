#!/usr/bin/env node
import { NodeRuntime } from "@effect/platform-node";
import * as Effect from "effect/Effect";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  state: { type: "string", multiple: true }, viewport: { type: "string", multiple: true },
  "output-dir": { type: "string" }, "storage-state": { type: "string" }, help: { type: "boolean" },
  "wait-for": { type: "string" }, "timeout-ms": { type: "string", default: "30000" },
} });
if (values.help || !positionals[0]) {
  console.log("audit-layout.mjs URL [--state NAME=URL] [--viewport WIDTHxHEIGHT] [--wait-for READY-SELECTOR] [--timeout-ms 30000] [--output-dir NEW-DIRECTORY] [--storage-state PRIVATE-PLAYWRIGHT-STATE]\nUses Playwright installed in the current project. Captures screenshots, console errors, and layout together. Run manually against authorized pages; output may contain private UI data. Failed captures remain in captures.json and do not prevent later requested captures.");
  process.exit(values.help ? 0 : 2);
}

const requireFromCwd = createRequire(path.join(process.cwd(), "package.json"));
const timeout = Number(values["timeout-ms"]);
if (!Number.isSafeInteger(timeout) || timeout <= 0) throw new Error("--timeout-ms requires a positive integer");
let chromium;

try {
  ({ chromium } = requireFromCwd("playwright"));
} catch {
  ({ chromium } = requireFromCwd("@playwright/test"));
}

const DEFAULT_VIEWPORTS = [
  { width: 390, height: 844, name: "mobile" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 1440, height: 900, name: "desktop" },
];

const url = positionals[0];
const states = [{ name: "default", url }, ...(values.state ?? []).map(value => {
  const separator = value.indexOf("=");
  if (separator < 1) throw new Error("--state requires NAME=URL");
  return { name: value.slice(0, separator), url: value.slice(separator + 1) };
})];
const viewports = values.viewport?.map(value => {
  const match = /^(\d+)x(\d+)$/u.exec(value);
  if (!match || Number(match[1]) < 100 || Number(match[2]) < 100) throw new Error("--viewport requires WIDTHxHEIGHT, minimum 100x100");
  return { width: Number(match[1]), height: Number(match[2]), name: value };
}) ?? DEFAULT_VIEWPORTS;
const outputDirectory = values["output-dir"] ? path.resolve(values["output-dir"]) : fs.mkdtempSync(path.join(os.tmpdir(), "ui-proof-"));
if (values["output-dir"]) fs.mkdirSync(outputDirectory, { mode: 0o700 });

const program = Effect.acquireUseRelease(
  Effect.tryPromise(() => chromium.launch()),
  (browser) => Effect.tryPromise(async () => {
const results = [];
const captures = [];
for (const state of states) {
for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, storageState: values["storage-state"] });
  context.setDefaultTimeout(timeout);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", error => consoleErrors.push(error.message));
  const capture = { state: state.name, url: state.url, viewport, capturedAt: new Date().toISOString(), consoleErrors, findings: [] };
  try {
  await page.goto(state.url, { waitUntil: "domcontentloaded", timeout });
  if (values["wait-for"]) await page.locator(values["wait-for"]).waitFor({ state: "visible", timeout });
  const screenshot = path.join(outputDirectory, `${captures.length + 1}-${viewport.width}x${viewport.height}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  capture.screenshot = screenshot;

  const audit = await page.evaluate((viewportName) => {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const pageScrollWidth = document.documentElement.scrollWidth;
    const findings = [];

    const selector = [
      "a",
      "button",
      "input",
      "select",
      "textarea",
      "[role='button']",
      "[role='link']",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "label",
      "li",
      "td",
      "th",
      "[class]",
    ].join(",");

    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0
      );
    };

    const textFor = (element) =>
      (element.innerText || element.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100);

    const labelFor = (element) => {
      const id = element.id ? `#${element.id}` : "";
      const cls =
        typeof element.className === "string" && element.className
          ? `.${element.className.trim().replace(/\s+/g, ".")}`.slice(0, 80)
          : "";
      const text = textFor(element);
      return `${element.tagName.toLowerCase()}${id}${cls}${text ? ` "${text}"` : ""}`;
    };

    const interesting = [...document.querySelectorAll(selector)]
      .filter(isVisible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return {
          element,
          rect: {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          style,
          label: labelFor(element),
          text: textFor(element),
        };
      });

    if (pageScrollWidth > viewportWidth + 1) {
      findings.push({
        level: "error",
        type: "page-horizontal-overflow",
        message: `document scrollWidth ${pageScrollWidth}px exceeds viewport ${viewportWidth}px`,
      });
    }

    for (const item of interesting) {
      const { element, rect, style, label, text } = item;
      const overflowX = element.scrollWidth > element.clientWidth + 1;
      const overflowY = element.scrollHeight > element.clientHeight + 1;
      const clipsOverflow =
        style.overflow === "hidden" ||
        style.overflowX === "hidden" ||
        style.overflowY === "hidden" ||
        style.textOverflow === "ellipsis";

      if ((overflowX || overflowY) && text && clipsOverflow) {
        findings.push({
          level: "warning",
          type: "possible-clipped-text",
          selector: label,
          message: `content ${element.scrollWidth}x${element.scrollHeight}px exceeds box ${element.clientWidth}x${element.clientHeight}px`,
        });
      }

      if (rect.left < -1 || rect.right > viewportWidth + 1) {
        findings.push({
          level: "warning",
          type: "element-outside-viewport-x",
          selector: label,
          message: `box left/right ${Math.round(rect.left)}/${Math.round(rect.right)} outside viewport width ${viewportWidth}`,
        });
      }

      if (rect.top < -1 || rect.bottom > viewportHeight + 1) {
        const fixedOrSticky =
          style.position === "fixed" || style.position === "sticky";
        if (!fixedOrSticky && rect.top < viewportHeight) {
          findings.push({
            level: "warning",
            type: "element-outside-viewport-y",
            selector: label,
            message: `box top/bottom ${Math.round(rect.top)}/${Math.round(rect.bottom)} outside viewport height ${viewportHeight}`,
          });
        }
      }

      const isTarget =
        element.matches("button,a,input,select,textarea,[role='button'],[role='link']");
      if (isTarget && (rect.width < 44 || rect.height < 44)) {
        findings.push({
          level: "warning",
          type: "small-touch-target",
          selector: label,
          message: `target is ${Math.round(rect.width)}x${Math.round(rect.height)}px`,
        });
      }
    }

    const overlapCandidates = interesting.filter(
      (item) =>
        item.text ||
        item.element.matches(
          "button,a,input,select,textarea,[role='button'],[role='link'],h1,h2,h3,h4,h5,h6",
        ),
    );

    for (let i = 0; i < overlapCandidates.length; i += 1) {
      for (let j = i + 1; j < overlapCandidates.length; j += 1) {
        const a = overlapCandidates[i];
        const b = overlapCandidates[j];

        if (a.element.contains(b.element) || b.element.contains(a.element)) {
          continue;
        }

        const left = Math.max(a.rect.left, b.rect.left);
        const right = Math.min(a.rect.right, b.rect.right);
        const top = Math.max(a.rect.top, b.rect.top);
        const bottom = Math.min(a.rect.bottom, b.rect.bottom);
        const width = right - left;
        const height = bottom - top;

        if (width <= 1 || height <= 1) {
          continue;
        }

        const area = width * height;
        const minArea = Math.min(
          a.rect.width * a.rect.height,
          b.rect.width * b.rect.height,
        );
        const overlapRatio = area / Math.max(minArea, 1);

        if (overlapRatio > 0.12 && area > 24) {
          findings.push({
            level: "warning",
            type: "sibling-overlap",
            selector: `${a.label} overlaps ${b.label}`,
            message: `overlap area ${Math.round(area)}px (${Math.round(overlapRatio * 100)}% of smaller element)`,
          });
        }
      }
    }

    return {
      viewport: viewportName,
      size: `${viewportWidth}x${viewportHeight}`,
      findings,
    };
  }, viewport.name);

  capture.findings = audit.findings;
  } catch (error) {
    capture.captureError = error instanceof Error ? error.message : String(error);
  } finally {
  capture.finalUrl = page.url();
  captures.push(capture);
  results.push(...capture.findings.map((finding) => ({ ...finding, state: state.name, viewport: `${viewport.width}x${viewport.height}` })),
    ...consoleErrors.map(message => ({ level: "error", type: "console", state: state.name, viewport: `${viewport.width}x${viewport.height}`, message })),
    ...(capture.captureError ? [{ level: "error", type: "capture-failed", state: state.name, viewport: `${viewport.width}x${viewport.height}`, message: capture.captureError }] : []));
  fs.writeFileSync(path.join(outputDirectory, "captures.json"), JSON.stringify(captures, null, 2));
  await context.close();
  }
}
}

const errors = results.filter((result) => result.level === "error");
const warnings = results.filter((result) => result.level === "warning");

console.log(
  JSON.stringify(
    {
      url,
      outputDirectory,
      captures,
      summary: {
        errors: errors.length,
        warnings: warnings.length,
      },
      findings: results,
    },
    null,
    2,
  ),
);

if (errors.length > 0) {
  throw new Error(`layout audit found ${errors.length} error(s)`);
}
  }),
  (browser) => Effect.promise(() => browser.close()),
);

NodeRuntime.runMain(program);
