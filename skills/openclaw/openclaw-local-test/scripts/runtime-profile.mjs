#!/usr/bin/env node

import { NodeRuntime } from "@effect/platform-node";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_CODEX_MODEL = "gpt-5.6-sol";
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5";
const JsonObject = Schema.fromJsonString(Schema.Record(Schema.String, Schema.Unknown));
const JsonString = Schema.fromJsonString(Schema.String);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readJsonObject(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return {};
  return Schema.decodeUnknownSync(JsonObject)(fs.readFileSync(filePath, "utf8"));
}

export function parseTopLevelTomlStrings(source) {
  const values = {};
  let inSection = false;
  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("[")) {
      inSection = true;
      continue;
    }
    if (inSection) continue;
    const match = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(?:"((?:\\.|[^"\\])*)"|'([^']*)'|([^\s#]+))/u);
    if (!match) continue;
    const [, key, doubleQuoted, singleQuoted, bare] = match;
    if (doubleQuoted !== undefined) {
      try {
        values[key] = Schema.decodeUnknownSync(JsonString)(`"${doubleQuoted}"`);
      } catch {
        values[key] = doubleQuoted;
      }
    } else {
      values[key] = singleQuoted ?? bare;
    }
  }
  return values;
}

function runStatus(command, args, env) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env,
    timeout: 5_000,
  });
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim(),
  };
}

function classifyCodexAuth(output) {
  if (/API key/iu.test(output)) return "api-key";
  if (/ChatGPT/iu.test(output)) return "chatgpt";
  if (/session token|access token|OAuth/iu.test(output)) return "session-token";
  return "unknown";
}

function classifyClaudeAuth(status) {
  const method = status.authMethod ?? status.auth_method;
  if (typeof method !== "string" || !method.trim()) return "unknown";
  if (/claude\.ai|oauth|subscription/iu.test(method)) return "claude-subscription";
  if (/api.?key/iu.test(method)) return "api-key";
  return method.trim().toLowerCase();
}

function hasProxyEnvironment(env) {
  return ["HTTPS_PROXY", "HTTP_PROXY", "ALL_PROXY", "https_proxy", "http_proxy", "all_proxy"].some(
    (name) => typeof env[name] === "string" && env[name].trim(),
  );
}

function classifyCodexRoute(config, env) {
  if (config.model_provider) return "custom-provider";
  if (config.openai_base_url || config.chatgpt_base_url || env.OPENAI_BASE_URL) {
    return "custom-endpoint";
  }
  if (hasProxyEnvironment(env)) return "network-proxy";
  return "default-endpoint";
}

function classifyClaudeRoute(settings, env) {
  const settingsEnv = isObject(settings.env) ? settings.env : {};
  if (settingsEnv.ANTHROPIC_BASE_URL || env.ANTHROPIC_BASE_URL) return "custom-endpoint";
  if (settings.apiKeyHelper) return "api-key-helper";
  if (hasProxyEnvironment({ ...env, ...settingsEnv })) return "network-proxy";
  return "default-endpoint";
}

function normalizeModel(model, provider, fallback) {
  const value = typeof model === "string" && model.trim() ? model.trim() : fallback;
  const slash = value.indexOf("/");
  const modelId = slash === -1 ? value : value.slice(slash + 1);
  if (slash !== -1 && value.slice(0, slash) !== provider) {
    throw new Error(`model ${value} does not belong to the ${provider} provider`);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*(?:\[(?:[0-9]+[kKmM])\])?$/u.test(modelId)) {
    throw new Error(`model ${value} contains unsupported characters`);
  }
  return modelId;
}

