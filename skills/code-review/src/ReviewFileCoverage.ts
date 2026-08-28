import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Option from "effect/Option"
import * as Path from "effect/Path"
import { createHash } from "node:crypto"
// Raw link bytes are required because Effect FileSystem.readLink returns decoded text.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { readlink } from "node:fs/promises"

import { checkedBytes, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { ReviewSnapshotError, trustedExecutable } from "./NativeReview.ts"
import { measureScopeDiff } from "./ReviewScope.ts"

export interface ReviewFileIdentity {
  readonly path: string
  readonly changeId: string
}

type WorkingPathState =
  | { readonly _tag: "file"; readonly mode: string }
  | { readonly _tag: "symlink"; readonly target: Uint8Array }
  | { readonly _tag: "missing" }
  | { readonly _tag: "other" }

const decodeGitOutput = (output: Uint8Array): string => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(output)
  } catch {
    throw new ReviewSnapshotError({ message: "changed-file coverage requires Git paths that are valid UTF-8 so the CLI can round-trip them exactly" })
  }
}

const splitNulText = (output: Uint8Array): ReadonlyArray<string> => decodeGitOutput(output).split("\0").filter((path) => path.length > 0)

const nulTerminatedText = (values: ReadonlyArray<string>): Uint8Array => new TextEncoder().encode(`${values.join("\0")}\0`)

const parseGitAttributes = (output: Uint8Array): ReadonlyMap<string, string> => {
  const fields = decodeGitOutput(output).split("\0")
  if (fields.at(-1) === "") fields.pop()
  const attributes = new Map<string, Array<string>>()
  for (let index = 0; index + 2 < fields.length; index += 3) {
    const path = fields[index]
    const attribute = fields[index + 1]
    const value = fields[index + 2]
    if (path === undefined || attribute === undefined || value === undefined) continue
    const entries = attributes.get(path) ?? []
    entries.push(`${attribute}\0${value}`)
    attributes.set(path, entries)
  }
  return new Map([...attributes].map(([path, entries]) => [path, entries.sort().join("\0")]))
}

const parseGitEntries = (output: Uint8Array): ReadonlyMap<string, string> => new Map(splitNulText(output).flatMap((record) => {
  const tab = record.indexOf("\t")
  if (tab < 0) return []
  const metadata = record.slice(0, tab).split(" ")
  const oid = metadata[1] === "blob" || metadata[1] === "tree" || metadata[1] === "commit" ? metadata[2] : metadata[1]
  return metadata[0] === undefined || oid === undefined ? [] : [[record.slice(tab + 1), `${metadata[0]} ${oid}`] as const]
}))
const parseRawModes = (output: Uint8Array): ReadonlyMap<string, string> => {
  const fields = splitNulText(output)
  const modes = new Map<string, string>()
  for (let index = 0; index + 1 < fields.length; index += 2) {
    const mode = /^:\d{6} (\d{6}) [0-9a-f]+ [0-9a-f]+ [A-Z]$/u.exec(fields[index] ?? "")?.[1]
    if (mode !== undefined) modes.set(fields[index + 1] ?? "", mode)
  }
  return modes
}

const selectGitEntries = (entries: ReadonlyMap<string, string>, paths: ReadonlySet<string>) => new Map([...entries].filter(([path]) => paths.has(path)))
const isAttributesPath = (path: string): boolean => path.split("/").at(-1) === ".gitattributes"
const isHiddenIndexRecord = (record: string): boolean => record.at(1) === " " && (record.at(0) === "S" || /^[a-z]$/u.test(record.at(0) ?? ""))

const contentId = (kind: string, path: string, mode: string, content: string | Uint8Array): string => createHash("sha256")
  .update(kind)
  .update("\0")
  .update(path)
  .update("\0")
  .update(mode)
  .update("\0")
  .update(content)
  .digest("hex")

