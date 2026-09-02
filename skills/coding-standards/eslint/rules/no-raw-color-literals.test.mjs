import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-raw-color-literals.mjs";

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

ruleTester.run("no-raw-color-literals", rule, {
	valid: [
		{
			name: "allows theme tokens in JSX color props",
			code: "const Icon = () => <Chevron color={theme.icon} />;\n",
		},
		{ name: "allows theme tokens in style objects", code: "const styles = { backgroundColor: tokens.surface };\n" },
		{
			name: "allows non-color props holding hex-like strings",
			code: 'const Row = () => <Anchor href="#top" />;\n',
		},
	],
	invalid: [
		{
			name: "rejects a raw literal in a JSX color attribute",
			code: 'const Icon = () => <Chevron color="#ffffff" />;\n',
			errors: [{ messageId: "rawColor" }],
		},
		{
			name: "rejects a raw literal inside a JSX expression container",
			code: 'const Icon = () => <Chevron pinColor={"rgb(0, 0, 0)"} />;\n',
			errors: [{ messageId: "rawColor" }],
		},
		{
			name: "rejects a raw literal on an identifier-keyed color property",
			code: 'const styles = { backgroundColor: "#fff" };\n',
			errors: [{ messageId: "rawColor" }],
		},
		{
			name: "rejects a raw literal on a string-keyed color property",
			code: 'const styles = { "shadowColor": "hsla(0, 0%, 0%, 0.2)" };\n',
			errors: [{ messageId: "rawColor" }],
		},
		{
			name: "uses the configured message",
			code: 'const styles = { backgroundColor: "#fff" };\n',
			options: [{ message: "Use useThemeColors() instead." }],
			errors: [{ message: "Use useThemeColors() instead." }],
		},
	],
});
