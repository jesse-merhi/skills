import { NodeRuntime, NodeServices } from "@effect/platform-node";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
// The analyzer snapshots large directory trees synchronously inside one Effect;
// Node's Dirent API avoids thousands of Effect allocations without changing lifecycle ownership.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import fs from "node:fs";
import os from "node:os";
// @effect-diagnostics-next-line nodeBuiltinImport:off
import path from "node:path";
import { pathToFileURL } from "node:url";

import { checkedText } from "../../../packages/effect-cli/CheckedProcess.ts";
import { exists, expandHome, parseFrontmatter, pluginPrefixFor, sanitizeSingleLine, walkFiles } from "../../../packages/skill-catalog/SkillFiles.ts";

type Skill = {
  name: string;
  baseName: string;
  description: string;
  path: string;
  realPath: string;
  dir: string;
  root: string;
  realRoot: string;
  scope: string;
  enabled: boolean;
  descChars: number;
  lineChars: number;
  lineBytes: number;
  bodyHash: string;
  bodyKey: string;
  descKey: string;
  renderPath: string;
  order: number;
  live: boolean;
};

type Usage = {
  dollar: number;
  fileRead: number;
  text: number;
};

type Budget = {
  model: string;
  contextTokens: number;
  contextSource: string;
  effectivePercent: number | null;
  effectiveContextTokens: number | null;
  budgetPercent: number;
  budgetTokens: number;
  effectiveBudgetTokens: number | null;
  renderedLineChars: number;
  unbudgetedFullTokens: number;
  minimumTokens: number;
  budgetedTokens: number;
  charsPerToken: number;
  unbudgetedBudgetUsedRatio: number;
  budgetedBudgetUsedRatio: number;
  effectiveBudgetUsedRatio: number | null;
  unbudgetedContextUsedRatio: number;
  budgetedContextUsedRatio: number;
  effectiveContextUsedRatio: number | null;
  remainingBudgetTokens: number;
  remainingEffectiveBudgetTokens: number | null;
  includedSkills: number;
  omittedSkills: number;
  truncatedDescriptionChars: number;
  truncatedDescriptionCount: number;
};

type LivePrompt = {
  prompt: string;
  roots: Map<string, string>;
  skillLines: string[];
};

const home = os.homedir();
const args = new Set(process.argv.slice(2));

function argValue(name: string, fallback: string): string {
  const raw = process.argv.slice(2);
  const index = raw.indexOf(name);
  const value = raw[index + 1];
  return index >= 0 && value !== undefined ? value : fallback;
}

const months = Number(argValue("--months", "3"));
const noLogs = args.has("--no-logs");
const deepLogs = args.has("--deep-logs");
const json = args.has("--json");
const includeAll = args.has("--all");
const rootOnly = args.has("--root-only");
const noLive = args.has("--no-live") || rootOnly;
const modelOverride = argValue("--model", "");
const budgetPercent = Number(argValue("--budget-percent", "2"));
const contextTokensOverride = argValue("--context-tokens", "");
const charsPerToken = Number(argValue("--chars-per-token", "4"));
const maxLogBytes = Number(argValue("--max-log-mb", "300")) * 1024 * 1024;
const cutoffMs = Date.now() - Math.max(0, months) * 31 * 24 * 60 * 60 * 1000;
const extraRoots = process.argv
  .slice(2)
  .flatMap((arg, index, all) => {
    const value = all[index + 1];
    return arg === "--root" && value && !value.startsWith("--") ? [value] : [];
  });

