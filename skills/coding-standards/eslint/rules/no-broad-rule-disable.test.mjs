import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-broad-rule-disable.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const inertRule = { create: () => ({}) };

const ruleTester = new RuleTester({
	languageOptions: { parser: tsParser, sourceType: "module", parserOptions: { ecmaVersion: 2022 } },
	// The fixtures carry directives for rules the tester does not run, so
	// ESLint's own unused-directive reporting would drown out the rule.
	linterOptions: { reportUnusedDisableDirectives: "off" },
	plugins: { standards: { rules: { "no-console": inertRule } } },
});

const protectedConsole = [{ rules: ["no-console"] }];

ruleTester.run("no-broad-rule-disable", rule, {
	valid: [
		{
			name: "reports nothing when no rules are protected",
			code: "/* eslint-disable no-console */\nconst value = 1;\n",
		},
		{
			name: "ignores a protected name that appears only in another rule's description",
			code: "/* eslint-disable no-debugger -- no-console is handled below */\nconst value = 1;\n",
			options: protectedConsole,
		},
		{
			name: "allows focused line disables of a protected rule",
			code: "const value = 1; // eslint-disable-line no-console\n",
			options: protectedConsole,
		},
		{
			name: "allows focused next-line disables of a protected rule",
			code: "// eslint-disable-next-line no-console\nconst value = 1;\n",
			options: protectedConsole,
		},
		{
			name: "allows broad disables of unprotected rules",
			code: "/* eslint-disable no-debugger */\nconst value = 1;\n",
			options: protectedConsole,
		},
	],
	invalid: [
		{
			name: "rejects block disables of a protected rule",
			code: "/* eslint-disable no-console */\nconst value = 1;\n",
			options: protectedConsole,
			errors: [{ messageId: "broadDisable", data: { rule: "no-console" } }],
		},
		{
			name: "rejects broad line disables of a protected rule",
			code: "// eslint-disable no-console\nconst value = 1;\n",
			options: protectedConsole,
			errors: [{ messageId: "broadDisable", data: { rule: "no-console" } }],
		},
		{
			name: "matches a plugin-prefixed directive against a bare protected name",
			code: "/* eslint-disable standards/no-console */\nconst value = 1;\n",
			options: protectedConsole,
			errors: [{ messageId: "broadDisable", data: { rule: "no-console" } }],
		},
		{
			name: "matches a bare directive against a plugin-prefixed protected name",
			code: "/* eslint-disable no-console */\nconst value = 1;\n",
			options: [{ rules: ["standards/no-console"] }],
			errors: [{ messageId: "broadDisable", data: { rule: "no-console" } }],
		},
	],
});
