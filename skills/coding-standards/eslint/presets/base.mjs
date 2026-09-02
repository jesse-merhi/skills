import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importX, { createNodeResolver } from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import promise from "eslint-plugin-promise";
import sonarjs from "eslint-plugin-sonarjs";

import { standards } from "../standards-plugin.mjs";

const DEFAULT_TSCONFIG_PATHS = ["./tsconfig.json"];
const DEFAULT_INTERNAL_PATTERN = ["^@/.+", "^~/.+", "^#.+"];
const RESOLVED_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".d.ts"];

export default function base(options = {}) {
	const tsconfigPaths = options.tsconfigPaths ?? DEFAULT_TSCONFIG_PATHS;
	const internalPattern = options.internalPattern ?? DEFAULT_INTERNAL_PATTERN;

	return [
		{
			...(options.files === undefined ? {} : { files: options.files }),
			plugins: { "import-x": importX, perfectionist, promise, sonarjs, standards },
			settings: {
				"import-x/parsers": {
					"@typescript-eslint/parser": [".ts", ".tsx"],
				},
				"import-x/resolver-next": [
					createTypeScriptImportResolver({ alwaysTryTypes: true, project: tsconfigPaths }),
					createNodeResolver({ extensions: RESOLVED_EXTENSIONS }),
				],
			},
			rules: {
				"array-callback-return": "error",
				"import-x/no-duplicates": "error",
				"import-x/no-import-module-exports": "error",
				"import-x/no-self-import": "error",
				"perfectionist/sort-exports": [
					"error",
					{
						type: "alphabetical",
						order: "asc",
						fallbackSort: { type: "unsorted" },
						ignoreCase: true,
						specialCharacters: "keep",
						newlinesBetween: "ignore",
						newlinesInside: "ignore",
					},
				],
				"perfectionist/sort-imports": [
					"error",
					{
						type: "alphabetical",
						order: "asc",
						fallbackSort: { type: "unsorted" },
						ignoreCase: true,
						specialCharacters: "keep",
						sortBy: "path",
						internalPattern,
						partitionByComment: false,
						partitionByNewLine: false,
						newlinesBetween: 1,
						newlinesInside: 0,
						groups: [
							"type-import",
							["value-builtin", "value-external"],
							"type-internal",
							"value-internal",
							["type-parent", "type-sibling", "type-index"],
							["value-parent", "value-sibling", "value-index"],
							"ts-equals-import",
							"unknown",
						],
					},
				],
				"perfectionist/sort-named-exports": [
					"error",
					{
						type: "alphabetical",
						order: "asc",
						fallbackSort: { type: "unsorted" },
						ignoreAlias: false,
						ignoreCase: true,
						specialCharacters: "keep",
						newlinesBetween: "ignore",
						newlinesInside: "ignore",
					},
				],
				"perfectionist/sort-named-imports": [
					"error",
					{
						type: "alphabetical",
						order: "asc",
						fallbackSort: { type: "unsorted" },
						ignoreCase: true,
						specialCharacters: "keep",
					},
				],
				"promise/no-multiple-resolved": "error",
				"promise/no-return-in-finally": "error",
				"promise/no-return-wrap": "error",
				"promise/param-names": "error",
				"promise/valid-params": "error",
				"sonarjs/no-all-duplicated-branches": "error",
				"sonarjs/no-useless-catch": "error",
				"sonarjs/updated-loop-counter": "error",
				"standards/no-banner-comments": "error",
				"standards/no-trivial-forwarding-wrapper": "error",
			},
		},
	];
}
