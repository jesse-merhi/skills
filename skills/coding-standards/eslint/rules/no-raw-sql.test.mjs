import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-raw-sql.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
	languageOptions: { parser: tsParser, sourceType: "module", parserOptions: { ecmaVersion: 2022 } },
});

ruleTester.run("no-raw-sql", rule, {
	valid: [
		{
			name: "allows parameterized template helpers",
			code: "const rows = await db.$queryRaw(Prisma.sql`select 1`);\n",
		},
		{
			name: "allows the default escape once it is not configured",
			code: 'const rows = Prisma.raw("select 1");\n',
			options: [{ escapes: [{ object: "sql", property: "unsafe" }] }],
		},
	],
	invalid: [
		{
			name: "rejects the default Prisma escape",
			code: 'const rows = Prisma.raw("select 1");\n',
			errors: [{ messageId: "rawSql", data: { escape: "Prisma.raw" } }],
		},
		{
			name: "rejects a configured escape",
			code: 'const rows = sql.unsafe("select 1");\n',
			options: [{ escapes: [{ object: "sql", property: "unsafe" }] }],
			errors: [{ messageId: "rawSql", data: { escape: "sql.unsafe" } }],
		},
	],
});
