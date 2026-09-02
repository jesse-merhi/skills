import path from "node:path";

import { splitTailwindSegments } from "./lib/tailwind-token-utils.mjs";

const ALLOWED_TEST_FILE_PATTERN = /\.(?:visual|contrast|layout)\.(?:spec|test)\.[cm]?[jt]sx?$/;
const ALLOW_MARKER = "@allow-brittle-test-style-assertion";
const CLASS_ASSERTION_MATCHERS = new Set(["toBe", "toEqual", "toStrictEqual", "toContain", "toMatch"]);
const EXACT_CLASS_ASSERTION_MATCHERS = new Set(["toBe", "toEqual", "toStrictEqual"]);
const CLASS_FUNCTION_NAMES = new Set(["cn", "clsx", "cva", "twMerge"]);
const CLASS_NORMALIZATION_METHOD_NAMES = new Set([
	"replace",
	"replaceAll",
	"split",
	"toLowerCase",
	"toUpperCase",
	"trim",
	"trimEnd",
	"trimStart",
]);
const CLASS_LIST_ACCESS_METHOD_NAMES = new Set(["entries", "item", "keys", "values"]);
const DEFAULT_SEMANTIC_CLASS_VALUES = ["dark"];
const DEFAULT_SEMANTIC_CLASS_TOKENS = [];

// Keep this list deliberately small. These forms are recognizable as utility classes
// without trying to model all of Tailwind or guess at product-specific class names.
const STANDALONE_TAILWIND_UTILITIES = new Set(
	"absolute block border flex grid hidden inline inline-block inline-flex inline-grid invisible not-sr-only relative rounded shadow sr-only sticky transition truncate visible whitespace-nowrap".split(
		" ",
	),
);
const TAILWIND_UTILITY_PATTERN =
	/^(?:\[[^\]]+\]|aspect-(?:auto|square|video|\[[^\]]+\])|(?:h|w|m[trblxyse]?|p[trblxyse]?|inset(?:-[xy])?|top|right|bottom|left|z|min-[hw]|max-[hw]|gap(?:-[xy])?|space-[xy])-(?:\d+(?:\.\d+)?(?:\/\d+)?|px|full|auto|fit|min|max|screen|\[[^\]]+\])|(?:bg|border)-(?:[a-z]+-\d+|\[[^\]]+\])(?:\/(?:\d+|\[[^\]]+\]))?|text-(?:(?:[a-z]+-\d+|\[[^\]]+\])(?:\/(?:\d+|\[[^\]]+\]))?|xs|sm|base|lg|[2-9]?xl|left|center|right|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty)|font-(?:sans|serif|mono|thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[[^\]]+\])|(?:items|content|justify|self)-(?:normal|start|end|center|between|around|evenly|baseline|stretch|auto|\[[^\]]+\])|place-(?:content|items|self)-(?:start|end|center|between|around|evenly|baseline|stretch|auto|\[[^\]]+\])|flex-(?:1|auto|initial|none|row|row-reverse|col|col-reverse|wrap|wrap-reverse|nowrap|\[[^\]]+\])|(?:grid-cols|grid-rows)-(?:none|subgrid|\d+|\[[^\]]+\])|(?:col|row)-(?:auto|span-(?:full|\d+)|start-(?:auto|\d+)|end-(?:auto|\d+)|\[[^\]]+\])|rounded(?:-[trblse](?:[trblse])?)?-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[^\]]+\])|opacity-(?:\d+|\[[^\]]+\])|leading-(?:none|tight|snug|normal|relaxed|loose|\d+|\[[^\]]+\])|tracking-(?:tighter|tight|normal|wide|wider|widest|\[[^\]]+\])|order-(?:first|last|none|\d+|\[[^\]]+\])|(?:duration|delay|scale|rotate)-(?:none|\d+|\[[^\]]+\])|skew-[xy]-(?:\d+|\[[^\]]+\])|origin-(?:center|top(?:-right|-left)?|right|bottom(?:-right|-left)?|left|\[[^\]]+\])|animate-(?:none|spin|ping|pulse|bounce|\[[^\]]+\])|ease-(?:linear|in|out|in-out|\[[^\]]+\])|shadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner|none|\[[^\]]+\])|outline-(?:none|hidden|dashed|dotted|double|\d+|\[[^\]]+\])|ring-offset-(?:\d+|\[[^\]]+\])|(?:cursor|overflow(?:-[xy])?|pointer-events|select|shrink|grow|ring|size|justify-self)-(?:[a-z0-9]+|\[[^\]]+\])|divide-[xy](?:-\d+)?|translate-[xy]-(?:\d+|[a-z]+|\[[^\]]+\]))$/;
const COMMON_TAILWIND_UTILITY_PATTERN =
	/^(?:(?:bg|border|text)-(?:black|current|inherit|transparent|white)|grid-flow-(?:col|col-dense|dense|row|row-dense)|transition-(?:all|colors|none|opacity|shadow|transform))$/;
const LOW_AMBIGUITY_MARKUP_PATTERN =
	/^(?:w-fit|whitespace-nowrap|cursor-pointer|justify-self-(?:start|end|center|stretch)|(?:h|w|m[trblxyse]?|p[trblxyse]?|gap|space-[xy]|min-[hw]|max-[hw])-(?:\d+(?:\.\d+)?|full|auto|fit|screen|\[[^\]]+\]))$/;
