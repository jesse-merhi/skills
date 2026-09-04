export function extractStringSnippets(node, classMap = false) {
	if (!node) {
		return [];
	}

	switch (node.type) {
		case "Literal":
			return typeof node.value === "string" ? [node.value] : [];
		case "TemplateLiteral":
			return [
				...node.quasis.map((quasi) => quasi.value.cooked ?? "").filter(Boolean),
				...node.expressions.flatMap((expression) => extractStringSnippets(expression, classMap)),
			];
		case "JSXExpressionContainer":
			return extractStringSnippets(node.expression, classMap);
		case "ConditionalExpression":
			return [...extractStringSnippets(node.consequent, classMap), ...extractStringSnippets(node.alternate, classMap)];
		case "LogicalExpression":
			return [...extractStringSnippets(node.left, classMap), ...extractStringSnippets(node.right, classMap)];
		case "BinaryExpression":
			if (node.operator !== "+") return [];
			return [...extractStringSnippets(node.left, classMap), ...extractStringSnippets(node.right, classMap)];
		case "ArrayExpression":
			return node.elements.flatMap((element) => extractStringSnippets(element, classMap));
		case "ObjectExpression":
			return node.properties.flatMap((property) => {
				if (property.type === "SpreadElement") return extractStringSnippets(property.argument, classMap);
				if (property.type !== "Property") return [];
				if (!classMap) return extractStringSnippets(property.value);
				if (property.value.type === "Literal" && !property.value.value) return [];
				if (property.computed) return extractStringSnippets(property.key);
				const key = getStaticPropertyName(property.key);
				return key === null ? [] : [key];
			});
		case "CallExpression":
			if (node.callee.type === "Identifier" && node.callee.name === "cva") {
				return getCvaClassNodes(node).flatMap((value) => extractStringSnippets(value, true));
			}
			return node.arguments.flatMap((argument) =>
				extractStringSnippets(
					argument,
					node.callee.type === "Identifier" && ["cn", "clsx", "classNames"].includes(node.callee.name),
				),
			);
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
