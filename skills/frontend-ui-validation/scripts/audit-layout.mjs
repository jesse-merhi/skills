#!/usr/bin/env node
import { NodeRuntime } from "@effect/platform-node";
import * as Effect from "effect/Effect";
import path from "node:path";
import { createRequire } from "node:module";

const requireFromCwd = createRequire(path.join(process.cwd(), "package.json"));
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

const url = process.argv[2];

if (!url) {
  console.error("Usage: audit-layout.mjs <url>");
  process.exit(2);
}

const program = Effect.acquireUseRelease(
  Effect.tryPromise(() => chromium.launch()),
  (browser) => Effect.tryPromise(async () => {
const page = await browser.newPage();
const results = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    results.push({
      level: "error",
      type: "console",
      viewport: "all",
      message: message.text(),
    });
  }
});

for (const viewport of DEFAULT_VIEWPORTS) {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });
  await page.goto(url, { waitUntil: "networkidle" });

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

  results.push(...audit.findings.map((finding) => ({ ...finding, viewport: audit.size })));
}

const errors = results.filter((result) => result.level === "error");
const warnings = results.filter((result) => result.level === "warning");

console.log(
  JSON.stringify(
    {
      url,
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
