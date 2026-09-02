import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-large-test-snapshots.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
	languageOptions: { parser: tsParser, sourceType: "module", parserOptions: { ecmaVersion: 2022 } },
});

ruleTester.run("no-large-test-snapshots", rule, {
	valid: [
		{
			name: "allows explicitly named snapshot specs",
			code: '\n\t\t\t\texpect(serialized).toMatchInlineSnapshot("{}");\n\t\t\t',
			filename: "/repo/packages/web/tests/unit/parser.snapshot.test.ts",
		},
	],
	invalid: [
		{
			name: "rejects ordinary snapshots",
			code: '\n\t\t\texpect(rendered).toMatchSnapshot();\n\t\t\texpect(rendered).toMatchInlineSnapshot("<div />");\n\t\t',
			filename: "/repo/packages/web/tests/unit/example.test.ts",
			errors: [{ messageId: "snapshot" }, { messageId: "snapshot" }],
		},
	],
});
