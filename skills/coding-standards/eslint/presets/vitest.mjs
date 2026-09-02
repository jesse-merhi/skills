import vitestPlugin from "@vitest/eslint-plugin";

import { standards } from "../standards-plugin.mjs";

const DEFAULT_FILES = ["**/*.{test,spec}.{ts,tsx,js,jsx,mts,mjs}"];

export default function vitest(options = {}) {
	const brittleStyleOptions = {};
	if (options.semanticClassTokens !== undefined) {
		brittleStyleOptions.semanticClassTokens = options.semanticClassTokens;
	}

	return [
		{
			files: options.files ?? DEFAULT_FILES,
			plugins: { "@vitest": vitestPlugin, standards },
			rules: {
				"@vitest/consistent-each-for": ["error", { test: "each", it: "each", describe: "each" }],
				"@vitest/no-commented-out-tests": "error",
				"@vitest/no-conditional-tests": "error",
				"@vitest/no-disabled-tests": "error",
				"@vitest/no-done-callback": "error",
				"@vitest/no-duplicate-hooks": "error",
				"@vitest/no-focused-tests": "error",
				"@vitest/no-identical-title": "error",
				"@vitest/no-import-node-test": "error",
				"@vitest/no-interpolation-in-snapshots": "error",
				"@vitest/no-mocks-import": "error",
				"@vitest/no-standalone-expect": "error",
				"@vitest/no-test-return-statement": "error",
				"@vitest/no-unneeded-async-expect-function": "error",
				"@vitest/prefer-each": "error",
				"@vitest/prefer-mock-return-shorthand": "error",
				"@vitest/prefer-to-have-length": "error",
				"@vitest/prefer-vi-mocked": "error",
				"@vitest/require-awaited-expect-poll": "error",
				"@vitest/require-local-test-context-for-concurrent-snapshots": "error",
				"@vitest/require-to-throw-message": "error",
				"@vitest/valid-describe-callback": "error",
				"@vitest/valid-expect": ["error", { maxArgs: 2 }],
				"@vitest/valid-expect-in-promise": "error",
				"@vitest/valid-title": "error",
				"standards/no-brittle-test-style-assertions": ["error", brittleStyleOptions],
				"standards/no-large-test-snapshots": "error",
			},
		},
	];
}
