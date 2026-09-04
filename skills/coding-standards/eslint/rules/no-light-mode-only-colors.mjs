import { splitTailwindSegments } from "./lib/tailwind-token-utils.mjs";

const LIGHT_ONLY_CLASS_PATTERN =
	/\b(?:bg-white|bg-(?:gray|slate)-(?:50|100|200|300)|text-(?:gray|slate)-(?:400|500|600|700|800|900)|border-(?:gray|slate)-(?:100|200|300)|from-(?:gray|slate)-(?:50|100|200)|to-(?:gray|slate)-(?:100|200|300)|hover:bg-white|hover:bg-gray-50|bg-slate-50|bg-blue-(?:50|100|600)|text-blue-(?:500|600|700|800)|border-blue-(?:200|300|700)|hover:bg-blue-(?:100|600|700)|ring-blue-500|focus:ring-blue-500)\b/g;

const STATUS_CHIP_PATTERN =
	/\bborder-(?:green|emerald|red|rose|yellow|amber|sky|blue)-\d+\b[\s\S]*\bbg-(?:green|emerald|red|rose|yellow|amber|sky|blue)-\d+\b[\s\S]*\btext-(?:green|emerald|red|rose|yellow|amber|sky|blue)-\d+\b/;

function getClassTokens(snippet) {
	return snippet.split(/\s+/).filter(Boolean);
}

function hasBareProseWithoutDarkCounterpart(snippet) {
	const tokens = getClassTokens(snippet);
	return tokens.includes("prose") && !tokens.includes("dark:prose-invert") && !tokens.includes("prose-invert");
}

function isColorUtility(utility, family) {
	if (!utility.startsWith(family)) return false;
	const value = utility.slice(family.length).replace(/!$/, "");
	if (/^(?:\d+(?:\.\d+)?(?:%|\/.*)?|\[|\()/.test(value)) {
		return /^\[(?:color:|#|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\()/.test(value);
	}
	return !/^(?:text-(?:xs|sm|base|lg|[2-9]?xl|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)(?:\/.*)?|bg-(?:auto|cover|contain|none|fixed|local|scroll)|(?:bg-(?:clip|origin|repeat|blend|gradient|linear|radial|conic|position|size)|text-(?:opacity|shadow)|border-(?:opacity|spacing|solid|dashed|dotted|double|hidden|none|[trblsexy])|ring-(?:offset|inset))(?:-.*)?|bg-(?:top|right|bottom|left|center)(?:-.*)?)$/.test(utility);
}

function hasExplicitDarkCounterpart(snippet, token) {
	const modifiers = splitTailwindSegments(token);
	const family = `${modifiers.pop().replace(/^!/, "").split("-")[0]}-`;
	return getClassTokens(snippet).some((candidate) => {
		const candidateModifiers = splitTailwindSegments(candidate);
		const utility = candidateModifiers.pop().replace(/^!/, "");
		return (
			isColorUtility(utility, family) &&
			candidateModifiers.includes("dark") &&
			candidateModifiers.length === modifiers.length + 1 &&
			modifiers.every((modifier) => candidateModifiers.includes(modifier))
		);
	});
}

function extractClassSnippets(node, unconditionalOnly = false) {
	if (!node) {
		return [];
	}

	switch (node.type) {
		case "Literal":
			return typeof node.value === "string" ? [node.value] : [];
		case "TemplateLiteral":
			return node.quasis.map((quasi) => quasi.value.cooked ?? "").filter(Boolean);
		case "JSXExpressionContainer":
			return extractClassSnippets(node.expression, unconditionalOnly);
		case "ConditionalExpression":
			if (unconditionalOnly) return [];
			return [...extractClassSnippets(node.consequent), ...extractClassSnippets(node.alternate)];
		case "LogicalExpression":
			if (unconditionalOnly) return [];
			return [...extractClassSnippets(node.left), ...extractClassSnippets(node.right)];
		case "ArrayExpression":
		case "CallExpression": {
			const children = node.type === "ArrayExpression" ? node.elements : node.arguments;
			const shared = children.flatMap((child) => extractClassSnippets(child, true)).join(" ");
			if (unconditionalOnly) return shared ? [shared] : [];
			return children.flatMap((child) => extractClassSnippets(child)).map((snippet) => `${shared} ${snippet}`);
		}
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
				const reportedTokens = new Set();
				for (const snippet of snippets) {
					if (!reportedTokens.has("prose") && hasBareProseWithoutDarkCounterpart(snippet)) {
						reportedTokens.add("prose");
						context.report({
							node,
							messageId: "bareProse",
						});
					}

					if (STATUS_CHIP_PATTERN.test(snippet)) {
						continue;
					}

					const matches = getClassTokens(snippet).filter(
						(token) => !splitTailwindSegments(token).includes("dark") && token.match(LIGHT_ONLY_CLASS_PATTERN),
					);

					for (const token of new Set(matches)) {
						if (reportedTokens.has(token) || hasExplicitDarkCounterpart(snippet, token)) {
							continue;
						}

						reportedTokens.add(token);
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
