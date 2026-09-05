import { findVariable } from "./find-variable.mjs";

export const CLASS_FUNCTION_NAMES = new Set(["cn", "clsx", "classNames", "cva", "twMerge"]);

export function getImportedClassFunctionName(specifier) {
	if (specifier.type === "ImportSpecifier") {
		const importedName = getStaticPropertyName(specifier.imported);
		return CLASS_FUNCTION_NAMES.has(importedName) ? importedName : undefined;
	}
	if (specifier.type !== "ImportDefaultSpecifier" || specifier.parent?.type !== "ImportDeclaration") return undefined;
	const sourceName = specifier.parent.source.value;
	if (sourceName === "class-variance-authority") return "cva";
	if (sourceName === "clsx") return "clsx";
	if (sourceName === "classnames") return "classNames";
	if (sourceName === "tailwind-merge") return "twMerge";
	return undefined;
}

export function resolveClassFunctionName(node, context, visitedVariables = new Set()) {
	if (node?.type === "MemberExpression" && !node.computed) {
		const name = getStaticPropertyName(node.property);
		return CLASS_FUNCTION_NAMES.has(name) ? name : undefined;
	}
	if (node?.type !== "Identifier") return undefined;
	const variable = context && findVariable(context, node);
	if (!variable) return CLASS_FUNCTION_NAMES.has(node.name) ? node.name : undefined;
	if (visitedVariables.has(variable)) return undefined;
	visitedVariables.add(variable);
	return variable.defs.map((definition) => {
		if (definition.type === "ImportBinding") return getImportedClassFunctionName(definition.node);
		if (definition.type === "Variable" && definition.parent.kind === "const") {
			return resolveClassFunctionName(definition.node.init, context, visitedVariables);
		}
		return undefined;
	}).find(Boolean);
}

export function extractStringSnippets(node, classMap = false, context) {
	if (!node) {
		return [];
	}

	switch (node.type) {
		case "Literal":
			return typeof node.value === "string" ? [node.value] : [];
		case "TemplateLiteral":
			return [
				...node.quasis.map((quasi) => quasi.value.cooked ?? "").filter(Boolean),
				...node.expressions.flatMap((expression) => extractStringSnippets(expression, classMap, context)),
			];
		case "JSXExpressionContainer":
			return extractStringSnippets(node.expression, classMap, context);
		case "ConditionalExpression":
			return [...extractStringSnippets(node.consequent, classMap, context), ...extractStringSnippets(node.alternate, classMap, context)];
		case "LogicalExpression":
			return [...extractStringSnippets(node.left, classMap, context), ...extractStringSnippets(node.right, classMap, context)];
		case "BinaryExpression":
			if (node.operator !== "+") return [];
			return [...extractStringSnippets(node.left, classMap, context), ...extractStringSnippets(node.right, classMap, context)];
		case "ArrayExpression":
			return node.elements.flatMap((element) => extractStringSnippets(element, classMap, context));
		case "ObjectExpression":
			return node.properties.flatMap((property) => {
				if (property.type === "SpreadElement") return extractStringSnippets(property.argument, classMap, context);
				if (property.type !== "Property") return [];
				if (!classMap) return extractStringSnippets(property.value, false, context);
				if (property.value.type === "Literal" && !property.value.value) return [];
				if (property.computed) return extractStringSnippets(property.key, false, context);
				const key = getStaticPropertyName(property.key);
				return key === null ? [] : [key];
			});
		case "CallExpression": {
			const functionName = resolveClassFunctionName(node.callee, context);
			if (functionName === "cva") {
				return getCvaClassNodes(node).flatMap((value) => extractStringSnippets(value, true, context));
			}
			return node.arguments.flatMap((argument) =>
				extractStringSnippets(
					argument,
					["cn", "clsx", "classNames"].includes(functionName),
					context,
				),
			);
		}
		default:
			return [];
	}
}

export function getCvaClassNodes(call) {
	const classNodes = [call.arguments[0]];
	for (const option of call.arguments[1]?.properties ?? []) {
		if (getStaticPropertyName(option.key) === "variants") {
			for (const variant of option.value?.properties ?? []) {
				for (const choice of variant.value?.properties ?? []) classNodes.push(choice.value);
			}
		}
		if (getStaticPropertyName(option.key) === "compoundVariants") {
			for (const compound of option.value?.elements ?? []) {
				for (const property of compound?.properties ?? []) {
					if (["class", "className"].includes(getStaticPropertyName(property.key))) classNodes.push(property.value);
				}
			}
		}
	}
	return classNodes;
}

export function getStaticPropertyName(key) {
	if (!key) {
		return null;
	}

	if (key.type === "Identifier") {
		return key.name;
	}

	if (key.type === "Literal" && typeof key.value === "string") {
		return key.value;
	}

	return null;
}
