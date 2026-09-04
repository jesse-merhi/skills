import { extractStringSnippets, getStaticPropertyName } from "./lib/static-node-values.mjs";
import { splitTailwindSegments } from "./lib/tailwind-token-utils.mjs";

const DEFAULT_MINIMUM_FONT_SIZE_PX = 14;
const TINY_TEXT_TOKENS = new Set(["text-xs"]);
const UPPERCASE_TEXT_TOKENS = new Set(["uppercase"]);
const DEFAULT_ALLOWED_ALL_CAPS_TERMS = ["JSON"];
const TEXT_CLASS_PROP_NAMES = new Set([
	"className",
	"classNames",
	"font",
	"labelFont",
	"placeholderClassName",
	"textClassName",
]);

function normalizeTailwindUtility(token) {
	const utility = (splitTailwindSegments(token).at(-1) ?? token).replace(/^!|!$/g, "");
	return splitTailwindSegments(utility, "/")[0];
}

function parseFontSizePx(value) {
	if (typeof value === "number") {
		return value;
	}

	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	const numericMatch = trimmedValue.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(px|rem|em)?$/);
	if (!numericMatch) {
		return null;
	}

	const numberValue = Number(numericMatch[1]);
	if (!Number.isFinite(numberValue)) {
		return null;
	}

	const unit = numericMatch[2] ?? "px";
	return unit === "px" ? numberValue : numberValue * 16;
}

function getArbitraryTextSize(token) {
	const baseToken = normalizeTailwindUtility(token);
	const match = baseToken.match(/^!?text-\[([^\]]+)\](?:\/.+)?$/);
	if (!match) {
		return null;
	}

	const value = match[1].replace(/^length:/, "");
	return parseFontSizePx(value) === null ? null : value;
}

function hasAllowComment(context, node) {
	const { sourceCode } = context;
	const commentsToCheck = [
		...sourceCode.getCommentsBefore(node),
		...(node.parent ? sourceCode.getCommentsBefore(node.parent) : []),
		...(node.parent?.parent ? sourceCode.getCommentsBefore(node.parent.parent) : []),
	];

	if (commentsToCheck.some((comment) => comment.value.includes("@allow-small-text"))) {
		return true;
	}

	const nearbyPreviousLines = sourceCode.lines
		.slice(Math.max(0, node.loc.start.line - 4), Math.max(0, node.loc.start.line - 1))
		.join("\n");
	return nearbyPreviousLines.includes("@allow-small-text");
}

function getStaticPropertyValue(value) {
	if (!value) {
		return null;
	}

	if (value.type === "Literal") {
		return typeof value.value === "number" || typeof value.value === "string" ? value.value : null;
	}

	if (value.type === "UnaryExpression" && value.operator === "-" && value.argument.type === "Literal") {
		return typeof value.argument.value === "number" ? -value.argument.value : null;
	}

	return null;
}

function isClassNameCall(node) {
	if (!node || node.type !== "CallExpression") {
		return false;
	}

	return node.callee.type === "Identifier" && ["classNames", "clsx", "cn", "cva"].includes(node.callee.name);
}

function isClassSnippetVariableName(node) {
	if (!node || node.type !== "Identifier") {
		return false;
	}

	return /(?:classNames?|ClassNames?|font|Font|textSize|TextSize)/.test(node.name);
}

function isInsideClassAttribute(node) {
	return node.parent?.type === "JSXExpressionContainer" && node.parent.parent?.type === "JSXAttribute";
}

function normalizeVisibleText(value) {
	return value.replace(/\s+/g, " ").trim();
}