function numberArg(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const ModelCache = Schema.fromJsonString(Schema.Json);
const isJsonArray = (value: Schema.Json): value is Schema.JsonArray => Array.isArray(value);

function decodeJson(input: string): Schema.Json | undefined {
  const decoded = Schema.decodeUnknownOption(ModelCache)(input);
  return Option.isSome(decoded) ? decoded.value : undefined;
}

function findModelRecord(value: Schema.Json, target: string): Schema.JsonObject | null {
  if (isJsonArray(value)) {
    for (const item of value) {
      const found = findModelRecord(item, target);
      if (found) return found;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  const names = [value.slug, value.id, value.model, value.name]
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.toLowerCase());
  if (names.includes(target.toLowerCase())) return value;
  for (const item of Object.values(value)) {
    const found = findModelRecord(item, target);
    if (found) return found;
  }
  return null;
}

function firstModelName(value: Schema.Json): string | null {
  if (isJsonArray(value)) {
    for (const item of value) {
      const found = firstModelName(item);
      if (found) return found;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  for (const key of ["slug", "id", "model", "name"] as const) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }
  for (const item of Object.values(value)) {
    const found = firstModelName(item);
    if (found) return found;
  }
  return null;
}

function codexModelName(): string {
  if (modelOverride) return modelOverride;

  const config = path.join(home, ".codex/config.toml");
  if (exists(config)) {
    const match = /^\s*model\s*=\s*["']([^"']+)["']/m.exec(fs.readFileSync(config, "utf8"));
    if (match?.[1]) return match[1];
  }

  const cache = path.join(home, ".codex/models_cache.json");
  if (exists(cache)) {
    const decoded = Schema.decodeUnknownOption(ModelCache)(fs.readFileSync(cache, "utf8"));
    if (Option.isSome(decoded)) return firstModelName(decoded.value) ?? "current-configured-model";
  }

  return "current-configured-model";
}

function codexModelContext(modelName: string): {
  tokens: number;
  source: string;
  effectivePercent: number | null;
} {
  const override = numberArg(contextTokensOverride, 0);
  if (override > 0) return { tokens: override, source: "--context-tokens", effectivePercent: null };

  const cache = path.join(home, ".codex/models_cache.json");
  if (exists(cache)) {
    try {
      const decoded = Schema.decodeUnknownOption(ModelCache)(fs.readFileSync(cache, "utf8"));
      const record = Option.isSome(decoded) ? findModelRecord(decoded.value, modelName) : null;
      const tokens = Number(record?.context_window);
      const effectivePercent = Number(record?.effective_context_window_percent);
      if (Number.isFinite(tokens) && tokens > 0) {
        return {
          tokens,
          source: cache,
          effectivePercent: Number.isFinite(effectivePercent) && effectivePercent > 0 ? effectivePercent : null,
        };
      }
    } catch {}
  }

  return { tokens: 128_000, source: "fallback:conservative-context", effectivePercent: null };
}

function findSkillsPrompt(value: unknown): string | null {
  if (typeof value === "string") {
    return value.includes("<skills_instructions>") && value.includes("### Available skills") ? value : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSkillsPrompt(item);
      if (found) return found;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  for (const item of Object.values(value)) {
    const found = findSkillsPrompt(item);
    if (found) return found;
  }
  return null;
}

export function parseLiveSkillsPrompt(raw: string): LivePrompt {
  const parsed = decodeJson(raw);
  if (parsed === undefined) throw new Error("Codex prompt output was not valid JSON");
  const prompt = findSkillsPrompt(parsed);
  if (!prompt) throw new Error("Codex prompt output did not contain skills instructions");

  const roots = new Map<string, string>();
  const skillLines: string[] = [];
  let section = "";
  for (const line of prompt.split(/\r?\n/)) {
    if (line === "### Skill roots") {
      section = "roots";
      continue;
    }
    if (line === "### Available skills") {
      section = "skills";
      continue;
    }
    if (line === "### How to use skills") {
      section = "";
      continue;
    }
    if (section === "roots") {
      const match = /^- `(r\d+)` = `([^`]+)`$/.exec(line);
      if (match?.[1] && match[2]) roots.set(match[1], match[2]);
    } else if (section === "skills" && line.startsWith("- ")) {
      skillLines.push(line);
    }
  }
  if (skillLines.length === 0) throw new Error("Codex prompt output contained no skills");
  return { prompt, roots, skillLines };
}

const livePrompt = Effect.fn("SkillCleaner.livePrompt")(function*() {
  if (noLive) return null;
  return yield* checkedText("codex", ["debug", "prompt-input"], { cwd: process.cwd() }).pipe(
    Effect.map(parseLiveSkillsPrompt),
    Effect.catch((error) => {
      const fallback = Effect.succeed<LivePrompt | null>(null);
      return json
        ? fallback
        : Console.error(`skill-cleaner: live Codex inventory unavailable (${error.message}); using filesystem scan`).pipe(
            Effect.andThen(fallback),
          );
    }),
  );
});

function resolveLivePath(locator: string, roots: Map<string, string>): string {
  const match = /^(r\d+)\/(.+)$/.exec(locator);
  return match?.[1] && match[2]
    ? path.join(roots.get(match[1]) ?? match[1], match[2])
    : expandHome(locator, home);
}

function parseLiveSkills(live: LivePrompt): Skill[] {
  return live.skillLines.flatMap((line, order) => {
    const match = /^- (\S+):(?: (.*?))? \(file: (.+)\)$/.exec(line);
    if (!match?.[1] || !match[3]) return [];
    const name = match[1];
    const renderPath = match[3];
    const file = resolveLivePath(renderPath, live.roots);
    if (!exists(file)) return [];
    const parsed = parseFrontmatter(file);
    if (!parsed) return [];
    const description = parsed.description ?? "";
    const realPath = fs.realpathSync(file);
    const root = [...live.roots.values()]
      .filter((candidate) => realPath === candidate || realPath.startsWith(`${candidate}${path.sep}`))
      .sort((a, b) => b.length - a.length)[0] ?? path.dirname(file);
    const baseName = name.split(":").at(-1) ?? name;
    const bodyKey = normalizeWords(parsed.body);
    return [{
      name,
      baseName,
      description,
      path: file,
      realPath,
      dir: path.dirname(file),
      root,
      realRoot: exists(root) ? fs.realpathSync(root) : root,
      scope: skillRootScope(root),
      enabled: true,
      descChars: [...description].length,
      lineChars: [...`${line}\n`].length,
      lineBytes: Buffer.byteLength(`${line}\n`, "utf8"),
      bodyHash: fnv1a(bodyKey),
      bodyKey,
      descKey: normalizeWords(description),
      renderPath,
      order,
      live: true,
    }];
  });
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeWords(input: string): string {
  return input
    .toLowerCase()
    .replace(/[`"'’().,;:!?/\\[\]{}_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(input: string): Set<string> {
  return new Set(normalizeWords(input).split(" ").filter((word) => word.length >= 2));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}

function skillRootScope(root: string): string {
  const normalized = root.split(path.sep).join("/");
  if (normalized.includes("/.codex/plugins/cache")) return "codex-plugin";
  if (normalized.includes("/.codex/skills")) return "codex";
  if (normalized.includes("/.agents/skills")) return "repo";
  return "extra";
}

function deletePriority(skill: Skill): number {
  if (skill.path.includes("/.codex/skills/.system/")) return 0;
  if (skill.path.includes("/.codex/skills/")) return 1;
  if (skill.path.includes("/.codex/plugins/cache/") && !skill.path.includes("/plugin-install-")) return 2;
  if (skill.path.includes("/.codex/plugins/cache/")) return 3;
  if (skill.realPath.includes("/.agents/skills/")) return 4;
  return 5;
}

function preferredKeepSkill(list: Skill[]): Skill {
  return [...list].sort((a, b) => {
    const byPriority = deletePriority(a) - deletePriority(b);
    if (byPriority !== 0) return byPriority;
    return a.realPath.length - b.realPath.length || a.realPath.localeCompare(b.realPath);
  })[0]!;
}

function displayPathPriority(skill: Skill): number {
  if (skill.path === skill.realPath) return 0;
  return 1;
}

function preferredDisplaySkill(a: Skill, b: Skill): Skill {
  const byDisplay = displayPathPriority(a) - displayPathPriority(b);
  if (byDisplay < 0) return a;
  if (byDisplay > 0) return b;
  return a.path.length <= b.path.length ? a : b;
}

function disabledPluginMatches(disabledPlugin: string, pluginPrefix: string): boolean {
  return disabledPlugin === pluginPrefix || disabledPlugin.startsWith(`${pluginPrefix}@`);
}

function configState(): { disabledPaths: Set<string>; disabledNames: Set<string>; disabledPlugins: Set<string> } {
  const disabledPaths = new Set<string>();
  const disabledNames = new Set<string>();
  const disabledPlugins = new Set<string>();
  const config = path.join(home, ".codex/config.toml");
  if (!exists(config)) return { disabledPaths, disabledNames, disabledPlugins };
  const lines = fs.readFileSync(config, "utf8").split(/\r?\n/);
  let block = "";
  let currentPath = "";
  let currentName = "";
  for (const line of lines) {
    const skillBlock = /^\[\[skills\.config\]\]/.test(line);
    const pluginBlock = /^\[plugins\."([^"]+)"\]/.exec(line);
    if (skillBlock) {
      block = "skill";
      currentPath = "";
      currentName = "";
      continue;
    }
    if (pluginBlock) {
      block = `plugin:${pluginBlock[1]}`;
      continue;
    }
    if (/^\[/.test(line)) {
      block = "";
      currentPath = "";
      currentName = "";
      continue;
    }
    if (block === "skill") {
      const pathMatch = /^path\s*=\s*"([^"]+)"/.exec(line);
      const nameMatch = /^name\s*=\s*"([^"]+)"/.exec(line);
      if (pathMatch) currentPath = expandHome(pathMatch[1] ?? "", home);
      if (nameMatch) currentName = nameMatch[1] ?? "";
      if (/^enabled\s*=\s*false/.test(line)) {
        if (currentPath) disabledPaths.add(currentPath);
        if (currentName) disabledNames.add(currentName);
      }
    } else if (block.startsWith("plugin:") && /^enabled\s*=\s*false/.test(line)) {
      disabledPlugins.add(block.slice("plugin:".length));
    }
  }
  return { disabledPaths, disabledNames, disabledPlugins };
}

