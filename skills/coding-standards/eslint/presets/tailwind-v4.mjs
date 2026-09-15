import { plugin as shadcn } from "@shadcn/lint";

export default function tailwindV4(options = {}) {
	return [
		{
			files: options.files ?? ["**/*.{js,jsx,ts,tsx}"],
			plugins: { shadcn },
			settings: { shadcn: options.settings ?? {} },
			rules: {
				"shadcn/no-restyle": ["error", { allow: ["layout"] }],
				"shadcn/no-raw-colors": "error",
				"shadcn/no-arbitrary-values": "error",
				"shadcn/no-inline-styles": "error",
				"shadcn/no-unknown-classes": "error",
				"shadcn/require-static-classes": "error",
				...options.rules,
			},
		},
		{
			files: options.componentFiles ?? ["**/components/ui/**"],
			plugins: { shadcn },
			rules: { "shadcn/no-restyle": "off" },
		},
	];
}