function isAllCapsCopy(value, allowedAllCapsTerms) {
	const normalizedValue = normalizeVisibleText(value);
	if (allowedAllCapsTerms.has(normalizedValue)) {
		return false;
	}

	if (normalizedValue.length < 4) {
		return false;
	}

	if (!/[A-Z]/.test(normalizedValue) || /[a-z]/.test(normalizedValue)) {
		return false;
	}

	return /^[A-Z0-9][A-Z0-9\s&/().,'’:-]*$/.test(normalizedValue);
}

export default {
	meta: {
		type: "suggestion",
		docs: {
			description: "Disallow undersized text, arbitrary numeric text sizes, uppercase utilities, and all-caps copy outside documented exceptions",
		},
		schema: [
			{
				type: "object",
				properties: {
					minimumFontSizePx: { type: "number" },
					allowedAllCapsTerms: {
						type: "array",
						items: { type: "string" },
						uniqueItems: true,
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			tinyToken:
				"Avoid tiny text utility '{{token}}'. Use text-sm or a larger typography token, or document a non-copy exception with @allow-small-text.",
			arbitrarySize:
				"Avoid arbitrary text size '{{token}}'. Use a shared typography token instead, or document a non-copy exception with @allow-small-text.",
			inlineFontSize:
				"Avoid inline fontSize {{size}} below {{minimum}}px. Use a shared typography token instead, or document a non-copy exception with @allow-small-text.",
			uppercaseUtility:
				"Avoid all-caps text styling '{{token}}'. Use sentence/title case copy instead, or document an acronym/status exception with @allow-uppercase-text.",
			allCapsCopy:
				"Avoid all-caps visible copy '{{text}}'. Use sentence/title case instead, or document an acronym/status exception with @allow-uppercase-text.",
		},
	},
	create(context) {
		const minimumFontSizePx = context.options[0]?.minimumFontSizePx ?? DEFAULT_MINIMUM_FONT_SIZE_PX;
		const allowedAllCapsTerms = new Set(context.options[0]?.allowedAllCapsTerms ?? DEFAULT_ALLOWED_ALL_CAPS_TERMS);

		function hasAllowUppercaseComment(node) {
			const { sourceCode } = context;
			const commentsToCheck = [
				...sourceCode.getCommentsBefore(node),
				...(node.parent ? sourceCode.getCommentsBefore(node.parent) : []),
				...(node.parent?.parent ? sourceCode.getCommentsBefore(node.parent.parent) : []),
			];

			if (commentsToCheck.some((comment) => comment.value.includes("@allow-uppercase-text"))) {
				return true;
			}

			const nearbyPreviousLines = sourceCode.lines
				.slice(Math.max(0, node.loc.start.line - 4), Math.max(0, node.loc.start.line - 1))
				.join("\n");
			return nearbyPreviousLines.includes("@allow-uppercase-text");
		}

		function reportAllCapsCopy(node, value) {
			if (!isAllCapsCopy(value, allowedAllCapsTerms) || hasAllowUppercaseComment(node)) {
				return;
			}

			context.report({
				node,
				messageId: "allCapsCopy",
				data: { text: normalizeVisibleText(value) },
			});
		}

		function checkClassSnippets(node, snippets) {
			for (const snippet of snippets) {
				const tokens = snippet.split(/\s+/).filter(Boolean);
				for (const token of tokens) {
					const baseToken = normalizeTailwindUtility(token);
					if (UPPERCASE_TEXT_TOKENS.has(baseToken)) {
						if (!hasAllowUppercaseComment(node)) {
							context.report({
								node,
								messageId: "uppercaseUtility",
								data: { token },
							});
						}
						continue;
					}

					if (TINY_TEXT_TOKENS.has(baseToken)) {
						if (!hasAllowComment(context, node)) {
							context.report({
								node,
								messageId: "tinyToken",
								data: { token },
							});
						}
						continue;
					}

					if (getArbitraryTextSize(token) !== null && !hasAllowComment(context, node)) {
						context.report({
							node,
							messageId: "arbitrarySize",
							data: { token },
						});
					}
				}
			}
		}

		function checkFontSizeProperty(node) {
			if (node.type !== "Property" || getStaticPropertyName(node.key) !== "fontSize") {
				return;
			}

			const fontSizeValue = getStaticPropertyValue(node.value);
			const fontSizePx = parseFontSizePx(fontSizeValue);
			if (fontSizePx !== null && fontSizePx < minimumFontSizePx && !hasAllowComment(context, node)) {
				context.report({
					node,
					messageId: "inlineFontSize",
					data: {
						size: String(fontSizeValue),
						minimum: String(minimumFontSizePx),
					},
				});
			}
		}

		return {
			JSXAttribute(node) {
				if (node.name?.type !== "JSXIdentifier") {
					return;
				}

				const attributeName = node.name.name;
				if (TEXT_CLASS_PROP_NAMES.has(attributeName)) {
					checkClassSnippets(node, extractStringSnippets(node.value));
					return;
				}
			},
			CallExpression(node) {
				if (!isClassNameCall(node) || isInsideClassAttribute(node)) {
					return;
				}

				checkClassSnippets(node, extractStringSnippets(node));
			},
			VariableDeclarator(node) {
				if (!isClassSnippetVariableName(node.id)) {
					return;
				}

				checkClassSnippets(node, extractStringSnippets(node.init));
			},
			Property(node) {
				checkFontSizeProperty(node);
			},
			JSXText(node) {
				reportAllCapsCopy(node, node.value);
			},
			JSXExpressionContainer(node) {
				if (node.parent?.type !== "JSXElement" || node.expression.type !== "Literal") {
					return;
				}

				if (typeof node.expression.value === "string") {
					reportAllCapsCopy(node.expression, node.expression.value);
				}
			},
		};
	},
};
