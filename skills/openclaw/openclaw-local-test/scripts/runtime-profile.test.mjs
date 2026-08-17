import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildOpenClawConfig,
  inspectRuntimeProfiles,
  parseTopLevelTomlStrings,
  pathsReferToSameFile,
  selectRuntimeProfile,
} from "./runtime-profile.mjs";

test("recognizes a symlinked runtime helper as the main module", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "openclaw-runtime-symlink-"));
  const target = path.join(root, "target.mjs");
  const link = path.join(root, "link.mjs");
  await writeFile(target, "export {};\n");
  await symlink(target, link);
  try {
    assert.equal(pathsReferToSameFile(link, target), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("parses only top-level Codex route settings", () => {
  assert.deepEqual(
    parseTopLevelTomlStrings(`
model = "gpt-test"
model_provider = "local"
[model_providers.local]
base_url = "http://should-not-be-copied.invalid/v1"
`),
    { model: "gpt-test", model_provider: "local" },
  );
});

test("inspects native logins without returning credentials or endpoint values", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "openclaw-runtime-profile-"));
  const codexHome = path.join(root, ".codex");
  const claudeHome = path.join(root, ".claude");
  await mkdir(codexHome, { recursive: true });
  await mkdir(claudeHome, { recursive: true });
  await writeFile(
    path.join(codexHome, "config.toml"),
    'model = "gpt-proxy-test"\nmodel_provider = "private-route"\n',
  );
  await writeFile(
    path.join(claudeHome, "settings.json"),
    JSON.stringify({
      model: "claude-test",
      env: {
        ANTHROPIC_BASE_URL: "https://private.example.invalid",
        ANTHROPIC_AUTH_TOKEN: "never-return-this-token",
      },
    }),
  );

  try {
    const profiles = inspectRuntimeProfiles({
      homeDir: root,
      env: {},
      runStatus(command) {
        return command === "codex"
          ? { ok: true, output: "Logged in using an API key - secret-value" }
          : {
              ok: true,
              output: JSON.stringify({ loggedIn: true, authMethod: "claude.ai" }),
            };
      },
    });

    assert.deepEqual(profiles.codex, {
      id: "codex",
      usable: true,
      auth: "api-key",
      route: "custom-provider",
      model: "gpt-proxy-test",
      modelRef: "openai/gpt-proxy-test",
      runtimeId: "codex",
      pluginId: "codex",
    });
    assert.deepEqual(profiles.claude, {
      id: "claude",
      usable: true,
      auth: "claude-subscription",
      route: "custom-endpoint",
      model: "claude-test",
      modelRef: "anthropic/claude-test",
      runtimeId: "claude-cli",
      pluginId: "anthropic",
    });
    const serialized = JSON.stringify(profiles);
    assert.doesNotMatch(serialized, /secret-value|never-return-this-token|private\.example/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("auto selection prefers Codex and explicit selection can choose Claude", () => {
  const profiles = {
    codex: { id: "codex", usable: true },
    claude: { id: "claude", usable: true },
  };
  assert.equal(selectRuntimeProfile(profiles, "auto").id, "codex");
  assert.equal(selectRuntimeProfile(profiles, "claude").id, "claude");
});

test("builds native Codex and Claude configs without copying auth material", () => {
  const base = {
    plugins: { allow: ["browser"] },
    agents: {
      entries: {
        main: {
          default: true,
          models: { "openai/gpt-test": { agentRuntime: { id: "openclaw" } } },
        },
      },
    },
  };
  const options = {
    gatewayPort: 19_010,
    proxyPort: 19_011,
    stateDir: "/tmp/openclaw-local-test",
    workspaceDir: "/tmp/openclaw-local-test/workspace",
  };
  const codexProfile = {
    id: "codex",
    modelRef: "openai/gpt-test",
    runtimeId: "codex",
    pluginId: "codex",
  };
  const codexConfig = buildOpenClawConfig(base, codexProfile, options);
  assert.equal(codexConfig.agents.defaults.model.primary, "openai/gpt-test");
  assert.deepEqual(codexConfig.agents.defaults.models["openai/gpt-test"].agentRuntime, {
    id: "codex",
  });
  assert.deepEqual(codexConfig.agents.entries.main.models["openai/gpt-test"].agentRuntime, {
    id: "codex",
  });
  assert.equal(codexConfig.plugins.entries.codex.config.appServer.homeScope, "user");
  assert.deepEqual(codexConfig.gateway.controlUi.allowedOrigins, [
    "http://localhost:19011",
    "http://127.0.0.1:19011",
  ]);
  assert.equal("allowInsecureAuth" in codexConfig.gateway.controlUi, false);
  assert.equal("dangerouslyDisableDeviceAuth" in codexConfig.gateway.controlUi, false);
  assert.deepEqual(codexConfig.plugins.allow, ["browser", "codex"]);

  const claudeProfile = {
    id: "claude",
    modelRef: "anthropic/claude-test",
    runtimeId: "claude-cli",
    pluginId: "anthropic",
  };
  const claudeConfig = buildOpenClawConfig(base, claudeProfile, options);
  assert.deepEqual(claudeConfig.agents.defaults.models["anthropic/claude-test"].agentRuntime, {
    id: "claude-cli",
  });
  assert.deepEqual(claudeConfig.agents.entries.main.models["anthropic/claude-test"].agentRuntime, {
    id: "claude-cli",
  });
  assert.equal(claudeConfig.plugins.entries.anthropic.enabled, true);
  assert.equal(JSON.stringify(claudeConfig).includes("apiKey"), false);
});
