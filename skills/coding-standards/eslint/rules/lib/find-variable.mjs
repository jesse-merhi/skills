export function findVariable(context, node) {
	let scope = context.sourceCode.getScope(node);
	while (scope) {
		const variable = scope.set.get(node.name);
		if (variable) return variable;
		scope = scope.upper;
	}
	return null;
}
