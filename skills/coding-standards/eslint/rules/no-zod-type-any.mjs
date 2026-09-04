import { findVariable } from "./lib/find-variable.mjs";

function getTypeReferenceName(typeName) {
	if (!typeName) {
		return null;
	}

	if (typeName.type === "Identifier") {
		return typeName.name;
	}

	if (typeName.type === "TSQualifiedName") {
		return getTypeReferenceName(typeName.right);
	}

	if (typeName.type === "MemberExpression" && typeName.property.type === "Identifier") {
		return typeName.property.name;
	}

	return null;
}

function getQualifiedRootName(typeName) {
	if (!typeName) {
		return null;
	}

	if (typeName.type === "Identifier") {
		return typeName.name;
	}

	if (typeName.type === "TSQualifiedName") {
		return getQualifiedRootName(typeName.left);
	}

	if (typeName.type === "MemberExpression") {
		return getQualifiedRootName(typeName.object);
	}

	return null;
}

function getImportedName(specifier) {
	if (!specifier.imported) {
		return null;
	}

	if (specifier.imported.type === "Identifier") {
		return specifier.imported.name;
	}

	if (specifier.imported.type === "Literal" && typeof specifier.imported.value === "string") {
		return specifier.imported.value;
	}

	return null;
}

function getExportLocalName(specifier) {
	if (specifier.local?.type === "Identifier") {
		return specifier.local.name;
	}

	if (specifier.local?.type === "Literal" && typeof specifier.local.value === "string") {
		return specifier.local.value;
	}

	return null;
}

function isZodNamespaceExportName(name) {
	return name === "z" || name === "default";
}

function hasZodNamespaceName(names, name, node) {
	return typeof name === "string" && names.bindings.has(findVariable(names.context, node, name));
}

function addZodNamespaceBinding(names, identifier) {
	const variable = findVariable(names.context, identifier);
	return variable ? addName(names.bindings, variable) : false;
}

function isWeakLocalZodExport(
	specifier,
	weakZodTypeNames,
	weakZodTypeScopes,
	typeDeclarationScopes,
	zodTypeNames,
	zodNamespaceNames,
	zodNamespaceTypeScopes,
) {
	const localName = getExportLocalName(specifier);
	return (
		localName !== null &&
		(isScopedName(localName, specifier, weakZodTypeNames, weakZodTypeScopes) ||
			isZodTypeReference(specifier.local, zodTypeNames, zodNamespaceNames) ||
			isScopedTypeZodNamespaceName(localName, specifier, zodNamespaceNames, zodNamespaceTypeScopes))
	);
}

function getSourceValue(source) {
	if (source?.type === "Literal" && typeof source.value === "string") {
		return source.value;
	}

	if (source?.type === "TSLiteralType") {
		return getSourceValue(source.literal);
	}

	if (source?.type === "TemplateLiteral" && source.quasis.length === 1 && source.expressions.length === 0) {
		return source.quasis[0].value.cooked;
	}

	return null;
}

function hasNoZodTypeAnyDisableComment(context, node) {
	const sourceCode = context.sourceCode;
	const comments = [...sourceCode.getCommentsBefore(node), ...sourceCode.getCommentsAfter(node)];

	return comments.some(
		(comment) => comment.value.includes("eslint-disable") && comment.value.includes("no-zod-type-any"),
	);
}

function hasNoZodTypeAnyDisableCommentInRange(context, node) {
	return context.sourceCode
		.getAllComments()
		.some((comment) => {
			return (
				comment.range &&
				node.range &&
				comment.range[0] >= node.range[0] &&
				comment.range[1] <= node.range[1] &&
				comment.value.includes("eslint-disable") &&
				comment.value.includes("no-zod-type-any")
			);
		});
}

function isZodSource(source) {
	const sourceValue = getSourceValue(source);
	return sourceValue === "zod" || sourceValue?.startsWith("zod/");
}

function isWeakZodAliasName(name) {
	return name === "ZodTypeAny" || name === "ZodSchema" || name === "Schema";
}

function isWeakZodExportName(name) {
	return isWeakZodAliasName(name) || name === "ZodType";
}

function isWeakZodAliasReference(
	typeName,
	weakZodTypeNames,
	weakZodTypeScopes,
	typeDeclarationScopes,
	zodNamespaceNames,
) {
	if (!typeName) {
		return false;
	}

	if (typeName.type === "Identifier") {
		return isScopedName(typeName.name, typeName, weakZodTypeNames, weakZodTypeScopes);
	}

	const name = getTypeReferenceName(typeName);
	if (!isWeakZodAliasName(name)) {
		return false;
	}

	const rootName = getQualifiedRootName(typeName);
	return hasZodNamespaceName(zodNamespaceNames, rootName, typeName);
}

function isBareZodTypeReference(node, zodTypeNames, zodNamespaceNames) {
	return getTypeArguments(node).length === 0 && isZodTypeReference(node.typeName, zodTypeNames, zodNamespaceNames);
}

function containsAnyKeyword(node, anyTypeNames, skipFunctionBodies = false) {
	let containsAny = false;
	visitNode(node, (child) => {
		if (
			child.type === "TSAnyKeyword" ||
			(child.type === "TSTypeReference" && child.typeName.type === "Identifier" &&
				anyTypeNames.bindings.has(findVariable(anyTypeNames.context, child.typeName)))
		) {
			containsAny = true;
		}
	}, skipFunctionBodies);
	return containsAny;
}

function isZodTypeReference(typeName, zodTypeNames, zodNamespaceNames) {
	if (typeName.type === "Identifier") {
		return zodTypeNames.bindings.has(findVariable(zodTypeNames.context, typeName));
	}

	if (getTypeReferenceName(typeName) !== "ZodType") {
		return false;
	}

	const rootName = getQualifiedRootName(typeName);
	return hasZodNamespaceName(zodNamespaceNames, rootName, typeName);
}

function isZodTypeReferenceWithAnyTypeArgument(node, zodTypeNames, zodNamespaceNames, anyTypeNames) {
	const typeArguments = getTypeArguments(node);
	return (
		typeArguments.length > 0 &&
		isZodTypeReference(node.typeName, zodTypeNames, zodNamespaceNames) &&
		typeArguments.some((typeArgument) => containsAnyKeyword(typeArgument, anyTypeNames))
	);
}

function isGenericZodTypeAliasReferenceWithAnyTypeArgument(node, genericZodTypeNames, anyTypeNames) {
	const typeArguments = getTypeArguments(node);
	return (
		typeArguments.length > 0 &&
		node.typeName.type === "Identifier" &&
		genericZodTypeNames.has(node.typeName.name) &&
		typeArguments.some((typeArgument) => containsAnyKeyword(typeArgument, anyTypeNames))
	);
}

function isZodTypeRuntimeReference(node, zodTypeNames, zodNamespaceNames) {
	if (!node) {
		return false;
	}

	if (node.type === "Identifier") {
		return isZodTypeReference(node, zodTypeNames, zodNamespaceNames);
	}

	if (node.type === "MemberExpression") {
		return getTypeReferenceName(node) === "ZodType" && hasZodNamespaceName(zodNamespaceNames, getQualifiedRootName(node), node);
	}

	return false;
}

