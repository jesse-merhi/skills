const LIGHT_ONLY_CLASS_PATTERN =
	/\b(?:bg-(?:white|gray|slate)-(?:50|100|200|300)|text-(?:gray|slate)-(?:400|500|600|700|800|900)|border-(?:gray|slate)-(?:100|200|300)|from-(?:gray|slate)-(?:50|100|200)|to-(?:gray|slate)-(?:100|200|300)|hover:bg-white|hover:bg-gray-50|bg-slate-50|bg-blue-(?:50|100|600)|text-blue-(?:500|600|700|800)|border-blue-(?:200|300|700)|hover:bg-blue-(?:100|600|700)|ring-blue-500|focus:ring-blue-500)\b/g;

const STATUS_CHIP_PATTERN =
	/\bborder-(?:green|emerald|red|rose|yellow|amber|sky|blue)-\d+\b[\s\S]*\bbg-(?:green|emerald|red|rose|yellow|amber|sky|blue)-\d+\b[\s\S]*\btext-(?:green|emerald|red|rose|yellow|amber|sky|blue)-\d+\b/;

function getClassTokens(snippet) {
	return snippet.split(/\s+/).filter(Boolean);
}

function hasBareProseWithoutDarkCounterpart(snippet) {
	const tokens = getClassTokens(snippet);
	return tokens.includes("prose") && !tokens.includes("dark:prose-invert") && !tokens.includes("prose-invert");
}

function hasExplicitDarkCounterpart(snippet, token) {
	const modifiers = token.split(":");
	const family = `${modifiers.pop().split("-")[0]}-`;
	return getClassTokens(snippet).some((candidate) => {
		const candidateModifiers = candidate.split(":");
		const utility = candidateModifiers.pop();
		return (
			utility.startsWith(family) &&
			candidateModifiers.includes("dark") &&
			candidateModifiers.length === modifiers.length + 1 &&
			modifiers.every((modifier) => candidateModifiers.includes(modifier))
		);
	});
}

function extractClassSnippets(node) {
	if (!node) {
		return [];
	}

	switch (node.type) {
		case "Literal":
			return typeof node.value === "string" ? [node.value] : [];
		case "TemplateLiteral":
			return node.quasis.map((quasi) => quasi.value.cooked ?? "").filter(Boolean);
		case "JSXExpressionContainer":
			return extractClassSnippets(node.expression);
		case "ConditionalExpression":
			return [...extractClassSnippets(node.consequent), ...extractClassSnippets(node.alternate)];
		case "LogicalExpression":
			return [...extractClassSnippets(node.left), ...extractClassSnippets(node.right)];
		case "ArrayExpression":
			return node.elements.flatMap((element) => extractClassSnippets(element));
		case "CallExpression":
			return node.arguments.flatMap((argument) => extractClassSnippets(argument));
		default:
			return [];
	}
}

export default {
	meta: {
		type: "suggestion",
		docs: {
			description: "Flag hard-coded light-only colour utilities and bare prose in className strings that lack a dark counterpart",
		},
		schema: [],
		messages: {
			lightOnly:
				"Avoid hard-coded light-mode utility '{{token}}'. Prefer semantic tokens like bg-card/text-muted-foreground or add an explicit dark counterpart.",
			bareProse:
				"Avoid bare typography utility 'prose' without dark-mode support. Add dark:prose-invert or use semantic text classes instead.",
		},
	},
	create(context) {
		return {
			JSXAttribute(node) {
				if (node.name?.type !== "JSXIdentifier" || node.name.name !== "className") {
					return;
				}

				const snippets = extractClassSnippets(node.value);
				for (const snippet of snippets) {
					if (hasBareProseWithoutDarkCounterpart(snippet)) {
						context.report({
							node,
							messageId: "bareProse",
						});
					}

					if (STATUS_CHIP_PATTERN.test(snippet)) {
						continue;
					}

					const matches = snippet.match(LIGHT_ONLY_CLASS_PATTERN);
					if (!matches) {
						continue;
					}

					for (const token of new Set(matches)) {
						if (hasExplicitDarkCounterpart(snippet, token)) {
							continue;
						}

						context.report({
							node,
							messageId: "lightOnly",
							data: { token },
						});
					}
				}
			},
		};
	},
};
