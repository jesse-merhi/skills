import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-raw-elevation.mjs";

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

ruleTester.run("no-raw-elevation", rule, {
	valid: [
		{ name: "allows removing elevation", code: 'const Card = () => <div className="shadow-none" />;\n' },
		{
			name: "allows named elevation tokens",
			code: 'import { elevation } from "@/lib/elevation";\nconst Card = () => <div className={elevation.raised} />;\n',
		},
	],
	invalid: [
		{
			name: "rejects raw shadow utilities without naming a token module",
			code: 'const Card = () => <div className="shadow-lg" />;\n',
			errors: [{ messageId: "rawElevation", data: { token: "shadow-lg" } }],
		},
		{
			name: "names the configured token module",
			code: 'const Card = () => <div className="drop-shadow-md" />;\n',
			options: [{ tokenModule: "~/design/elevation" }],
			errors: [
				{
					messageId: "rawElevationFromModule",
					data: { token: "drop-shadow-md", tokenModule: "~/design/elevation" },
				},
			],
		},
	],
});