function isRestrictedZodRuntimeReference(node, zodNamespaceNames, namespaceOnly = false) {
	if (!node) {
		return false;
	}

	if (
		node.type === "TSAsExpression" ||
		node.type === "TSSatisfiesExpression" ||
		node.type === "TSNonNullExpression"
	) {
		return isRestrictedZodRuntimeReference(node.expression, zodNamespaceNames, namespaceOnly);
	}

	if (node.type === "Identifier") {
		return hasZodNamespaceName(zodNamespaceNames, node.name, node);
	}

	if (node.type === "MemberExpression" || node.type === "TSQualifiedName") {
		const name = node.type === "TSQualifiedName"
			? node.right.name
			: node.computed ? getSourceValue(node.property) : getRuntimePropertyName(node.property);
		const receiver = node.type === "TSQualifiedName" ? node.left : node.object;
		return (
			(isZodNamespaceExportName(name) || (!namespaceOnly && isWeakZodExportName(name))) &&
			isRestrictedZodRuntimeReference(receiver, zodNamespaceNames, true)
		);
	}

	return false;
}

function isDirectZodNamespaceRuntimeReference(node, zodNamespaceNames) {
	return node?.type === "Identifier" && hasZodNamespaceName(zodNamespaceNames, node.name, node);
}

function containsDirectZodNamespaceRuntimeReference(node, zodNamespaceNames) {
	if (!node) {
		return false;
	}

	if (isDirectZodNamespaceRuntimeReference(node, zodNamespaceNames)) {
		return true;
	}

	if (node.type === "ObjectExpression") {
		return node.properties.some((property) => {
			if (property.type === "SpreadElement") {
				return containsDirectZodNamespaceRuntimeReference(property.argument, zodNamespaceNames);
			}

			return containsDirectZodNamespaceRuntimeReference(property.value, zodNamespaceNames);
		});
	}

	if (node.type === "ArrayExpression") {
		return node.elements.some((element) => containsDirectZodNamespaceRuntimeReference(element, zodNamespaceNames));
	}

	if (
		node.type === "TSAsExpression" ||
		node.type === "TSSatisfiesExpression" ||
		node.type === "TSNonNullExpression"
	) {
		return containsDirectZodNamespaceRuntimeReference(node.expression, zodNamespaceNames);
	}

	return false;
}

function getRuntimePropertyName(node) {
	if (node?.type === "Identifier") {
		return node.name;
	}

	if (node?.type === "Literal" && typeof node.value === "string") {
		return node.value;
	}

	return null;
}

function getObjectExpressionPropertyValue(objectExpression, propertyName) {
	if (objectExpression?.type !== "ObjectExpression") {
		return null;
	}

	for (const property of objectExpression.properties) {
		if (property.type === "SpreadElement") {
			continue;
		}

		if (getRuntimePropertyName(property.key) === propertyName) {
			return property.value;
		}
	}

	return null;
}

function isZodNamespaceExportDeclaration(node, zodNamespaceNames) {
	if (node.type !== "VariableDeclaration") {
		return false;
	}

	return node.declarations.some((declaration) =>
		containsDirectZodNamespaceRuntimeReference(declaration.init, zodNamespaceNames),
	);
}

function isIdentifierNamed(node, name) {
	return node?.type === "Identifier" && node.name === name;
}

function isFunctionLikeNode(node) {
	return (
		node?.type === "FunctionDeclaration" ||
		node?.type === "FunctionExpression" ||
		node?.type === "ArrowFunctionExpression"
	);
}

function isDirectZodTypeInstanceofGuard(node, predicateParameterName, zodTypeNames, zodNamespaceNames) {
	return (
		node?.type === "BinaryExpression" &&
		node.operator === "instanceof" &&
		isIdentifierNamed(node.left, predicateParameterName) &&
		isZodTypeRuntimeReference(node.right, zodTypeNames, zodNamespaceNames)
	);
}

function collectReturnStatements(node) {
	const returnStatements = [];

	function collect(child) {
		if (!child || typeof child !== "object") {
			return;
		}

		if (child !== node && isFunctionLikeNode(child)) {
			return;
		}

		if (child.type === "ReturnStatement") {
			returnStatements.push(child);
			return;
		}

		for (const [key, value] of Object.entries(child)) {
			if (key === "parent") {
				continue;
			}

			if (Array.isArray(value)) {
				for (const item of value) {
					collect(item);
				}
				continue;
			}

			collect(value);
		}
	}

	collect(node);
	return returnStatements;
}

function isFalseLiteral(node) {
	return node?.type === "Literal" && node.value === false;
}

function isTrueLiteral(node) {
	return node?.type === "Literal" && node.value === true;
}

function getOwningIfStatement(node) {
	if (node.parent?.type === "IfStatement" && node.parent.consequent === node) {
		return node.parent;
	}

	if (
		node.parent?.type === "BlockStatement" &&
		node.parent.parent?.type === "IfStatement" &&
		node.parent.parent.consequent === node.parent
	) {
		return node.parent.parent;
	}

	return null;
}

function isTrueReturnGuardedByZodTypeInstanceof(node, predicateParameterName, zodTypeNames, zodNamespaceNames) {
	const ifStatement = getOwningIfStatement(node);
	return (
		isTrueLiteral(node.argument) &&
		Boolean(ifStatement) &&
		returnsZodTypeInstanceofGuard(ifStatement.test, predicateParameterName, zodTypeNames, zodNamespaceNames)
	);
}

function isSafeZodTypeGuardReturn(node, predicateParameterName, zodTypeNames, zodNamespaceNames) {
	return (
		node.type === "ReturnStatement" &&
		(isFalseLiteral(node.argument) ||
			isTrueReturnGuardedByZodTypeInstanceof(node, predicateParameterName, zodTypeNames, zodNamespaceNames) ||
			returnsZodTypeInstanceofGuard(node.argument, predicateParameterName, zodTypeNames, zodNamespaceNames))
	);
}

function returnsZodTypeInstanceofGuard(node, predicateParameterName, zodTypeNames, zodNamespaceNames) {
	if (!node || typeof node !== "object") {
		return false;
	}

	if (node.type === "BinaryExpression") {
		return isDirectZodTypeInstanceofGuard(node, predicateParameterName, zodTypeNames, zodNamespaceNames);
	}

	if (node.type === "LogicalExpression") {
		if (node.operator !== "&&") {
			return false;
		}

		if (isFalseLiteral(node.left) || isFalseLiteral(node.right)) {
			return false;
		}

		return (
			returnsZodTypeInstanceofGuard(node.left, predicateParameterName, zodTypeNames, zodNamespaceNames) ||
			returnsZodTypeInstanceofGuard(node.right, predicateParameterName, zodTypeNames, zodNamespaceNames)
		);
	}

	if (node.type === "ReturnStatement") {
		return returnsZodTypeInstanceofGuard(node.argument, predicateParameterName, zodTypeNames, zodNamespaceNames);
	}

	if (node.type === "BlockStatement") {
		const returnStatements = collectReturnStatements(node);
		return (
			returnStatements.length > 0 &&
			returnStatements.some((statement) =>
				[
					returnsZodTypeInstanceofGuard(
						statement.argument,
						predicateParameterName,
						zodTypeNames,
						zodNamespaceNames,
					),
					isTrueReturnGuardedByZodTypeInstanceof(
						statement,
						predicateParameterName,
						zodTypeNames,
						zodNamespaceNames,
					),
				].some(Boolean),
			) &&
			returnStatements.every((statement) =>
				isSafeZodTypeGuardReturn(statement, predicateParameterName, zodTypeNames, zodNamespaceNames),
			)
		);
	}

	return false;
}

