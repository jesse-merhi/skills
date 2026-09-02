import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-zod-type-any.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
	languageOptions: { parser: tsParser, sourceType: "module", parserOptions: { ecmaVersion: 2022 } },
});

ruleTester.run("no-zod-type-any", rule, {
	valid: [
		{
			name: "allows utility-wrapped Zod namespace aliases without weak exports",
			code: 'import { z } from "zod";\ntype W = Pick<typeof z, "ZodString">;\n',
		},
		{
			name: "allows non-weak partial indexed namespace key aliases",
			code: 'import { z } from "zod";\ntype Part = "TypeAny";\ntype Schema = z[Part];\n',
		},
		{
			name: "allows unrelated namespace aliases with the same name as disabled weak Zod aliases",
			code: 'import { z } from "zod";\ndeclare namespace A {\n // eslint-disable-next-line rule-to-test/no-zod-type-any\n type Schema = z.ZodTypeAny;\n}\ndeclare namespace B {\n type Schema = string;\n type Later = Schema;\n}\n',
		},
		{
			name: "allows namespace aliases that shadow outer disabled weak Zod aliases",
			code: '// eslint-disable-next-line rule-to-test/no-zod-type-any\nimport type { ZodTypeAny as Schema } from "zod";\ndeclare namespace B {\n type Schema = string;\n type Later = Schema;\n}\n',
		},
		{
			name: "allows unrelated aliases with the same name as block-scoped weak Zod aliases",
			code: 'import { z } from "zod";\nfunction build() {\n // eslint-disable-next-line rule-to-test/no-zod-type-any\n type Schema = z.ZodTypeAny;\n return null;\n}\ntype Schema = string;\ntype Later = Schema;\n',
		},
		{
			name: "allows generic ZodType aliases instantiated with concrete output types",
			code: 'import { z } from "zod";\ntype SchemaOf<T> = z.ZodType<T>;\ntype Schema = SchemaOf<string>;\n',
		},
		{
			name: "allows exported schema values under a property named z",
			code: 'import { z } from "zod";\nconst schema = z.string();\nexport const wrapper = { z: schema };\n',
		},
		{
			name: "allows exported Zod schema values",
			code: 'import { z } from "zod";\nexport const schema = z.object({ value: z.string() });\n',
		},
		{
			name: "allows precise ZodType unknown schemas",
			code: 'import { type ZodType, type ZodTypeDef } from "zod";\ntype Schema = ZodType<unknown, ZodTypeDef, unknown>;\n',
		},
		{
			name: "allows output-typed ZodType schemas",
			code: 'import { z } from "zod";\ntype Schema = z.ZodType<string>;\n',
		},
		{
			name: "allows ZodType references to aliases with unused generic any defaults",
			code: 'import { z } from "zod";\ntype StringSchema<T = any> = string;\ntype Schema = z.ZodType<StringSchema>;\n',
		},
		{
			name: "allows bare ZodType type predicates for runtime Zod guards",
			code: 'import { ZodType } from "zod";\nfunction isZodType(value: unknown): value is ZodType {\n return value instanceof ZodType;\n}\n',
		},
		{
			name: "allows bare ZodType type predicates with guarded true return paths",
			code: 'import { ZodType } from "zod";\nfunction isZodType(value: unknown): value is ZodType {\n if (value === null) return false;\n return value instanceof ZodType;\n}\n',
		},
		{
			name: "allows bare ZodType type predicates with guarded true branches",
			code: 'import { ZodType } from "zod";\nfunction isZodType(value: unknown): value is ZodType {\n if (value instanceof ZodType) return true;\n return false;\n}\n',
		},
		{
			name: "allows precise ZodType type predicates for runtime Zod guards",
			code: 'import { ZodType, type ZodTypeDef } from "zod";\nfunction isZodType(value: unknown): value is ZodType<unknown, ZodTypeDef, unknown> {\n return value instanceof ZodType;\n}\n',
		},
		{
			name: "allows unrelated identifiers",
			code: "type ZodTypeAnythingElse = string;\n",
		},
		{
			name: "allows non-Zod symbols named ZodTypeAny",
			code: 'import { type ZodTypeAny } from "not-zod";\ntype Schema = ZodTypeAny;\n',
		},
		{
			name: "allows non-Zod re-exports named ZodTypeAny",
			code: 'export type { ZodTypeAny } from "not-zod";\n',
		},
		{
			name: "allows non-Zod export-all declarations",
			code: 'export * from "not-zod";\nexport * as zod from "not-zod";\n',
		},
		{
			name: "allows non-Zod qualified ZodTypeAny references",
			code: "declare namespace Foo { type ZodTypeAny = string }\ntype Schema = Foo.ZodTypeAny;\n",
		},
		{
			name: "allows non-Zod inline import ZodTypeAny references",
			code: 'type Schema = import("not-zod").ZodTypeAny;\n',
		},
		{
			name: "allows non-Zod indexed namespace ZodTypeAny references",
			code: 'declare namespace Foo { type ZodTypeAny = string }\ntype Schema = Foo["ZodTypeAny"];\n',
		},
		{
			name: "allows local type aliases that shadow Zod namespace imports",
			code: 'import { z } from "zod";\ntype z = { ZodTypeAny: string };\ntype Schema = z["ZodTypeAny"];\n',
		},
		{
			name: "allows non-Zod indexed inline import ZodTypeAny references",
			code: 'type Schema = import("not-zod")["ZodTypeAny"];\n',
		},
		{
			name: "allows non-Zod import equals namespace references",
			code: 'import zod = require("not-zod");\ntype Schema = zod.ZodTypeAny;\n',
		},
		{
			name: "allows non-Zod heritage clauses",
			code: "declare namespace Foo { interface ZodTypeAny {} }\ninterface Schema extends Foo.ZodTypeAny {}\n",
		},
		{
			name: "source roots do not use ZodTypeAny",
			code: 'import { createRequire } from "node:module";\n\nconst require = createRequire(import.meta.url);\n\n// Prisma loads this generator from schema.prisma via provider string.\nexport const prismaJsonTypesGeneratorProvider = require.resolve("prisma-json-types-generator");\n',
		},
	],
	invalid: [
		{
			name: "rejects direct ZodTypeAny imports and references",
			code: 'import { type ZodTypeAny } from "zod";\ntype Schema = ZodTypeAny;\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects direct ZodTypeAny imports from zod subpaths",
			code: 'import { type ZodTypeAny } from "zod/v3";\ntype Schema = ZodTypeAny;\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects aliased ZodTypeAny imports",
			code: 'import { type ZodTypeAny as AnyZodSchema } from "zod";\ntype Schema = AnyZodSchema;\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects qualified z.ZodTypeAny references",
			code: 'import { z } from "zod";\ntype Schema = z.ZodTypeAny;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects qualified z.ZodTypeAny references from zod subpaths",
			code: 'import { z } from "zod/v3";\ntype Schema = z.ZodTypeAny;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects qualified z.ZodTypeAny references before the zod import",
			code: 'type Schema = z.ZodTypeAny;\nimport { z } from "zod";\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects direct ZodTypeAny references before the zod import",
			code: 'type Schema = ZodTypeAny;\nimport type { ZodTypeAny } from "zod";\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects namespace qualified ZodTypeAny references",
			code: 'import * as zod from "zod";\ntype Schema = zod.ZodTypeAny;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects named default import namespace ZodTypeAny references",
			code: 'import { default as zod } from "zod";\ntype Schema = zod.ZodTypeAny;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects namespace qualified ZodTypeAny references before the zod import",
			code: 'type Schema = zod.ZodTypeAny;\nimport * as zod from "zod";\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects import equals namespace qualified ZodTypeAny references",
			code: 'import zod = require("zod");\ntype Schema = zod.ZodTypeAny;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects import equals namespace qualified ZodTypeAny references before the zod import",
			code: 'type Schema = zod.ZodTypeAny;\nimport zod = require("zod");\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects import equals aliases to ZodTypeAny references",
			code: 'import zod = require("zod");\nimport AnyZodSchema = zod.ZodTypeAny;\ntype Schema = AnyZodSchema;\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects import equals aliases to ZodTypeAny references before the aliases",
			code: 'type Schema = AnyZodSchema;\nimport zod = require("zod");\nimport AnyZodSchema = zod.ZodTypeAny;\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects inline import ZodTypeAny references",
			code: 'type Schema = import("zod").ZodTypeAny;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects inline import ZodTypeAny references from zod subpaths",
			code: 'type Schema = import("zod/v3").ZodTypeAny;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed namespace ZodTypeAny references",
			code: 'import { z } from "zod";\ntype Schema = z["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed namespace bare ZodType references",
			code: 'import { z } from "zod";\ntype Schema = z["ZodType"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed namespace ZodTypeAny references through key aliases",
			code: 'import { z } from "zod";\ntype Key = "ZodTypeAny";\ntype Schema = z[Key];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed namespace weak Zod references through union key aliases",
			code: 'import { z } from "zod";\ntype Key = "ZodTypeAny" | "ZodType";\ntype Schema = z[Key];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed namespace ZodTypeAny references through generic key wrappers",
			code: 'import { z } from "zod";\ntype Key<T extends string> = T;\ntype Schema = z[Key<"ZodTypeAny">];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed namespace ZodTypeAny references through defaulted generic keys",
			code: 'import { z } from "zod";\ntype Weak<T extends keyof typeof z = "ZodTypeAny"> = z[T];\ntype Schema = Weak;\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed namespace ZodTypeAny references through generic key instantiations",
			code: 'import { z } from "zod";\ntype Weak<T extends keyof typeof z> = z[T];\ntype Schema = Weak<"ZodTypeAny">;\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed namespace ZodTypeAny references through namespace keyof",
			code: 'import { z } from "zod";\ntype Schema = z[keyof typeof z];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed inline import ZodTypeAny references through module keyof",
			code: 'type Schema = (typeof import("zod"))[keyof typeof import("zod")];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed namespace ZodTypeAny references through utility object wrappers",
			code: 'import { z } from "zod";\ntype Schema = Pick<typeof z, "ZodTypeAny">["ZodTypeAny"];\ntype RequiredSchema = Required<typeof z>["ZodTypeAny"];\n',
			errors: [
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
			],
		},
		{
			name: "rejects utility-wrapped Zod namespace aliases",
			code: 'import { z } from "zod";\ntype W = Pick<typeof z, "ZodTypeAny">;\ntype W2 = Omit<typeof z, "ZodString">;\ntype W3 = Partial<typeof z>;\ntype W4 = Required<typeof z>;\ntype W5 = Record<keyof typeof z, unknown>;\n',
			errors: [
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
			],
		},
		{
			name: "rejects exported utility-wrapped Zod namespace aliases",
			code: 'import { z } from "zod";\nexport type W = Pick<typeof z, "ZodTypeAny">;\nexport type W2 = Omit<typeof z, "ZodString">;\nexport type W3 = Partial<typeof z>;\nexport type W4 = Record<keyof typeof z, unknown>;\n',
			errors: [
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
			],
		},
		{
			name: "rejects indexed namespace ZodTypeAny references through negative key utilities",
			code: 'import { z } from "zod";\ntype Schema = z[Exclude<keyof typeof z, "ZodString">];\ntype Key = Exclude<keyof typeof z, "ZodString">;\ntype Schema2 = z[Key];\ntype Schema3 = Omit<typeof z, "ZodString">[keyof Omit<typeof z, "ZodString">];\n',
			errors: [
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
			],
		},
		{
			name: "rejects indexed namespace ZodTypeAny references through intersection key aliases",
			code: 'import { z } from "zod";\ntype Key = "ZodTypeAny" & string;\ntype Schema = z[Key];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed namespace ZodTypeAny references through keyof utility key aliases",
			code: 'type Key = keyof Pick<typeof import("zod"), "ZodTypeAny">;\ntype Schema = import("zod")[Key];\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects template-literal indexed namespace ZodTypeAny references",
			code: 'import { z } from "zod";\ntype Schema = z[`ZodTypeAny`];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects template-literal indexed namespace bare ZodType references",
			code: 'import { z } from "zod";\ntype Schema = z[`ZodType`];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects computed template-literal indexed namespace ZodTypeAny references",
			code: 'import { z } from "zod";\ntype Key = `Zod${"TypeAny"}`;\ntype Schema = z[Key];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects computed template-literal indexed namespace ZodTypeAny references through part aliases",
			code: 'import { z } from "zod";\ntype Part = "TypeAny";\ntype Schema = z[`Zod${Part}`];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed inline import ZodTypeAny references",
			code: 'type Schema = import("zod")["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed typeof import ZodTypeAny references",
			code: 'type Schema = (typeof import("zod"))["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed typeof import ZodTypeAny references through namespace aliases",
			code: 'type ZodNS = typeof import("zod");\ntype Schema = ZodNS["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed typeof namespace ZodTypeAny references through namespace aliases",
			code: 'import zod = require("zod");\ntype ZodNS = typeof zod;\ntype Schema = ZodNS["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed exported z namespace ZodTypeAny references",
			code: 'type Schema = import("zod")["z"]["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed exported z namespace ZodTypeAny references through namespace aliases",
			code: 'type ZodNS = typeof import("zod");\ntype Z = ZodNS["z"];\ntype Schema = Z["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed exported z namespace ZodTypeAny references through runtime wrappers",
			code: 'import { z } from "zod";\nconst wrapper = { z };\ntype Schema = (typeof wrapper)["z"]["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed exported z namespace ZodTypeAny references through asserted runtime aliases",
			code: 'import { z } from "zod";\nconst zz = z as typeof z;\ntype Schema = typeof zz["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed exported z namespace ZodTypeAny references through destructured runtime aliases",
			code: 'import { z } from "zod";\nconst { z: zz } = { z };\ntype Schema = typeof zz["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed exported z namespace ZodTypeAny references through renamed destructured runtime aliases",
			code: 'import { z } from "zod";\nconst { schema: zz } = { schema: z };\ntype Schema = typeof zz["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed ZodTypeAny references through composed module namespace aliases",
			code: 'type ZodNS = typeof import("zod") & {};\ntype Schema = ZodNS["ZodTypeAny"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects indexed inline import bare ZodType references",
			code: 'type Schema = import("zod")["ZodType"];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects template-literal indexed inline import ZodTypeAny references",
			code: 'type Schema = import("zod")[`ZodTypeAny`];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects template-literal indexed inline import bare ZodType references",
			code: 'type Schema = import("zod")[`ZodType`];\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects weak Zod schema aliases",
			code: 'import { type ZodSchema, type Schema as ZodSchemaAlias } from "zod";\ntype A = ZodSchema;\ntype B = ZodSchemaAlias<string>;\n',
			errors: [
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
				{ messageId: "noWeakZodType" },
			],
		},
		{
			name: "rejects qualified weak Zod schema aliases",
			code: 'import { z } from "zod";\ntype A = z.ZodSchema;\ntype B = z.Schema<string>;\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects later use of disabled weak Zod type aliases",
			code: 'import { z } from "zod";\n// eslint-disable-next-line rule-to-test/no-zod-type-any\ntype Weak = z.ZodTypeAny;\ntype Later = Weak;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects chained weak Zod type aliases",
			code: 'import { z } from "zod";\n// eslint-disable-next-line rule-to-test/no-zod-type-any\ntype Weak = z.ZodTypeAny;\n// eslint-disable-next-line rule-to-test/no-zod-type-any\ntype Chained = Weak;\ntype Later = Chained;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects nested use of disabled weak Zod type aliases",
			code: 'import { z } from "zod";\ndeclare namespace N {\n // eslint-disable-next-line rule-to-test/no-zod-type-any\n type Weak = z.ZodTypeAny;\n type Later = Weak;\n}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects later use of disabled compound weak Zod type aliases",
			code: 'import { z } from "zod";\n// eslint-disable-next-line rule-to-test/no-zod-type-any\ntype Weak = z.ZodTypeAny & { brand?: never };\ntype Later = Weak;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects later use of disabled weak Zod interface aliases",
			code: 'import { z } from "zod";\n// eslint-disable-next-line rule-to-test/no-zod-type-any\ninterface Weak extends z.ZodTypeAny {}\ntype Later = Weak;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects bare ZodType references",
			code: 'import { type ZodType } from "zod";\ntype Schema = ZodType;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects qualified bare ZodType references",
			code: 'import { z } from "zod";\ntype Schema = z.ZodType;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects inline import bare ZodType references",
			code: 'type Schema = import("zod").ZodType;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects import equals aliases to bare ZodType references",
			code: 'import zod = require("zod");\nimport ZodType = zod.ZodType;\ntype Schema = ZodType;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects import equals aliases to bare ZodType references before the aliases",
			code: 'type Schema = ZodType;\nimport zod = require("zod");\nimport ZodType = zod.ZodType;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodType references with any type arguments",
			code: 'import { z, type ZodType } from "zod";\ntype A = z.ZodType<any>;\ntype B = ZodType<unknown, any, unknown>;\ntype C = z.ZodType<{ value: any }>;\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodType references with aliased any type arguments",
			code: 'import { z } from "zod";\ntype Loose = any;\ntype Schema = z.ZodType<Loose>;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodType references with chained aliased any type arguments",
			code: 'import { z } from "zod";\ntype Loose = any;\ntype MoreLoose = Loose;\ntype Schema = z.ZodType<MoreLoose>;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodType references with defaulted generic any aliases",
			code: 'import { z } from "zod";\ntype Loose<T = any> = T;\ntype Schema = z.ZodType<Loose>;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodType references with nested defaulted generic any aliases",
			code: 'import { z } from "zod";\ntype Loose<T = any> = { value: T };\ntype Schema = z.ZodType<Loose>;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodType aliases with defaulted generic any arguments",
			code: 'import { z } from "zod";\ntype Schema<T = any> = z.ZodType<T>;\ntype Later = Schema;\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects exported ZodType aliases with defaulted generic any arguments at the declaration",
			code: 'import { z } from "zod";\nexport type Schema<T = any> = z.ZodType<T>;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodType aliases with generic any constraints",
			code: 'import { z } from "zod";\ntype Schema<T extends any> = z.ZodType<T>;\ntype Later = Schema;\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects function boundaries using ZodType with scoped generic any defaults",
			code: 'import { z } from "zod";\nfunction parse<T = any>(schema: z.ZodType<T>) { return schema; }\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects disabled weak Zod aliases with generic weak defaults",
			code: 'import { z } from "zod";\n// eslint-disable-next-line rule-to-test/no-zod-type-any\ntype Weak<T = z.ZodTypeAny> = T;\ntype Later = Weak;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects disabled weak Zod aliases with generic weak constraints",
			code: 'import { z } from "zod";\n// eslint-disable-next-line rule-to-test/no-zod-type-any\ntype Weak<T extends z.ZodTypeAny> = T;\ntype Later = Weak;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodType references with interface any type arguments",
			code: 'import { z } from "zod";\ninterface Loose { value: any }\ntype Schema = z.ZodType<Loose>;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects generic ZodType aliases instantiated with any",
			code: 'import { z } from "zod";\ntype SchemaOf<T> = z.ZodType<T>;\ntype Weak = SchemaOf<any>;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects chained generic ZodType aliases instantiated with any",
			code: 'import { z } from "zod";\ntype SchemaOf<T> = z.ZodType<T>;\ntype Wrapped<T> = SchemaOf<T>;\ntype Weak = Wrapped<any>;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects inline import ZodType references with any type arguments",
			code: 'type Schema = import("zod").ZodType<any>;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects direct ZodTypeAny re-exports",
			code: 'export type { ZodTypeAny } from "zod";\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects aliased ZodTypeAny re-exports",
			code: 'export { type ZodTypeAny as AnyZodSchema } from "zod";\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodType re-exports",
			code: 'export type { ZodType } from "zod";\nexport { type ZodType as AnyZodSchema } from "zod";\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects Zod namespace re-exports",
			code: 'export { z } from "zod";\nexport { default as zod } from "zod";\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects local weak Zod alias re-exports",
			code: '// eslint-disable-next-line rule-to-test/no-zod-type-any\nimport type { ZodTypeAny as AnyZodSchema } from "zod";\nexport type { AnyZodSchema };\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects local Zod namespace re-exports",
			code: 'import { z } from "zod";\nexport { z };\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects default Zod namespace exports",
			code: 'import { z } from "zod";\nexport default z;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects export assignment Zod namespace exports",
			code: 'import { z } from "zod";\nexport = z;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects aliased Zod namespace re-exports",
			code: 'import { z } from "zod";\nconst zod = z;\nexport { zod };\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects exported Zod namespace variable aliases",
			code: 'import { z } from "zod";\nexport const zod = z;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects exported Zod namespace object wrappers",
			code: 'import { z } from "zod";\nexport const wrapper = { z };\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects disabled exported weak Zod type aliases",
			code: 'import { z } from "zod";\n// eslint-disable-next-line rule-to-test/no-zod-type-any\nexport type AnyZodSchema = z.ZodTypeAny;\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects line-disabled exported weak Zod type aliases",
			code: 'import { z } from "zod";\nexport type AnyZodSchema = z.ZodTypeAny; // eslint-disable-line rule-to-test/no-zod-type-any\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects rulesdir-disabled weak Zod re-export specifiers",
			code: '// eslint-disable-next-line rule-to-test/no-zod-type-any\nexport type { ZodTypeAny as AnyZodSchema } from "zod";\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects rulesdir-line-disabled weak Zod re-export specifiers",
			code: 'export type { ZodTypeAny as AnyZodSchema } from "zod"; // eslint-disable-line rule-to-test/no-zod-type-any\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects rulesdir-disabled local weak Zod re-export specifiers",
			code: 'import { z } from "zod";\n// eslint-disable-next-line rule-to-test/no-zod-type-any\ntype Weak = z.ZodTypeAny;\n// eslint-disable-next-line rule-to-test/no-zod-type-any\nexport type { Weak };\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects rulesdir-disabled exported weak Zod interfaces",
			code: 'import { z } from "zod";\n// eslint-disable-next-line rule-to-test/no-zod-type-any\nexport interface Boundary { schema: z.ZodTypeAny }\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects rulesdir-disabled exported weak Zod interface properties",
			code: 'import { z } from "zod";\nexport interface Boundary {\n // eslint-disable-next-line rule-to-test/no-zod-type-any\n schema: z.ZodTypeAny\n}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects rulesdir-disabled exported weak Zod interfaces through aliases",
			code: 'import { z } from "zod";\n// eslint-disable-next-line rule-to-test/no-zod-type-any\ntype Weak = z.ZodTypeAny;\n// eslint-disable-next-line rule-to-test/no-zod-type-any\nexport interface Boundary { schema: Weak }\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects rulesdir-disabled exported weak Zod classes",
			code: 'import { z } from "zod";\n// eslint-disable-next-line rule-to-test/no-zod-type-any\nexport class Boundary { schema!: z.ZodTypeAny }\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects export-all from zod",
			code: 'export * from "zod";\nexport * as zod from "zod";\n',
			errors: [{ messageId: "noWeakZodType" }, { messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodTypeAny in interface heritage clauses",
			code: 'import { z } from "zod";\ninterface Schema extends z.ZodTypeAny {}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodType with any type arguments in interface heritage clauses",
			code: 'import { z } from "zod";\ninterface Schema extends z.ZodType<any> {}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodTypeAny in class implements clauses",
			code: 'import { z } from "zod";\nclass Schema implements z.ZodTypeAny {}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects ZodType with any type arguments in class implements clauses",
			code: 'import { z } from "zod";\nclass Schema implements z.ZodType<any> {}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects bare ZodType type predicates without runtime Zod guards",
			code: 'import { type ZodType } from "zod";\nfunction isZodType(value: unknown): value is ZodType {\n return Boolean(value);\n}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects bare ZodType type predicates that guard a different value",
			code: 'import { ZodType } from "zod";\nfunction isZodType(value: unknown, other: unknown): value is ZodType {\n return other instanceof ZodType;\n}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects bare ZodType type predicates with dead runtime Zod guards",
			code: 'import { ZodType } from "zod";\nfunction isZodType(value: unknown): value is ZodType {\n value instanceof ZodType;\n return true;\n}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects bare ZodType type predicates with unreachable runtime Zod guards",
			code: 'import { ZodType } from "zod";\nfunction isZodType(value: unknown): value is ZodType {\n return true || value instanceof ZodType;\n}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects bare ZodType type predicates with inverted runtime Zod guards",
			code: 'import { ZodType } from "zod";\nfunction isZodType(value: unknown): value is ZodType {\n return (value instanceof ZodType) === false;\n}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects bare ZodType type predicates with unguarded true return paths",
			code: 'import { ZodType } from "zod";\nfunction isZodType(value: unknown): value is ZodType {\n if (typeof value === "string") return true;\n return value instanceof ZodType;\n}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
		{
			name: "rejects bare ZodType type predicates with impossible runtime Zod guards",
			code: 'import { ZodType } from "zod";\nfunction isZodType(value: unknown): value is ZodType {\n return value instanceof ZodType && false;\n}\n',
			errors: [{ messageId: "noWeakZodType" }],
		},
	],
});
