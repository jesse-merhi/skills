const comparisonOperators = new Set(["==", "===", "!=", "!=="])
const manualCheckOperators = new Set([...comparisonOperators, "instanceof"])

const identifierName = (node) => node?.type === "Identifier" ? node.name : undefined
const isUnknown = (node) => node?.type === "TSUnknownKeyword"
const isUnknownRecord = (node) => node?.type === "TSTypeReference" && node.typeName.type === "Identifier" && node.typeName.name === "Record" && (node.typeArguments?.params ?? node.typeParameters?.params ?? []).at(1)?.type === "TSUnknownKeyword"
const isBoundaryType = (node) => isUnknown(node) || isUnknownRecord(node)
const annotationOf = (node) => node?.typeAnnotation?.typeAnnotation

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

const rootIdentifier = (node) => {
  if (node?.type === "Identifier") return node
  if (node?.type === "MemberExpression") return rootIdentifier(node.object)
  return node?.type === "ChainExpression" ? rootIdentifier(node.expression) : undefined
}

const propertyName = (node) => {
  if (node?.type === "Identifier") return node.name
  return node?.type === "Literal" && typeof node.value === "string" ? node.value : undefined
}

const propertyType = (type, name) => {
  if (type?.type !== "TSTypeLiteral") return undefined
  const member = type.members.find((candidate) => candidate.type === "TSPropertySignature" && propertyName(candidate.key) === name)
  return annotationOf(member)
}

const boundaryIdentifiers = (pattern, inheritedType) => {
  const type = annotationOf(pattern) ?? inheritedType
  if (pattern?.type === "Identifier") return isBoundaryType(type) ? [pattern] : []
  if (pattern?.type === "AssignmentPattern") return boundaryIdentifiers(pattern.left, type)
  if (pattern?.type === "RestElement") return boundaryIdentifiers(pattern.argument, type)
  if (pattern?.type === "ObjectPattern") {
    if (isBoundaryType(type)) return pattern.properties.flatMap((property) => property.type === "Property" ? boundaryIdentifiers(property.value, type) : boundaryIdentifiers(property.argument, type))
    return pattern.properties.flatMap((property) => property.type === "Property"
      ? boundaryIdentifiers(property.value, propertyType(type, propertyName(property.key)))
      : boundaryIdentifiers(property.argument, undefined))
  }
  if (pattern?.type === "ArrayPattern") {
    const elements = type?.type === "TSTupleType" ? type.elementTypes : []
    return pattern.elements.flatMap((element, index) => element === null ? [] : boundaryIdentifiers(element, elements[index]))
  }
  return []
}

export default {
  meta: {
    type: "problem",
    docs: { description: "Prefer Effect Schema over manual parsing of unknown boundary values" },
    schema: [],
    messages: { schema: "Decode unknown boundary value `{{name}}` with Effect Schema instead of manual type checks." }
  },
  create(context) {
    const sourceCode = context.sourceCode
    const boundaryBindings = []
    const aliases = []
    const checks = []

    const variableFor = (identifier) => {
      if (identifier === undefined) return undefined
      for (let scope = sourceCode.getScope(identifier); scope !== null; scope = scope.upper) {
        const reference = scope.references.find((candidate) => candidate.identifier === identifier)
        if (reference?.resolved !== null && reference?.resolved !== undefined) return reference.resolved
        const declared = scope.variables.find((variable) => variable.identifiers.includes(identifier))
        if (declared !== undefined) return declared
      }
      return undefined
    }

    const recordBoundaries = (pattern) => boundaryBindings.push(...boundaryIdentifiers(pattern))
    const recordAlias = (target, source) => {
      const targetIdentifier = rootIdentifier(target)
      const sourceIdentifier = rootIdentifier(source)
      if (targetIdentifier !== undefined && sourceIdentifier !== undefined) aliases.push([targetIdentifier, sourceIdentifier])
    }
    const recordCheck = (node, operand) => {
      const identifier = rootIdentifier(operand)
      if (identifier !== undefined) checks.push([node, identifier])
    }

    return {
      ArrowFunctionExpression(node) { node.params.forEach(recordBoundaries) },
      FunctionDeclaration(node) { node.params.forEach(recordBoundaries) },
      FunctionExpression(node) { node.params.forEach(recordBoundaries) },
      VariableDeclarator(node) {
        recordBoundaries(node.id)
        if (node.init !== null) recordAlias(node.id, node.init)
      },
      AssignmentExpression(node) {
        if (node.operator === "=") recordAlias(node.left, node.right)
      },
      BinaryExpression(node) { recordCheck(node, manualCheckOperand(node)) },
      CallExpression(node) { recordCheck(node, arrayOperand(node)) },
      "Program:exit"() {
        const tainted = new Set(boundaryBindings.map(variableFor).filter((variable) => variable !== undefined))
        let changed = true
        while (changed) {
          changed = false
          for (const [targetIdentifier, sourceIdentifier] of aliases) {
            const target = variableFor(targetIdentifier)
            const source = variableFor(sourceIdentifier)
            if (target !== undefined && source !== undefined && tainted.has(source) && !tainted.has(target)) {
              tainted.add(target)
              changed = true
            }
          }
        }
        for (const [node, identifier] of checks) {
          const variable = variableFor(identifier)
          if (variable !== undefined && tainted.has(variable)) context.report({ node, messageId: "schema", data: { name: identifierName(identifier) } })
        }
      }
    }
  }
}
