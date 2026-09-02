import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Option from "effect/Option"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"

export class ReviewSnapshotError extends Schema.TaggedError<ReviewSnapshotError>()("ReviewSnapshotError", { message: Schema.String }) {}

// Explicit tool overrides are trusted user configuration; defaults are resolved outside the checkout.
// @effect-diagnostics-next-line processEnv:off
const toolEnvironment = { CODEX_BIN: process.env.CODEX_BIN, GH_BIN: process.env.GH_BIN, GIT_BIN: process.env.GIT_BIN, PATH: process.env.PATH ?? "" }

export const trustedExecutable = Effect.fn("ReviewEnvironment.trustedExecutable")(function*(name: string, reviewedRepoPath = process.cwd()) {
  const explicit = name === "git" ? toolEnvironment.GIT_BIN : name === "gh" ? toolEnvironment.GH_BIN : name === "codex" ? toolEnvironment.CODEX_BIN : undefined
  if (explicit !== undefined && explicit.length > 0) return explicit
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  let cursor = paths.resolve(reviewedRepoPath)
  let repo: string | undefined
  while (repo === undefined) {
    if (yield* fs.exists(paths.join(cursor, ".git"))) repo = yield* fs.realPath(cursor).pipe(Effect.orElseSucceed(() => cursor))
    else {
      const parent = paths.dirname(cursor)
      if (parent === cursor) break
      cursor = parent
    }
  }
  for (const entry of toolEnvironment.PATH.split(":")) {
    if (entry.length === 0 || !paths.isAbsolute(entry)) continue
    const candidate = paths.join(entry, name)
    if (!(yield* fs.exists(candidate))) continue
    const resolved = yield* fs.realPath(candidate).pipe(Effect.orElseSucceed(() => paths.resolve(candidate)))
    const info = yield* fs.stat(resolved).pipe(Effect.option)
    if (Option.isNone(info) || info.value.type !== "File" || (info.value.mode & 0o111) === 0) continue
    const relative = repo === undefined ? undefined : paths.relative(repo, resolved)
    const insideRepo = relative !== undefined && (relative === "" || (!paths.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${paths.sep}`)))
    if (!insideRepo) return resolved
  }
  return yield* new ReviewSnapshotError({ message: `could not resolve trusted ${name} executable outside the reviewed checkout; use the explicit tool override` })
})
