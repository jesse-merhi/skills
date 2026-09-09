import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const DEFAULT_FILES = ["**/*.{ts,tsx,mts,cts}"];

export default function typescript(options = {}) {
	// Nothing here needs type information, so the project service is opt-in:
	// with it on, any .ts file outside a tsconfig is a fatal parse error.
	const parserOptions = options.typeChecked
		? {
				projectService: true,
				...(options.tsconfigRootDir === undefined ? {} : { tsconfigRootDir: options.tsconfigRootDir }),
			}
		: {};

	return [
		{
			files: options.files ?? DEFAULT_FILES,
			languageOptions: { parser: tsParser, parserOptions },
			plugins: { "@typescript-eslint": tsPlugin },
			rules: {
				...tsPlugin.configs.recommended.rules,
				"@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
				"@typescript-eslint/no-explicit-any": "error",
				"@typescript-eslint/no-unused-vars": "off",
			},
		},
	];
}
