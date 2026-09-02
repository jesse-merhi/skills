import nativeA11y from "eslint-plugin-react-native-a11y";

import { standards } from "../standards-plugin.mjs";

const DEFAULT_FILES = ["**/*.{jsx,tsx}"];

export default function reactNative(options = {}) {
	return [
		{
			files: options.files ?? DEFAULT_FILES,
			languageOptions: {
				parserOptions: { ecmaFeatures: { jsx: true } },
			},
			plugins: { "react-native-a11y": nativeA11y, standards },
			rules: {
				"react-native-a11y/has-accessibility-props": "error",
				"react-native-a11y/has-valid-accessibility-actions": "error",
				"react-native-a11y/has-valid-accessibility-descriptors": "error",
				"react-native-a11y/has-valid-accessibility-role": "error",
				"react-native-a11y/has-valid-accessibility-state": "error",
				"react-native-a11y/has-valid-accessibility-value": "error",
				"react-native-a11y/no-nested-touchables": "error",
				"standards/no-raw-color-literals": "warn",
				"standards/no-small-text": "error",
			},
		},
	];
}
