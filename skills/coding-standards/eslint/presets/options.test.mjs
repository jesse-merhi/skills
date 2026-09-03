import { assert, describe, it } from "vitest";

import base from "./base.mjs";
import jest from "./jest.mjs";
import playwright from "./playwright.mjs";
import prisma from "./prisma.mjs";
import reactNative from "./react-native.mjs";
import tailwind from "./tailwind.mjs";
import vitest from "./vitest.mjs";

const ruleOptions = (configs, ruleId) => {
	const setting = configs.map((config) => config.rules?.[ruleId]).find((value) => value !== undefined);
	return Array.isArray(setting) ? setting[1] : undefined;
};

describe("preset option forwarding", () => {
	it("passes every rule option a consumer can set through to the rule", () => {
		const cases = [
			[base({ ignoreExported: false }), "standards/no-trivial-forwarding-wrapper", { ignoreExported: false }],
			[vitest({ semanticClassTokens: ["card"], semanticClassValues: ["dark", "theme-transitioning"] }), "standards/no-brittle-test-style-assertions", { semanticClassTokens: ["card"], semanticClassValues: ["dark", "theme-transitioning"] }],
			[jest({ semanticClassValues: ["theme-transitioning"] }), "standards/no-brittle-test-style-assertions", { semanticClassValues: ["theme-transitioning"] }],
			[playwright({ checks: ["nthChild"], semanticClassValues: ["dark"] }), "standards/no-brittle-e2e-selectors", { checks: ["nthChild"] }],
			[tailwind({ minimumFontSizePx: 12, allowedAllCapsTerms: ["API"] }), "standards/no-small-text", { minimumFontSizePx: 12, allowedAllCapsTerms: ["API"] }],
			[tailwind({ tokenModule: "@/ui/elevation", maximumPx: 1200, disallowedNamedBreakpoints: [] }), "standards/no-wide-arbitrary-breakpoints", { maximumPx: 1200, disallowedNamedBreakpoints: [] }],
			[reactNative({ colorMessage: "Use useThemeColors()", minimumFontSizePx: 13 }), "standards/no-raw-color-literals", { message: "Use useThemeColors()" }],
			[reactNative({ minimumFontSizePx: 13 }), "standards/no-small-text", { minimumFontSizePx: 13 }],
			[prisma({ escapes: [{ object: "db", property: "raw" }] }), "standards/no-raw-sql", { escapes: [{ object: "db", property: "raw" }] }],
		];
		for (const [configs, ruleId, expected] of cases) {
			assert.deepEqual(ruleOptions(configs, ruleId), expected, ruleId);
		}
	});

	it("emits no option object keys the consumer did not set", () => {
		assert.deepEqual(ruleOptions(vitest(), "standards/no-brittle-test-style-assertions"), {});
		assert.deepEqual(ruleOptions(tailwind(), "standards/no-small-text"), {});
		assert.deepEqual(ruleOptions(prisma(), "standards/no-raw-sql"), {});
	});
});
