import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-banner-comments.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
	languageOptions: { parser: tsParser, sourceType: "module", parserOptions: { ecmaVersion: 2022 } },
});

ruleTester.run("no-banner-comments", rule, {
	valid: [
		{ name: "keeps plain section comments", code: "// Section name\nconst value = 1;\n" },
		{ name: "keeps short rules of thumb", code: "// --- keep\nconst value = 1;\n" },
	],
	invalid: [
		{
			name: "rejects dash separators",
			code: "// ----------\nconst value = 1;\n",
			errors: [{ messageId: "banner" }],
		},
		{
			name: "rejects equals separators",
			code: "/* ========== */\nconst value = 1;\n",
			errors: [{ messageId: "banner" }],
		},
	],
});
