import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-brittle-e2e-selectors.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
	languageOptions: { parser: tsParser, sourceType: "module", parserOptions: { ecmaVersion: 2022 } },
});

ruleTester.run("no-brittle-e2e-selectors", rule, {
	valid: [
		{
			name: "allows stable data selectors and documented exceptions",
			code: '\n\t\t\tpage.locator(\'[data-testid="worker-row"]\');\n\t\t\t// @allow-brittle-e2e-selector third-party calendar exposes no accessible date cell name.\n\t\t\tpage.locator("td:nth-child(2)");\n\t\t',
			filename: "/repo/packages/web/tests/e2e/example.spec.ts",
		},
		{
			name: "allows an escape marker on an enclosing statement above the nearby-line window",
			code: '\n// @allow-brittle-e2e-selector third-party calendar exposes no accessible date cell name.\nif (legacyCalendar) {\n\tconst grid = page.locator(\'[data-testid="calendar"]\');\n\tgrid.click();\n\tpage.locator("td:nth-child(2)");\n}\n',
			filename: "/repo/packages/web/tests/e2e/example.spec.ts",
		},
	],
	invalid: [
		{
			name: "reports in every file the flat config enables it for",
			code: '\n\t\t\tpage.locator("#root > span");\n\t\t',
			filename: "/repo/packages/web/src/components/Table.tsx",
			errors: [{ messageId: "domPath" }],
		},
		{
			name: "rejects DOM path and nth-child selectors",
			code: '\n\t\t\tpage.locator("#assigned-shift-assignee-list-show-unavailable > span");\n\t\t\tpage.locator("td:nth-child(2)");\n\t\t',
			filename: "/repo/packages/web/tests/e2e/example.spec.ts",
			errors: [{ messageId: "domPath" }, { messageId: "nthChild" }],
		},
		{
			name: "rejects class attribute and utility-class selectors",
			code: '\n\t\t\tpage.locator(\'[class*="whitespace-nowrap"]\');\n\t\t\trow.locator("svg.text-emerald-500");\n\t\t',
			filename: "/repo/packages/web/tests/e2e/example.spec.ts",
			errors: [{ messageId: "classAttribute" }, { messageId: "utilityClass" }],
		},
		{
			name: "rejects DOM path traversal after stable data selector roots",
			code: "\n\t\t\tpage.locator('[data-testid=\"worker-row\"] > span');\n\t\t",
			filename: "/repo/packages/web/tests/e2e/example.spec.ts",
			errors: [{ messageId: "domPath" }],
		},
		{
			name: "rejects class selectors combined with stable data selector roots",
			code: '\n\t\t\tpage.locator(\'[data-testid="worker-row"][class*="whitespace-nowrap"]\');\n\t\t\tpage.locator(\'[data-testid="worker-row"].text-emerald-500\');\n\t\t',
			filename: "/repo/packages/web/tests/e2e/example.spec.ts",
			errors: [{ messageId: "classAttribute" }, { messageId: "utilityClass" }],
		},
		{
			name: "can be rolled out one selector category at a time",
			code: '\n\t\t\t\tpage.locator("td:nth-child(2)");\n\t\t\t\tpage.locator("#assigned-shift-assignee-list-show-unavailable > span");\n\t\t\t\tpage.locator("tbody tr:nth-child(2) > td");\n\t\t\t',
			filename: "/repo/packages/web/tests/e2e/example.spec.ts",
			options: [{ checks: ["domPath"] }],
			errors: [{ messageId: "domPath" }, { messageId: "domPath" }],
		},
	],
});