function isZodTypeRuntimeGuardPredicate(node, zodTypeNames, zodNamespaceNames) {
	const innerTypeAnnotation = node.parent;
	const typePredicate = innerTypeAnnotation?.parent;
	const returnTypeAnnotation = typePredicate?.parent;
	const functionNode = returnTypeAnnotation?.parent;

	return (
		innerTypeAnnotation?.type === "TSTypeAnnotation" &&
		typePredicate?.type === "TSTypePredicate" &&
		returnTypeAnnotation?.type === "TSTypeAnnotation" &&
		(functionNode?.type === "FunctionDeclaration" ||
			functionNode?.type === "FunctionExpression" ||
			functionNode?.type === "ArrowFunctionExpression") &&
		typePredicate.parameterName.type === "Identifier" &&
		returnsZodTypeInstanceofGuard(
			functionNode.body,
			typePredicate.parameterName.name,
			zodTypeNames,
			zodNamespaceNames,
		)
	);
}

function isWeakZodImportType(node, anyTypeNames) {
	if (!isZodSource(node.source)) {
		return false;
	}

	const name = getTypeReferenceName(node.qualifier);
	const typeArguments = getTypeArguments(node);
	return (
		isWeakZodAliasName(name) ||
		(name === "ZodType" &&
			(typeArguments.length === 0 ||
				typeArguments.some((typeArgument) => containsAnyKeyword(typeArgument, anyTypeNames))))
	);
}

function isZodNamespaceTypeQuery(node, zodNamespaceNames) {
	if (node?.type !== "TSTypeQuery") {
		return false;
	}

	if (node.exprName.type === "TSImportType") {
		return (
			isZodSource(node.exprName.source) &&
			(!node.exprName.qualifier || isZodNamespaceImportQualifier(node.exprName.qualifier))
		);
	}

	return isRestrictedZodRuntimeReference(node.exprName, zodNamespaceNames, true);
}

function isZodNamespaceImportQualifier(node) {
	if (node.type === "Identifier") {
		return isZodNamespaceExportName(node.name);
	}
	return (
		node.type === "TSQualifiedName" &&
		isZodNamespaceExportName(node.right.name) &&
		isZodNamespaceImportQualifier(node.left)
	);
}

function isZodNamespaceExportIndex(
	node,
	zodNamespaceNames,
	weakZodIndexKeyNames,
	zodNamespaceTypeScopes = new Map(),
	typeDeclarationScopes = new Map(),
) {
	if (node?.type !== "TSIndexedAccessType") {
		return false;
	}

	return (
		getIndexedAccessKeyNames(node.indexType, weakZodIndexKeyNames).some(isZodNamespaceExportName) &&
		(isZodNamespaceObjectType(
			node.objectType,
			zodNamespaceNames,
			weakZodIndexKeyNames,
			zodNamespaceTypeScopes,
			typeDeclarationScopes,
		) ||
			isZodModuleNamespaceObjectType(
				node.objectType,
				zodNamespaceNames,
				weakZodIndexKeyNames,
				zodNamespaceTypeScopes,
				typeDeclarationScopes,
			))
	);
}

function getIdentifierTypeReferenceName(indexType) {
	return indexType?.type === "TSTypeReference" && indexType.typeName.type === "Identifier"
		? indexType.typeName.name
		: null;
}

function isNegativeKeyUtilityName(name) {
	return name === "Exclude" || name === "Omit";
}

function getIndexedAccessKeyNames(indexType, weakZodIndexKeyNames) {
	if (indexType?.type === "TSTypeReference" && indexType.typeName.type === "Identifier") {
		if (isNegativeKeyUtilityName(indexType.typeName.name)) {
			return [];
		}

		const variable = findVariable(weakZodIndexKeyNames.context, indexType.typeName);
		const aliasKeyNames = weakZodIndexKeyNames.bindings.get(variable) ?? [];
		const typeArgumentKeyNames =
			getTypeArguments(indexType).flatMap((type) => getIndexedAccessKeyNames(type, weakZodIndexKeyNames)) ?? [];
		return [...aliasKeyNames, ...typeArgumentKeyNames];
	}

	if (indexType?.type === "TSUnionType" || indexType?.type === "TSIntersectionType") {
		return indexType.types.flatMap((type) => getIndexedAccessKeyNames(type, weakZodIndexKeyNames));
	}

	if (indexType?.type === "TSTypeOperator" && indexType.operator === "keyof") {
		return getIndexedAccessKeyNames(indexType.typeAnnotation, weakZodIndexKeyNames);
	}

	if (indexType?.type === "TSTemplateLiteralType") {
		const keyParts = [];
		for (let index = 0; index < indexType.quasis.length; index += 1) {
			keyParts.push(indexType.quasis[index].value.cooked);
			const expression = indexType.types[index];
			if (expression) {
				const expressionKeyNames = getIndexedAccessKeyNames(expression, weakZodIndexKeyNames);
				if (expressionKeyNames.length !== 1) {
					return [];
				}
				keyParts.push(expressionKeyNames[0]);
			}
		}
		return [keyParts.join("")];
	}

	const keyName = getSourceValue(indexType);
	return keyName === null ? [] : [keyName];
}

function isZodModuleNamespaceObjectType(
	objectType,
	zodNamespaceNames,
	weakZodIndexKeyNames,
	zodNamespaceTypeScopes = new Map(),
	typeDeclarationScopes = new Map(),
) {
	if (objectType?.type === "TSTypeReference") {
		return (
			objectType.typeName.type === "Identifier" &&
			isScopedTypeZodNamespaceName(
				objectType.typeName.name,
				objectType.typeName,
				zodNamespaceNames,
				zodNamespaceTypeScopes,
			)
		);
	}

	return (
		(objectType?.type === "TSImportType" && isZodSource(objectType.source) &&
			(!objectType.qualifier || isZodNamespaceImportQualifier(objectType.qualifier))) ||
		isZodNamespaceTypeQuery(objectType, zodNamespaceNames) ||
		isZodNamespaceExportIndex(
			objectType,
			zodNamespaceNames,
			weakZodIndexKeyNames,
			zodNamespaceTypeScopes,
			typeDeclarationScopes,
		)
	);
}

function isZodNamespaceObjectType(
	objectType,
	zodNamespaceNames,
	weakZodIndexKeyNames,
	zodNamespaceTypeScopes = new Map(),
	typeDeclarationScopes = new Map(),
) {
	return (
		isZodModuleNamespaceObjectType(
			objectType,
			zodNamespaceNames,
			weakZodIndexKeyNames,
			zodNamespaceTypeScopes,
			typeDeclarationScopes,
		) ||
		isZodNamespaceExportIndex(
			objectType,
			zodNamespaceNames,
			weakZodIndexKeyNames,
			zodNamespaceTypeScopes,
			typeDeclarationScopes,
		)
	);
}

function containsTypeReference(node) {
	let foundTypeReference = false;
	visitNode(node, (child) => {
		if (child.type === "TSTypeReference") {
			foundTypeReference = true;
		}
	});

	return foundTypeReference;
}

function isZodNamespaceKeyofType(
	indexType,
	zodNamespaceNames,
	weakZodIndexKeyNames,
	zodNamespaceTypeScopes = new Map(),
	typeDeclarationScopes = new Map(),
) {
	return (
		indexType?.type === "TSTypeOperator" &&
		indexType.operator === "keyof" &&
		(isZodNamespaceObjectType(
			indexType.typeAnnotation,
			zodNamespaceNames,
			weakZodIndexKeyNames,
			zodNamespaceTypeScopes,
			typeDeclarationScopes,
		) ||
			containsZodModuleNamespaceObjectType(
				indexType.typeAnnotation,
				zodNamespaceNames,
				weakZodIndexKeyNames,
				zodNamespaceTypeScopes,
				typeDeclarationScopes,
			))
	);
}