export const changedFileManifest = Effect.fn("ReviewFileCoverage.changedFileManifest")(function*(repoPath: string, baseRef: string, targetRef = "HEAD", workingTree?: boolean) {
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const git = yield* trustedExecutable("git", repoPath)
  const targetOid = yield* checkedTrimmedText(git, ["rev-parse", "--verify", `${targetRef}^{commit}`], { cwd: repoPath })
  const checkoutOid = yield* checkedTrimmedText(git, ["rev-parse", "--verify", "HEAD^{commit}"], { cwd: repoPath })
  const includeWorkingTree = workingTree ?? targetOid === checkoutOid
  const mergeBase = yield* checkedTrimmedText(git, ["merge-base", baseRef, targetOid], { cwd: repoPath })
  const diffOptions = ["--no-ext-diff", "--no-textconv", "--no-renames", "--ignore-submodules=none", "--submodule=short"] as const
  const measurement = yield* measureScopeDiff(repoPath, mergeBase, targetRef, includeWorkingTree)
  const changedPaths = measurement.changedPaths
  if (changedPaths.length === 0) return []
  const untrackedPaths = includeWorkingTree ? new Set(splitNulText(yield* checkedBytes(git, ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: repoPath }))) : new Set<string>()
  const changedPathSet = new Set(changedPaths)
  const literalPaths = { cwd: repoPath, env: { GIT_LITERAL_PATHSPECS: "1" }, extendEnv: true } as const
  const attributeOptions = {
    cwd: repoPath,
    env: { GIT_LITERAL_PATHSPECS: "1", ...(includeWorkingTree ? {} : { GIT_ATTR_SOURCE: targetOid }) },
    extendEnv: true
  } as const
  const attributes = parseGitAttributes(yield* checkedBytes(git, ["check-attr", "-z", "--stdin", "-a"], {
    ...attributeOptions,
    stdin: nulTerminatedText(changedPaths)
  }))
  const baseEntries = selectGitEntries(parseGitEntries(yield* checkedBytes(git, ["ls-tree", "-r", "-z", "--full-tree", mergeBase], literalPaths)), changedPathSet)
  const targetEntries = includeWorkingTree
    ? new Map<string, string>()
    : selectGitEntries(parseGitEntries(yield* checkedBytes(git, ["ls-tree", "-r", "-z", "--full-tree", targetOid], literalPaths)), changedPathSet)
  const indexEntries = includeWorkingTree
    ? selectGitEntries(parseGitEntries(yield* checkedBytes(git, ["ls-files", "--stage", "-z"], literalPaths)), changedPathSet)
    : new Map<string, string>()
  const currentModes = includeWorkingTree
    ? parseRawModes(yield* checkedBytes(git, ["diff", "--raw", "-z", ...diffOptions, mergeBase, "--"], literalPaths))
    : new Map<string, string>()
  const hiddenIndexPaths = includeWorkingTree
    ? new Set(splitNulText(yield* checkedBytes(git, ["ls-files", "-v", "-z"], literalPaths)).filter(isHiddenIndexRecord).map((record) => record.slice(2)))
    : new Set<string>()
  const deleted = includeWorkingTree
    ? new Set(splitNulText(yield* checkedBytes(git, ["ls-files", "--deleted", "-z"], literalPaths)))
    : new Set<string>()
  const workingStates = includeWorkingTree
    ? new Map<string, WorkingPathState>(yield* Effect.forEach(changedPaths, (path) => Effect.gen(function*() {
      const absolutePath = paths.resolve(repoPath, path)
      const linkTarget = yield* fs.readLink(absolutePath).pipe(Effect.option)
      if (Option.isSome(linkTarget)) {
        const target = yield* Effect.tryPromise({
          try: () => readlink(absolutePath, { encoding: "buffer" }),
          catch: () => new ReviewSnapshotError({ message: `changed-file coverage could not read symlink target '${path}' exactly` })
        })
        return [path, { _tag: "symlink", target } satisfies WorkingPathState] as const
      }
      const info = yield* fs.stat(absolutePath).pipe(Effect.option)
      if (Option.isNone(info)) return [path, { _tag: "missing" } satisfies WorkingPathState] as const
      if (info.value.type !== "File") return [path, { _tag: "other" } satisfies WorkingPathState] as const
      const mode = (info.value.mode & 0o111) === 0 ? "100644" : "100755"
      return [path, { _tag: "file", mode } satisfies WorkingPathState] as const
    }), { concurrency: 16 }))
    : new Map<string, WorkingPathState>()
  const regularPaths = [...workingStates].flatMap(([path, state]) => state._tag === "file" ? [path] : [])
  const regularPathChunks = Array.from({ length: Math.ceil(regularPaths.length / 32) }, (_, index) => regularPaths.slice(index * 32, index * 32 + 32))
  const blobIds = (yield* Effect.forEach(regularPathChunks, (chunk) => checkedTrimmedText(git, ["hash-object", "--filters", "--", ...chunk], literalPaths))).flatMap((output) => output.split("\n"))
  if (blobIds.length !== regularPaths.length) {
    return yield* new ReviewSnapshotError({ message: `git hash-object returned ${blobIds.length} identities for ${regularPaths.length} changed files` })
  }
  const workingBlobIds = new Map(regularPaths.map((path, index) => [path, blobIds[index] ?? ""]))
  const symlinkBlobIds = new Map(yield* Effect.forEach([...workingStates].flatMap(([path, state]) => state._tag === "symlink" ? [[path, state.target] as const] : []),
    ([path, target]) => checkedTrimmedText(git, ["hash-object", "--stdin"], { cwd: repoPath, stdin: target }).pipe(Effect.map((oid) => [path, oid] as const))))
  const deletedAttributeSources = changedPaths.filter((path) => isAttributesPath(path) && deleted.has(path) && !hiddenIndexPaths.has(path))
  const deletedAttributeIdentity = (path: string) => deletedAttributeSources
    .filter((source) => source === ".gitattributes" || path.startsWith(source.slice(0, -".gitattributes".length)))
    .join("\0")
  return yield* Effect.forEach(changedPaths, (path) => Effect.gen(function*() {
    const baseIdentity = baseEntries.get(path) ?? "missing"
    const effectiveAttributes = `${attributes.get(path) ?? ""}\0${deletedAttributeIdentity(path)}`
    if (!includeWorkingTree) {
      return { path, changeId: contentId("change", path, baseIdentity, `${targetEntries.get(path) ?? "missing"}\0${effectiveAttributes}`) } satisfies ReviewFileIdentity
    }
    if (baseIdentity !== "missing" && !indexEntries.has(path) && !untrackedPaths.has(path)) return { path, changeId: contentId("change", path, baseIdentity, `missing\0${effectiveAttributes}`) } satisfies ReviewFileIdentity
    if (deleted.has(path) && !hiddenIndexPaths.has(path)) return { path, changeId: contentId("change", path, baseIdentity, `missing\0${effectiveAttributes}`) } satisfies ReviewFileIdentity
    const state = workingStates.get(path)
    if (state?._tag === "symlink") {
      return { path, changeId: contentId("change", path, baseIdentity, `120000 ${symlinkBlobIds.get(path) ?? ""}\0${effectiveAttributes}`) } satisfies ReviewFileIdentity
    }
    if (state === undefined || state._tag === "missing") {
      return { path, changeId: contentId("change", path, baseIdentity, `${indexEntries.get(path) ?? "missing"}\0${effectiveAttributes}`) } satisfies ReviewFileIdentity
    }
    if (state._tag === "file") {
      return { path, changeId: contentId("change", path, baseIdentity, `${currentModes.get(path) ?? state.mode} ${workingBlobIds.get(path) ?? ""}\0${effectiveAttributes}`) } satisfies ReviewFileIdentity
    }
    const indexIdentity = indexEntries.get(path)
    const patch = yield* checkedBytes(git, ["diff", "--binary", "--full-index", ...diffOptions, mergeBase, "--", path], literalPaths)
    const patchText = new TextDecoder().decode(patch)
    const gitlinkOid = /^\+Subproject commit ([0-9a-f]+)$/mu.exec(patchText)?.[1]
    if (indexIdentity !== undefined && !indexIdentity.startsWith("160000 ") && gitlinkOid === undefined) {
      return { path, changeId: contentId("change", path, baseIdentity, `missing\0${effectiveAttributes}`) } satisfies ReviewFileIdentity
    }
    if (patch.length === 0 || /^[+-]Subproject commit [0-9a-f]+-dirty$/mu.test(patchText) || gitlinkOid === undefined) {
      return yield* new ReviewSnapshotError({ message: `changed-file coverage cannot attest dirty or untracked nested repository '${path}'; commit its nested state before review` })
    }
    return { path, changeId: contentId("change", path, baseIdentity, `160000 ${gitlinkOid}\0${effectiveAttributes}`) } satisfies ReviewFileIdentity
  }), { concurrency: 16 })
})
