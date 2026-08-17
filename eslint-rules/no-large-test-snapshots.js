const allowedSnapshotFilePattern = /\.snapshot\.(?:spec|test)\.[cm]?[jt]sx?$/u

const propertyName = (node) => {
  if (node?.type === "Identifier") return node.name
  return node?.type === "Literal" && typeof node.value === "string" ? node.value : undefined
}

export default {
  meta: {
    type: "problem",
    docs: { description: "Disallow broad snapshots in ordinary tests" },
    schema: [],
    messages: { snapshot: "Assert the behavior or fields that matter, or move deliberate serializer coverage to a *.snapshot test." }
  },
  create(context) {
    if (allowedSnapshotFilePattern.test(context.filename)) return {}
    return {
      CallExpression(node) {
        const matcher = propertyName(node.callee.property)
        if (matcher === "toMatchSnapshot" || matcher === "toMatchInlineSnapshot") context.report({ node, messageId: "snapshot" })
      }
    }
  }
}
