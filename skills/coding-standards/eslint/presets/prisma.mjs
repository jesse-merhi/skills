import { standards } from "../standards-plugin.mjs";

export default function prisma(options = {}) {
	return [
		{
			...(options.files === undefined ? {} : { files: options.files }),
			plugins: { standards },
			rules: {
				"standards/no-raw-sql": "error",
			},
		},
	];
}
