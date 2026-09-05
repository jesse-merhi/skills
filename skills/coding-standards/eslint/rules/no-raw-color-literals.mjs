const RAW_COLOR_PATTERN = "^(#|rgb\\(|rgba\\(|hsl\\(|hsla\\()";
const COLOR_PROP_PATTERN = "^(fill|stroke|.*color|.*Color|pinColor|backgroundColor|borderColor|shadowColor)$";

const SELECTORS = [
	`JSXAttribute[name.name=/${COLOR_PROP_PATTERN}/][value.value=/${RAW_COLOR_PATTERN}/]`,
	`JSXAttribute[name.name=/${COLOR_PROP_PATTERN}/] JSXExpressionContainer > Literal[value=/${RAW_COLOR_PATTERN}/]`,
	`Property[key.name=/${COLOR_PROP_PATTERN}/] > Literal[value=/${RAW_COLOR_PATTERN}/]`,
	`Property[key.value=/${COLOR_PROP_PATTERN}/] > Literal[value=/${RAW_COLOR_PATTERN}/]`,
];

export default {
	meta: {
		type: "suggestion",
		docs: {
			description: "Disallow raw color literals in color props and color object properties",
		},
		schema: [
			{
				type: "object",
				properties: {
					message: { type: "string" },
				},
				additionalProperties: false,
			},
		],
		messages: {
			rawColor: "Raw color literal in a color prop. Use a theme token instead.",
		},
	},
	create(context) {
		const overrideMessage = context.options[0]?.message;
		const report = (node) => {
			if (overrideMessage === undefined) {
				context.report({ node, messageId: "rawColor" });
				return;
			}
			context.report({ node, message: overrideMessage });
		};

		return Object.fromEntries(SELECTORS.map((selector) => [selector, report]));
	},
};
