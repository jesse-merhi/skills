import { findVariable } from "./lib/find-variable.mjs";

const TYPEOF_COMPARISON_OPERATORS = new Set(["==", "===", "!=", "!=="]);
const MANUAL_CHECK_OPERATORS = new Set(["==", "===", "!=", "!==", "instanceof"]);

function getIdentifierName(pattern) {
	return pattern && pattern.type === "Identifier" ? pattern.name : null;
}

function isUnknownType(typeNode) {
	return typeNode && typeNode.type === "TSUnknownKeyword";
}

function isRecordOfUnknown(typeNode) {
	if (!typeNode || typeNode.type !== "TSTypeReference") {
		return false;
	}

	if (typeNode.typeName.type !== "Identifier" || typeNode.typeName.name !== "Record") {
		return false;
	}

	const params = typeNode.typeArguments?.params ?? typeNode.typeParameters?.params ?? [];
	return params.length === 2 && isUnknownType(params[1]);
}

function isBoundaryTypeAnnotation(node) {
	const typeNode = node?.typeAnnotation?.typeAnnotation;
	return isUnknownType(typeNode) || isRecordOfUnknown(typeNode);
}

function isTypeofStringComparison(node) {
	if (!TYPEOF_COMPARISON_OPERATORS.has(node.operator)) {
		return null;
	}

	return getTypeofOperand(node.left, node.right) ?? getTypeofOperand(node.right, node.left);
}

function getTypeofOperand(typeOfSide, literalSide) {
	if (
		typeOfSide?.type !== "UnaryExpression" ||
		typeOfSide.operator !== "typeof" ||
		literalSide?.type !== "Literal" ||
		typeof literalSide.value !== "string"
	) {
		return null;
	}

	return typeOfSide.argument;
}

function isNullishLiteral(node) {
	return (
		(node?.type === "Literal" && node.value === null) || (node?.type === "Identifier" && node.name === "undefined")
	);
}

function getManualCheckOperand(node) {
	if (!MANUAL_CHECK_OPERATORS.has(node.operator)) {
		return null;
	}

	const typeofOperand = isTypeofStringComparison(node);
	if (typeofOperand) {
		return typeofOperand;
	}

	if (node.operator === "instanceof") {
		return node.left;
	}

	if (isNullishLiteral(node.left)) {
		return node.right;
	}

	if (isNullishLiteral(node.right)) {
		return node.left;
	}

	return null;
}

function getArrayIsArrayOperand(node) {
	if (node.type !== "CallExpression" || node.arguments.length !== 1) {
		return null;
	}

	const callee = node.callee;
	if (callee.type !== "MemberExpression" || callee.computed) {
		return null;
	}

	if (
		callee.object.type !== "Identifier" ||
		callee.object.name !== "Array" ||
		callee.property.type !== "Identifier" ||
		callee.property.name !== "isArray"
	) {
		return null;
	}

	return node.arguments[0];
}

function getTaintedNameFromExpression(node, taintedVariables, context) {
	if (!node) {
		return null;
	}

	if (node.type === "Identifier") {
		return taintedVariables.has(findVariable(context, node)) ? node.name : null;
	}

	if (node.type === "MemberExpression") {
		return getTaintedNameFromExpression(node.object, taintedVariables, context);
	}

	if (node.type === "ChainExpression") {
		return getTaintedNameFromExpression(node.expression, taintedVariables, context);
	}

	return null;
}

export default {
	meta: {
		type: "problem",
		docs: {
			description: "Prefer Zod parsing over manual type checks for unknown boundary values",
		},
		schema: [
			{
				type: "object",
				properties: {
					allowedFiles: {
						type: "array",
						items: { type: "string" },
					},
					checkManualTypeChecks: { type: "boolean" },
				},
				additionalProperties: false,
			},
		],
		messages: {
			preferZod:
				"Do not parse unknown boundary value `{{name}}` with manual type checks. Prefer a Zod schema/safeParse boundary, or add a focused eslint-disable for a genuine TypeScript narrowing exception.",
		},
	},
	create(context) {
		const options = context.options[0] || {};
		const allowedFiles = options.allowedFiles || [];
		const checkManualTypeChecks = options.checkManualTypeChecks === true;
		const filename = context.filename;
		const scopes = [new Set()];

		if (allowedFiles.some((allowedFile) => filename.endsWith(allowedFile))) {
			return {};
		}

		function currentTaintedVariables() {
			return scopes[scopes.length - 1] ?? null;
		}

		function enterFunction(node) {
			const taintedVariables = new Set(currentTaintedVariables() ?? []);

			for (const parameter of node.params) {
				const param = parameter.type === "AssignmentPattern" ? parameter.left : parameter;
				const name = getIdentifierName(param);
				if (name && isBoundaryTypeAnnotation(param)) {
					const variable = findVariable(context, param);
					if (variable) taintedVariables.add(variable);
				}
			}

			scopes.push(taintedVariables);
		}

		function exitFunction() {
			scopes.pop();
		}

		return {
			FunctionDeclaration: enterFunction,
			"FunctionDeclaration:exit": exitFunction,
			FunctionExpression: enterFunction,
			"FunctionExpression:exit": exitFunction,
			ArrowFunctionExpression: enterFunction,
			"ArrowFunctionExpression:exit": exitFunction,
			VariableDeclarator(node) {
				const taintedVariables = currentTaintedVariables();
				if (!taintedVariables) {
					return;
				}

				const name = getIdentifierName(node.id);
				if (!name) {
					return;
				}

				if (isBoundaryTypeAnnotation(node.id) || getTaintedNameFromExpression(node.init, taintedVariables, context)) {
					const variable = findVariable(context, node.id);
					if (variable) taintedVariables.add(variable);
				}
			},
			BinaryExpression(node) {
				const taintedVariables = currentTaintedVariables();
				if (!taintedVariables) {
					return;
				}

				const operand = checkManualTypeChecks ? getManualCheckOperand(node) : isTypeofStringComparison(node);
				const taintedName = getTaintedNameFromExpression(operand, taintedVariables, context);
				if (!taintedName) {
					return;
				}

				context.report({
					node,
					messageId: "preferZod",
					data: { name: taintedName },
				});
			},
			CallExpression(node) {
				if (!checkManualTypeChecks) {
					return;
				}

				const taintedVariables = currentTaintedVariables();
				if (!taintedVariables) {
					return;
				}

				const operand = getArrayIsArrayOperand(node);
				const taintedName = getTaintedNameFromExpression(operand, taintedVariables, context);
				if (!taintedName) {
					return;
				}

				context.report({
					node,
					messageId: "preferZod",
					data: { name: taintedName },
				});
			},
		};
	},
};
