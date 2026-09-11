import query from "@tanstack/eslint-plugin-query";

export default function tanstackQuery(options = {}) {
	return [
		{
			...(options.files === undefined ? {} : { files: options.files }),
			plugins: { "@tanstack/query": query },
			rules: {
				"@tanstack/query/exhaustive-deps": "error",
				"@tanstack/query/infinite-query-property-order": "error",
				"@tanstack/query/mutation-property-order": "error",
				"@tanstack/query/no-rest-destructuring": "error",
				"@tanstack/query/no-unstable-deps": "error",
				"@tanstack/query/no-void-query-fn": options.typeChecked ? "error" : "off",
			},
		},
	];
}
