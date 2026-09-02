import { standards } from "../standards-plugin.mjs";

export default function prisma() {
	return [
		{
			plugins: { standards },
			rules: {
				"standards/no-raw-sql": "error",
			},
		},
	];
}
