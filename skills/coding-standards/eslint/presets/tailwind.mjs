import { standards } from "../standards-plugin.mjs";

export default function tailwind(options = {}) {
	const elevationOptions = {};
	if (options.tokenModule !== undefined) {
		elevationOptions.tokenModule = options.tokenModule;
	}

	const breakpointOptions = {};
	if (options.maximumPx !== undefined) {
		breakpointOptions.maximumPx = options.maximumPx;
	}
	if (options.disallowedNamedBreakpoints !== undefined) {
		breakpointOptions.disallowedNamedBreakpoints = options.disallowedNamedBreakpoints;
	}

	const configs = [
		{
			...(options.files === undefined ? {} : { files: options.files }),
			plugins: { standards },
			rules: {
				"standards/no-light-mode-only-colors": "error",
				"standards/no-raw-elevation": ["error", elevationOptions],
				"standards/no-small-text": "error",
				"standards/no-wide-arbitrary-breakpoints": ["error", breakpointOptions],
			},
		},
	];

	// The module that defines the elevation tokens is the one place raw shadow
	// utilities belong, so the preset turns the rule off there.
	if (options.elevationModuleFiles !== undefined && options.elevationModuleFiles.length > 0) {
		configs.push({
			files: options.elevationModuleFiles,
			plugins: { standards },
			rules: { "standards/no-raw-elevation": "off" },
		});
	}

	return configs;
}
