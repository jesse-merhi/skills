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

const enforcements = catalog.standards.flatMap((standard) => [
  ...standard.enforcement.javascript,
  ...standard.enforcement.python,
  ...(standard.enforcement.script ?? [])
])

const ruleEntries = enforcements.flatMap((entry) => (entry.kind === "rule" ? [entry] : []))
const scriptEntries = enforcements.flatMap((entry) => (entry.kind === "script" ? [entry] : []))
const pythonFileEntries = enforcements.flatMap((entry) =>
  entry.kind === "check" || entry.kind === "semgrep" ? [entry] : []
)
const referencedPaths = [
  ...ruleEntries.map((entry) => entry.rule),
  ...scriptEntries.map((entry) => entry.file),
  ...Object.values(catalog.baselines).map((baseline) => baseline.file),
  ...pythonFileEntries.map((entry) => entry.file),
  ...Object.values(catalog.presets).flatMap((family) => Object.values(family).map((preset) => preset.file))
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

interface MutableStandard {
  enforcement: { javascript: Array<Record<string, unknown>>; python: Array<Record<string, unknown>> }
}

const pythonEntries = (standards: ReadonlyArray<MutableStandard>): ReadonlyArray<Record<string, unknown>> =>
  standards.flatMap((standard) => standard.enforcement.python)

// The schema, not a test, is what has to reject a hand-edited catalog, so each
// mutation below is one way that editing goes wrong.
const rejectedMutations: ReadonlyArray<[string, (standards: Array<MutableStandard>) => void]> = [
  [
    "a standard whose python column is empty",
    (standards) => {
      for (const standard of standards) standard.enforcement.python = []
    }
  ],
  [
    "a ruff entry selecting no rule codes",
    (standards) => {
      for (const entry of pythonEntries(standards)) if (entry.kind === "ruff") entry.select = []
    }
  ],
  [
    "a mypy option written as the string a config file holds",
    (standards) => {
      for (const entry of pythonEntries(standards)) if (entry.kind === "mypy") entry.options = { strict: "True" }
    }
  ],
  [
    "an enforcement entry carrying a key its kind does not define",
    (standards) => {
      for (const entry of pythonEntries(standards)) entry.severity = "error"
    }
  ],
  [
    "a ruff entry pasted into the javascript column",
    (standards) => {
      for (const standard of standards) standard.enforcement.javascript.push({ kind: "ruff", select: ["S608"] })
    }
  ],
  [
    "an ESLint rule entry pasted into the python column",
    (standards) => {
      for (const standard of standards) {
        standard.enforcement.python.push({ kind: "rule", presets: ["base"], rule: "r.mjs" })
      }
    }
  ]
]

const ruleFiles = readdirSync(join(standardsDirectory, "eslint/rules"))
  .filter((entry) => entry.endsWith(".mjs") && !entry.endsWith(".test.mjs"))
  .map((entry) => `eslint/rules/${entry}`)

describe("coding standards catalog", () => {
  it("resolves every referenced rule, script, check, baseline, and preset file", () => {
    for (const path of referencedPaths) {
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
  it("keys every preset family by a known ecosystem and claims every rule in a preset", () => {
    const families = new Set(Object.values(catalog.ecosystems).map((ecosystem) => ecosystem.presets))
    for (const family of Object.keys(catalog.presets)) {
      assert.isTrue(families.has(family), `preset family ${family} belongs to no ecosystem`)
    }
    for (const entry of enforcements) {
      if (entry.kind === "rule" || entry.kind === "plugin") {
        assert.isNotEmpty(entry.presets, `${entry.kind === "rule" ? entry.rule : entry.package} is claimed by no preset`)
      }
    }
  })

  it("rejects an applies naming no condition and an ecosystem detecting nothing", () => {
    const source = readFileSync(join(standardsDirectory, "catalog.json"), "utf8")
    const presets: { presets: { javascript: { base: { applies: unknown } } } } = JSON.parse(source)
    presets.presets.javascript.base.applies = {}
    assert.throws(() => decodeCatalog(JSON.stringify(presets)))
    const ecosystems: { ecosystems: { python: { detect: unknown } } } = JSON.parse(source)
    ecosystems.ecosystems.python.detect = []
    assert.throws(() => decodeCatalog(JSON.stringify(ecosystems)))
  })

  it.each(rejectedMutations)("rejects %s", (_, mutate) => {
    const raw: { standards: Array<MutableStandard> } = JSON.parse(
      readFileSync(join(standardsDirectory, "catalog.json"), "utf8")
    )
    mutate(raw.standards)
    assert.throws(() => decodeCatalog(JSON.stringify(raw)))
  })

  it("gives every standard a column for every ecosystem", () => {
    for (const standard of catalog.standards) {
      for (const ecosystem of Object.keys(catalog.ecosystems)) {
        assert.property(standard.enforcement, ecosystem, `${standard.id} lacks a ${ecosystem} column`)
      }
    }
  })
})
