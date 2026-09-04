import { CLASS_FUNCTION_NAMES, getCvaClassNodes, getImportedClassFunctionName } from "./lib/static-node-values.mjs";
import { splitTailwindSegments } from "./lib/tailwind-token-utils.mjs";

function getStaticName(node) {
	if (node?.type === "Identifier" || node?.type === "JSXIdentifier") {
		return node.name;
	}
	if (node?.type === "Literal" && typeof node.value === "string") {
		return node.value;
	}
	return null;
}

function isClassName(name) {
	return (
		typeof name === "string" &&
		(name === "className" || name === "classNames" || /ClassNames?$/i.test(name) || /CLASS_NAMES?$/.test(name))
	);
}

function createIdentifierBindings(sourceCode) {
	const identifierBindings = new WeakMap();

	for (const scope of sourceCode.scopeManager?.scopes ?? []) {
		for (const variable of scope.variables) {
			for (const identifier of variable.identifiers) {
				identifierBindings.set(identifier, variable);
			}
			for (const reference of variable.references) {
				identifierBindings.set(reference.identifier, variable);
			}
		}
	}

	return identifierBindings;
}

function getClassFunctionName(node, classFunctionBindings, identifierBindings) {
	if (node?.type === "Identifier") {
		const binding = identifierBindings.get(node);
		if (binding) {
			return classFunctionBindings.get(binding);
		}
		return CLASS_FUNCTION_NAMES.has(node.name) ? node.name : undefined;
	}
	if (node?.type === "MemberExpression" && !node.computed) {
		const propertyName = getStaticName(node.property);
		return CLASS_FUNCTION_NAMES.has(propertyName) ? propertyName : undefined;
	}
	return undefined;
}

function seedDeclaredClassFunctionBindings(sourceCode, classFunctionBindings, identifierBindings) {
	const variables = (sourceCode.scopeManager?.scopes ?? []).flatMap((scope) => scope.variables);

	for (const variable of variables) {
		const imported = variable.defs.find(
			(definition) => definition.type === "ImportBinding" && getImportedClassFunctionName(definition.node),
		);
		if (imported) {
			classFunctionBindings.set(variable, getImportedClassFunctionName(imported.node));
		}
	}

	let changed = true;
	while (changed) {
		changed = false;
		for (const variable of variables) {
			if (classFunctionBindings.has(variable)) {
				continue;
			}
			const classFunctionName = variable.defs.map(
				(definition) =>
					definition.type === "Variable" &&
					definition.node.type === "VariableDeclarator" &&
					getClassFunctionName(definition.node.init, classFunctionBindings, identifierBindings),
			).find(Boolean);
			if (classFunctionName) {
				classFunctionBindings.set(variable, classFunctionName);
				changed = true;
			}
		}
	}
}

function isDirectClassContext(node, classFunctionBindings, identifierBindings, { visitedVariables = new Set(), classMapKey = false } = {}) {
	let previousNode = node;
	let currentNode = node.parent;
	for (let depth = 0; currentNode && depth < 10; depth += 1) {
		if (currentNode.type === "MemberExpression" && (classMapKey || currentNode.property === previousNode)) return false;
		if (
			(currentNode.type === "ConditionalExpression" && currentNode.test === previousNode) ||
			(currentNode.type === "BinaryExpression" && currentNode.operator !== "+")
		) return false;
		if (currentNode.type === "CallExpression") {
			if (getClassFunctionName(currentNode.callee, classFunctionBindings, identifierBindings)) {
				return true;
			}
			if (currentNode.arguments.includes(previousNode)) {
				return false;
			}
		}

		if (!classMapKey && currentNode.type === "JSXAttribute" && isClassName(getStaticName(currentNode.name))) {
			return true;
		}
		if (!classMapKey && currentNode.type === "VariableDeclarator" && isClassName(getStaticName(currentNode.id))) {
			return true;
		}
		const assigned = currentNode.type === "VariableDeclarator"
			? currentNode.id
			: currentNode.type === "AssignmentExpression" ? currentNode.left : null;
		const variable = assigned?.type === "Identifier" ? identifierBindings.get(assigned) : null;
		if (variable && !visitedVariables.has(variable)) {
			visitedVariables.add(variable);
			if (variable.references.some((reference) =>
				reference.isRead() &&
				isDirectClassContext(reference.identifier, classFunctionBindings, identifierBindings, {
					visitedVariables: new Set(visitedVariables), classMapKey,
				}),
			)) {
				return true;
			}
		}
		if (!classMapKey && currentNode.type === "Property" && isClassName(getStaticName(currentNode.key))) {
			return true;
		}
		if (
			!classMapKey && (currentNode.type === "FunctionDeclaration" || currentNode.type === "FunctionExpression") &&
			isClassName(getStaticName(currentNode.id))
		) {
			return true;
		}
		if (
			!classMapKey && currentNode.type === "AssignmentExpression" &&
			(currentNode.left.type === "Identifier"
				? isClassName(currentNode.left.name)
				: currentNode.left.type === "MemberExpression" && isClassName(getStaticName(currentNode.left.property)))
		) {
			return true;
		}

		previousNode = currentNode;
		currentNode = currentNode.parent;
	}

	return false;
}