function containsZodNamespaceKeyofType(
	node,
	zodNamespaceNames,
	weakZodIndexKeyNames,
	zodNamespaceTypeScopes = new Map(),
	typeDeclarationScopes = new Map(),
) {
	let containsKeyof = false;
	visitNode(node, (child) => {
		if (
			isZodNamespaceKeyofType(
				child,
				zodNamespaceNames,
				weakZodIndexKeyNames,
				zodNamespaceTypeScopes,
				typeDeclarationScopes,
			)
		) {
			containsKeyof = true;
		}
	});

	return containsKeyof;
}

function getTypeArguments(node) {
	const typeArguments = getTypeArgumentParams(node.typeArguments);
	if (typeArguments.length > 0 || Object.hasOwn(node, "typeArguments")) {
		return typeArguments;
	}

	if (!Object.prototype.propertyIsEnumerable.call(node, "typeParameters")) {
		return [];
	}

	return getTypeArgumentParams(node.typeParameters);
}

function getTypeArgumentParams(typeArguments) {
	if (Array.isArray(typeArguments)) {
		return typeArguments;
	}

	if (Array.isArray(typeArguments?.params)) {
		return typeArguments.params;
	}

	return [];
}

function isWeakZodNamespaceUtilityType(
	node,
	zodNamespaceNames,
	weakZodIndexKeyNames,
	zodNamespaceTypeScopes = new Map(),
	typeDeclarationScopes = new Map(),
) {
	if (node?.type !== "TSTypeReference" || node.typeName.type !== "Identifier") {
		return false;
	}

	const utilityName = node.typeName.name;
	const typeArguments = getTypeArguments(node);
	const firstArgument = typeArguments[0];
	if (utilityName === "Record") {
		return containsZodNamespaceKeyofType(
			firstArgument,
			zodNamespaceNames,
			weakZodIndexKeyNames,
			zodNamespaceTypeScopes,
			typeDeclarationScopes,
		);
	}

	const hasZodNamespaceObject =
		isZodNamespaceObjectType(
			firstArgument,
			zodNamespaceNames,
			weakZodIndexKeyNames,
			zodNamespaceTypeScopes,
			typeDeclarationScopes,
		) ||
		containsZodModuleNamespaceObjectType(
			firstArgument,
			zodNamespaceNames,
			weakZodIndexKeyNames,
			zodNamespaceTypeScopes,
			typeDeclarationScopes,
		);

	if (!hasZodNamespaceObject) {
		return false;
	}

	if (utilityName === "Pick") {
		const pickedKey = typeArguments[1];
		return (
			getIndexedAccessKeyNames(pickedKey, weakZodIndexKeyNames).some(isWeakZodExportName) ||
			containsZodNamespaceKeyofType(
				pickedKey,
				zodNamespaceNames,
				weakZodIndexKeyNames,
				zodNamespaceTypeScopes,
				typeDeclarationScopes,
			)
		);
	}

	return ["Omit", "Partial", "Readonly", "Required"].includes(utilityName);
}

function isWeakZodIndexedAccessType(
	node,
	zodNamespaceNames,
	weakZodIndexKeyNames,
	zodNamespaceTypeScopes = new Map(),
	typeDeclarationScopes = new Map(),
) {
	const keyNames = getIndexedAccessKeyNames(node.indexType, weakZodIndexKeyNames);
	const hasDirectZodNamespaceObject = isZodNamespaceObjectType(
		node.objectType,
		zodNamespaceNames,
		weakZodIndexKeyNames,
		zodNamespaceTypeScopes,
		typeDeclarationScopes,
	);
	const hasWrappedZodNamespaceObject = containsZodModuleNamespaceObjectType(
		node.objectType,
		zodNamespaceNames,
		weakZodIndexKeyNames,
		zodNamespaceTypeScopes,
		typeDeclarationScopes,
	);
	return (
		(hasDirectZodNamespaceObject || hasWrappedZodNamespaceObject) &&
		(keyNames.some(isWeakZodExportName) ||
			(hasDirectZodNamespaceObject &&
				containsZodNamespaceKeyofType(
					node.indexType,
					zodNamespaceNames,
					weakZodIndexKeyNames,
					zodNamespaceTypeScopes,
					typeDeclarationScopes,
				)) ||
			(keyNames.length === 0 && containsTypeReference(node.indexType)))
	);
}

function isWeakZodTypeAnnotation(
	node,
	weakZodTypeNames,
	weakZodTypeScopes,
	typeDeclarationScopes,
	zodTypeNames,
	zodNamespaceNames,
	zodNamespaceTypeScopes,
	weakZodIndexKeyNames,
	anyTypeNames,
	genericZodTypeNames,
) {
	if (!node) {
		return false;
	}

	if (node.type === "TSTypeReference") {
		if (
			isBareZodTypeReference(node, zodTypeNames, zodNamespaceNames) &&
			isZodTypeRuntimeGuardPredicate(node, zodTypeNames, zodNamespaceNames)
		) {
			return false;
		}

		return (
			isWeakZodAliasReference(
				node.typeName,
				weakZodTypeNames,
				weakZodTypeScopes,
				typeDeclarationScopes,
				zodNamespaceNames,
			) ||
			isBareZodTypeReference(node, zodTypeNames, zodNamespaceNames) ||
			isZodTypeReferenceWithAnyTypeArgument(node, zodTypeNames, zodNamespaceNames, anyTypeNames) ||
			isGenericZodTypeAliasReferenceWithAnyTypeArgument(node, genericZodTypeNames, anyTypeNames) ||
			isWeakZodNamespaceUtilityType(
				node,
				zodNamespaceNames,
				weakZodIndexKeyNames,
				zodNamespaceTypeScopes,
				typeDeclarationScopes,
			)
		);
	}

	if (node.type === "TSImportType") {
		return isWeakZodImportType(node, anyTypeNames);
	}

	if (node.type === "TSIndexedAccessType") {
		return isWeakZodIndexedAccessType(
			node,
			zodNamespaceNames,
			weakZodIndexKeyNames,
			zodNamespaceTypeScopes,
			typeDeclarationScopes,
		);
	}

	return false;
}

function containsWeakZodTypeAnnotation(
	node,
	weakZodTypeNames,
	weakZodTypeScopes,
	typeDeclarationScopes,
	zodTypeNames,
	zodNamespaceNames,
	zodNamespaceTypeScopes,
	weakZodIndexKeyNames,
	anyTypeNames,
	genericZodTypeNames = new Set(),
	skipFunctionBodies = false,
) {
	let containsWeakType = false;
	visitNode(node, (child) => {
		if (
			isWeakZodTypeAnnotation(
				child,
				weakZodTypeNames,
				weakZodTypeScopes,
				typeDeclarationScopes,
				zodTypeNames,
				zodNamespaceNames,
				zodNamespaceTypeScopes,
				weakZodIndexKeyNames,
				anyTypeNames,
				genericZodTypeNames,
			)
		) {
			containsWeakType = true;
			return;
		}

		if (
			(child.type === "TSExpressionWithTypeArguments" ||
				child.type === "TSInterfaceHeritage" ||
				child.type === "TSClassImplements") &&
			isWeakZodHeritage(
				child,
				weakZodTypeNames,
				weakZodTypeScopes,
				typeDeclarationScopes,
				zodTypeNames,
				zodNamespaceNames,
				anyTypeNames,
				genericZodTypeNames,
			)
		) {
			containsWeakType = true;
		}
	}, skipFunctionBodies);

	return containsWeakType;
}

