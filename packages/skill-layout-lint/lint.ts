import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import { pathToFileURL } from "node:url"

import { formatFinding, isError, lintSkillsRoot } from "./SkillLayoutLint.ts"

const repositoryRoot = Effect.fn("skill-layout-lint.repositoryRoot")(function*(start: string) {
  const fileSystem = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  let directory = start
  while (!(yield* fileSystem.exists(path.join(directory, "package.json")))) {
    const parent = path.dirname(directory)
    if (parent === directory) return start
    directory = parent
  }
  return directory
})

export const report = Effect.fn("skill-layout-lint.report")(function*(root: string) {
  const path = yield* Path.Path
  const { findings, referenceCount, skillCount } = yield* lintSkillsRoot(root)
  const base = path.dirname(root)
  const errors = findings.filter(isError)
  for (const finding of [...errors, ...findings.filter((finding) => !isError(finding))]) {
    yield* Console.log(formatFinding({ ...finding, path: path.relative(base, finding.path) }))
  }
  if (errors.length === 0) {
    yield* Console.log(`skill-layout-lint: ${skillCount} skills, ${referenceCount} references, no errors`)
  }
  return errors.length === 0 ? 0 : 1
})

const main = Effect.gen(function*() {
  const path = yield* Path.Path
  const requested = process.argv[2]
  const root = requested === undefined
    ? path.join(yield* repositoryRoot(path.dirname(yield* path.fromFileUrl(new URL(import.meta.url)))), "skills")
    : path.resolve(requested)
  process.exitCode = yield* report(root)
})

export function run(): void {
  // @effect-diagnostics-next-line strictEffectProvide:off
  main.pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run()
}
