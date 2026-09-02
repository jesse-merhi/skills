import { builtinRules } from "eslint/use-at-your-own-risk"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { existsSync, readdirSync, readFileSync } from "node:fs"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { assert, describe, it } from "vitest"

import type { Catalog } from "./catalog.schema.ts"

import { decodeCatalog } from "./catalog.schema.ts"

type PresetFactory = () => ReadonlyArray<{
  plugins?: Record<string, { rules?: Record<string, unknown> }>
  rules?: Record<string, unknown>
}>

const standardsDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryPackages = join(standardsDirectory, "../../node_modules")

const catalog: Catalog = decodeCatalog(readFileSync(join(standardsDirectory, "catalog.json"), "utf8"))

const eslintPresets = catalog.presets.eslint ?? {}

const enforcements = catalog.standards.flatMap((standard) => Object.values(standard.enforcement).flat())

const ruleEntries = enforcements.flatMap((entry) => (entry.kind === "rule" ? [entry] : []))
const scriptEntries = enforcements.flatMap((entry) => (entry.kind === "script" ? [entry] : []))
const referencedPaths = [
  ...ruleEntries.flatMap((entry) => [entry.rule, entry.test]),
  ...scriptEntries.map((entry) => entry.file)
]

const bareSpecifier = (specifier: string): string => {
  const segments = specifier.split("/")
  return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0] ?? specifier
}

const importedPackages = (presetFile: string): ReadonlyArray<string> => {
  const source = readFileSync(join(standardsDirectory, presetFile), "utf8")
  const specifiers = [...source.matchAll(/from\s+"([^"]+)"/gu)].map((match) => match[1] ?? "")
  return [...new Set(specifiers.filter((specifier) => !specifier.startsWith(".")).map(bareSpecifier))].sort()
}

const installedVersion = (packageName: string): string => {
  const manifest: { version?: string } = JSON.parse(
    readFileSync(join(repositoryPackages, packageName, "package.json"), "utf8")
  )
  return manifest.version ?? ""
}

const pluginRuleNames = async (packageName: string): Promise<ReadonlySet<string>> => {
  if (packageName === "eslint") return new Set(builtinRules.keys())
  type Plugin = { rules?: Record<string, unknown> }
  const loaded: Plugin & { default?: Plugin } = await import(packageName)
  const plugin = loaded.default ?? loaded
  return new Set(Object.keys(plugin.rules ?? {}))
}

const ruleFiles = readdirSync(join(standardsDirectory, "eslint/rules"))
  .filter((entry) => entry.endsWith(".mjs") && !entry.endsWith(".test.mjs"))
  .map((entry) => `eslint/rules/${entry}`)

describe("coding standards catalog", () => {
  it("resolves every referenced rule, test, script, and preset file", () => {
    for (const path of [...referencedPaths, ...Object.values(eslintPresets).map((preset) => preset.file)]) {
      assert.isTrue(existsSync(join(standardsDirectory, path)), `missing catalog path ${path}`)
    }
  })

  it("catalogues every custom rule exactly once alongside its test", () => {
    assert.deepEqual(
      ruleFiles.toSorted(),
      ruleEntries.map((entry) => entry.rule).toSorted(),
      "every rule file must be catalogued exactly once"
    )
    for (const entry of ruleEntries) {
      assert.strictEqual(entry.test, entry.rule.replace(/\.mjs$/u, ".test.mjs"))
    }
  })

  it("names preset ids that exist", () => {
    for (const entry of enforcements) {
      if (entry.kind !== "rule" && entry.kind !== "plugin") continue
      for (const preset of entry.presets) {
        assert.property(eslintPresets, preset)
      }
    }
  })

  // Loading every ESLint plugin costs more than vitest's default per-test budget.
  it("names plugin rules that resolve in the installed package", { timeout: 60_000 }, async () => {
    for (const entry of enforcements) {
      if (entry.kind !== "plugin") continue
      const available = await pluginRuleNames(entry.package)
      for (const ruleId of entry.rules) {
        const bare = entry.package === "eslint" ? ruleId : ruleId.slice(ruleId.lastIndexOf("/") + 1)
        assert.isTrue(available.has(bare), `${entry.package} does not define ${ruleId}`)
      }
    }
  })

  it("pins the packages each preset actually imports", () => {
    for (const [name, preset] of Object.entries(eslintPresets)) {
      const imported = importedPackages(preset.file)
      assert.deepEqual(Object.keys(preset.packages).toSorted(), imported, `${name} package list`)
      for (const [packageName, version] of Object.entries(preset.packages)) {
        assert.strictEqual(version, installedVersion(packageName), `${name} pins ${packageName}`)
      }
    }
  })

  it("pins the packages each ecosystem installs", () => {
    for (const [name, ecosystem] of Object.entries(catalog.ecosystems)) {
      for (const [packageName, version] of Object.entries(ecosystem.packages ?? {})) {
        assert.strictEqual(version, installedVersion(packageName), `${name} pins ${packageName}`)
      }
    }
  })

  it("emits configs whose every rule id resolves against its own plugins", { timeout: 60_000 }, async () => {
    for (const [name, preset] of Object.entries(eslintPresets)) {
      const { default: factory }: { default: PresetFactory } = await import(
        pathToFileURL(join(standardsDirectory, preset.file)).href
      )
      assert.isFunction(factory, `${name} must default-export a factory`)
      const configs = factory()
      assert.isNotEmpty(configs, `${name} must emit at least one config`)
      for (const config of configs) {
        for (const ruleId of Object.keys(config.rules ?? {})) {
          const separator = ruleId.lastIndexOf("/")
          const resolved =
            separator === -1
              ? builtinRules.has(ruleId)
              : Boolean(config.plugins?.[ruleId.slice(0, separator)]?.rules?.[ruleId.slice(separator + 1)])
          assert.isTrue(resolved, `${name} enables unresolvable rule ${ruleId}`)
        }
      }
    }
  })
})