function isWeakZodHeritage(
	node,
	weakZodTypeNames,
	weakZodTypeScopes,
	typeDeclarationScopes,
	zodTypeNames,
	zodNamespaceNames,
	anyTypeNames,
	genericZodTypeNames,
) {
	if (
		isWeakZodAliasReference(
			node.expression,
			weakZodTypeNames,
			weakZodTypeScopes,
			typeDeclarationScopes,
			zodNamespaceNames,
		)
	) {
		return true;
	}

	const typeArguments = getTypeArguments(node);
	const typeReference = {
		type: "TSTypeReference",
		typeName: node.expression,
		typeArguments: typeArguments.length > 0 ? { params: typeArguments } : undefined,
	};
	return (
		isBareZodTypeReference(typeReference, zodTypeNames, zodNamespaceNames) ||
		isZodTypeReferenceWithAnyTypeArgument(typeReference, zodTypeNames, zodNamespaceNames, anyTypeNames) ||
		isGenericZodTypeAliasReferenceWithAnyTypeArgument(typeReference, genericZodTypeNames, anyTypeNames)
	);
}

function isZodRequireReference(moduleReference) {
	return moduleReference?.type === "TSExternalModuleReference" && isZodSource(moduleReference.expression);
}

function addName(names, name) {
	if (names.has(name)) {
		return false;
	}

	names.add(name);
	return true;
}

function addZodTypeBinding(zodTypeNames, identifier) {
	const variable = findVariable(zodTypeNames.context, identifier);
	return variable ? addName(zodTypeNames.bindings, variable) : false;
}

function getAliasScope(node) {
	for (let current = node; current; current = current.parent) {
		if (current.type === "BlockStatement" || current.type === "TSModuleBlock" || current.type === "Program") {
			return current;
		}
	}

	return null;
}

function addScopedName(names, scopes, name, node) {
	let changed = addName(names, name);
	const variables = scopes.context.sourceCode.getDeclaredVariables(node).filter((variable) => variable.name === name);
	const reference = findVariable(scopes.context, node, name);
	if (reference) variables.push(reference);
	for (const variable of variables) {
		changed = addName(scopes.bindings, variable) || changed;
	}
	return changed;
}

function addNameScope(scopes, name, node) {
	const scope = getAliasScope(node);
	if (!scope) {
		return false;
	}

	const nameScopes = scopes.get(name) ?? new Set();
	const changedScope = !nameScopes.has(scope);
	nameScopes.add(scope);
	scopes.set(name, nameScopes);
	return changedScope;
}

function isScopedName(name, node, names, scopes) {
	return names.has(name) && scopes.bindings.has(findVariable(scopes.context, node, name));
}

function isScopedTypeZodNamespaceName(name, node, zodNamespaceNames, zodNamespaceTypeScopes) {
	const variable = findVariable(zodNamespaceNames.context, node, name);
	return (
		zodNamespaceNames.bindings.has(variable) ||
		Boolean(variable?.defs.some((definition) =>
			definition.node.type === "TSTypeAliasDeclaration" &&
			zodNamespaceTypeScopes.get(name)?.has(getAliasScope(definition.node)),
		))
	);
}

