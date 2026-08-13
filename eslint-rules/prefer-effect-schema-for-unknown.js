const comparisonOperators = new Set(["==", "===", "!=", "!=="])
const manualCheckOperators = new Set([...comparisonOperators, "instanceof"])

const identifierName = (node) => node?.type === "Identifier" ? node.name : undefined
const isUnknown = (node) => node?.type === "TSUnknownKeyword"
const isUnknownRecord = (node) => node?.type === "TSTypeReference" && node.typeName.type === "Identifier" && node.typeName.name === "Record" && (node.typeArguments?.params ?? node.typeParameters?.params ?? []).at(1)?.type === "TSUnknownKeyword"
const isBoundary = (node) => {
  const annotation = node?.typeAnnotation?.typeAnnotation
  return isUnknown(annotation) || isUnknownRecord(annotation)
}

const typeofOperand = (left, right) => left?.type === "UnaryExpression" && left.operator === "typeof" && right?.type === "Literal" && typeof right.value === "string" ? left.argument : undefined

const manualCheckOperand = (node) => {
  if (!manualCheckOperators.has(node.operator)) return undefined
  const typeCheck = typeofOperand(node.left, node.right) ?? typeofOperand(node.right, node.left)
  if (typeCheck !== undefined) return typeCheck
  if (node.operator === "instanceof") return node.left
  if (node.left?.type === "Literal" && node.left.value === null) return node.right
  if (node.right?.type === "Literal" && node.right.value === null) return node.left
  if (node.left?.type === "Identifier" && node.left.name === "undefined") return node.right
  return node.right?.type === "Identifier" && node.right.name === "undefined" ? node.left : undefined
}

const arrayOperand = (node) => node.type === "CallExpression" && node.arguments.length === 1 && node.callee.type === "MemberExpression" && !node.callee.computed && node.callee.object.type === "Identifier" && node.callee.object.name === "Array" && node.callee.property.type === "Identifier" && node.callee.property.name === "isArray" ? node.arguments[0] : undefined

const taintedName = (node, names) => {
  if (node?.type === "Identifier") return names.has(node.name) ? node.name : undefined
  if (node?.type === "MemberExpression") return taintedName(node.object, names)
  return node?.type === "ChainExpression" ? taintedName(node.expression, names) : undefined
}

export default {
  meta: {
    type: "problem",
    docs: { description: "Prefer Effect Schema over manual parsing of unknown boundary values" },
    schema: [],
    messages: { schema: "Decode unknown boundary value `{{name}}` with Effect Schema instead of manual type checks." }
  },
  create(context) {
    const scopes = []
    const enterFunction = (node) => scopes.push(new Set(node.params.flatMap((parameter) => identifierName(parameter) !== undefined && isBoundary(parameter) ? [identifierName(parameter)] : [])))
    const exitFunction = () => { scopes.pop() }
    const currentNames = () => scopes.at(-1)
    const report = (node, operand) => {
      const names = currentNames()
      if (names === undefined) return
      const name = taintedName(operand, names)
      if (name !== undefined) context.report({ node, messageId: "schema", data: { name } })
    }
    return {
      ArrowFunctionExpression: enterFunction,
      "ArrowFunctionExpression:exit": exitFunction,
      FunctionDeclaration: enterFunction,
      "FunctionDeclaration:exit": exitFunction,
      FunctionExpression: enterFunction,
      "FunctionExpression:exit": exitFunction,
      VariableDeclarator(node) {
        const names = currentNames()
        const name = identifierName(node.id)
        if (names !== undefined && name !== undefined && (isBoundary(node.id) || taintedName(node.init, names) !== undefined)) names.add(name)
      },
      BinaryExpression(node) { report(node, manualCheckOperand(node)) },
      CallExpression(node) { report(node, arrayOperand(node)) }
    }
  }
}
