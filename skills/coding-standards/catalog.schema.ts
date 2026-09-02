import * as Schema from "effect/Schema"

const RuleEnforcement = Schema.Struct({
  kind: Schema.Literal("rule"),
  presets: Schema.Array(Schema.NonEmptyString),
  rule: Schema.NonEmptyString,
  test: Schema.NonEmptyString
})

const PluginEnforcement = Schema.Struct({
  kind: Schema.Literal("plugin"),
  package: Schema.NonEmptyString,
  presets: Schema.Array(Schema.NonEmptyString),
  rules: Schema.Array(Schema.NonEmptyString)
})

const ScriptEnforcement = Schema.Struct({
  file: Schema.NonEmptyString,
  kind: Schema.Literal("script"),
  languages: Schema.Array(Schema.NonEmptyString)
})

const RuffEnforcement = Schema.Struct({
  config: Schema.optionalKey(Schema.NonEmptyString),
  kind: Schema.Literal("ruff"),
  select: Schema.Array(Schema.NonEmptyString)
})

const MypyEnforcement = Schema.Struct({
  kind: Schema.Literal("mypy"),
  options: Schema.Record(Schema.NonEmptyString, Schema.Union([Schema.String, Schema.Boolean]))
})

const SemgrepEnforcement = Schema.Struct({
  file: Schema.NonEmptyString,
  kind: Schema.Literal("semgrep"),
  test: Schema.NonEmptyString
})

const CheckEnforcement = Schema.Struct({
  file: Schema.NonEmptyString,
  kind: Schema.Literal("check"),
  module: Schema.NonEmptyString,
  test: Schema.NonEmptyString
})

const NotApplicableEnforcement = Schema.Struct({
  kind: Schema.Literal("not-applicable"),
  reason: Schema.NonEmptyString
})

const Enforcement = Schema.Union([
  CheckEnforcement,
  MypyEnforcement,
  NotApplicableEnforcement,
  PluginEnforcement,
  RuffEnforcement,
  RuleEnforcement,
  ScriptEnforcement,
  SemgrepEnforcement
])

const Applies = Schema.Struct({
  always: Schema.optionalKey(Schema.Boolean),
  dependencies: Schema.optionalKey(Schema.Array(Schema.NonEmptyString)),
  devDependencies: Schema.optionalKey(Schema.Array(Schema.NonEmptyString))
})

const Preset = Schema.Struct({
  applies: Applies,
  file: Schema.NonEmptyString,
  packages: Schema.Record(Schema.NonEmptyString, Schema.NonEmptyString)
})

const Standard = Schema.Struct({
  enforcement: Schema.Record(Schema.NonEmptyString, Schema.Array(Enforcement)),
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
  detect: Schema.Array(Schema.NonEmptyString),
  packages: Schema.optionalKey(Schema.Record(Schema.NonEmptyString, Schema.NonEmptyString)),
  presets: Schema.NonEmptyString
})

const CatalogSchema = Schema.Struct({
  ecosystems: Schema.Record(Schema.NonEmptyString, Ecosystem),
  presets: Schema.Record(Schema.NonEmptyString, Schema.Record(Schema.NonEmptyString, Preset)),
  standards: Schema.Array(Standard),
  version: Schema.Literal(1)
})

export type Catalog = typeof CatalogSchema.Type

const decode = Schema.decodeUnknownSync(Schema.fromJsonString(CatalogSchema))

export const decodeCatalog = (text: string): Catalog => decode(text)