function visitNode(node, visitor, skipFunctionBodies = false) {
	if (!node || typeof node !== "object") {
		return;
	}

	if (visitor(node) === false) return;

	for (const [key, value] of Object.entries(node)) {
		if (
			key === "parent" ||
			(skipFunctionBodies && key === "body" &&
				["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type))
		) {
			continue;
		}

		if (Array.isArray(value)) {
			for (const child of value) {
				visitNode(child, visitor, skipFunctionBodies);
			}
			continue;
		}

		visitNode(value, visitor, skipFunctionBodies);
	}
}

function addIndexKeyAlias(indexKeyAliases, identifier, keyNames) {
	const variable = findVariable(indexKeyAliases.context, identifier);
	if (!variable) return false;
	const uniqueKeyNames = [...new Set(keyNames)];
	const existingKeyNames = indexKeyAliases.bindings.get(variable) ?? [];
	if (
		existingKeyNames.length === uniqueKeyNames.length &&
		existingKeyNames.every((keyName, index) => keyName === uniqueKeyNames[index])
	) {
		return false;
	}

	indexKeyAliases.bindings.set(variable, uniqueKeyNames);
	return true;
}

function collectZodIndexKeyAlias(node, zodIndexKeyAliases) {
	if (node.type !== "TSTypeAliasDeclaration") {
		return false;
	}

	if (isNegativeKeyUtilityName(getIdentifierTypeReferenceName(node.typeAnnotation))) {
		return false;
	}

	const keyNames = getIndexedAccessKeyNames(node.typeAnnotation, zodIndexKeyAliases);
	if (keyNames.length > 0) {
		return addIndexKeyAlias(zodIndexKeyAliases, node.id, keyNames);
	}

	return false;
}

const TYPE_PARAMETER_OWNER_TYPES = new Set([
	"ArrowFunctionExpression",
	"ClassDeclaration",
	"ClassExpression",
	"FunctionDeclaration",
	"FunctionExpression",
	"MethodDefinition",
	"TSCallSignatureDeclaration",
	"TSConstructSignatureDeclaration",
	"TSConstructorType",
	"TSDeclareFunction",
	"TSFunctionType",
	"TSInterfaceDeclaration",
	"TSMethodSignature",
	"TSTypeAliasDeclaration",
]);

function collectAnyTypeParameterBindings(node, anyTypeNames) {
	const typeParameterBindings = new Set();
	if (!TYPE_PARAMETER_OWNER_TYPES.has(node.type)) {
		return typeParameterBindings;
	}

	for (const typeParameter of node.typeParameters?.params ?? []) {
		if (
			typeParameter.name?.name &&
			(containsAnyKeyword(typeParameter.default, anyTypeNames) ||
				containsAnyKeyword(typeParameter.constraint, anyTypeNames))
		) {
			const variable = findVariable(anyTypeNames.context, typeParameter.name);
			if (variable) typeParameterBindings.add(variable);
		}
	}

	return typeParameterBindings;
}

function getScopedAnyTypeNames(node, anyTypeNames) {
	const scopedAnyTypeNames = { ...anyTypeNames, bindings: new Set(anyTypeNames.bindings) };
	for (let parent = node; parent; parent = parent.parent) {
		for (const variable of collectAnyTypeParameterBindings(parent, scopedAnyTypeNames)) {
			scopedAnyTypeNames.bindings.add(variable);
		}
	}

	return scopedAnyTypeNames;
}

function collectWeakZodTypeParameterBindings(
	node,
	weakZodTypeNames,
	weakZodTypeScopes,
	typeDeclarationScopes,
	zodTypeNames,
	zodNamespaceNames,
	zodNamespaceTypeScopes,
	weakZodIndexKeyNames,
	anyTypeNames,
	genericZodTypeNames,
) {
	const typeParameterBindings = new Set();
	for (const typeParameter of node.typeParameters?.params ?? []) {
		if (!typeParameter.name?.name) {
			continue;
		}

		const isWeakZodTypeParameter =
			containsWeakZodTypeAnnotation(
				typeParameter.default,
				weakZodTypeNames,
				weakZodTypeScopes,
				typeDeclarationScopes,
				zodTypeNames,
				zodNamespaceNames,
				zodNamespaceTypeScopes,
				weakZodIndexKeyNames,
				anyTypeNames,
				genericZodTypeNames,
			) ||
			containsWeakZodTypeAnnotation(
				typeParameter.constraint,
				weakZodTypeNames,
				weakZodTypeScopes,
				typeDeclarationScopes,
				zodTypeNames,
				zodNamespaceNames,
				zodNamespaceTypeScopes,
				weakZodIndexKeyNames,
				anyTypeNames,
				genericZodTypeNames,
			);

		if (isWeakZodTypeParameter) {
			const variable = findVariable(weakZodTypeScopes.context, typeParameter.name);
			if (variable) typeParameterBindings.add(variable);
		}
	}

	return typeParameterBindings;
}

function addAnyTypeDeclaration(node, anyTypeNames) {
	let changed = false;
	for (const variable of anyTypeNames.context.sourceCode.getDeclaredVariables(node)) {
		if (variable.name === node.id.name) {
			changed = addName(anyTypeNames.bindings, variable) || changed;
		}
	}
	return changed;
}

function collectAnyTypeAlias(node, anyTypeNames) {
	if (node.type !== "TSTypeAliasDeclaration") {
		return false;
	}

	const localAnyTypeNames = getScopedAnyTypeNames(node, anyTypeNames);

	if (containsAnyKeyword(node.typeAnnotation, localAnyTypeNames)) {
		return addAnyTypeDeclaration(node, anyTypeNames);
	}

	return false;
}

function collectAnyInterfaceOrClass(node, anyTypeNames) {
	if ((node.type !== "TSInterfaceDeclaration" && node.type !== "ClassDeclaration") || !node.id?.name) {
		return false;
	}

	if (containsAnyKeyword(node, anyTypeNames, true)) {
		return addAnyTypeDeclaration(node, anyTypeNames);
	}

	return false;
}

function collectWeakZodTypeAlias(
	node,
	weakZodTypeNames,
	weakZodTypeScopes,
	typeDeclarationScopes,
	zodTypeNames,
	zodNamespaceNames,
	zodNamespaceTypeScopes,
	weakZodIndexKeyNames,
	anyTypeNames,
	genericZodTypeNames,
) {
	if (node.type !== "TSTypeAliasDeclaration") {
		return false;
	}

	const localAnyTypeNames = getScopedAnyTypeNames(node, anyTypeNames);

	const localWeakZodTypeNames = new Set(weakZodTypeNames);
	const localWeakZodTypeScopes = { ...weakZodTypeScopes, bindings: new Set(weakZodTypeScopes.bindings) };
	for (const variable of collectWeakZodTypeParameterBindings(
		node,
		weakZodTypeNames,
		weakZodTypeScopes,
		typeDeclarationScopes,
		zodTypeNames,
		zodNamespaceNames,
		zodNamespaceTypeScopes,
		weakZodIndexKeyNames,
		anyTypeNames,
		genericZodTypeNames,
	)) {
		localWeakZodTypeNames.add(variable.name);
		localWeakZodTypeScopes.bindings.add(variable);
	}

	if (
		containsWeakZodTypeAnnotation(
			node.typeAnnotation,
			localWeakZodTypeNames,
			localWeakZodTypeScopes,
			typeDeclarationScopes,
			zodTypeNames,
			zodNamespaceNames,
			zodNamespaceTypeScopes,
			weakZodIndexKeyNames,
			localAnyTypeNames,
			genericZodTypeNames,
		)
	) {
		return addScopedName(weakZodTypeNames, weakZodTypeScopes, node.id.name, node);
	}

	return false;
}

function collectGenericZodTypeAlias(node, zodTypeNames, zodNamespaceNames, genericZodTypeNames) {
	if (node.type !== "TSTypeAliasDeclaration" || !node.typeParameters?.params?.length) {
		return false;
	}

	if (node.typeAnnotation.type !== "TSTypeReference") {
		return false;
	}

	const isDirectZodTypeAlias = isZodTypeReference(node.typeAnnotation.typeName, zodTypeNames, zodNamespaceNames);
	const isChainedGenericZodTypeAlias =
		node.typeAnnotation.typeName.type === "Identifier" &&
		genericZodTypeNames.has(node.typeAnnotation.typeName.name);

	return isDirectZodTypeAlias || isChainedGenericZodTypeAlias ? addName(genericZodTypeNames, node.id.name) : false;
}

function collectWeakZodHeritageAlias(
	node,
	weakZodTypeNames,
	weakZodTypeScopes,
	typeDeclarationScopes,
	zodTypeNames,
	zodNamespaceNames,
	zodNamespaceTypeScopes,
	weakZodIndexKeyNames,
	anyTypeNames,
	genericZodTypeNames,
) {
	if ((node.type !== "TSInterfaceDeclaration" && node.type !== "ClassDeclaration") || !node.id?.name) {
		return false;
	}

	if (
		containsWeakZodTypeAnnotation(
			node,
			weakZodTypeNames,
			weakZodTypeScopes,
			typeDeclarationScopes,
			zodTypeNames,
			zodNamespaceNames,
			zodNamespaceTypeScopes,
			weakZodIndexKeyNames,
			anyTypeNames,
			genericZodTypeNames,
			true,
		)
	) {
		return addScopedName(weakZodTypeNames, weakZodTypeScopes, node.id.name, node);
	}

	return false;
}

function collectZodNamespaceTypeAlias(node, zodNamespaceNames, zodNamespaceTypeScopes, weakZodIndexKeyNames) {
	if (node.type !== "TSTypeAliasDeclaration") {
		return false;
	}

	if (
		isZodNamespaceTypeQuery(node.typeAnnotation, zodNamespaceNames) ||
		isZodNamespaceExportIndex(node.typeAnnotation, zodNamespaceNames, weakZodIndexKeyNames) ||
		containsZodModuleNamespaceObjectType(node.typeAnnotation, zodNamespaceNames, weakZodIndexKeyNames)
	) {
		return addNameScope(zodNamespaceTypeScopes, node.id.name, node);
	}

	return false;
}

function containsZodModuleNamespaceObjectType(
	node,
	zodNamespaceNames,
	weakZodIndexKeyNames,
	zodNamespaceTypeScopes = new Map(),
	typeDeclarationScopes = new Map(),
) {
	let containsNamespace = false;
	visitNode(node, (child) => {
		if (child.type === "TSTypeReference" && child.typeName.type === "Identifier" &&
			["Pick", "Omit", "Partial", "Readonly", "Required"].includes(child.typeName.name)) {
			containsNamespace = isWeakZodNamespaceUtilityType(
				child, zodNamespaceNames, weakZodIndexKeyNames, zodNamespaceTypeScopes, typeDeclarationScopes,
			) || containsNamespace;
			return false;
		}
		if (child === node) {
			return;
		}

		if (
			isZodModuleNamespaceObjectType(
				child,
				zodNamespaceNames,
				weakZodIndexKeyNames,
				zodNamespaceTypeScopes,
				typeDeclarationScopes,
			)
		) {
			containsNamespace = true;
		}
	});

	return containsNamespace;
}

function collectZodNamespaceValueAlias(node, zodNamespaceNames) {
	if (node.type !== "VariableDeclarator") {
		return false;
	}

	if (node.id.type === "Identifier" && containsDirectZodNamespaceRuntimeReference(node.init, zodNamespaceNames)) {
		return addZodNamespaceBinding(zodNamespaceNames, node.id);
	}

	if (node.id.type === "ObjectPattern") {
		let changed = false;
		for (const property of node.id.properties) {
			if (property.type !== "Property" || property.value.type !== "Identifier") {
				continue;
			}

			const propertyName = getRuntimePropertyName(property.key);
			const initPropertyValue = getObjectExpressionPropertyValue(node.init, propertyName);
			if (
				(propertyName !== null &&
					isZodNamespaceExportName(propertyName) &&
					containsDirectZodNamespaceRuntimeReference(node.init, zodNamespaceNames)) ||
				containsDirectZodNamespaceRuntimeReference(initPropertyValue, zodNamespaceNames)
			) {
				changed = addZodNamespaceBinding(zodNamespaceNames, property.value) || changed;
			}
		}
		return changed;
	}

	return false;
}

function collectTypeDeclarationScopes(node, typeDeclarationScopes) {
	visitNode(node, (child) => {
		if (child.type === "TSTypeAliasDeclaration") {
			addNameScope(typeDeclarationScopes, child.id.name, child);
		}

		if ((child.type === "TSInterfaceDeclaration" || child.type === "ClassDeclaration") && child.id?.name) {
			addNameScope(typeDeclarationScopes, child.id.name, child);
		}

		if (child.type === "TSImportEqualsDeclaration") {
			addNameScope(typeDeclarationScopes, child.id.name, child);
		}

		if (child.type === "ImportDeclaration") {
			for (const specifier of child.specifiers) {
				if (child.importKind === "type" || specifier.importKind === "type") {
					addNameScope(typeDeclarationScopes, specifier.local.name, specifier);
				}
			}
		}
	});
}

function collectAliases(
	node,
	weakZodTypeNames,
	weakZodTypeScopes,
	typeDeclarationScopes,
	zodTypeNames,
	zodNamespaceNames,
	zodNamespaceTypeScopes,
	zodIndexKeyAliases,
	anyTypeNames,
	genericZodTypeNames,
) {
	let changed = false;
	visitNode(node, (child) => {
		if (child.type === "TSImportEqualsDeclaration") {
			changed =
				collectZodImportEqualsDeclaration(
					child,
					weakZodTypeNames,
					weakZodTypeScopes,
					typeDeclarationScopes,
					zodTypeNames,
					zodNamespaceNames,
				) || changed;
		}

		if (child.type === "TSTypeAliasDeclaration") {
			changed = collectAnyTypeAlias(child, anyTypeNames) || changed;
			changed =
				collectZodNamespaceTypeAlias(child, zodNamespaceNames, zodNamespaceTypeScopes, zodIndexKeyAliases) ||
				changed;
			changed = collectZodIndexKeyAlias(child, zodIndexKeyAliases) || changed;
			changed =
				collectGenericZodTypeAlias(child, zodTypeNames, zodNamespaceNames, genericZodTypeNames) || changed;
			changed =
				collectWeakZodTypeAlias(
					child,
					weakZodTypeNames,
					weakZodTypeScopes,
					typeDeclarationScopes,
					zodTypeNames,
					zodNamespaceNames,
					zodNamespaceTypeScopes,
					zodIndexKeyAliases,
					anyTypeNames,
					genericZodTypeNames,
				) || changed;
		}

		if (child.type === "VariableDeclarator") {
			changed = collectZodNamespaceValueAlias(child, zodNamespaceNames) || changed;
		}

		if (child.type === "TSInterfaceDeclaration" || child.type === "ClassDeclaration") {
			changed = collectAnyInterfaceOrClass(child, anyTypeNames) || changed;
			changed =
				collectWeakZodHeritageAlias(
					child,
					weakZodTypeNames,
					weakZodTypeScopes,
					typeDeclarationScopes,
					zodTypeNames,
					zodNamespaceNames,
					zodNamespaceTypeScopes,
					zodIndexKeyAliases,
					anyTypeNames,
					genericZodTypeNames,
				) || changed;
		}
	});

	return changed;
}

function collectZodImportDeclaration(node, weakZodTypeNames, weakZodTypeScopes, zodTypeNames, zodNamespaceNames) {
	if (!isZodSource(node.source)) {
		return;
	}

	for (const specifier of node.specifiers) {
		if (specifier.type === "ImportNamespaceSpecifier" || specifier.type === "ImportDefaultSpecifier") {
			addZodNamespaceBinding(zodNamespaceNames, specifier.local);
			continue;
		}

		if (specifier.type !== "ImportSpecifier") {
			continue;
		}

		const importedName = getImportedName(specifier);
		if (isWeakZodAliasName(importedName)) {
			addScopedName(weakZodTypeNames, weakZodTypeScopes, specifier.local.name, specifier);
			continue;
		}

		if (importedName === "ZodType") {
			addZodTypeBinding(zodTypeNames, specifier.local);
			continue;
		}

		if (importedName === "default" || importedName === "z") {
			addZodNamespaceBinding(zodNamespaceNames, specifier.local);
		}
	}
}

function collectZodImportEqualsDeclaration(
	node,
	weakZodTypeNames,
	weakZodTypeScopes,
	typeDeclarationScopes,
	zodTypeNames,
	zodNamespaceNames,
) {
	if (isZodRequireReference(node.moduleReference)) {
		return addZodNamespaceBinding(zodNamespaceNames, node.id);
	}

	if (
		isWeakZodAliasReference(
			node.moduleReference,
			weakZodTypeNames,
			weakZodTypeScopes,
			typeDeclarationScopes,
			zodNamespaceNames,
		)
	) {
		return addScopedName(weakZodTypeNames, weakZodTypeScopes, node.id.name, node);
	}

	if (isZodTypeReference(node.moduleReference, zodTypeNames, zodNamespaceNames)) {
		return addZodTypeBinding(zodTypeNames, node.id);
	}

	return false;
}

function collectZodBindings(
	node,
	weakZodTypeNames,
	weakZodTypeScopes,
	typeDeclarationScopes,
	zodTypeNames,
	zodNamespaceNames,
	zodNamespaceTypeScopes,
	zodIndexKeyAliases,
	anyTypeNames,
	genericZodTypeNames,
) {
	collectTypeDeclarationScopes(node, typeDeclarationScopes);

	for (const statement of node.body) {
		if (statement.type === "ImportDeclaration") {
			collectZodImportDeclaration(
				statement,
				weakZodTypeNames,
				weakZodTypeScopes,
				zodTypeNames,
				zodNamespaceNames,
			);
		}

		if (statement.type === "TSImportEqualsDeclaration" && isZodRequireReference(statement.moduleReference)) {
			collectZodImportEqualsDeclaration(
				statement,
				weakZodTypeNames,
				weakZodTypeScopes,
				typeDeclarationScopes,
				zodTypeNames,
				zodNamespaceNames,
			);
		}
	}

	let changed = true;
	while (changed) {
		changed = collectAliases(
			node,
			weakZodTypeNames,
			weakZodTypeScopes,
			typeDeclarationScopes,
			zodTypeNames,
			zodNamespaceNames,
			zodNamespaceTypeScopes,
			zodIndexKeyAliases,
			anyTypeNames,
			genericZodTypeNames,
		);
	}
}

export default {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow ZodTypeAny except for focused Zod boundary exceptions",
		},
		messages: {
			noWeakZodType:
				"Do not use weak Zod schema types like ZodTypeAny, ZodSchema, Schema, or bare ZodType. Prefer a precise schema type such as ZodType<unknown, ZodTypeDef, unknown>, or add a focused eslint-disable for a Zod library boundary exception. An exported weak type stays reported at the end of the file even when disabled.",
		},
	},
	create(context) {
		const weakZodTypeNames = new Set();
		const weakZodTypeScopes = { bindings: new Set(), context };
		const typeDeclarationScopes = new Map();
		const zodTypeNames = { bindings: new Set(), context };
		const zodNamespaceNames = { bindings: new Set(), context };
		const zodNamespaceTypeScopes = new Map();
		const zodIndexKeyAliases = { bindings: new Map(), context };
		const anyTypeNames = { bindings: new Set(), context };
		const genericZodTypeNames = new Set();
		const escapedWeakExports = new Set();

		return {
			Program(node) {
				collectZodBindings(
					node,
					weakZodTypeNames,
					weakZodTypeScopes,
					typeDeclarationScopes,
					zodTypeNames,
					zodNamespaceNames,
					zodNamespaceTypeScopes,
					zodIndexKeyAliases,
					anyTypeNames,
					genericZodTypeNames,
				);
			},
			"Program:exit"() {
				for (const escapedWeakExport of escapedWeakExports) {
					context.report({
						node: escapedWeakExport,
						loc: { line: context.sourceCode.lines.length + 1, column: 0 },
						messageId: "noWeakZodType",
					});
				}
			},
			ImportDeclaration(node) {
				if (!isZodSource(node.source)) {
					return;
				}

				for (const specifier of node.specifiers) {
					if (specifier.type === "ImportNamespaceSpecifier" || specifier.type === "ImportDefaultSpecifier") {
						addZodNamespaceBinding(zodNamespaceNames, specifier.local);
						continue;
					}

					if (specifier.type !== "ImportSpecifier") {
						continue;
					}

					const importedName = getImportedName(specifier);
					if (isWeakZodAliasName(importedName)) {
						addScopedName(weakZodTypeNames, weakZodTypeScopes, specifier.local.name, specifier);
						context.report({ node: specifier, messageId: "noWeakZodType" });
						continue;
					}

					if (importedName === "ZodType") {
						addZodTypeBinding(zodTypeNames, specifier.local);
						continue;
					}

					if (importedName === "default" || importedName === "z") {
						addZodNamespaceBinding(zodNamespaceNames, specifier.local);
					}
				}
			},
			ExportNamedDeclaration(node) {
				if (node.declaration && isZodNamespaceExportDeclaration(node.declaration, zodNamespaceNames)) {
					context.report({ node: node.declaration, messageId: "noWeakZodType" });
					return;
				}

				if (
					node.declaration &&
					containsWeakZodTypeAnnotation(
						node.declaration,
						weakZodTypeNames,
						weakZodTypeScopes,
						typeDeclarationScopes,
						zodTypeNames,
						zodNamespaceNames,
						zodNamespaceTypeScopes,
						zodIndexKeyAliases,
						anyTypeNames,
						genericZodTypeNames,
						true,
					)
				) {
					if (
						hasNoZodTypeAnyDisableComment(context, node) ||
						hasNoZodTypeAnyDisableComment(context, node.declaration) ||
						hasNoZodTypeAnyDisableCommentInRange(context, node.declaration)
					) {
						escapedWeakExports.add(context.sourceCode.ast);
					}
					return;
				}

				for (const specifier of node.specifiers) {
					const exportsWeakZodType =
						(isZodSource(node.source) &&
							(isWeakZodExportName(getExportLocalName(specifier)) ||
								isZodNamespaceExportName(getExportLocalName(specifier)))) ||
						(!node.source &&
							isWeakLocalZodExport(
								specifier,
								weakZodTypeNames,
								weakZodTypeScopes,
								typeDeclarationScopes,
								zodTypeNames,
								zodNamespaceNames,
								zodNamespaceTypeScopes,
							));

					if (exportsWeakZodType) {
						if (
							hasNoZodTypeAnyDisableComment(context, node) ||
							hasNoZodTypeAnyDisableComment(context, specifier)
						) {
							escapedWeakExports.add(context.sourceCode.ast);
						}

						context.report({ node: specifier, messageId: "noWeakZodType" });
					}
				}
			},
			ExportDefaultDeclaration(node) {
				if (isRestrictedZodRuntimeReference(node.declaration, zodNamespaceNames)) {
					context.report({ node, messageId: "noWeakZodType" });
				}
			},
			TSExportAssignment(node) {
				if (isRestrictedZodRuntimeReference(node.expression, zodNamespaceNames)) {
					context.report({ node, messageId: "noWeakZodType" });
				}
			},
			ExportAllDeclaration(node) {
				if (isZodSource(node.source)) {
					context.report({ node, messageId: "noWeakZodType" });
				}
			},
			TSImportEqualsDeclaration(node) {
				if (isZodRequireReference(node.moduleReference)) {
					addZodNamespaceBinding(zodNamespaceNames, node.id);
					return;
				}

				if (
					isWeakZodAliasReference(
						node.moduleReference,
						weakZodTypeNames,
						weakZodTypeScopes,
						typeDeclarationScopes,
						zodNamespaceNames,
					)
				) {
					addScopedName(weakZodTypeNames, weakZodTypeScopes, node.id.name, node);
					context.report({ node, messageId: "noWeakZodType" });
					return;
				}

				if (isZodTypeReference(node.moduleReference, zodTypeNames, zodNamespaceNames)) {
					addZodTypeBinding(zodTypeNames, node.id);
				}
			},
			TSTypeReference(node) {
				const scopedAnyTypeNames = getScopedAnyTypeNames(node, anyTypeNames);
				if (
					isWeakZodTypeAnnotation(
						node,
						weakZodTypeNames,
						weakZodTypeScopes,
						typeDeclarationScopes,
						zodTypeNames,
						zodNamespaceNames,
						zodNamespaceTypeScopes,
						zodIndexKeyAliases,
						scopedAnyTypeNames,
						genericZodTypeNames,
					)
				) {
					context.report({ node, messageId: "noWeakZodType" });
				}
			},
			TSExpressionWithTypeArguments(node) {
				const scopedAnyTypeNames = getScopedAnyTypeNames(node, anyTypeNames);
				if (
					isWeakZodHeritage(
						node,
						weakZodTypeNames,
						weakZodTypeScopes,
						typeDeclarationScopes,
						zodTypeNames,
						zodNamespaceNames,
						scopedAnyTypeNames,
						genericZodTypeNames,
					)
				) {
					context.report({ node, messageId: "noWeakZodType" });
				}
			},
			TSInterfaceHeritage(node) {
				const scopedAnyTypeNames = getScopedAnyTypeNames(node, anyTypeNames);
				if (
					isWeakZodHeritage(
						node,
						weakZodTypeNames,
						weakZodTypeScopes,
						typeDeclarationScopes,
						zodTypeNames,
						zodNamespaceNames,
						scopedAnyTypeNames,
						genericZodTypeNames,
					)
				) {
					context.report({ node, messageId: "noWeakZodType" });
				}
			},
			TSClassImplements(node) {
				const scopedAnyTypeNames = getScopedAnyTypeNames(node, anyTypeNames);
				if (
					isWeakZodHeritage(
						node,
						weakZodTypeNames,
						weakZodTypeScopes,
						typeDeclarationScopes,
						zodTypeNames,
						zodNamespaceNames,
						scopedAnyTypeNames,
						genericZodTypeNames,
					)
				) {
					context.report({ node, messageId: "noWeakZodType" });
				}
			},
			TSImportType(node) {
				const scopedAnyTypeNames = getScopedAnyTypeNames(node, anyTypeNames);
				if (
					isWeakZodTypeAnnotation(
						node,
						weakZodTypeNames,
						weakZodTypeScopes,
						typeDeclarationScopes,
						zodTypeNames,
						zodNamespaceNames,
						zodNamespaceTypeScopes,
						zodIndexKeyAliases,
						scopedAnyTypeNames,
						genericZodTypeNames,
					)
				) {
					context.report({ node, messageId: "noWeakZodType" });
				}
			},
			TSIndexedAccessType(node) {
				const scopedAnyTypeNames = getScopedAnyTypeNames(node, anyTypeNames);
				if (
					isWeakZodTypeAnnotation(
						node,
						weakZodTypeNames,
						weakZodTypeScopes,
						typeDeclarationScopes,
						zodTypeNames,
						zodNamespaceNames,
						zodNamespaceTypeScopes,
						zodIndexKeyAliases,
						scopedAnyTypeNames,
						genericZodTypeNames,
					)
				) {
					context.report({ node, messageId: "noWeakZodType" });
				}
			},
		};
	},
};
