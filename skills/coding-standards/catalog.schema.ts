import * as Schema from "effect/Schema"

const RuleEnforcement = Schema.Struct({
  kind: Schema.Literal("rule"),
  presets: Schema.Array(Schema.NonEmptyString),
  rule: Schema.NonEmptyString
})

const PluginEnforcement = Schema.Struct({
  kind: Schema.Literal("plugin"),
  package: Schema.NonEmptyString,
  presets: Schema.Array(Schema.NonEmptyString),
  rules: Schema.Array(Schema.NonEmptyString),
  typeChecked: Schema.optionalKey(Schema.Literal(true))
})

const ScriptEnforcement = Schema.Struct({
  file: Schema.NonEmptyString,
  kind: Schema.Literal("script"),
  languages: Schema.Array(Schema.NonEmptyString)
})

const Enforcement = Schema.Struct({
  javascript: Schema.NonEmptyArray(Schema.Union([PluginEnforcement, RuleEnforcement])),
  script: Schema.optionalKey(Schema.NonEmptyArray(ScriptEnforcement))
})

const PackageNames = Schema.NonEmptyArray(Schema.NonEmptyString)

// Every shape names at least one condition, so an empty object cannot mean "never applies".
const Applies = Schema.Union([
  Schema.Struct({ always: Schema.Literal(true) }),
  Schema.Struct({ dependencies: PackageNames, devDependencies: Schema.optionalKey(PackageNames) }),
  Schema.Struct({ dependencies: Schema.optionalKey(PackageNames), devDependencies: PackageNames })
])

const Preset = Schema.Struct({
  applies: Applies,
  file: Schema.NonEmptyString,
  packages: Schema.Record(Schema.NonEmptyString, Schema.NonEmptyString)
})

// A config file copied into a target repository rather than enforced by a rule.
const Baseline = Schema.Struct({
  applies: Applies,
  file: Schema.NonEmptyString,
  target: Schema.NonEmptyString
})

const Standard = Schema.Struct({
  enforcement: Enforcement,
  id: Schema.NonEmptyString,
  origin: Schema.NonEmptyString,
  principle: Schema.NonEmptyString,
  scope: Schema.Literals([
    "any",
    "typescript",
    "react",
    "react-native",
    "tailwind",
    "zod",
    "tanstack-query",
    "prisma",
    "tests",
    "e2e"
  ]),
  title: Schema.NonEmptyString
})

const Ecosystem = Schema.Struct({
  detect: Schema.NonEmptyArray(Schema.NonEmptyString),
  packages: Schema.optionalKey(Schema.Record(Schema.NonEmptyString, Schema.NonEmptyString)),
  presets: Schema.NonEmptyString
})

const CatalogSchema = Schema.Struct({
  baselines: Schema.Record(Schema.NonEmptyString, Baseline),
  ecosystems: Schema.Record(Schema.NonEmptyString, Ecosystem),
  presets: Schema.Record(Schema.NonEmptyString, Schema.Record(Schema.NonEmptyString, Preset)),
  standards: Schema.Array(Standard),
  version: Schema.Literal(1)
})

export type Catalog = typeof CatalogSchema.Type

const decode = Schema.decodeSync(Schema.fromJsonString(CatalogSchema), { onExcessProperty: "error" })

export const decodeCatalog = (text: string): Catalog => decode(text)
