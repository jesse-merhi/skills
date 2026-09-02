import { splitTailwindSegments } from "./lib/tailwind-token-utils.mjs";

const CLASS_FUNCTION_NAMES = new Set(["cn", "clsx", "cva", "twMerge"]);

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

function isClassFunctionReference(node, classFunctionBindings, identifierBindings) {
	if (node?.type === "Identifier") {
		const binding = identifierBindings.get(node);
		if (binding) {
			return classFunctionBindings.has(binding);
		}
		return CLASS_FUNCTION_NAMES.has(node.name);
	}
	if (node?.type === "MemberExpression" && !node.computed) {
		const propertyName = getStaticName(node.property);
		return propertyName !== null && CLASS_FUNCTION_NAMES.has(propertyName);
	}
	return false;
}

function isCanonicalClassFunctionImport(specifier) {
	if (specifier.type === "ImportSpecifier") {
		const importedName = getStaticName(specifier.imported);
		return importedName !== null && CLASS_FUNCTION_NAMES.has(importedName);
	}
	if (specifier.type !== "ImportDefaultSpecifier" || specifier.parent?.type !== "ImportDeclaration") {
		return false;
	}

	const sourceName = typeof specifier.parent.source.value === "string" ? specifier.parent.source.value : "";
	return ["class-variance-authority", "clsx", "cn", "tailwind-merge"].includes(sourceName);
}

function seedDeclaredClassFunctionBindings(sourceCode, classFunctionBindings, identifierBindings) {
	const variables = (sourceCode.scopeManager?.scopes ?? []).flatMap((scope) => scope.variables);

	for (const variable of variables) {
		if (
			variable.defs.some(
				(definition) => definition.type === "ImportBinding" && isCanonicalClassFunctionImport(definition.node),
			)
		) {
			classFunctionBindings.add(variable);
		}
	}

	let changed = true;
	while (changed) {
		changed = false;
		for (const variable of variables) {
			if (classFunctionBindings.has(variable)) {
				continue;
			}
			const isDeclaredAlias = variable.defs.some(
				(definition) =>
					definition.type === "Variable" &&
					definition.node.type === "VariableDeclarator" &&
					isClassFunctionReference(definition.node.init, classFunctionBindings, identifierBindings),
			);
			if (isDeclaredAlias) {
				classFunctionBindings.add(variable);
				changed = true;
			}
		}
	}
}

function isDirectClassContext(node, classFunctionBindings, identifierBindings) {
	let previousNode = node;
	let currentNode = node.parent;
	for (let depth = 0; currentNode && depth < 10; depth += 1) {
		if (currentNode.type === "CallExpression") {
			if (isClassFunctionReference(currentNode.callee, classFunctionBindings, identifierBindings)) {
				return true;
			}
			if (currentNode.arguments.includes(previousNode)) {
				return false;
			}
		}

		if (currentNode.type === "JSXAttribute" && isClassName(getStaticName(currentNode.name))) {
			return true;
		}
		if (currentNode.type === "VariableDeclarator" && isClassName(getStaticName(currentNode.id))) {
			return true;
		}
		if (currentNode.type === "Property" && isClassName(getStaticName(currentNode.key))) {
			return true;
		}
		if (
			(currentNode.type === "FunctionDeclaration" || currentNode.type === "FunctionExpression") &&
			isClassName(getStaticName(currentNode.id))
		) {
			return true;
		}
		if (
			currentNode.type === "AssignmentExpression" &&
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
	if (normalizedUtility === "shadow-none" || normalizedUtility === "drop-shadow-none") {
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

	if (normalizedUtility === "shadow" || /^shadow-(?:[A-Za-z0-9][A-Za-z0-9_/-]*|\[.+\])$/.test(normalizedUtility)) {
		return utility;
	}

	if (
		normalizedUtility === "drop-shadow" ||
		/^drop-shadow-(?:[A-Za-z0-9][A-Za-z0-9_/-]*|\[.+\])$/.test(normalizedUtility)
	) {
		return utility;
	}

	return null;
}

function isLikelyClassValue(value) {
	const proseWords = new Set([
		"a",
		"an",
		"and",
		"are",
		"as",
		"at",
		"be",
		"because",
		"but",
		"by",
		"can",
		"do",
		"does",
		"for",
		"from",
		"has",
		"have",
		"if",
		"in",
		"into",
		"is",
		"it",
		"of",
		"on",
		"only",
		"or",
		"should",
		"that",
		"the",
		"their",
		"this",
		"to",
		"use",
		"used",
		"uses",
		"using",
		"when",
		"where",
		"which",
		"while",
		"with",
		"without",
	]);
	const tokens = value.split(/\s+/).filter(Boolean);

	return (
		tokens.length > 0 &&
		!tokens.some((token) => {
			const proseCandidate = token.replace(/^[("'`]+|[)"'`.,!?;:]+$/g, "");
			return proseWords.has(proseCandidate.toLowerCase());
		})
	);
}

function reportRawElevation(context, node, value, classFunctionBindings, identifierBindings, tokenModule) {
	const directClassContext = isDirectClassContext(node, classFunctionBindings, identifierBindings);
	const trimmedValue = value.trim();
	if (!directClassContext && trimmedValue === "drop-shadow") {
		return;
	}
	if (!directClassContext && !isLikelyClassValue(value)) {
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
		const classFunctionBindings = new Set();
		seedDeclaredClassFunctionBindings(sourceCode, classFunctionBindings, identifierBindings);

		function updateClassFunctionBinding(identifier, isClassFunction) {
			const binding = identifierBindings.get(identifier);
			if (!binding) {
				return;
			}
			if (isClassFunction) {
				classFunctionBindings.add(binding);
			} else {
				classFunctionBindings.delete(binding);
			}
		}

		return {
			ImportDeclaration(node) {
				const sourceName = typeof node.source.value === "string" ? node.source.value : "";
				for (const specifier of node.specifiers) {
					if (specifier.type === "ImportSpecifier") {
						const importedName = getStaticName(specifier.imported);
						if (importedName !== null && CLASS_FUNCTION_NAMES.has(importedName)) {
							updateClassFunctionBinding(specifier.local, true);
						}
					} else if (
						specifier.type === "ImportDefaultSpecifier" &&
						["class-variance-authority", "clsx", "cn", "tailwind-merge"].includes(sourceName)
					) {
						updateClassFunctionBinding(specifier.local, true);
					}
				}
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
						isClassFunctionReference(node.init, classFunctionBindings, identifierBindings),
					);
				}
			},
			AssignmentExpression(node) {
				if (node.left.type !== "Identifier") {
					return;
				}
				updateClassFunctionBinding(
					node.left,
					isClassFunctionReference(node.right, classFunctionBindings, identifierBindings),
				);
			},
		};
	},
};
