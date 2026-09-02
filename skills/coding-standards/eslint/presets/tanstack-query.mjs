import query from "@tanstack/eslint-plugin-query";

export default function tanstackQuery() {
	return [
		{
			plugins: { "@tanstack/query": query },
			rules: {
				"@tanstack/query/exhaustive-deps": "error",
				"@tanstack/query/infinite-query-property-order": "error",
				"@tanstack/query/mutation-property-order": "error",
				"@tanstack/query/no-rest-destructuring": "error",
				"@tanstack/query/no-unstable-deps": "error",
				"@tanstack/query/no-void-query-fn": "error",
			},
		},
	];
}