export function inspectRuntimeProfiles(options = {}) {
  const env = options.env ?? process.env;
  const homeDir = options.homeDir ?? os.homedir();
  const codexHome = env.CODEX_HOME?.trim() || path.join(homeDir, ".codex");
  const claudeHome = env.CLAUDE_CONFIG_DIR?.trim() || path.join(homeDir, ".claude");
  const codexConfigPath = options.codexConfigPath ?? path.join(codexHome, "config.toml");
  const claudeSettingsPath = options.claudeSettingsPath ?? path.join(claudeHome, "settings.json");
  const codexConfig = fs.existsSync(codexConfigPath)
    ? parseTopLevelTomlStrings(fs.readFileSync(codexConfigPath, "utf8"))
    : {};
  const claudeSettings = readJsonObject(claudeSettingsPath);

  const codexStatus = (options.runStatus ?? runStatus)("codex", ["login", "status"], env);
  const claudeStatusResult = (options.runStatus ?? runStatus)("claude", ["auth", "status", "--json"], env);
  let claudeStatus = {};
  if (claudeStatusResult.ok) {
    try {
      claudeStatus = Schema.decodeUnknownSync(JsonObject)(claudeStatusResult.output);
    } catch {
      claudeStatus = {};
    }
  }

  const codexModel = normalizeModel(
    options.codexModel ?? options.model ?? codexConfig.model,
    "openai",
    DEFAULT_CODEX_MODEL,
  );
  const settingsEnv = isObject(claudeSettings.env) ? claudeSettings.env : {};
  const claudeModel = normalizeModel(
    options.claudeModel ?? options.model ?? claudeSettings.model ?? settingsEnv.ANTHROPIC_MODEL,
    "anthropic",
    DEFAULT_CLAUDE_MODEL,
  );

  return {
    codex: {
      id: "codex",
      usable: codexStatus.ok,
      auth: codexStatus.ok ? classifyCodexAuth(codexStatus.output) : "unavailable",
      route: classifyCodexRoute(codexConfig, env),
      model: codexModel,
      modelRef: `openai/${codexModel}`,
      runtimeId: "codex",
      pluginId: "codex",
    },
    claude: {
      id: "claude",
      usable:
        claudeStatusResult.ok &&
        (claudeStatus.loggedIn === true || claudeStatus.logged_in === true),
      auth: claudeStatusResult.ok ? classifyClaudeAuth(claudeStatus) : "unavailable",
      route: classifyClaudeRoute(claudeSettings, env),
      model: claudeModel,
      modelRef: `anthropic/${claudeModel}`,
      runtimeId: "claude-cli",
      pluginId: "anthropic",
    },
  };
}

export function selectRuntimeProfile(profiles, requested = "auto") {
  if (!["auto", "codex", "claude"].includes(requested)) {
    throw new Error(`unsupported runtime ${requested}; expected auto, codex, or claude`);
  }
  const selected = requested === "auto" ? (profiles.codex.usable ? profiles.codex : profiles.claude) : profiles[requested];
  if (!selected?.usable) {
    throw new Error(
      requested === "auto"
        ? "neither Codex nor Claude has a usable local login"
        : `${requested} does not have a usable local login`,
    );
  }
  return selected;
}

function withPrimaryModel(existing, primary) {
  return isObject(existing) ? { ...existing, primary } : { primary };
}

export function buildOpenClawConfig(baseConfig, profile, options) {
  if (!isObject(baseConfig)) throw new Error("base OpenClaw config must be a JSON object");
  if (Array.isArray(baseConfig.agents?.list)) {
    throw new Error("base config still uses agents.list; run openclaw doctor --fix before using it");
  }

  const config = structuredClone(baseConfig);
  const existingControlUi = isObject(config.gateway?.controlUi) ? config.gateway.controlUi : {};
  const existingAllowedOrigins = Array.isArray(existingControlUi.allowedOrigins)
    ? existingControlUi.allowedOrigins.filter((value) => typeof value === "string")
    : [];
  config.gateway = {
    ...(isObject(config.gateway) ? config.gateway : {}),
    mode: "local",
    port: options.gatewayPort,
    bind: "loopback",
    auth: { mode: "none" },
    controlUi: {
      ...existingControlUi,
      allowedOrigins: [
        ...new Set([
          ...existingAllowedOrigins,
          `http://localhost:${options.proxyPort}`,
          `http://127.0.0.1:${options.proxyPort}`,
        ]),
      ],
    },
    tailscale: {
      ...(isObject(config.gateway?.tailscale) ? config.gateway.tailscale : {}),
      mode: "off",
      resetOnExit: false,
    },
  };

  config.agents = isObject(config.agents) ? config.agents : {};
  config.agents.defaults = isObject(config.agents.defaults) ? config.agents.defaults : {};
  config.agents.defaults.workspace = options.workspaceDir;
  config.agents.defaults.model = withPrimaryModel(config.agents.defaults.model, profile.modelRef);
  config.agents.defaults.models = isObject(config.agents.defaults.models)
    ? config.agents.defaults.models
    : {};
  const existingModelPolicy = isObject(config.agents.defaults.models[profile.modelRef])
    ? config.agents.defaults.models[profile.modelRef]
    : {};
  config.agents.defaults.models[profile.modelRef] = {
    ...existingModelPolicy,
    agentRuntime: { id: profile.runtimeId },
  };

  const entries = isObject(config.agents.entries) ? config.agents.entries : {};
  if (Object.keys(entries).length === 0) entries.main = { default: true };
  for (const [agentId, rawAgent] of Object.entries(entries)) {
    const agent = isObject(rawAgent) ? rawAgent : {};
    agent.model = withPrimaryModel(agent.model, profile.modelRef);
    agent.models = isObject(agent.models) ? agent.models : {};
    const existingAgentModelPolicy = isObject(agent.models[profile.modelRef])
      ? agent.models[profile.modelRef]
      : {};
    agent.models[profile.modelRef] = {
      ...existingAgentModelPolicy,
      agentRuntime: { id: profile.runtimeId },
    };
    agent.workspace = path.join(options.stateDir, "agents", agentId, "workspace");
    entries[agentId] = agent;
  }
  config.agents.entries = entries;

  config.tools = isObject(config.tools) ? config.tools : {};
  config.tools.exec = {
    ...(isObject(config.tools.exec) ? config.tools.exec : {}),
    host: "auto",
  };

  config.plugins = isObject(config.plugins) ? config.plugins : {};
  config.plugins.entries = isObject(config.plugins.entries) ? config.plugins.entries : {};
  const pluginEntry = isObject(config.plugins.entries[profile.pluginId])
    ? config.plugins.entries[profile.pluginId]
    : {};
  if (profile.id === "codex") {
    const pluginConfig = isObject(pluginEntry.config) ? pluginEntry.config : {};
    const appServer = isObject(pluginConfig.appServer) ? pluginConfig.appServer : {};
    config.plugins.entries.codex = {
      ...pluginEntry,
      enabled: true,
      config: {
        ...pluginConfig,
        appServer: { ...appServer, homeScope: "user" },
      },
    };
  } else {
    config.plugins.entries.anthropic = { ...pluginEntry, enabled: true };
  }
  if (Array.isArray(config.plugins.allow)) {
    config.plugins.allow = [...new Set([...config.plugins.allow, profile.pluginId])];
  }
  return config;
}

