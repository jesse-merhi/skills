export function findVariable(context, node, name = node.name) {
	let scope = context.sourceCode.getScope(node);
	const reference = scope.references.find((candidate) => candidate.identifier === node);
	if (reference) return reference.resolved;
	while (scope) {
		const variable = scope.set.get(name);
		if (variable) return variable;
		scope = scope.upper;
	}
	return null;
}