export function discoverRoots(baseHome = home, providedRoots = extraRoots, exclusive = rootOnly): string[] {
  const rootsByRealPath = new Map<string, string>();
  const roots = providedRoots.map((root) => root.replace(/^~(?=$|\/)/, baseHome));
  const candidates = exclusive
    ? roots
    : [
        path.join(baseHome, ".codex/skills"),
        path.join(baseHome, ".codex/plugins/cache"),
        path.join(baseHome, "Projects/agent-scripts/skills"),
        ...roots,
      ];
  candidates.forEach((root) => {
    if (!exists(root)) return;
    const real = fs.realpathSync(root);
    const current = rootsByRealPath.get(real);
    if (!current || root.length < current.length) rootsByRealPath.set(real, root);
  });
  const projects = path.join(baseHome, "Projects");
  if (!exclusive && exists(projects)) {
    for (const entry of fs.readdirSync(projects, { withFileTypes: true })) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      const skillRoot = path.join(projects, entry.name, ".agents/skills");
      if (exists(skillRoot)) {
        const real = fs.realpathSync(skillRoot);
        const current = rootsByRealPath.get(real);
        if (!current || skillRoot.length < current.length) rootsByRealPath.set(real, skillRoot);
      }
    }
  }
  return [...rootsByRealPath.values()].sort();
}

function discoverSkills(): Skill[] {
  const { disabledPaths, disabledNames, disabledPlugins } = configState();
  const skillsByRealPath = new Map<string, Skill>();
  for (const root of discoverRoots()) {
    for (const file of walkFiles(root, (candidate) => path.basename(candidate) === "SKILL.md", 10)) {
      const parsed = parseFrontmatter(file);
      if (!parsed) continue;
      const baseName = parsed.name || path.basename(path.dirname(file));
      const pluginPrefix = pluginPrefixFor(file);
      const name = pluginPrefix ? `${pluginPrefix}:${baseName}` : baseName;
      const description = parsed.description ?? "";
      const rendered = description
        ? `- ${name}: ${description} (file: ${file})`
        : `- ${name}: (file: ${file})`;
      const disabledByPath = disabledPaths.has(file);
      const disabledByName = disabledNames.has(name);
      const disabledByPlugin =
        pluginPrefix != null && [...disabledPlugins].some((plugin) => disabledPluginMatches(plugin, pluginPrefix));
      const bodyKey = normalizeWords(parsed.body);
      const skill: Skill = {
        name,
        baseName,
        description,
        path: file,
        realPath: fs.realpathSync(file),
        dir: path.dirname(file),
        root,
        realRoot: fs.realpathSync(root),
        scope: skillRootScope(root),
        enabled: !disabledByPath && !disabledByName && !disabledByPlugin,
        descChars: [...description].length,
        lineChars: [...`${rendered}\n`].length,
        lineBytes: Buffer.byteLength(`${rendered}\n`, "utf8"),
        bodyHash: fnv1a(bodyKey),
        bodyKey,
        descKey: normalizeWords(description),
        renderPath: file,
        order: Number.MAX_SAFE_INTEGER,
        live: false,
      };
      const existing = skillsByRealPath.get(skill.realPath);
      skillsByRealPath.set(skill.realPath, existing ? preferredDisplaySkill(existing, skill) : skill);
    }
  }
  return [...skillsByRealPath.values()];
}

