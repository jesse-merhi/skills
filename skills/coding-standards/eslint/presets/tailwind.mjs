import { standards } from "../standards-plugin.mjs";

export default function tailwind(options = {}) {
	const elevationOptions = {};
	if (options.tokenModule !== undefined) {
		elevationOptions.tokenModule = options.tokenModule;
	}
	if (options.exemptFiles !== undefined) {
		elevationOptions.exemptFiles = options.exemptFiles;
	}

	const breakpointOptions = {};
	if (options.maximumPx !== undefined) {
		breakpointOptions.maximumPx = options.maximumPx;
	}
	if (options.disallowedNamedBreakpoints !== undefined) {
		breakpointOptions.disallowedNamedBreakpoints = options.disallowedNamedBreakpoints;
	}

	return [
		{
			plugins: { standards },
			rules: {
				"standards/no-light-mode-only-colors": "error",
				"standards/no-raw-elevation": ["error", elevationOptions],
				"standards/no-small-text": "error",
				"standards/no-wide-arbitrary-breakpoints": ["error", breakpointOptions],
			},
		},
	];
}
