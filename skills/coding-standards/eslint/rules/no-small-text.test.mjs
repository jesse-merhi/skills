import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-small-text.mjs";

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

ruleTester.run("no-small-text", rule, {
	valid: [
		{
			name: "allows shared typography tokens",
			code: 'const Row = () => <span className="text-sm">Total</span>;\n',
		},
		{
			name: "allows documented small-text exceptions",
			code: '// @allow-small-text dense data grid\nconst Row = () => <span className="text-xs">Total</span>;\n',
		},
		{ name: "allows allow-listed all-caps terms", code: "const Row = () => <span>JSON</span>;\n" },
		{
			name: "allows inline font sizes above a lowered minimum",
			code: "const styles = { fontSize: 12 };\n",
			options: [{ minimumFontSizePx: 10 }],
		},
		{
			name: "allows all-caps terms once they are configured",
			code: "const Row = () => <span>SAVE CHANGES</span>;\n",
			options: [{ allowedAllCapsTerms: ["SAVE CHANGES"] }],
		},
	],
	invalid: [
		{
			name: "rejects tiny typography tokens",
			code: 'const Row = () => <span className="text-xs">Total</span>;\n',
			errors: [{ messageId: "tinyToken", data: { token: "text-xs" } }],
		},
		{
			name: "rejects arbitrary text sizes",
			code: 'const Row = () => <span className="text-[10px]">Total</span>;\n',
			errors: [{ messageId: "arbitrarySize", data: { token: "text-[10px]" } }],
		},
		{
			name: "rejects inline font sizes below the minimum",
			code: "const styles = { fontSize: 12 };\n",
			errors: [{ messageId: "inlineFontSize", data: { size: "12", minimum: "14" } }],
		},
		{
			name: "rejects all-caps utilities",
			code: 'const Row = () => <span className="uppercase">Total</span>;\n',
			errors: [{ messageId: "uppercaseUtility", data: { token: "uppercase" } }],
		},
		{
			name: "rejects all-caps visible copy",
			code: "const Row = () => <span>SAVE CHANGES</span>;\n",
			errors: [{ messageId: "allCapsCopy", data: { text: "SAVE CHANGES" } }],
		},
		{
			name: "rejects the default all-caps term once allowedAllCapsTerms replaces it",
			code: "const Row = () => <span>JSON</span>;\n",
			options: [{ allowedAllCapsTerms: ["SAVE CHANGES"] }],
			errors: [{ messageId: "allCapsCopy", data: { text: "JSON" } }],
		},
		{
			name: "rejects inline font sizes below a raised minimum",
			code: "const styles = { fontSize: 15 };\n",
			options: [{ minimumFontSizePx: 16 }],
			errors: [{ messageId: "inlineFontSize", data: { size: "15", minimum: "16" } }],
		},
	],
});
