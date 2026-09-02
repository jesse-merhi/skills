import path from "node:path";

const ALLOW_MARKER = "@allow-brittle-e2e-selector";
const DEFAULT_CHECKS = ["nthChild", "domPath", "classAttribute", "utilityClass"];
const DEFAULT_FILES_PATTERN = "/tests/e2e/";
const TAILWIND_CLASS_SELECTOR_PATTERN =
	/\.(?:bg|text|border|rounded|flex|min-w|max-w|truncate|overflow|whitespace|shadow|grid|hidden|block|inline|px|py|pt|pb|pl|pr|p|m|w|h)-[A-Za-z0-9_[\]/:%.-]+/;

function normalizeFilename(filename) {
	return filename.split(path.sep).join("/");
}

function getSourceCode(context) {
	return context.sourceCode ?? context.getSourceCode();
}

function getPropertyName(node) {
	if (!node) {
		return null;
	}

	if (node.type === "Identifier") {
		return node.name;
	}

	if (node.type === "Literal" && typeof node.value === "string") {
		return node.value;
	}

	return null;
}

function extractStaticSelector(node) {
	if (!node) {
		return null;
	}

	if (node.type === "Literal" && typeof node.value === "string") {
		return node.value;
	}

	if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
		return node.quasis.map((quasi) => quasi.value.cooked ?? "").join("");
	}

	return null;
}

function getAncestors(context) {
	if (typeof context.getAncestors === "function") {
		return context.getAncestors();
	}

	return [];
}

function hasAllowComment(context, node) {
	const sourceCode = getSourceCode(context);
	const nodesToCheck = [node, ...getAncestors(context).slice(-4)];
	const comments = nodesToCheck.flatMap((candidate) => sourceCode.getCommentsBefore(candidate));
	const nearbyPreviousLines = sourceCode.lines
		.slice(Math.max(0, node.loc.start.line - 4), Math.max(0, node.loc.start.line - 1))
		.join("\n");

	return [...comments.map((comment) => comment.value), nearbyPreviousLines].some((commentText) => {
		const markerIndex = commentText.indexOf(ALLOW_MARKER);
		return markerIndex !== -1 && commentText.slice(markerIndex + ALLOW_MARKER.length).trim().length >= 16;
	});
}

function isLocatorCall(node) {
	return (
		node.callee.type === "MemberExpression" &&
		getPropertyName(node.callee.property) === "locator" &&
		node.arguments.length > 0
	);
}

function getSelectorMessageIds(selector) {
	const messageIds = [];

	if (selector.includes(":nth-child")) {
		messageIds.push("nthChild");
	}

	if (selector.includes(">")) {
		messageIds.push("domPath");
	}

	if (/\[class[*^$|~]?=/.test(selector) || /xpath=.*class/i.test(selector)) {
		messageIds.push("classAttribute");
	}

	if (TAILWIND_CLASS_SELECTOR_PATTERN.test(selector)) {
		messageIds.push("utilityClass");
	}

	return messageIds;
}

export default {
	meta: {
		type: "suggestion",
		docs: {
			description: "Discourage brittle CSS and DOM-structure selectors in Playwright E2E tests",
		},
		schema: [
			{
				type: "object",
				properties: {
					checks: {
						type: "array",
						items: {
							enum: DEFAULT_CHECKS,
						},
						uniqueItems: true,
					},
					files: { type: "string" },
				},
				additionalProperties: false,
			},
		],
		messages: {
			nthChild:
				"Avoid :nth-child selectors in E2E tests. Prefer role/label/text/testid selectors that survive DOM restructuring.",
			domPath:
				"Avoid DOM path selectors in E2E tests. Prefer role/label/text/testid selectors that describe user-facing behavior.",
			classAttribute:
				"Avoid class-attribute selectors in E2E tests. Prefer role/label/text/testid selectors, or document an exception with @allow-brittle-e2e-selector and a reason.",
			utilityClass:
				"Avoid Tailwind/utility class selectors in E2E tests. Prefer role/label/text/testid selectors, or document an exception with @allow-brittle-e2e-selector and a reason.",
		},
	},
	create(context) {
		const filename = normalizeFilename(context.getFilename());
		const filesPattern = new RegExp(context.options[0]?.files ?? DEFAULT_FILES_PATTERN, "u");
		if (!filesPattern.test(filename)) {
			return {};
		}
		const enabledChecks = new Set(context.options[0]?.checks ?? DEFAULT_CHECKS);

		return {
			CallExpression(node) {
				if (!isLocatorCall(node) || hasAllowComment(context, node)) {
					return;
				}

				const selector = extractStaticSelector(node.arguments[0]);
				const messageId = selector
					? getSelectorMessageIds(selector).find((candidate) => enabledChecks.has(candidate))
					: null;
				if (!messageId) {
					return;
				}

				context.report({ node: node.arguments[0], messageId });
			},
		};
	},
};
