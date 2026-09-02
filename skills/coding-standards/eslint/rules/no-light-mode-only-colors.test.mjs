import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-light-mode-only-colors.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
	languageOptions: {
		parser: tsParser,
		sourceType: "module",
		parserOptions: { ecmaVersion: 2022, ecmaFeatures: { jsx: true } },
	},
});

ruleTester.run("no-light-mode-only-colors", rule, {
	valid: [
		{
			name: "allows semantic tokens",
			code: 'const Card = () => <div className="bg-card text-muted-foreground" />;\n',
		},
		{
			name: "allows light utilities paired with a dark counterpart",
			code: 'const Card = () => <div className="bg-white dark:bg-slate-900" />;\n',
		},
		{
			name: "allows prose with an inverted dark counterpart",
			code: 'const Body = () => <div className="prose dark:prose-invert" />;\n',
		},
	],
	invalid: [
		{
			name: "rejects bare light-mode utilities",
			code: 'const Card = () => <div className="bg-gray-100" />;\n',
			errors: [{ messageId: "lightOnly", data: { token: "bg-gray-100" } }],
		},
		{
			name: "rejects bare prose without dark support",
			code: 'const Body = () => <div className="prose" />;\n',
			errors: [{ messageId: "bareProse" }],
		},
	],
});