function getRawElevationUtility(token) {
	const utility = splitTailwindSegments(token).at(-1);
	if (!utility) {
		return null;
	}

	const normalizedUtility = utility.replace(/^!/, "").replace(/!$/, "");
	if (/^(?:inset-|drop-)?shadow-none$/.test(normalizedUtility)) {
		return null;
	}

	if (
		(normalizedUtility.startsWith("[box-shadow:") && normalizedUtility.endsWith("]")) ||
		(normalizedUtility.startsWith("[filter:") &&
			normalizedUtility.includes("drop-shadow(") &&
			normalizedUtility.endsWith("]"))
	) {
		return utility;
	}

	if (/^(?:inset-|drop-)?shadow(?:-(?:[A-Za-z0-9][A-Za-z0-9_/-]*|\[.+\]))?$/.test(normalizedUtility)) {
		return utility;
	}

	return null;
}

function reportRawElevation(context, node, value, classFunctionBindings, identifierBindings, tokenModule) {
	const ancestors = context.sourceCode.getAncestors(node);
	if (ancestors.some((ancestor) => ancestor.type === "Property" &&
		ancestor.value.type === "Literal" && !ancestor.value.value)) return;
	const cvaCall = ancestors.findLast((ancestor) => ancestor.type === "CallExpression" &&
		getClassFunctionName(ancestor.callee, classFunctionBindings, identifierBindings) === "cva");
	if (cvaCall && !getCvaClassNodes(cvaCall).some((valueNode) => valueNode === node || ancestors.includes(valueNode))) return;
	const property = ancestors.findLast((ancestor) => ancestor.type === "Property");
	const classMapKey = property !== undefined && (property.key === node || ancestors.includes(property.key));
	if (!isDirectClassContext(node, classFunctionBindings, identifierBindings, { classMapKey })) {
		return;
	}

	for (const token of value.split(/\s+/).filter(Boolean)) {
		if (!getRawElevationUtility(token)) {
			continue;
		}

		context.report({
			node,
			messageId: tokenModule === undefined ? "rawElevation" : "rawElevationFromModule",
			data: { token, tokenModule },
		});
	}
}

export default {
	meta: {
		type: "suggestion",
		docs: {
			description: "Require semantic elevation tokens instead of raw Tailwind shadow utilities",
		},
		schema: [
			{
				type: "object",
				properties: {
					tokenModule: { type: "string" },
				},
				additionalProperties: false,
			},
		],
		messages: {
			rawElevation:
				"Raw elevation utility '{{token}}' is not allowed. Remove the decorative shadow or use a named elevation token for an approved layered state.",
			rawElevationFromModule:
				"Raw elevation utility '{{token}}' is not allowed. Remove the decorative shadow or use a named token from {{tokenModule}} for an approved layered state.",
		},
	},
	create(context) {
		const tokenModule = context.options[0]?.tokenModule;
		const { sourceCode } = context;
		const identifierBindings = createIdentifierBindings(sourceCode);
		const classFunctionBindings = new Map();
		seedDeclaredClassFunctionBindings(sourceCode, classFunctionBindings, identifierBindings);

		function updateClassFunctionBinding(identifier, classFunctionName) {
			const binding = identifierBindings.get(identifier);
			if (!binding) {
				return;
			}
			if (classFunctionName) {
				classFunctionBindings.set(binding, classFunctionName);
			} else {
				classFunctionBindings.delete(binding);
			}
		}

		return {
			ImportDeclaration(node) {
				for (const specifier of node.specifiers) {
					updateClassFunctionBinding(specifier.local, getImportedClassFunctionName(specifier));
				}
			},
			Property(node) {
				if (node.computed || node.key.type !== "Identifier") return;
				reportRawElevation(context, node.key, node.key.name, classFunctionBindings, identifierBindings, tokenModule);
			},
			Literal(node) {
				if (typeof node.value === "string") {
					reportRawElevation(
						context,
						node,
						node.value,
						classFunctionBindings,
						identifierBindings,
						tokenModule,
					);
				}
			},
			TemplateElement(node) {
				reportRawElevation(
					context,
					node,
					node.value.cooked ?? node.value.raw,
					classFunctionBindings,
					identifierBindings,
					tokenModule,
				);
			},
			VariableDeclarator(node) {
				if (node.id.type === "Identifier") {
					updateClassFunctionBinding(
						node.id,
						getClassFunctionName(node.init, classFunctionBindings, identifierBindings),
					);
				}
			},
			AssignmentExpression(node) {
				if (node.left.type !== "Identifier") {
					return;
				}
				updateClassFunctionBinding(
					node.left,
					getClassFunctionName(node.right, classFunctionBindings, identifierBindings),
				);
			},
		};
	},
};