function parseArgs(argv) {
  const result = { command: argv[0] ?? "inspect", runtime: "auto" };
  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") {
      result.json = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value) throw new Error(`missing value for ${argument}`);
    index += 1;
    switch (argument) {
      case "--runtime":
        result.runtime = value;
        break;
      case "--model":
        result.model = value;
        break;
      case "--base-config":
        result.baseConfig = value;
        break;
      case "--config-out":
        result.configOut = value;
        break;
      case "--state-dir":
        result.stateDir = value;
        break;
      case "--workspace-dir":
        result.workspaceDir = value;
        break;
      case "--gateway-port":
        result.gatewayPort = Number(value);
        break;
      case "--proxy-port":
        result.proxyPort = Number(value);
        break;
      default:
        throw new Error(`unknown option ${argument}`);
    }
  }
  return result;
}

function safeSummary(profiles, selected) {
  const lines = [];
  for (const profile of [profiles.codex, profiles.claude]) {
    lines.push(
      `${profile.id}: ${profile.usable ? "usable" : "unavailable"}; auth=${profile.auth}; route=${profile.route}; model=${profile.model}`,
    );
  }
  if (selected) lines.push(`selected: ${selected.id}`);
  return lines.join("\n");
}

function runMain() {
  const args = parseArgs(process.argv.slice(2));
  const profiles = inspectRuntimeProfiles({ model: args.model });
  const selected = selectRuntimeProfile(profiles, args.runtime);
  if (args.command === "inspect") {
    process.stdout.write(args.json ? `${JSON.stringify({ profiles, selected })}\n` : `${safeSummary(profiles, selected)}\n`);
    return;
  }
  if (args.command !== "configure") throw new Error(`unknown command ${args.command}`);
  if (
    !args.configOut ||
    !args.stateDir ||
    !args.workspaceDir ||
    !Number.isInteger(args.gatewayPort) ||
    !Number.isInteger(args.proxyPort)
  ) {
    throw new Error(
      "configure requires --config-out, --state-dir, --workspace-dir, --gateway-port, and --proxy-port",
    );
  }
  const baseConfig = args.baseConfig ? readJsonObject(args.baseConfig) : {};
  const config = buildOpenClawConfig(baseConfig, selected, {
    gatewayPort: args.gatewayPort,
    proxyPort: args.proxyPort,
    stateDir: args.stateDir,
    workspaceDir: args.workspaceDir,
  });
  fs.mkdirSync(path.dirname(args.configOut), { recursive: true, mode: 0o700 });
  fs.writeFileSync(args.configOut, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  process.stdout.write(`${JSON.stringify(selected)}\n`);
}

export function pathsReferToSameFile(left, right) {
  try {
    return fs.realpathSync(left) === fs.realpathSync(right);
  } catch {
    return path.resolve(left) === path.resolve(right);
  }
}

if (process.argv[1] && pathsReferToSameFile(process.argv[1], fileURLToPath(import.meta.url))) {
  Effect.try({
    try: runMain,
    catch: (cause) => cause instanceof Error ? cause : new Error(String(cause)),
  }).pipe(
    Effect.tapError((error) => Console.error(`runtime-profile: ${error.message}`)),
    NodeRuntime.runMain({ disableErrorReporting: true }),
  );
}
