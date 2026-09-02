import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./prefer-zod-for-unknown-typeof.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
	languageOptions: { parser: tsParser, sourceType: "module", parserOptions: { ecmaVersion: 2022 } },
});

ruleTester.run("prefer-zod-for-unknown-typeof", rule, {
	valid: [
		{
			name: "allows typeof checks on typed parameters",
			code: 'function handle(value: string) { return typeof value === "string"; }\n',
		},
		{
			name: "allows parsing unknown values with a schema",
			code: "function handle(value: unknown) { return schema.safeParse(value); }\n",
		},
		{
			name: "allows instanceof checks unless manual type checks are enabled",
			code: "function handle(value: unknown) { return value instanceof Date; }\n",
		},
		{
			name: "skips files listed in allowedFiles",
			code: 'function handle(value: unknown) { return typeof value === "string"; }\n',
			filename: "/repo/src/boundary/decode.ts",
			options: [{ allowedFiles: ["boundary/decode.ts"] }],
		},
	],
	invalid: [
		{
			name: "rejects typeof checks on unknown parameters",
			code: 'function handle(value: unknown) { return typeof value === "string"; }\n',
			errors: [{ messageId: "preferZod", data: { name: "value" } }],
		},
		{
			name: "rejects typeof checks on Record<string, unknown> parameters",
			code: 'function handle(payload: Record<string, unknown>) { return typeof payload.id === "string"; }\n',
			errors: [{ messageId: "preferZod", data: { name: "payload" } }],
		},
		{
			name: "rejects instanceof checks once manual type checks are enabled",
			code: "function handle(value: unknown) { return value instanceof Date; }\n",
			options: [{ checkManualTypeChecks: true }],
			errors: [{ messageId: "preferZod", data: { name: "value" } }],
		},
		{
			name: "rejects Array.isArray checks once manual type checks are enabled",
			code: "function handle(value: unknown) { return Array.isArray(value); }\n",
			options: [{ checkManualTypeChecks: true }],
			errors: [{ messageId: "preferZod", data: { name: "value" } }],
		},
	],
});
