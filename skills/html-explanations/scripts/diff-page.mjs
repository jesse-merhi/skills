import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const escape = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
export function diffPage({ root, base, head = "HEAD" }) {
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 32_000_000 });
  const resolve = ref => git(["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`]).trim();
  const baseHead = resolve(base);
  const headSha = resolve(head);
  const comparisonBase = git(["merge-base", baseHead, headSha]).trim();
  const files = git(["diff", "--name-only", "-z", comparisonBase, headSha, "--"]).split("\0").filter(Boolean);
  const sections = files.map((file, index) => {
    const patch = git(["diff", "--no-ext-diff", "--no-textconv", "--no-color", "--no-renames", comparisonBase, headSha, "--", file]);
    const digest = createHash("sha256").update(patch).digest("hex");
    const lines = patch.split("\n").map(line => `<span style="display:block;${line.startsWith("+") ? "background:#102b20" : line.startsWith("-") ? "background:#361a20" : ""}">${escape(line) || " "}</span>`).join("");
    return `<details id="file-${index}" open data-path="${escape(file)}" data-digest="${digest}"><summary>${escape(file)}</summary><p>Explain the behavioral purpose of this file after inspecting the diff. No review verdict is implied.</p><pre style="overflow:auto;padding:16px">${lines}</pre></details>`;
  });
  if (resolve(base) !== baseHead || resolve(head) !== headSha) throw new Error("Base or head changed during generation; regenerate from the new revision");
  const template = fs.readFileSync(new URL("../assets/patterns/annotated-diff.html", import.meta.url), "utf8");
  const style = template.match(/<style>([\s\S]*?)<\/style>/u)?.[1];
  if (!style) throw new Error("Annotated diff template has no stylesheet");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Diff walkthrough</title><style>${style}</style><main><h1>Diff walkthrough</h1><p>${escape(base)} → ${escape(head)}. ${files.length} files.</p><p>Head <code>${headSha}</code>; comparison base <code>${comparisonBase}</code>. Generated code-reading draft, not runtime proof or code review. Raw patch headers are retained for source verification.</p>${sections.join("")}</main></html>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values } = parseArgs({ options: { root: { type: "string", default: process.cwd() }, base: { type: "string" }, head: { type: "string", default: "HEAD" }, output: { type: "string" }, help: { type: "boolean" } } });
  if (values.help) console.log("node diff-page.mjs --base DIRECT-BASE [--head HEAD] [--root REPO] --output NEW.html\nLocal revision-pinned annotated-diff draft. Inspect and replace purpose prompts before sharing.");
  else {
    if (!values.base || !values.output) throw new Error("Supply --base and --output");
    fs.writeFileSync(path.resolve(values.output), diffPage(values), { flag: "wx", mode: 0o600 });
    console.log(path.resolve(values.output));
  }
}