function recentLogFiles(): string[] {
  if (noLogs) return [];
  const files = new Set<string>();
  const roots = [path.join(home, ".codex/sessions")];
  if (deepLogs) {
    roots.push(
      path.join(home, ".codex/archived_sessions"),
      path.join(home, ".openclaw"),
      path.join(home, ".clawd"),
    );
  }
  const history = path.join(home, ".codex/history.jsonl");
  if (exists(history)) files.add(history);
  for (const root of roots) {
    for (const file of walkRecentFiles(root, (candidate) => candidate.endsWith(".jsonl") || candidate.endsWith(".log"), 8)) {
      try {
        if (fs.statSync(file).mtimeMs >= cutoffMs) files.add(file);
      } catch {}
    }
  }
  return [...files].sort();
}

function walkRecentFiles(root: string, predicate: (file: string) => boolean, maxDepth = 8): string[] {
  const out: string[] = [];
  function walk(dir: string, depth: number) {
    if (depth > maxDepth) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const file = path.join(dir, entry.name);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(file);
      } catch {
        continue;
      }
      if (entry.isDirectory()) {
        if (depth > 0 && stat.mtimeMs < cutoffMs) continue;
        walk(file, depth + 1);
      } else if (entry.isFile() && stat.mtimeMs >= cutoffMs && predicate(file)) {
        out.push(file);
      }
    }
  }
  if (exists(root)) walk(root, 0);
  return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function messageText(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(messageText);
  if (!isRecord(value)) return [];
  if (value.type === "input_text" && typeof value.text === "string") return [value.text];
  return Object.values(value).flatMap(messageText);
}

export function usageEvidence(record: Record<string, unknown>): { callArgs?: string; userText?: string } {
  const payload = record.payload;
  if (record.type === "response_item" && isRecord(payload)) {
    if (payload.type === "function_call") {
      return { callArgs: typeof payload.arguments === "string" ? payload.arguments : "" };
    }
    if (payload.type === "custom_tool_call") {
      return { callArgs: typeof payload.input === "string" ? payload.input : "" };
    }
  }
  if (typeof record.session_id === "string" && typeof record.text === "string" && typeof record.ts === "number") {
    return { userText: record.text };
  }
  const isUser = isRecord(payload) && (
    (record.type === "response_item" && payload.type === "message" && payload.role === "user") ||
    (record.type === "event_msg" && payload.type === "user_message")
  );
  return isUser ? { userText: messageText(payload).join("\n") } : {};
}

function collectWorkingDirectories(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectWorkingDirectories);
  if (!isRecord(value)) return [];
  const current = [value.workdir, value.cwd].filter((item): item is string => typeof item === "string");
  return [...current, ...Object.values(value).flatMap(collectWorkingDirectories)];
}

