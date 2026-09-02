import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-trivial-forwarding-wrapper.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
	languageOptions: { parser: tsParser, sourceType: "module", parserOptions: { ecmaVersion: 2022 } },
});

ruleTester.run("no-trivial-forwarding-wrapper", rule, {
	valid: [
		{
			name: "allows type predicates",
			code: "const isString = (value: unknown): value is string => typeof value === 'string';\n",
		},
		{ name: "allows async wrappers", code: "const capture = async (value: string) => target(value);\n" },
		{ name: "allows generators", code: "function* capture(value: string) { return target(value); }\n" },
		{
			name: "allows wrappers that reorder arguments",
			code: "const capture = (a: string, b: string) => target(b, a);\n",
		},
		{
			name: "ignores exported wrappers by default",
			code: "export const capture = (value: string) => target(value);\n",
		},
	],
	invalid: [
		{
			name: "rejects named forwarding wrappers",
			code: "const capture = (value: string) => target(value);\n",
			errors: [{ messageId: "forwarding", data: { name: "capture" } }],
		},
		{
			name: "rejects exported wrappers once ignoreExported is off",
			code: "export const capture = (value: string) => target(value);\n",
			options: [{ ignoreExported: false }],
			errors: [{ messageId: "forwarding", data: { name: "capture" } }],
		},
	],
});
