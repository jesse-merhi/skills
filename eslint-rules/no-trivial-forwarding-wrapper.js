const identifierName = (node) => node?.type === "Identifier" ? node.name : undefined

const functionName = (node) => {
  if (node.id?.type === "Identifier") return node.id.name
  const parent = node.parent
  return parent?.type === "VariableDeclarator" && parent.id.type === "Identifier" ? parent.id.name : "function"
}

const isExported = (node) => {
  const parent = node.parent
  if (parent?.type === "ExportDefaultDeclaration" || parent?.type === "ExportNamedDeclaration") return true
  const declaration = parent?.type === "VariableDeclarator" ? parent.parent : undefined
  return declaration?.parent?.type === "ExportNamedDeclaration"
}

const singleReturnArgument = (node) => {
  if (node.type === "ArrowFunctionExpression" && node.body.type !== "BlockStatement") return node.body
  if (node.body?.type !== "BlockStatement" || node.body.body.length !== 1) return undefined
  const statement = node.body.body[0]
  return statement.type === "ReturnStatement" ? statement.argument : undefined
}

const forwardsSameIdentifiers = (parameters, arguments_) => parameters.length > 0 && parameters.length === arguments_.length && parameters.every(
  (parameter, index) => identifierName(parameter) !== undefined && identifierName(parameter) === identifierName(arguments_[index])
)

const calleeContainsCall = (node) => {
  if (node?.type === "CallExpression") return true
  if (node?.type === "MemberExpression") return calleeContainsCall(node.object) || calleeContainsCall(node.property)
  return node?.type === "ChainExpression" && calleeContainsCall(node.expression)
}

const isTrivialForwarder = (node) => {
  const namedDeclaration = node.type === "FunctionDeclaration" || node.parent?.type === "VariableDeclarator"
  const isTypePredicate = node.returnType?.typeAnnotation?.type === "TSTypePredicate"
  if (!namedDeclaration || isTypePredicate) return false
  const returned = singleReturnArgument(node)
  return returned?.type === "CallExpression" && !calleeContainsCall(returned.callee) && forwardsSameIdentifiers(node.params, returned.arguments)
}

export default {
  meta: {
    type: "suggestion",
    docs: { description: "Disallow helpers that only forward their parameters into another call" },
    schema: [{ type: "object", properties: { ignoreExported: { type: "boolean" } }, additionalProperties: false }],
    messages: { forwarding: "Avoid trivial forwarding wrapper `{{name}}`. Inline it, or keep a helper only when it captures a concept, invariant, boundary, or test seam." }
  },
  create(context) {
    const ignoreExported = context.options[0]?.ignoreExported !== false
    const check = (node) => {
      if ((!ignoreExported || !isExported(node)) && isTrivialForwarder(node)) {
        context.report({ node, messageId: "forwarding", data: { name: functionName(node) } })
      }
    }
    return { ArrowFunctionExpression: check, FunctionDeclaration: check, FunctionExpression: check }
  }
}
