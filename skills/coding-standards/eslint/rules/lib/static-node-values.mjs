export function extractStringSnippets(node, classMap = false) {
	if (!node) {
		return [];
	}

	switch (node.type) {
		case "Literal":
			return typeof node.value === "string" ? [node.value] : [];
		case "TemplateLiteral":
			return node.quasis.map((quasi) => quasi.value.cooked ?? "").filter(Boolean);
		case "JSXExpressionContainer":
			return extractStringSnippets(node.expression, classMap);
		case "ConditionalExpression":
			return [...extractStringSnippets(node.consequent, classMap), ...extractStringSnippets(node.alternate, classMap)];
		case "LogicalExpression":
		case "BinaryExpression":
			return [...extractStringSnippets(node.left, classMap), ...extractStringSnippets(node.right, classMap)];
		case "ArrayExpression":
			return node.elements.flatMap((element) => extractStringSnippets(element, classMap));
		case "ObjectExpression":
			return node.properties.flatMap((property) => {
				if (property.type === "SpreadElement") return extractStringSnippets(property.argument, classMap);
				if (property.type !== "Property") return [];
				if (!classMap) return extractStringSnippets(property.value);
				if (property.computed) return extractStringSnippets(property.key);
				const key = getStaticPropertyName(property.key);
				return key === null ? [] : [key];
			});
		case "CallExpression":
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
