const DEFAULT_ESCAPES = [{ object: "Prisma", property: "raw" }];

export default {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow query-builder escape hatches that interpolate raw SQL",
		},
		schema: [
			{
				type: "object",
				properties: {
					escapes: {
						type: "array",
						items: {
							type: "object",
							properties: {
								object: { type: "string", pattern: "^[A-Za-z_$][\\w$]*$" },
								property: { type: "string", pattern: "^[A-Za-z_$][\\w$]*$" },
							},
							required: ["object", "property"],
							additionalProperties: false,
						},
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			rawSql: "Do not use {{escape}}. It bypasses query parameterization; use parameterized queries or the query builder instead.",
		},
	},
	create(context) {
		const escapes = context.options[0]?.escapes ?? DEFAULT_ESCAPES;

		return Object.fromEntries(
			escapes.map(({ object, property }) => [
				`CallExpression > MemberExpression[object.name='${object}'][property.name='${property}']`,
				(node) => {
					context.report({ node, messageId: "rawSql", data: { escape: `${object}.${property}` } });
				},
			]),
		);
	},
};
