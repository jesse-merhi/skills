export function findVariable(context, node, name = node.name) {
	let scope = context.sourceCode.getScope(node);
	while (scope) {
		const variable = scope.set.get(name);
		if (variable) return variable;
		scope = scope.upper;
	}
	return null;
}
