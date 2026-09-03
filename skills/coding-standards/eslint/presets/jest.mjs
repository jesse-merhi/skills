import jestPlugin from "eslint-plugin-jest";

import { standards } from "../standards-plugin.mjs";

const DEFAULT_FILES = ["**/*.{test,spec}.{ts,tsx,js,jsx,mts,mjs}"];

export default function jest(options = {}) {
	const brittleStyleOptions = {};
	if (options.semanticClassTokens !== undefined) {
		brittleStyleOptions.semanticClassTokens = options.semanticClassTokens;
	}
	if (options.semanticClassValues !== undefined) {
		brittleStyleOptions.semanticClassValues = options.semanticClassValues;
	}

	return [
		{
			files: options.files ?? DEFAULT_FILES,
			plugins: { jest: jestPlugin, standards },
			rules: {
				"jest/no-alias-methods": "error",
				"jest/no-commented-out-tests": "error",
				"jest/no-confusing-set-timeout": "error",
				"jest/no-deprecated-functions": "error",
				"jest/no-disabled-tests": "error",
				"jest/no-done-callback": "error",
				"jest/no-duplicate-hooks": "error",
				"jest/no-error-equal": "error",
				"jest/no-export": "error",
				"jest/no-focused-tests": "error",
				"jest/no-identical-title": "error",
				"jest/no-interpolation-in-snapshots": "error",
				"jest/no-jasmine-globals": "error",
				"jest/no-mocks-import": "error",
				"jest/no-standalone-expect": "error",
				"jest/no-test-prefixes": "error",
				"jest/no-test-return-statement": "error",
				"jest/no-unneeded-async-expect-function": "error",
				"jest/require-to-throw-message": "error",
				"jest/valid-describe-callback": "error",
				"jest/valid-expect": "error",
				"jest/valid-expect-in-promise": "error",
				"jest/valid-expect-with-promise": "error",
				"jest/valid-title": "error",
				"standards/no-brittle-test-style-assertions": ["error", brittleStyleOptions],
				"standards/no-large-test-snapshots": "error",
			},
		},
	];
}
