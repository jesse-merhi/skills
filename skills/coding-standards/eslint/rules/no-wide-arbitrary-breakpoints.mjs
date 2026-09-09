import { extractStringSnippets, getStaticPropertyName } from "./lib/static-node-values.mjs";
import { splitTailwindSegments } from "./lib/tailwind-token-utils.mjs";

const DEFAULT_MAX_ARBITRARY_BREAKPOINT_PX = 960;
const DEFAULT_DISALLOWED_NAMED_BREAKPOINTS = ["3xl"];

const CLASS_PROP_NAMES = new Set([
	"className",
	"classNames",
	"contentClassName",
	"headerClassName",
	"containerClassName",
	"placeholderClassName",
	"textClassName",
]);

function hasAllowComment(context, node) {
	const { sourceCode } = context;
	const commentsToCheck = [
		...sourceCode.getCommentsBefore(node),
		...(node.parent ? sourceCode.getCommentsBefore(node.parent) : []),
		...(node.parent?.parent ? sourceCode.getCommentsBefore(node.parent.parent) : []),
	];

	if (commentsToCheck.some((comment) => comment.value.includes("@allow-wide-breakpoint"))) {
		return true;
	}

	const nearbyPreviousLines = sourceCode.lines
		.slice(Math.max(0, node.loc.start.line - 4), Math.max(0, node.loc.start.line - 1))
		.join("\n");
	return nearbyPreviousLines.includes("@allow-wide-breakpoint");
}

function parseWidthPx(value, unit) {
	const numericValue = Number(value);
	if (!Number.isFinite(numericValue)) {
		return null;
	}

	if (!unit || unit === "px") {
		return numericValue;
	}

	return numericValue * 16;
}

function getWideArbitraryBreakpoint(token, maximumPx) {
	const segments = splitTailwindSegments(token);
	for (const segment of segments.slice(0, -1)) {
		const match = segment.match(/^(?:min|max)-\[(-?\d+(?:\.\d+)?)(px|rem|em)?\]$/);
		if (!match) {
			continue;
		}

		const widthPx = parseWidthPx(match[1], match[2]);
		if (widthPx !== null && widthPx > maximumPx) {
			return {
				breakpoint: segment,
				widthPx,
			};
		}
	}

	return null;
}

function getDisallowedNamedBreakpoint(token, disallowedNamedBreakpoints) {
	const disallowed = new Set(disallowedNamedBreakpoints);
	const segments = splitTailwindSegments(token);
	for (const segment of segments.slice(0, -1)) {
		if (disallowed.has(segment)) {
			return segment;
		}
	}

	return null;
}

function checkNode(context, reportNode, valueNode, options) {
	if (hasAllowComment(context, reportNode)) {
		return;
	}

	const snippets = extractStringSnippets(valueNode, false, context);
	for (const snippet of snippets) {
		for (const token of snippet.split(/\s+/).filter(Boolean)) {
			const wideBreakpoint = getWideArbitraryBreakpoint(token, options.maximumPx);
			if (wideBreakpoint) {
				context.report({
					node: reportNode,
					messageId: "wideArbitraryBreakpoint",
					data: {
						token: wideBreakpoint.breakpoint,
						width: String(wideBreakpoint.widthPx),
						maximum: String(options.maximumPx),
					},
				});
			}

			const namedBreakpoint = getDisallowedNamedBreakpoint(token, options.disallowedNamedBreakpoints);
			if (namedBreakpoint) {
				context.report({
					node: reportNode,
					messageId: "disallowedNamedBreakpoint",
					data: {
						token: namedBreakpoint,
					},
				});
			}
		}
	}
}

export default {
	meta: {
		type: "suggestion",
		docs: {
			description: "Disallow oversized arbitrary Tailwind breakpoint variants and disallowed named breakpoints",
		},
		schema: [
			{
				type: "object",
				properties: {
					maximumPx: {
						type: "number",
					},
					disallowedNamedBreakpoints: {
						type: "array",
						items: { type: "string" },
						uniqueItems: true,
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			wideArbitraryBreakpoint:
				"Avoid arbitrary Tailwind breakpoint '{{token}}' above {{maximum}}px. Use a named responsive variant like lg:/xl:, or document a component-specific exception with @allow-wide-breakpoint.",
			disallowedNamedBreakpoint:
				"Avoid extra-wide Tailwind breakpoint '{{token}}'. Keep app chrome/layout responsive with standard breakpoints, or document a component-specific exception with @allow-wide-breakpoint.",
		},
	},
	create(context) {
		const options = {
			maximumPx: context.options[0]?.maximumPx ?? DEFAULT_MAX_ARBITRARY_BREAKPOINT_PX,
			disallowedNamedBreakpoints:
				context.options[0]?.disallowedNamedBreakpoints ?? DEFAULT_DISALLOWED_NAMED_BREAKPOINTS,
		};

		return {
			JSXAttribute(node) {
				if (node.name?.type !== "JSXIdentifier" || !CLASS_PROP_NAMES.has(node.name.name)) {
					return;
				}

				checkNode(context, node, node.value, options);
			},
			Property(node) {
				const propertyName = getStaticPropertyName(node.key);
				if (!CLASS_PROP_NAMES.has(propertyName)) {
					return;
				}

				checkNode(context, node, node.value, options);
			},
		};
	},
};
