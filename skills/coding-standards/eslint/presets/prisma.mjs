import { standards } from "../standards-plugin.mjs";

export default function prisma(options = {}) {
	const sqlOptions = {};
	if (options.escapes !== undefined) {
		sqlOptions.escapes = options.escapes;
	}

	return [
		{
			...(options.files === undefined ? {} : { files: options.files }),
			plugins: { standards },
			rules: {
				"standards/no-raw-sql": ["error", sqlOptions],
			},
		},
	];
}