const CLASS_ATTRIBUTE_PATTERN = /(?:^|[\s<])class(?:Name)?\s*=\s*(["'])([\s\S]*?)\1/g;
const CLASS_ATTRIBUTE_SELECTOR_PATTERN =
	/\[\s*class\s*(?:[~|^$*]?=)\s*(?:(["'])([\s\S]*?)\1|([^\]\s]+))(?:\s+[is])?\s*\]/gi;
const QUOTED_SELECTOR_VALUE_PATTERN = /(["'])(?:\\.|(?!\1).)*\1/g;
const CLASS_SELECTOR_PATTERN = /\.(-?(?:\\.|[A-Za-z_])(?:\\.|[A-Za-z0-9_-])*)/g;

const configurations = new WeakMap();

function ruleConfiguration(context) {
	const cached = configurations.get(context);
	if (cached) {
		return cached;
	}

	const configuration = {
		semanticClassTokens: new Set(context.options[0]?.semanticClassTokens ?? DEFAULT_SEMANTIC_CLASS_TOKENS),
		semanticClassValues: new Set(context.options[0]?.semanticClassValues ?? DEFAULT_SEMANTIC_CLASS_VALUES),
	};
	configurations.set(context, configuration);
	return configuration;
}

function normalizeFilename(filename) {
	return filename.split(path.sep).join("/");
}

function getSourceCode(context) {
	return context.sourceCode ?? context.getSourceCode();
}

function getScope(context, node) {
	const sourceCode = getSourceCode(context);
	return typeof sourceCode.getScope === "function" ? sourceCode.getScope(node) : context.getScope();
}

function getFunctionParameterVariable(context, functionNode, parameter) {
	if (parameter.type !== "Identifier") return null;
	const functionScope = getSourceCode(context).scopeManager?.acquire(functionNode);
	return functionScope?.set.get(parameter.name) ?? null;
}

function getPropertyName(node) {
	if (!node) return null;
	if (node.type === "Identifier") return node.name;
	if (node.type === "Literal" && typeof node.value === "string") return node.value;
	return null;
}

function findVariable(context, node) {
	let scope = getScope(context, node);
	while (scope) {
		const variable = scope.set.get(node.name);
		if (variable) return variable;
		scope = scope.upper;
	}
	return null;
}

function isCanonicalClassFunctionImport(specifier) {
	if (specifier.type === "ImportSpecifier") {
		return CLASS_FUNCTION_NAMES.has(getPropertyName(specifier.imported));
	}
	if (specifier.type !== "ImportDefaultSpecifier" || specifier.parent?.type !== "ImportDeclaration") return false;
	const sourceName = typeof specifier.parent.source.value === "string" ? specifier.parent.source.value : "";
	return ["clsx", "tailwind-merge", "class-variance-authority"].includes(sourceName);
}

function isClassFunctionReference(node, context, visitedVariables = new Set()) {
	const expression = unwrapExpression(node);
	if (expression?.type !== "Identifier") return false;
	const variable = findVariable(context, expression);
	if (!variable) return CLASS_FUNCTION_NAMES.has(expression.name);
	if (visitedVariables.has(variable)) return false;
	visitedVariables.add(variable);

	return variable.defs.some((definition) => {
		if (definition.type === "ImportBinding") return isCanonicalClassFunctionImport(definition.node);
		return (
			definition.type === "Variable" &&
			definition.node.type === "VariableDeclarator" &&
			definition.parent.kind === "const" &&
			isClassFunctionReference(definition.node.init, context, visitedVariables)
		);
	});
}

function unwrapExpression(node) {
	let current = node;
	while (
		current &&
		(current.type === "TSAsExpression" ||
			current.type === "TSTypeAssertion" ||
			current.type === "TSNonNullExpression" ||
			current.type === "ChainExpression" ||
			current.type === "AwaitExpression")
	) {
		current = current.expression;
	}
	return current;
}

function getStaticText(node, context, visitedVariables = new Set(), parameterBindings = new Map()) {
	const expression = unwrapExpression(node);
	if (!expression) return null;
	if (expression.type === "Literal" && ["boolean", "number", "string"].includes(typeof expression.value)) {
		return String(expression.value);
	}
	if (expression.type === "Literal" && expression.regex) return expression.regex.pattern;
	if (expression.type === "Identifier" && context) {
		const variable = findVariable(context, expression);
		if (variable && parameterBindings.has(variable)) {
			const nextParameterBindings = new Map(parameterBindings);
			const boundExpression = nextParameterBindings.get(variable);
			nextParameterBindings.delete(variable);
			return getStaticText(boundExpression, context, new Set(visitedVariables), nextParameterBindings);
		}
		if (!variable || visitedVariables.has(variable)) return null;
		const initializer = getConstInitializer(context, expression);
		if (!initializer) return null;
		const nextVisitedVariables = new Set(visitedVariables);
		nextVisitedVariables.add(variable);
		return getStaticText(initializer, context, nextVisitedVariables, parameterBindings);
	}
	if (expression.type === "TemplateLiteral") {
		let value = expression.quasis[0]?.value.cooked ?? "";
		for (let index = 0; index < expression.expressions.length; index += 1) {
			const interpolation = getStaticText(
				expression.expressions[index],
				context,
				visitedVariables,
				parameterBindings,
			);
			if (interpolation === null) return null;
			value += interpolation;
			value += expression.quasis[index + 1]?.value.cooked ?? "";
		}
		return value;
	}
	if (expression.type === "BinaryExpression" && expression.operator === "+") {
		const left = getStaticText(expression.left, context, visitedVariables, parameterBindings);
		const right = getStaticText(expression.right, context, visitedVariables, parameterBindings);
		return left === null || right === null ? null : left + right;
	}
	if (
		(expression.type === "NewExpression" || expression.type === "CallExpression") &&
		getPropertyName(expression.callee) === "RegExp" &&
		expression.arguments.length > 0
	) {
		return getStaticText(expression.arguments[0], context, visitedVariables, parameterBindings);
	}
	return null;
}

function getStaticTexts(node, context, visitedVariables = new Set()) {
	const expression = unwrapExpression(node);
	if (expression?.type === "ArrayExpression") {
		return expression.elements.flatMap((element) => getStaticTexts(element, context, visitedVariables));
	}
	const asymmetricReceiver =
		expression?.type === "CallExpression" && expression.callee?.type === "MemberExpression"
			? unwrapExpression(expression.callee.object)
			: null;
	const isExpectAsymmetricReceiver =
		getPropertyName(asymmetricReceiver) === "expect" ||
		(asymmetricReceiver?.type === "MemberExpression" &&
			getPropertyName(asymmetricReceiver.property) === "not" &&
			getPropertyName(unwrapExpression(asymmetricReceiver.object)) === "expect");
	if (
		expression?.type === "CallExpression" &&
		expression.callee?.type === "MemberExpression" &&
		isExpectAsymmetricReceiver &&
		["arrayContaining", "stringContaining", "stringMatching"].includes(getPropertyName(expression.callee.property))
	) {
		return expression.arguments.flatMap((argument) => getStaticTexts(argument, context, visitedVariables));
	}

	const text = getStaticText(expression, context, visitedVariables);
	return text === null ? [] : [text];
}

function normalizeUtilityToken(token) {
	const normalizedToken = token.replace(/^[._#]+|[-_]+$/g, "");
	return splitTailwindSegments(normalizedToken)
		.at(-1)
		?.replace(/^[!-]+|[!_-]+$/g, "");
}

function isTailwindUtilityToken(token, context) {
	const utility = normalizeUtilityToken(token);
	if (!utility) return false;
	const themeColorMatch = utility.match(
		/^(?:accent|bg|border|caret|decoration|divide|fill|from|outline|ring|stroke|text|to|via)-(.+?)(?:\/(?:\d+|\[[^\]]+\]))?$/,
	);
	return (
		STANDALONE_TAILWIND_UTILITIES.has(utility) ||
		TAILWIND_UTILITY_PATTERN.test(utility) ||
		COMMON_TAILWIND_UTILITY_PATTERN.test(utility) ||
		(themeColorMatch !== null && ruleConfiguration(context).semanticClassTokens.has(themeColorMatch[1]))
	);
}

function getClassCandidates(value) {
	const candidates = [];
	let bracketDepth = 0;
	let candidateStart = null;
	const normalizedValue = value.replace(/\\[bB]/g, " ");

	for (let index = 0; index <= normalizedValue.length; index += 1) {
		const character = normalizedValue[index];
		const isCandidateCharacter =
			character !== undefined && (bracketDepth > 0 || /[A-Za-z0-9_!:[\].%/\\-]/.test(character));

		if (isCandidateCharacter) {
			candidateStart ??= index;
			if (character === "[") bracketDepth += 1;
			if (character === "]") bracketDepth = Math.max(0, bracketDepth - 1);
		} else if (candidateStart !== null) {
			candidates.push(normalizedValue.slice(candidateStart, index));
			candidateStart = null;
		}
	}

	return candidates;
}

function containsTokens(value, matcher) {
	return getClassCandidates(value).some(matcher);
}

function containsLowAmbiguityMarkupToken(value) {
	return containsTokens(value, (token) => LOW_AMBIGUITY_MARKUP_PATTERN.test(normalizeUtilityToken(token) ?? ""));
}

function containsTailwindUtilityToken(value, context) {
	return containsTokens(value, (token) => isTailwindUtilityToken(token, context));
}

function isNonSemanticClassValue(value, context) {
	const semanticClassValues = ruleConfiguration(context).semanticClassValues;
	const candidates = getClassCandidates(value);
	return (
		candidates.length > 0 &&
		candidates.some((candidate) => !semanticClassValues.has(normalizeUtilityToken(candidate) ?? ""))
	);
}

function containsNonSemanticClassAttribute(value, context) {
	for (const match of value.matchAll(CLASS_ATTRIBUTE_PATTERN)) {
		if (isNonSemanticClassValue(match[2], context)) return true;
	}
	return false;
}

function containsTailwindClassSelector(value, context) {
	for (const match of value.matchAll(CLASS_ATTRIBUTE_SELECTOR_PATTERN)) {
		if (containsTailwindUtilityToken(match[2] ?? match[3] ?? "", context)) return true;
	}
	if (/@class\b/i.test(value)) {
		for (const match of value.matchAll(QUOTED_SELECTOR_VALUE_PATTERN)) {
			const quotedValue = match[0].slice(1, -1);
			if (containsTailwindUtilityToken(quotedValue, context)) return true;
		}
	}
	for (const match of value.replace(QUOTED_SELECTOR_VALUE_PATTERN, "").matchAll(CLASS_SELECTOR_PATTERN)) {
		const className = match[1].replace(/\\(.)/g, "$1");
		if (isTailwindUtilityToken(className, context)) return true;
	}
	return false;
}

function isExpectCall(node) {
	const expression = unwrapExpression(node);
	if (expression?.type !== "CallExpression") return false;

	const callee = unwrapExpression(expression.callee);
	if (callee?.type === "Identifier") return callee.name === "expect";
	return (
		callee?.type === "MemberExpression" &&
		getPropertyName(unwrapExpression(callee.object)) === "expect" &&
		["poll", "soft"].includes(getPropertyName(callee.property) ?? "")
	);
}

function getExpectationCall(node) {
	let current = unwrapExpression(node?.callee);
	while (current?.type === "MemberExpression") current = unwrapExpression(current.object);
	return isExpectCall(current) ? current : null;
}

function getMatcherName(node) {
	return node?.callee?.type === "MemberExpression" ? getPropertyName(node.callee.property) : null;
}

function isInsideExpectation(node) {
	let current = node?.parent;
	while (current) {
		if (isExpectCall(current)) return true;
		if (current.type === "ArrowFunctionExpression" || current.type === "FunctionExpression") {
			return isExpectPollCall(current.parent);
		}
		current = current.parent;
	}
	return false;
}

function isExpectPollCall(node) {
	const expression = unwrapExpression(node);
	return (
		expression?.type === "CallExpression" &&
		expression.callee?.type === "MemberExpression" &&
		getPropertyName(unwrapExpression(expression.callee.object)) === "expect" &&
		getPropertyName(expression.callee.property) === "poll"
	);
}

function isClassListContainsCall(node, context) {
	if (
		node?.type !== "CallExpression" ||
		node.callee?.type !== "MemberExpression" ||
		!isNonSemanticClassValue(getStaticText(node.arguments[0], context) ?? "", context)
	) {
		return false;
	}

	const classList = unwrapExpression(node.callee.object);
	return (
		classList?.type === "MemberExpression" &&
		getPropertyName(classList.property) === "classList" &&
		getPropertyName(node.callee.property) === "contains"
	);
}

function isClassSelectorCall(node, context, parameterBindings = new Map()) {
	if (node?.type !== "CallExpression" || node.callee?.type !== "MemberExpression") return false;
	const methodName = getPropertyName(node.callee.property);
	if (["querySelector", "querySelectorAll", "matches", "closest", "locator"].includes(methodName)) {
		return containsTailwindClassSelector(
			getStaticText(node.arguments[0], context, new Set(), parameterBindings) ?? "",
			context,
		);
	}
	return (
		methodName === "getElementsByClassName" &&
		isNonSemanticClassValue(getStaticText(node.arguments[0], context, new Set(), parameterBindings) ?? "", context)
	);
}

function containsClassSelectorExpression(node, context, visitedVariables = new Set(), parameterBindings = new Map()) {
	const expression = unwrapExpression(node);
	if (!expression) return false;
	if (isClassSelectorCall(expression, context, parameterBindings)) return true;

	if (expression.type === "Identifier") {
		const variable = findVariable(context, expression);
		if (variable && parameterBindings.has(variable)) {
			const nextParameterBindings = new Map(parameterBindings);
			const boundExpression = nextParameterBindings.get(variable);
			nextParameterBindings.delete(variable);
			return containsClassSelectorExpression(
				boundExpression,
				context,
				new Set(visitedVariables),
				nextParameterBindings,
			);
		}
		if (!variable || visitedVariables.has(variable)) return false;
		visitedVariables.add(variable);
		return getConstSourceExpressions(context, expression).some((source) =>
			containsClassSelectorExpression(source, context, visitedVariables, parameterBindings),
		);
	}

	if (expression.type === "ArrayExpression") {
		return expression.elements.some((element) =>
			containsClassSelectorExpression(element, context, visitedVariables, parameterBindings),
		);
	}

	if (expression.type === "ConditionalExpression") {
		return [expression.consequent, expression.alternate].some((branch) =>
			containsClassSelectorExpression(branch, context, new Set(visitedVariables), parameterBindings),
		);
	}

	if (expression.type === "LogicalExpression") {
		return [expression.left, expression.right].some((branch) =>
			containsClassSelectorExpression(branch, context, new Set(visitedVariables), parameterBindings),
		);
	}

	if (expression.type === "SequenceExpression") {
		return expression.expressions.some((item) =>
			containsClassSelectorExpression(item, context, new Set(visitedVariables), parameterBindings),
		);
	}

	if (expression.type === "CallExpression") {
		if (expression.callee.type === "Identifier") {
			const variable = findVariable(context, expression.callee);
			if (variable && !visitedVariables.has(variable)) {
				visitedVariables.add(variable);
				if (
					getFunctionSourceExpressions(context, expression.callee).some((source) => {
						const helperBindings = new Map(parameterBindings);
						source.params.forEach((parameter, index) => {
							if (parameter.type !== "Identifier" || !expression.arguments[index]) return;
							const parameterVariable = getFunctionParameterVariable(context, source, parameter);
							if (parameterVariable) helperBindings.set(parameterVariable, expression.arguments[index]);
						});
						return getFunctionReturnExpressions(source).some((returnedExpression) =>
							containsClassSelectorExpression(
								returnedExpression,
								context,
								new Set(visitedVariables),
								helperBindings,
							),
						);
					})
				) {
					return true;
				}
			}
		}

		if (expression.callee.type === "MemberExpression") {
			const memberSources = getMemberSourceExpressions(context, expression.callee);
			if (memberSources.length > 0) {
				return (
					memberSources.some((source) => {
						if (!["ArrowFunctionExpression", "FunctionExpression"].includes(source.type)) {
							return containsClassSelectorExpression(
								source,
								context,
								new Set(visitedVariables),
								parameterBindings,
							);
						}
						const helperBindings = new Map(parameterBindings);
						source.params.forEach((parameter, index) => {
							if (parameter.type === "Identifier" && expression.arguments[index]) {
								const parameterVariable = getFunctionParameterVariable(context, source, parameter);
								if (parameterVariable) {
									helperBindings.set(parameterVariable, expression.arguments[index]);
								}
							}
						});
						return getFunctionReturnExpressions(source).some((returnedExpression) =>
							containsClassSelectorExpression(
								returnedExpression,
								context,
								new Set(visitedVariables),
								helperBindings,
							),
						);
					}) ||
					expression.arguments.some((argument) =>
						containsClassSelectorExpression(argument, context, visitedVariables, parameterBindings),
					)
				);
			}
			return (
				containsClassSelectorExpression(
					expression.callee.object,
					context,
					visitedVariables,
					parameterBindings,
				) ||
				expression.arguments.some((argument) =>
					containsClassSelectorExpression(argument, context, visitedVariables, parameterBindings),
				)
			);
		}
	}

	if (expression.type === "ObjectExpression") {
		return expression.properties.some((property) => {
			if (property.type === "SpreadElement") {
				return containsClassSelectorExpression(property.argument, context, visitedVariables, parameterBindings);
			}
			return containsClassSelectorExpression(property.value, context, visitedVariables, parameterBindings);
		});
	}

	if (expression.type === "MemberExpression") {
		const memberSources = getMemberSourceExpressions(context, expression);
		if (memberSources.length > 0) {
			return memberSources.some((source) =>
				containsClassSelectorExpression(source, context, new Set(visitedVariables), parameterBindings),
			);
		}
		return containsClassSelectorExpression(expression.object, context, visitedVariables, parameterBindings);
	}

	return false;
}

function getConstSourceExpressions(context, node) {
	const definition = findVariable(context, node)?.defs.find(
		(candidate) =>
			candidate.type === "Variable" && candidate.name.type === "Identifier" && candidate.parent.kind === "const",
	);
	if (!definition) return [];
	if (definition.node.init) return [definition.node.init];

	const declaration = definition.parent;
	const loop = declaration.parent;
	return loop?.type === "ForOfStatement" && loop.left === declaration ? [loop.right] : [];
}

function getMemberSourceExpressions(context, node) {
	const expression = unwrapExpression(node);
	if (expression?.type !== "MemberExpression") return [];
	const propertyName = getPropertyName(expression.property);
	if (!propertyName) return [];
	return getObjectPropertyExpressions(context, expression.object, propertyName);
}

function getObjectPropertyExpressions(context, node, propertyName, visitedVariables = new Set()) {
	const expression = unwrapExpression(node);
	if (!expression) return [];

	if (expression.type === "Identifier") {
		const variable = findVariable(context, expression);
		if (!variable || visitedVariables.has(variable)) return [];
		const nextVisitedVariables = new Set(visitedVariables);
		nextVisitedVariables.add(variable);
		return getConstSourceExpressions(context, expression).flatMap((source) =>
			getObjectPropertyExpressions(context, source, propertyName, nextVisitedVariables),
		);
	}

	if (expression.type === "ObjectExpression") {
		return expression.properties.flatMap((property) => {
			if (property.type === "SpreadElement") {
				return getObjectPropertyExpressions(context, property.argument, propertyName, visitedVariables);
			}
			return getPropertyName(property.key) === propertyName ? [property.value] : [];
		});
	}

	if (expression.type === "ConditionalExpression") {
		return [expression.consequent, expression.alternate].flatMap((branch) =>
			getObjectPropertyExpressions(context, branch, propertyName, new Set(visitedVariables)),
		);
	}

	if (expression.type === "LogicalExpression") {
		return [expression.left, expression.right].flatMap((branch) =>
			getObjectPropertyExpressions(context, branch, propertyName, new Set(visitedVariables)),
		);
	}

	return [];
}

function getFunctionSourceExpressions(context, node) {
	const variable = findVariable(context, node);
	if (!variable) return [];

	return variable.defs.flatMap((definition) => {
		if (
			definition.type === "Variable" &&
			definition.parent.kind === "const" &&
			["ArrowFunctionExpression", "FunctionExpression"].includes(definition.node.init?.type)
		) {
			return [definition.node.init];
		}
		if (definition.type === "FunctionName" && definition.node.type === "FunctionDeclaration") {
			return [definition.node];
		}
		return [];
	});
}

function getFunctionReturnExpressions(node) {
	if (node.type === "ArrowFunctionExpression" && node.body.type !== "BlockStatement") return [node.body];
	const returnedExpressions = [];
	const visitStatement = (statement) => {
		if (!statement) return;
		switch (statement.type) {
			case "ReturnStatement":
				if (statement.argument) returnedExpressions.push(statement.argument);
				return;
			case "BlockStatement":
				statement.body.forEach(visitStatement);
				return;
			case "IfStatement":
				visitStatement(statement.consequent);
				visitStatement(statement.alternate);
				return;
			case "SwitchStatement":
				statement.cases.forEach((switchCase) => switchCase.consequent.forEach(visitStatement));
				return;
			case "TryStatement":
				visitStatement(statement.block);
				visitStatement(statement.handler?.body);
				visitStatement(statement.finalizer);
				return;
			case "DoWhileStatement":
			case "ForInStatement":
			case "ForOfStatement":
			case "ForStatement":
			case "LabeledStatement":
			case "WhileStatement":
			case "WithStatement":
				visitStatement(statement.body);
		}
	};

	visitStatement(node.body);
	return returnedExpressions;
}

function getConstInitializer(context, node) {
	const definition = findVariable(context, node)?.defs.find(
		(candidate) =>
			candidate.type === "Variable" && candidate.name.type === "Identifier" && candidate.parent.kind === "const",
	);
	return definition?.node.init ?? null;
}

function isClassMemberExpression(node) {
	const expression = unwrapExpression(node);
	return (
		expression?.type === "MemberExpression" &&
		["classList", "className"].includes(getPropertyName(expression.property))
	);
}

function isClassShapedIdentifier(node) {
	const expression = unwrapExpression(node);
	return (
		expression?.type === "Identifier" &&
		/^(?:class|classes|className|classNames|classString)$/i.test(expression.name)
	);
}

function isClassNamedCallExpression(node) {
	const expression = unwrapExpression(node);
	if (expression?.type !== "CallExpression") return false;
	return /(?:class|classes|classname|classnames)$/i.test(
		getPropertyName(expression.callee.property ?? expression.callee) ?? "",
	);
}

function isLikelyDomExpression(node) {
	const expression = unwrapExpression(node);
	if (!expression) return false;
	if (expression.type === "Identifier") {
		return /^(?:body|container|currentTarget|documentElement|el|element|html|node|root|target)$/i.test(
			expression.name,
		);
	}
	if (expression.type === "MemberExpression") {
		return (
			["body", "current", "currentTarget", "documentElement", "target"].includes(
				getPropertyName(expression.property),
			) || isLikelyDomExpression(expression.object)
		);
	}
	if (expression.type === "CallExpression") {
		return /^(?:closest|getBy\w+|getElementBy\w+|querySelector|querySelectorAll)$/i.test(
			getPropertyName(expression.callee.property ?? expression.callee) ?? "",
		);
	}
	return false;
}

function isClassExpression(node, context, visitedIdentifiers = new Set(), allowStaticClassValue = false) {
	const expression = unwrapExpression(node);
	if (!expression) return false;

	if (expression.type === "Identifier") {
		const hasClassShapedName = /^(?:class|classes|className|classNames|classString)$/i.test(expression.name);
		const initializer = getConstInitializer(context, expression);
		if (hasClassShapedName && initializer) {
			if (visitedIdentifiers.has(expression)) return false;
			visitedIdentifiers.add(expression);
			return isClassExpression(initializer, context, visitedIdentifiers, true);
		}
		if (visitedIdentifiers.has(expression)) return false;
		visitedIdentifiers.add(expression);
		return isClassExpression(initializer, context, visitedIdentifiers, allowStaticClassValue);
	}

	if (
		(expression.type === "Literal" && typeof expression.value === "string") ||
		(expression.type === "TemplateLiteral" && expression.expressions.length === 0)
	) {
		return allowStaticClassValue && containsTailwindUtilityToken(getStaticText(expression, context) ?? "", context);
	}

	if (expression.type === "ArrayExpression") {
		return expression.elements.some(
			(element) =>
				(element?.type === "SpreadElement" &&
					isClassExpression(element.argument, context, visitedIdentifiers, true)) ||
				(allowStaticClassValue && isTailwindUtilityToken(getStaticText(element, context) ?? "", context)) ||
				isClassExpression(element, context, visitedIdentifiers, allowStaticClassValue),
		);
	}

	if (expression.type === "MemberExpression") {
		return (
			(isClassMemberExpression(expression) && isLikelyDomExpression(expression.object)) ||
			isClassExpression(expression.object, context, visitedIdentifiers, allowStaticClassValue)
		);
	}

	if (expression.type === "CallExpression") {
		const calleeName = getPropertyName(expression.callee.property ?? expression.callee);
		const calleeObject =
			expression.callee.type === "MemberExpression" ? unwrapExpression(expression.callee.object) : null;
		const isArrayFromClassList =
			calleeName === "from" &&
			getPropertyName(calleeObject) === "Array" &&
			isClassExpression(expression.arguments[0], context, visitedIdentifiers, allowStaticClassValue);
		const isClassListAccess =
			CLASS_LIST_ACCESS_METHOD_NAMES.has(calleeName ?? "") &&
			isClassExpression(calleeObject, context, visitedIdentifiers, allowStaticClassValue);
		return (
			isClassFunctionReference(expression.callee, context) ||
			isArrayFromClassList ||
			isClassListAccess ||
			(calleeName === "getAttribute" && getStaticText(expression.arguments[0], context) === "class") ||
			(expression.callee.type === "MemberExpression" &&
				CLASS_NORMALIZATION_METHOD_NAMES.has(calleeName ?? "") &&
				isClassExpression(expression.callee.object, context, visitedIdentifiers, allowStaticClassValue))
		);
	}

	if (expression.type === "ArrowFunctionExpression" || expression.type === "FunctionExpression") {
		if (expression.body.type === "BlockStatement") {
			return expression.body.body.some(
				(statement) =>
					statement.type === "ReturnStatement" &&
					isClassExpression(statement.argument, context, visitedIdentifiers, allowStaticClassValue),
			);
		}
		return isClassExpression(expression.body, context, visitedIdentifiers, allowStaticClassValue);
	}

	return false;
}

function isClassDerivedAssertion(node, context, visitedVariables = new Set()) {
	const expression = unwrapExpression(node);
	if (!expression) return false;
	if (isClassListContainsCall(expression, context) && !isInsideExpectation(expression)) return true;

	if (expression.type === "Identifier") {
		const variable = findVariable(context, expression);
		if (!variable || visitedVariables.has(variable)) return false;
		visitedVariables.add(variable);
		return getConstSourceExpressions(context, expression).some((source) =>
			isClassDerivedAssertion(source, context, visitedVariables),
		);
	}

	if (expression.type === "CallExpression" && expression.callee?.type === "MemberExpression") {
		const methodName = getPropertyName(expression.callee.property);
		const expectedValues = expression.arguments.flatMap((argument) => getStaticTexts(argument, context));
		if (
			["includes", "startsWith", "endsWith", "indexOf", "match", "search"].includes(methodName) &&
			((isClassExpression(expression.callee.object, context) &&
				expectedValues.some((value) => isNonSemanticClassValue(value, context))) ||
				(isClassShapedIdentifier(expression.callee.object) &&
					expectedValues.some((value) => containsTailwindUtilityToken(value, context))) ||
				(isClassMemberExpression(expression.callee.object) &&
					expectedValues.some((value) => containsTailwindUtilityToken(value, context))))
		) {
			return true;
		}
		if (
			methodName === "test" &&
			isNonSemanticClassValue(getStaticText(expression.callee.object, context) ?? "", context) &&
			(isClassExpression(expression.arguments[0], context) ||
				(isClassMemberExpression(expression.arguments[0]) &&
					containsTailwindUtilityToken(getStaticText(expression.callee.object, context) ?? "", context)))
		) {
			return true;
		}
	}

	if (expression.type === "BinaryExpression") {
		const leftText = getStaticText(expression.left, context);
		const rightText = getStaticText(expression.right, context);
		if (
			(isClassExpression(expression.left, context) && isNonSemanticClassValue(rightText ?? "", context)) ||
			(isClassExpression(expression.right, context) && isNonSemanticClassValue(leftText ?? "", context)) ||
			(isClassMemberExpression(expression.left) && containsTailwindUtilityToken(rightText ?? "", context)) ||
			(isClassMemberExpression(expression.right) && containsTailwindUtilityToken(leftText ?? "", context))
		) {
			return true;
		}
		return (
			isClassDerivedAssertion(expression.left, context, visitedVariables) ||
			isClassDerivedAssertion(expression.right, context, visitedVariables)
		);
	}

	if (expression.type === "LogicalExpression") {
		return (
			isClassDerivedAssertion(expression.left, context, visitedVariables) ||
			isClassDerivedAssertion(expression.right, context, visitedVariables)
		);
	}
	if (expression.type === "UnaryExpression") {
		return isClassDerivedAssertion(expression.argument, context, visitedVariables);
	}
	return false;
}

function isMarkupExpression(node, context, visitedVariables = new Set()) {
	const expression = unwrapExpression(node);
	if (!expression) return false;
	if (isClassExpression(expression, context)) return true;
	if (expression.type === "Identifier") {
		if (/^(?:html|markup|renderedHtml|renderedMarkup)$/i.test(expression.name)) return true;
		const variable = findVariable(context, expression);
		if (!variable || visitedVariables.has(variable)) return false;
		visitedVariables.add(variable);
		return isMarkupExpression(getConstInitializer(context, expression), context, visitedVariables);
	}
	if (expression.type === "MemberExpression") {
		return ["innerHTML", "outerHTML"].includes(getPropertyName(expression.property));
	}
	if (expression.type === "CallExpression") {
		const calleeName = getPropertyName(expression.callee.property ?? expression.callee);
		return calleeName === "renderToStaticMarkup" || calleeName === "renderToString";
	}
	return false;
}

function getAncestors(context) {
	return typeof context.getAncestors === "function" ? context.getAncestors() : [];
}

function hasAllowComment(context, node) {
	const sourceCode = getSourceCode(context);
	const nodesToCheck = [node, ...getAncestors(context).slice(-5)];
	const comments = nodesToCheck.flatMap((candidate) => sourceCode.getCommentsBefore(candidate));
	const nearbyPreviousLines = sourceCode.lines
		.slice(Math.max(0, node.loc.start.line - 4), Math.max(0, node.loc.start.line - 1))
		.join("\n");

	return [...comments.map((comment) => comment.value), nearbyPreviousLines].some((commentText) => {
		const markerIndex = commentText.indexOf(ALLOW_MARKER);
		return markerIndex !== -1 && commentText.slice(markerIndex + ALLOW_MARKER.length).trim().length >= 16;
	});
}

function shouldSkipFile(context) {
	return ALLOWED_TEST_FILE_PATTERN.test(normalizeFilename(context.getFilename()));
}

function reportUnlessAllowed(context, node, messageId) {
	if (!shouldSkipFile(context) && !hasAllowComment(context, node)) context.report({ node, messageId });
}

export default {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow brittle exact CSS and computed-style assertions in ordinary tests",
		},
		schema: [
			{
				type: "object",
				properties: {
					semanticClassTokens: {
						type: "array",
						items: { type: "string" },
						uniqueItems: true,
					},
					semanticClassValues: {
						type: "array",
						items: { type: "string" },
						uniqueItems: true,
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			cssMatcher:
				"Avoid exact CSS/style assertions in ordinary tests. Assert user-visible behavior instead, or move visual/layout coverage to a *.visual/*.layout/*.contrast spec.",
			computedStyle:
				"Avoid getComputedStyle in ordinary tests. Assert user-visible behavior instead, or document a visual/layout exception with @allow-brittle-test-style-assertion and a reason.",
			elementStyle:
				"Avoid direct element.style checks or mutations in ordinary tests. Assert behavior instead, or document a visual/layout exception with @allow-brittle-test-style-assertion and a reason.",
			classAssertion:
				"Avoid exact class assertions in ordinary tests. Assert user-visible behavior instead, or move visual/layout coverage to a *.visual/*.layout/*.contrast spec.",
		},
	},
	create(context) {
		return {
			CallExpression(node) {
				if (isClassListContainsCall(node, context) && isInsideExpectation(node)) {
					reportUnlessAllowed(context, node, "classAssertion");
					return;
				}

				const expectation = getExpectationCall(node);
				const matcherName = getMatcherName(node);
				if (expectation && isClassDerivedAssertion(expectation.arguments[0], context)) {
					reportUnlessAllowed(context, node, "classAssertion");
					return;
				}
				if (expectation && containsClassSelectorExpression(expectation.arguments[0], context)) {
					reportUnlessAllowed(context, node, "classAssertion");
					return;
				}
				if (expectation && matcherName) {
					const received = expectation.arguments[0];
					const exactClassShapeAssertion =
						isClassExpression(received, context) &&
						((matcherName === "toHaveLength" &&
							node.arguments[0]?.type === "Literal" &&
							typeof node.arguments[0].value === "number") ||
							["toBeNull", "toBeUndefined"].includes(matcherName));
					if (exactClassShapeAssertion) {
						reportUnlessAllowed(context, node, "classAssertion");
						return;
					}
				}

				if (expectation && matcherName && CLASS_ASSERTION_MATCHERS.has(matcherName)) {
					const received = expectation.arguments[0];
					const expectedValues = node.arguments.flatMap((argument) => getStaticTexts(argument, context));
					const expectsExactEmptyClass =
						EXACT_CLASS_ASSERTION_MATCHERS.has(matcherName) && expectedValues.includes("");
					const classAssertion =
						(isClassExpression(received, context) &&
							(expectsExactEmptyClass ||
								expectedValues.some((value) => isNonSemanticClassValue(value, context)))) ||
						(isClassShapedIdentifier(received) &&
							expectedValues.some((value) => containsTailwindUtilityToken(value, context))) ||
						(isClassMemberExpression(received) &&
							expectedValues.some((value) => containsTailwindUtilityToken(value, context))) ||
						(isClassNamedCallExpression(received) &&
							expectedValues.some((value) => containsTailwindUtilityToken(value, context)));
					const markupAssertion =
						isMarkupExpression(received, context) &&
						expectedValues.some(
							(value) =>
								containsNonSemanticClassAttribute(value, context) ||
								containsLowAmbiguityMarkupToken(value),
						);

					if (classAssertion || markupAssertion) {
						reportUnlessAllowed(context, node, "classAssertion");
						return;
					}
				}

				if (
					expectation &&
					matcherName === "toHaveClass" &&
					node.arguments
						.flatMap((argument) => getStaticTexts(argument, context))
						.some((value) => value === "" || isNonSemanticClassValue(value, context))
				) {
					reportUnlessAllowed(context, node, "classAssertion");
					return;
				}

				if (
					expectation &&
					matcherName === "toHaveAttribute" &&
					getStaticText(node.arguments[0], context) === "class" &&
					(node.arguments.length === 1 ||
						getStaticTexts(node.arguments[1], context).some(
							(value) => value === "" || isNonSemanticClassValue(value, context),
						))
				) {
					reportUnlessAllowed(context, node, "classAssertion");
					return;
				}

				const calleeName = getPropertyName(node.callee.property ?? node.callee);
				if (calleeName === "toHaveCSS" || calleeName === "toHaveStyle") {
					reportUnlessAllowed(context, node, "cssMatcher");
					return;
				}
				if (calleeName === "getComputedStyle") reportUnlessAllowed(context, node, "computedStyle");
			},
			MemberExpression(node) {
				if (getPropertyName(node.property) === "style") reportUnlessAllowed(context, node, "elementStyle");
			},
		};
	},
};
