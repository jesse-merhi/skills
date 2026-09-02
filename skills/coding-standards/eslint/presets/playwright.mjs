import playwrightPlugin from "eslint-plugin-playwright";

import { standards } from "../standards-plugin.mjs";

const DEFAULT_FILES = ["**/tests/e2e/**/*.{ts,tsx}"];
const DEFAULT_CHECKS = ["domPath"];

export default function playwright(options = {}) {
	const brittleSelectorOptions = { checks: options.checks ?? DEFAULT_CHECKS };

	const brittleStyleOptions = {};
	if (options.semanticClassTokens !== undefined) {
		brittleStyleOptions.semanticClassTokens = options.semanticClassTokens;
	}

	return [
		{
			files: options.files ?? DEFAULT_FILES,
			plugins: { playwright: playwrightPlugin, standards },
			rules: {
				"playwright/missing-playwright-await": "error",
				"playwright/no-commented-out-tests": "error",
				"playwright/no-duplicate-hooks": "error",
				"playwright/no-duplicate-slow": "error",
				"playwright/no-element-handle": "error",
				"playwright/no-eval": "error",
				"playwright/no-focused-test": "error",
				"playwright/no-force-option": "error",
				"playwright/no-get-by-title": "error",
				"playwright/no-nested-step": "error",
				"playwright/no-networkidle": "error",
				"playwright/no-page-pause": "error",
				"playwright/no-skipped-test": ["error", { allowConditional: true, disallowFixme: true }],
				"playwright/no-standalone-expect": "error",
				"playwright/no-unsafe-references": "error",
				"playwright/no-unused-locators": "error",
				"playwright/no-useless-await": "error",
				"playwright/no-useless-not": "error",
				"playwright/no-wait-for-navigation": "error",
				"playwright/no-wait-for-selector": "error",
				"playwright/no-wait-for-timeout": "error",
				"playwright/prefer-native-locators": "error",
				"playwright/prefer-to-have-count": "error",
				"playwright/prefer-to-have-length": "error",
				"playwright/prefer-web-first-assertions": "error",
				"playwright/valid-describe-callback": "error",
				"playwright/valid-expect": "error",
				"playwright/valid-expect-in-promise": "error",
				"playwright/valid-test-tags": "error",
				"playwright/valid-title": "error",
				"standards/no-brittle-e2e-selectors": ["error", brittleSelectorOptions],
				"standards/no-brittle-test-style-assertions": ["error", brittleStyleOptions],
				"standards/no-large-test-snapshots": "error",
			},
		},
	];
}