export function referencedSkillPaths(callArgs: string): string[] {
  const parsed: unknown = decodeJson(callArgs) ?? callArgs;
  const texts = typeof parsed === "string" ? [parsed] : messageText(parsed);
  const workdirs = collectWorkingDirectories(parsed).map((workdir) => expandHome(workdir, home));
  const paths = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(/(?:^|[\s"'`=])((?:\/|\.{1,2}\/)?[^\s"'`]*\/SKILL\.md)\b/g)) {
      const locator = expandHome(match[1] ?? "", home);
      if (!locator) continue;
      if (path.isAbsolute(locator)) {
        paths.add(path.normalize(locator));
      } else {
        for (const workdir of workdirs) paths.add(path.resolve(workdir, locator));
      }
    }
  }
  return [...paths];
}

function applyUserMentions(userText: string, aliases: Map<string, string[]>, usage: Map<string, Usage>): void {
  const dollarCounts = countTokens(
    [...userText.matchAll(/\$([A-Za-z][A-Za-z0-9_.:-]{1,80})/g)].map((match) => (match[1] ?? "").toLowerCase()),
  );
  const textCounts = countTokens(
    [...userText.matchAll(/\b(?:use|using|load|read)\s+`?\$?([A-Za-z][A-Za-z0-9_.:-]{1,80})`?/gi)]
      .map((match) => (match[1] ?? "").toLowerCase()),
  );
  for (const [realPath, names] of aliases) {
    const item = usage.get(realPath);
    if (!item) continue;
    for (const candidate of names) {
      item.dollar += dollarCounts.get(candidate) ?? 0;
      item.text += textCounts.get(candidate) ?? 0;
    }
  }
}

export function plainLogSkillReads(text: string): string[] {
  return [...text.matchAll(
    /\b(?:cat|sed|head|tail|less|open|read)\b[^\r\n]{0,500}?(?:\.agents\/)?skills\/([^/"'`\\\s]+)\/SKILL\.md/gi,
  )].map((match) => (match[1] ?? "").toLowerCase());
}

function scanUsage(skills: Skill[], logFiles: string[]): Map<string, Usage> {
  const uniqueSkills = [...new Map(skills.map((skill) => [skill.realPath, skill])).values()];
  const aliases = new Map<string, string[]>();
  for (const skill of uniqueSkills) {
    const values = new Set([skill.name, skill.baseName, skill.name.split(":").at(-1) ?? skill.name]);
    aliases.set(skill.realPath, [...values].map((value) => value.toLowerCase()));
  }
  const usage = new Map<string, Usage>();
  for (const skill of uniqueSkills) usage.set(skill.realPath, { dollar: 0, fileRead: 0, text: 0 });
  let consumedBytes = 0;
  for (const file of logFiles) {
    let text = "";
    try {
      const stat = fs.statSync(file);
      if (stat.size > 150 * 1024 * 1024) continue;
      if (consumedBytes + stat.size > maxLogBytes) break;
      consumedBytes += stat.size;
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const plainLines: string[] = [];
    for (const line of text.split(/\r?\n/)) {
      const parsed = decodeJson(line);
      if (!isRecord(parsed)) {
        plainLines.push(line);
        continue;
      }
      const evidence = usageEvidence(parsed);
      if (evidence.callArgs !== undefined) {
        const referencedPaths = new Set(
          referencedSkillPaths(evidence.callArgs).flatMap((referencedPath) => {
            try {
              return [referencedPath, fs.realpathSync(referencedPath)];
            } catch {
              return [referencedPath];
            }
          }),
        );
        for (const skill of uniqueSkills) {
          if (
            evidence.callArgs.includes(skill.path) ||
            evidence.callArgs.includes(skill.realPath) ||
            referencedPaths.has(skill.path) ||
            referencedPaths.has(skill.realPath)
          ) {
            const item = usage.get(skill.realPath);
            if (item) item.fileRead++;
          }
        }
        continue;
      }
      if (evidence.userText !== undefined) applyUserMentions(evidence.userText, aliases, usage);
    }
    if (plainLines.length > 0) {
      const plainText = plainLines.join("\n");
      applyUserMentions(plainText, aliases, usage);
      const pathCounts = countTokens(plainLogSkillReads(plainText));
      for (const [realPath, names] of aliases) {
        const item = usage.get(realPath);
        if (!item) continue;
        for (const candidate of names) item.fileRead += pathCounts.get(candidate) ?? 0;
      }
    }
  }
  return usage;
}

function countTokens(values: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return map;
}

export function compactDescription(description: string, maxChars = 110): string {
  let draft = sanitizeSingleLine(description)
    .replace(/^Use this skill alongside ([A-Za-z0-9_.:-]+) when the task involves /i, "$1 + workflow: ")
    .replace(/^Use this skill whenever /i, "")
    .replace(/^Use this skill when /i, "")
    .replace(/^Use when /i, "")
    .replace(/^Trigger whenever the user asks to /i, "")
    .replace(/^This is the preferred workflow skill whenever /i, "")
    .replace(/\bthe user wants to\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const firstSentence = draft.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  if (firstSentence && firstSentence.length >= 35) draft = firstSentence;
  if ([...draft].length <= maxChars) return draft;
  const prefix = [...draft].slice(0, maxChars - 3).join("");
  const boundary = Math.max(prefix.lastIndexOf(";"), prefix.lastIndexOf(","), prefix.lastIndexOf(" "));
  return `${prefix.slice(0, boundary >= maxChars * 0.6 ? boundary : prefix.length).trimEnd()}...`;
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const value = key(item);
    map.set(value, [...(map.get(value) ?? []), item]);
  }
  return map;
}

function similarity(a: Skill, b: Skill): { description: number; body: number; overall: number } {
  const description = jaccard(wordSet(a.description), wordSet(b.description));
  const body = a.bodyHash === b.bodyHash ? 1 : jaccard(wordSet(a.bodyKey), wordSet(b.bodyKey));
  return {
    description,
    body,
    overall: body * 0.8 + description * 0.2,
  };
}

function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatOnePct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function tokenCost(text: string): number {
  return Math.ceil(Buffer.byteLength(text, "utf8") / 4);
}

function skillOrderRank(skill: Skill): number {
  if (skill.path.includes("/.codex/skills/.system/")) return 0;
  if (skill.scope === "codex-plugin") return 1;
  if (skill.scope === "repo") return 2;
  return 3;
}

function orderedSkillsForBudget(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) => {
    if (a.live && b.live) return a.order - b.order;
    const byScope = skillOrderRank(a) - skillOrderRank(b);
    if (byScope !== 0) return byScope;
    return a.name.localeCompare(b.name) || a.path.localeCompare(b.path);
  });
}

function renderSkillLine(skill: Skill, description: string): string {
  return description
    ? `- ${skill.name}: ${description} (file: ${skill.renderPath})`
    : `- ${skill.name}: (file: ${skill.renderPath})`;
}

function renderSkillDescriptionPrefix(skill: Skill, descriptionChars: number): string {
  if (descriptionChars <= 0) return "";
  return [...skill.description].slice(0, descriptionChars).join("");
}

function lineTokenCost(line: string): number {
  return tokenCost(`${line}\n`);
}

function minimumLineTokenCost(skill: Skill): number {
  return lineTokenCost(renderSkillLine(skill, ""));
}

function fullLineTokenCost(skill: Skill): number {
  return lineTokenCost(renderSkillLine(skill, skill.description));
}

function extraDescriptionCosts(skill: Skill): number[] {
  const minimumLine = renderSkillLine(skill, "");
  const minimumBytes = Buffer.byteLength(`${minimumLine}\n`, "utf8");
  const minimumCost = Math.ceil(minimumBytes / 4);
  const costs = [0];
  let prefixBytes = 0;
  for (const char of skill.description) {
    prefixBytes += Buffer.byteLength(char, "utf8");
    const renderedBytes = minimumBytes + prefixBytes + 1;
    costs.push(Math.ceil(renderedBytes / 4) - minimumCost);
  }
  return costs;
}

function codexBudgetedSkillCost(skills: Skill[], budgetTokens: number): {
  fullTokens: number;
  minimumTokens: number;
  budgetedTokens: number;
  includedSkills: number;
  omittedSkills: number;
  truncatedDescriptionChars: number;
  truncatedDescriptionCount: number;
} {
  const ordered = orderedSkillsForBudget(skills);
  const fullTokens = ordered.reduce((sum, skill) => sum + fullLineTokenCost(skill), 0);
  if (fullTokens <= budgetTokens) {
    return {
      fullTokens,
      minimumTokens: ordered.reduce((sum, skill) => sum + minimumLineTokenCost(skill), 0),
      budgetedTokens: fullTokens,
      includedSkills: ordered.length,
      omittedSkills: 0,
      truncatedDescriptionChars: 0,
      truncatedDescriptionCount: 0,
    };
  }

  const minimumTokens = ordered.reduce((sum, skill) => sum + minimumLineTokenCost(skill), 0);
  if (minimumTokens <= budgetTokens) {
    const remainingByIndex = ordered.map((skill) => [...skill.description].length);
    const allocatedByIndex = ordered.map(() => 0);
    const currentExtraCosts = ordered.map(() => 0);
    const extraCostsByIndex = ordered.map(extraDescriptionCosts);
    let remaining = budgetTokens - minimumTokens;
    while (true) {
      let changed = false;
      for (let index = 0; index < ordered.length; index++) {
        const allocated = allocatedByIndex[index] ?? 0;
        const remainingChars = remainingByIndex[index] ?? 0;
        const currentCost = currentExtraCosts[index] ?? 0;
        if (allocated >= remainingChars) continue;
        const nextChars = allocated + 1;
        const nextCost = extraCostsByIndex[index]?.[nextChars] ?? currentCost;
        const delta = nextCost - currentCost;
        if (delta <= remaining) {
          allocatedByIndex[index] = nextChars;
          currentExtraCosts[index] = nextCost;
          remaining -= delta;
          changed = true;
        }
      }
      if (!changed) break;
    }

    const rendered = ordered.map((skill, index) =>
      renderSkillLine(skill, renderSkillDescriptionPrefix(skill, allocatedByIndex[index] ?? 0))
    );
    const truncatedDescriptionChars = ordered.reduce(
      (sum, skill, index) => sum + Math.max(0, [...skill.description].length - (allocatedByIndex[index] ?? 0)),
      0,
    );
    const truncatedDescriptionCount = ordered.filter(
      (skill, index) => (allocatedByIndex[index] ?? 0) < [...skill.description].length,
    ).length;
    return {
      fullTokens,
      minimumTokens,
      budgetedTokens: rendered.reduce((sum, line) => sum + lineTokenCost(line), 0),
      includedSkills: ordered.length,
      omittedSkills: 0,
      truncatedDescriptionChars,
      truncatedDescriptionCount,
    };
  }

  let budgetedTokens = 0;
  let includedSkills = 0;
  let omittedSkills = 0;
  let truncatedDescriptionChars = 0;
  let truncatedDescriptionCount = 0;
  for (const skill of ordered) {
    const cost = minimumLineTokenCost(skill);
    if (budgetedTokens + cost <= budgetTokens) {
      budgetedTokens += cost;
      includedSkills++;
    } else {
      omittedSkills++;
    }
    const descriptionChars = [...skill.description].length;
    truncatedDescriptionChars += descriptionChars;
    if (descriptionChars > 0) truncatedDescriptionCount++;
  }
  return {
    fullTokens,
    minimumTokens,
    budgetedTokens,
    includedSkills,
    omittedSkills,
    truncatedDescriptionChars,
    truncatedDescriptionCount,
  };
}

function skillBudget(skills: Skill[], metadataOverheadTokens = 0): Budget {
  const model = codexModelName();
  const context = codexModelContext(model);
  const tokenRatio = numberArg(String(charsPerToken), 4);
  const percent = numberArg(String(budgetPercent), 2);
  const renderedLineChars = skills.reduce((sum, skill) => sum + skill.lineChars, 0);
  const effectiveContextTokens = context.effectivePercent
    ? Math.floor(context.tokens * (context.effectivePercent / 100))
    : null;
  const budgetTokens = Math.floor(context.tokens * (percent / 100));
  const effectiveBudgetTokens = effectiveContextTokens
    ? Math.floor(effectiveContextTokens * (percent / 100))
    : null;
  const codexCost = codexBudgetedSkillCost(skills, Math.max(1, budgetTokens - metadataOverheadTokens));
  const fullTokens = codexCost.fullTokens + metadataOverheadTokens;
  const minimumTokens = codexCost.minimumTokens + metadataOverheadTokens;
  const budgetedTokens = codexCost.budgetedTokens + metadataOverheadTokens;
  return {
    model,
    contextTokens: context.tokens,
    contextSource: context.source,
    effectivePercent: context.effectivePercent,
    effectiveContextTokens,
    budgetPercent: percent,
    budgetTokens,
    effectiveBudgetTokens,
    renderedLineChars,
    unbudgetedFullTokens: fullTokens,
    minimumTokens,
    budgetedTokens,
    charsPerToken: tokenRatio,
    unbudgetedBudgetUsedRatio: fullTokens / budgetTokens,
    budgetedBudgetUsedRatio: budgetedTokens / budgetTokens,
    effectiveBudgetUsedRatio: effectiveBudgetTokens ? budgetedTokens / effectiveBudgetTokens : null,
    unbudgetedContextUsedRatio: fullTokens / context.tokens,
    budgetedContextUsedRatio: budgetedTokens / context.tokens,
    effectiveContextUsedRatio: effectiveContextTokens ? budgetedTokens / effectiveContextTokens : null,
    remainingBudgetTokens: budgetTokens - budgetedTokens,
    remainingEffectiveBudgetTokens: effectiveBudgetTokens ? effectiveBudgetTokens - budgetedTokens : null,
    includedSkills: codexCost.includedSkills,
    omittedSkills: codexCost.omittedSkills,
    truncatedDescriptionChars: codexCost.truncatedDescriptionChars,
    truncatedDescriptionCount: codexCost.truncatedDescriptionCount,
  };
}

function isLikelyCopy(score: { description: number; body: number }): boolean {
  return score.body >= 0.95 || (score.body >= 0.85 && score.description >= 0.85);
}

function duplicateDeleteSuggestions(groups: [string, Skill[]][]): string[] {
  const lines: string[] = [];
  for (const [name, list] of groups.slice(0, 80)) {
    const keep = preferredKeepSkill(list);
    const candidates = list
      .filter((skill) => skill.realPath !== keep.realPath)
      .map((skill) => ({ skill, score: similarity(keep, skill) }))
      .filter(({ score }) => isLikelyCopy(score))
      .sort((a, b) => b.score.body - a.score.body || b.score.description - a.score.description);
    if (candidates.length === 0) continue;
    lines.push(`- ${name}`);
    lines.push(`  keep: ${keep.scope}: ${keep.path}`);
    for (const { skill, score } of candidates) {
      lines.push(
        `  delete: ${skill.scope}: ${skill.path} (similarity body=${formatPct(score.body)}, description=${formatPct(score.description)})`,
      );
    }
  }
  return lines.length ? lines : ["- none"];
}

function liveMetadataOverhead(live: LivePrompt | null): number {
  if (!live) return 0;
  return [...live.roots.entries()].reduce(
    (sum, [alias, root]) => sum + tokenCost(`- \`${alias}\` = \`${root}\`\n`),
    0,
  );
}

function usageForSkill(usage: Map<string, Usage>, skill: Skill): Usage {
  return usage.get(skill.realPath) ?? { dollar: 0, fileRead: 0, text: 0 };
}

function render(
  discovered: Skill[],
  selected: Skill[],
  usage: Map<string, Usage>,
  logFiles: string[],
  live: LivePrompt | null,
): string {
  const considered = includeAll ? discovered : selected;
  const roots = groupBy(discovered, (skill) => skill.root);
  const duplicatePool = includeAll ? discovered : discovered.filter((skill) => skill.enabled);
  const byBase = [...groupBy(duplicatePool, (skill) => skill.baseName.toLowerCase()).entries()].filter(([, list]) => list.length > 1);
  const byBody = [...groupBy(duplicatePool, (skill) => skill.bodyHash).entries()].filter(([hash, list]) => hash !== "811c9dc5" && list.length > 1);
  const longDescriptions = considered
    .filter((skill) => skill.descChars >= 110 || skill.lineChars >= 180)
    .sort((a, b) => b.descChars - a.descChars)
    .slice(0, 30);
  const unused = considered
    .filter((skill) => {
      const item = usageForSkill(usage, skill);
      return item.dollar + item.fileRead + item.text === 0;
    })
    .filter((skill) => !["codex", "codex-plugin"].includes(skill.scope))
    .sort((a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name))
    .slice(0, 80);
  const totalLineChars = considered.reduce((sum, skill) => sum + skill.lineChars, 0);
  const totalDescChars = considered.reduce((sum, skill) => sum + skill.descChars, 0);
  const budget = skillBudget(considered, liveMetadataOverhead(live));
  const lines: string[] = [];
  lines.push("# Skill Cleaner Report", "");
  lines.push(`generated: ${new Date().toISOString()}`);
  lines.push(`months: ${months}`);
  lines.push(`inventory_source: ${live ? "codex debug prompt-input" : "filesystem fallback"}`);
  lines.push(`skills: ${discovered.length} discovered, ${selected.length} live, ${considered.length} considered`);
  lines.push(`description_chars: ${totalDescChars}`);
  lines.push(`rendered_line_chars: ${totalLineChars}`);
  lines.push(`log_files_scanned: ${logFiles.length}`, "");

  lines.push("## Skill Budget", "");
  lines.push(`model: ${budget.model}`);
  lines.push(`context_tokens: ${formatNumber(budget.contextTokens)}`);
  lines.push(`context_source: ${budget.contextSource}`);
  lines.push(`${budget.budgetPercent}%_budget_tokens: ${formatNumber(budget.budgetTokens)}`);
  lines.push(`codex_cost_rule: ceil(utf8_bytes / ${budget.charsPerToken})`);
  lines.push(`unbudgeted_full_tokens: ${formatNumber(budget.unbudgetedFullTokens)}`);
  lines.push(`minimum_no_description_tokens: ${formatNumber(budget.minimumTokens)}`);
  lines.push(`budgeted_tokens_used: ${formatNumber(budget.budgetedTokens)}`);
  lines.push(`used_of_2%_budget: ${formatOnePct(budget.budgetedBudgetUsedRatio)}`);
  lines.push(`unbudgeted_used_of_2%_budget: ${formatOnePct(budget.unbudgetedBudgetUsedRatio)}`);
  lines.push(`used_of_context: ${formatOnePct(budget.budgetedContextUsedRatio)}`);
  lines.push(`remaining_2%_budget_tokens: ${formatNumber(budget.remainingBudgetTokens)}`);
  lines.push(`included_skills_after_budget: ${budget.includedSkills}`);
  lines.push(`omitted_skills_after_budget: ${budget.omittedSkills}`);
  lines.push(`truncated_description_chars: ${formatNumber(budget.truncatedDescriptionChars)}`);
  if (budget.effectiveContextTokens && budget.effectiveBudgetTokens && budget.remainingEffectiveBudgetTokens != null) {
    lines.push(`effective_context_tokens: ${formatNumber(budget.effectiveContextTokens)} (${budget.effectivePercent}%)`);
    lines.push(`effective_2%_budget_tokens: ${formatNumber(budget.effectiveBudgetTokens)}`);
    lines.push(`used_of_effective_2%_budget: ${formatOnePct(budget.effectiveBudgetUsedRatio ?? 0)}`);
    lines.push(`remaining_effective_2%_budget_tokens: ${formatNumber(budget.remainingEffectiveBudgetTokens)}`);
  }
  lines.push("");

  lines.push("## Description Candidates", "");
  for (const skill of longDescriptions) {
    lines.push(`- ${skill.name}`);
    lines.push(`  path: ${skill.path}`);
    lines.push(`  chars: description=${skill.descChars}, rendered_line=${skill.lineChars}`);
    lines.push(`  current: ${skill.description}`);
    lines.push(`  draft: ${compactDescription(skill.description)}`);
  }
  if (longDescriptions.length === 0) lines.push("- none");
  lines.push("");

  lines.push("## Duplicates By Name", "");
  for (const [name, list] of byBase.slice(0, 40)) {
    lines.push(`- ${name}`);
    const keep = preferredKeepSkill(list);
    lines.push(`  keep-default: ${keep.scope}: ${keep.path}`);
    for (const skill of list) {
      const score = skill.realPath === keep.realPath ? { body: 1, description: 1 } : similarity(keep, skill);
      lines.push(
        `  - ${skill.scope}: ${skill.path} (body=${formatPct(score.body)}, description=${formatPct(score.description)})`,
      );
    }
  }
  if (byBase.length === 0) lines.push("- none");
  lines.push("");

  lines.push("## Duplicate Delete Suggestions", "");
  lines.push(...duplicateDeleteSuggestions(byBase));
  lines.push("");

  lines.push("## Duplicates By Body Hash", "");
  for (const [, list] of byBody.slice(0, 30)) {
    lines.push(`- ${list.map((skill) => skill.name).join(", ")}`);
    for (const skill of list) lines.push(`  - ${skill.scope}: ${skill.path}`);
  }
  if (byBody.length === 0) lines.push("- none");
  lines.push("");

  lines.push("## Unused Candidates", "");
  for (const skill of unused) {
    const item = usageForSkill(usage, skill);
    lines.push(`- ${skill.name}: ${skill.scope}; usage=$${item.dollar}, reads=${item.fileRead}, text=${item.text}; ${skill.path}`);
  }
  if (unused.length === 0) lines.push("- none");
  lines.push("");

  lines.push("## Root Summary", "");
  for (const [root, list] of [...roots.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const disabled = list.filter((skill) => !skill.enabled).length;
    lines.push(`- ${root}: ${list.length} skills${disabled ? `, ${disabled} disabled` : ""}`);
  }
  return lines.join("\n");
}

const main = Effect.gen(function*() {
  if (rootOnly && extraRoots.length === 0) {
    process.exitCode = 2;
    yield* Console.error("skill-cleaner: --root-only requires at least one --root <path>");
    return;
  }
  const skills = discoverSkills();
  const live = yield* livePrompt();
  const liveSkills = live ? parseLiveSkills(live) : [];
  const selectedSkills = liveSkills.length > 0
    ? liveSkills
    : skills.filter((skill) => skill.enabled || includeAll);
  const logFiles = recentLogFiles();
  const usage = scanUsage([...skills, ...liveSkills], logFiles);
  const consideredSkills = includeAll ? skills : selectedSkills;
  const budget = skillBudget(consideredSkills, liveMetadataOverhead(live));
  const output = json
    ? JSON.stringify({
        skills,
        selectedSkills,
        inventorySource: live ? "codex debug prompt-input" : "filesystem fallback",
        usage: Object.fromEntries(usage),
        logFiles,
        budget,
      }, null, 2)
    : render(skills, selectedSkills, usage, logFiles, live);
  yield* Console.log(output);
});

export function run(): void {
  // @effect-diagnostics-next-line strictEffectProvide:off
  main.pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run();
}
