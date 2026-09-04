import * as Predicate from "effect/Predicate"
import * as Schema from "effect/Schema"
import { builtinRules } from "eslint/use-at-your-own-risk"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { existsSync, readdirSync, readFileSync } from "node:fs"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { basename, dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { assert, describe, it } from "vitest"

import type { Catalog } from "./catalog.schema.ts"

import { decodeCatalog } from "./catalog.schema.ts"

const PluginShape = Schema.Struct({
  rules: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown))
})

const PluginModule = Schema.Struct({
  default: Schema.optionalKey(PluginShape),
  rules: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown))
})

const RuleSetting = Schema.Union([Schema.String, Schema.Number, Schema.Array(Schema.Unknown)])

const PresetModule = Schema.Struct({ default: Schema.Unknown })

const PresetConfigs = Schema.Array(
  Schema.Struct({
    plugins: Schema.optionalKey(Schema.Record(Schema.String, PluginShape)),
    rules: Schema.optionalKey(Schema.Record(Schema.String, RuleSetting))
  })
)

const PackageManifest = Schema.Struct({ version: Schema.NonEmptyString })

const decodePluginModule = Schema.decodeUnknownSync(PluginModule)
const decodePresetModule = Schema.decodeUnknownSync(PresetModule)
const decodePresetConfigs = Schema.decodeUnknownSync(PresetConfigs)
const decodeManifest = Schema.decodeSync(Schema.fromJsonString(PackageManifest))

const standardsDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryPackages = join(standardsDirectory, "../../node_modules")

const catalog: Catalog = decodeCatalog(readFileSync(join(standardsDirectory, "catalog.json"), "utf8"))

const javascriptPresets = catalog.presets.javascript ?? {}

const enforcements = catalog.standards.flatMap((standard) => Object.values(standard.enforcement).flat())

const ruleEntries = enforcements.flatMap((entry) => (entry.kind === "rule" ? [entry] : []))
const scriptEntries = enforcements.flatMap((entry) => (entry.kind === "script" ? [entry] : []))
const referencedPaths = [
  ...ruleEntries.map((entry) => entry.rule),
  ...scriptEntries.map((entry) => entry.file),
  ...Object.values(catalog.baselines).map((baseline) => baseline.file)
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

const installedVersion = (packageName: string): string =>
  decodeManifest(readFileSync(join(repositoryPackages, packageName, "package.json"), "utf8")).version

const pluginRuleNames = async (packageName: string): Promise<ReadonlySet<string>> => {
  if (packageName === "eslint") return new Set(builtinRules.keys())
  const loaded: unknown = await import(packageName)
  const pluginModule = decodePluginModule(loaded)
  return new Set(Object.keys(pluginModule.default?.rules ?? pluginModule.rules ?? {}))
}

const presetConfigs = async (
  name: string,
  presetFile: string,
  typeChecked = false
): Promise<typeof PresetConfigs.Type> => {
  const loaded: unknown = await import(pathToFileURL(join(standardsDirectory, presetFile)).href)
  const { default: factory } = decodePresetModule(loaded)
  if (!Predicate.isFunction(factory)) throw new Error(`${name} must default-export a factory`)
  const configs = decodePresetConfigs(factory({ typeChecked }))
  assert.isNotEmpty(configs, `${name} must emit at least one config`)
  return configs
}

// A `rule` entry claims the plugin rule named after its file; a `plugin` entry
// claims the ids it lists.
const claimedRuleIds = (presetName: string, typeChecked: boolean): ReadonlySet<string> => {
  const claimed = new Set<string>()
  for (const entry of enforcements) {
    if (entry.kind === "rule" && entry.presets.includes(presetName)) {
      claimed.add(`standards/${basename(entry.rule, ".mjs")}`)
    }
    if (entry.kind === "plugin" && entry.presets.includes(presetName) && (!entry.typeChecked || typeChecked)) {
      for (const ruleId of entry.rules) claimed.add(ruleId)
    }
  }
  return claimed
}

const isEnabled = (setting: typeof RuleSetting.Type): boolean => {
  const severity = Array.isArray(setting) ? setting[0] : setting
  return severity !== "off" && severity !== 0
}

const ruleFiles = readdirSync(join(standardsDirectory, "eslint/rules"))
  .filter((entry) => entry.endsWith(".mjs") && !entry.endsWith(".test.mjs"))
  .map((entry) => `eslint/rules/${entry}`)

describe("coding standards catalog", () => {
  it("resolves every referenced rule, script, baseline, and preset file", () => {
    for (const path of [...referencedPaths, ...Object.values(javascriptPresets).map((preset) => preset.file)]) {
      assert.isTrue(existsSync(join(standardsDirectory, path)), `missing catalog path ${path}`)
    }
  })

  it("catalogues every custom rule exactly once", () => {
    assert.deepEqual(
      ruleFiles.toSorted(),
      ruleEntries.map((entry) => entry.rule).toSorted(),
      "every rule file must be catalogued exactly once"
    )
  })

  it("names preset families and preset ids that exist", () => {
    for (const [name, ecosystem] of Object.entries(catalog.ecosystems)) {
      assert.property(catalog.presets, ecosystem.presets, `${name} names a preset family`)
    }
    for (const entry of enforcements) {
      if (entry.kind !== "rule" && entry.kind !== "plugin") continue
      for (const preset of entry.presets) {
        assert.property(javascriptPresets, preset)
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
    for (const [name, preset] of Object.entries(javascriptPresets)) {
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
    for (const [name, preset] of Object.entries(javascriptPresets)) {
      for (const config of await presetConfigs(name, preset.file)) {
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

  it("claims exactly the rules each preset enables", { timeout: 60_000 }, async () => {
    for (const [name, preset] of Object.entries(javascriptPresets)) {
      for (const typeChecked of [false, true]) {
        const enabled = new Set<string>()
        for (const config of await presetConfigs(name, preset.file, typeChecked)) {
          for (const [ruleId, setting] of Object.entries(config.rules ?? {})) {
            if (isEnabled(setting)) enabled.add(ruleId)
          }
        }
        assert.deepEqual(
          [...enabled].toSorted(),
          [...claimedRuleIds(name, typeChecked)].toSorted(),
          `${name} catalog claims (typeChecked=${typeChecked})`
        )
      }
    }
  })
  it("keys every enforcement column and preset family by a known ecosystem", () => {
    const ecosystemNames = new Set(Object.keys(catalog.ecosystems))
    const families = new Set(Object.values(catalog.ecosystems).map((ecosystem) => ecosystem.presets))
    for (const standard of catalog.standards) {
      for (const column of Object.keys(standard.enforcement)) {
        assert.isTrue(column === "script" || ecosystemNames.has(column), `${standard.id} has an unknown column ${column}`)
      }
    }
    for (const family of Object.keys(catalog.presets)) {
      assert.isTrue(families.has(family), `preset family ${family} belongs to no ecosystem`)
    }
    for (const entry of enforcements) {
      if (entry.kind === "rule" || entry.kind === "plugin") {
        assert.isNotEmpty(entry.presets, `${entry.kind === "rule" ? entry.rule : entry.package} is claimed by no preset`)
      }
    }
  })
  it("rejects a preset or baseline whose applies names no condition", () => {
    const raw: { presets: { javascript: { base: { applies: unknown } } } } = JSON.parse(
      readFileSync(join(standardsDirectory, "catalog.json"), "utf8")
    )
    raw.presets.javascript.base.applies = {}
    assert.throws(() => decodeCatalog(JSON.stringify(raw)))
  })
})
