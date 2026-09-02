export function extractStringSnippets(node) {
	if (!node) {
		return [];
	}

	switch (node.type) {
		case "Literal":
			return typeof node.value === "string" ? [node.value] : [];
		case "TemplateLiteral":
			return node.quasis.map((quasi) => quasi.value.cooked ?? "").filter(Boolean);
		case "JSXExpressionContainer":
			return extractStringSnippets(node.expression);
		case "ConditionalExpression":
			return [...extractStringSnippets(node.consequent), ...extractStringSnippets(node.alternate)];
		case "LogicalExpression":
		case "BinaryExpression":
			return [...extractStringSnippets(node.left), ...extractStringSnippets(node.right)];
		case "ArrayExpression":
			return node.elements.flatMap((element) => extractStringSnippets(element));
		case "ObjectExpression":
			return node.properties.flatMap((property) =>
				property.type === "Property" ? extractStringSnippets(property.value) : [],
			);
		case "CallExpression":
			return node.arguments.flatMap((argument) => extractStringSnippets(argument));
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
