import { standards } from "../standards-plugin.mjs";

export default function zod(options = {}) {
	const preferZodOptions = {};
	if (options.allowedFiles !== undefined) {
		preferZodOptions.allowedFiles = options.allowedFiles;
	}
	if (options.checkManualTypeChecks !== undefined) {
		preferZodOptions.checkManualTypeChecks = options.checkManualTypeChecks;
	}

	return [
		{
			plugins: { standards },
			rules: {
				"standards/no-broad-rule-disable": [
					"error",
					{ rules: ["no-zod-type-any", "standards/no-zod-type-any"] },
				],
				"standards/no-zod-type-any": "error",
				"standards/prefer-zod-for-unknown-typeof": ["error", preferZodOptions],
			},
		},
	];
}
