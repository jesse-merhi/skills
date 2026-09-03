import { assert, describe, it } from "vitest";

import base from "./base.mjs";
import jest from "./jest.mjs";
import playwright from "./playwright.mjs";
import prisma from "./prisma.mjs";
import reactNative from "./react-native.mjs";
import react from "./react.mjs";
import tailwind from "./tailwind.mjs";
import typescript from "./typescript.mjs";
import vitest from "./vitest.mjs";
import zod from "./zod.mjs";

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
			[zod({ allowedFiles: ["src/boundary.ts"], checkManualTypeChecks: true }), "standards/prefer-zod-for-unknown-typeof", { allowedFiles: ["src/boundary.ts"], checkManualTypeChecks: true }],
		];
		for (const [configs, ruleId, expected] of cases) {
			assert.deepEqual(ruleOptions(configs, ruleId), expected, ruleId);
		}
	});

	it("reaches both jsx-a11y component lists through the react preset", () => {
		const configs = react({ a11y: { controlComponents: ["Field"], controlsRequiringLabel: ["IconButton"], labelComponents: ["FieldLabel"] } });
		assert.deepEqual(ruleOptions(configs, "jsx-a11y/label-has-associated-control").controlComponents, ["Field"]);
		assert.deepEqual(ruleOptions(configs, "jsx-a11y/label-has-associated-control").labelComponents, ["FieldLabel"]);
		assert.deepEqual(ruleOptions(configs, "jsx-a11y/control-has-associated-label").controlComponents, ["IconButton"]);
	});

	it("enables the project service only when type-aware linting is requested", () => {
		const [config] = typescript({ typeChecked: true, tsconfigRootDir: "/repo" });
		assert.deepEqual(config.languageOptions.parserOptions, { projectService: true, tsconfigRootDir: "/repo" });
		assert.deepEqual(typescript()[0].languageOptions.parserOptions, {});
	});

	it("turns the colour rule off for the palette module and nowhere else", () => {
		const configs = reactNative({ colorModuleFiles: ["**/lib/colors.ts"] });
		const override = configs.find((config) => config.rules?.["standards/no-raw-color-literals"] === "off");
		assert.deepEqual(override?.files, ["**/lib/colors.ts"]);
		assert.isUndefined(reactNative().find((config) => config.rules?.["standards/no-raw-color-literals"] === "off"));
	});

	it("forwards tokenModule, allowedAllCapsTerms, and the style-assertion options where the title claims", () => {
		assert.deepEqual(ruleOptions(tailwind({ tokenModule: "@/ui/elevation" }), "standards/no-raw-elevation"), { tokenModule: "@/ui/elevation" });
		assert.deepEqual(ruleOptions(reactNative({ allowedAllCapsTerms: ["NFC"] }), "standards/no-small-text"), { allowedAllCapsTerms: ["NFC"] });
		assert.deepEqual(ruleOptions(playwright({ semanticClassTokens: ["card"], semanticClassValues: ["dark"] }), "standards/no-brittle-test-style-assertions"), { semanticClassTokens: ["card"], semanticClassValues: ["dark"] });
	});

	it("emits no option object keys the consumer did not set", () => {
		assert.deepEqual(ruleOptions(vitest(), "standards/no-brittle-test-style-assertions"), {});
		assert.deepEqual(ruleOptions(tailwind(), "standards/no-small-text"), {});
		assert.deepEqual(ruleOptions(prisma(), "standards/no-raw-sql"), {});
	});
});
