import { assert, describe, it } from "@effect/vitest"
import * as Schema from "effect/Schema"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { execFileSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const runGit = (root: string, ...args: ReadonlyArray<string>) => execFileSync("git", args, {
  cwd: root,
  encoding: "utf8"
}).trim()

describe("PR net diff", () => {
  it("reports only the selected head's net changes from the merge base", () => {
    const root = mkdtempSync(join(tmpdir(), "pr-net-diff-test-"))
    try {
      runGit(root, "init", "-q", "-b", "main")
      runGit(root, "config", "user.name", "Test")
      runGit(root, "config", "user.email", "test@example.com")
      writeFileSync(join(root, "base.txt"), "base\n")
      runGit(root, "add", ".")
      runGit(root, "commit", "-qm", "base")
      const mergeBase = runGit(root, "rev-parse", "HEAD")

      runGit(root, "switch", "-c", "feature")
      writeFileSync(join(root, "feature.ts"), "export const feature = true\n")
      runGit(root, "add", "feature.ts")
      runGit(root, "commit", "-qm", "add feature")
      writeFileSync(join(root, "temporary.txt"), "temporary\n")
      runGit(root, "add", "temporary.txt")
      runGit(root, "commit", "-qm", "add temporary file")
      rmSync(join(root, "temporary.txt"))
      runGit(root, "add", "-u")
      runGit(root, "commit", "-qm", "remove temporary file")
      const head = runGit(root, "rev-parse", "HEAD")

      runGit(root, "switch", "main")
      writeFileSync(join(root, "README.md"), "destination advanced\n")
      runGit(root, "add", "README.md")
      runGit(root, "commit", "-qm", "advance destination")
      const destination = runGit(root, "rev-parse", "HEAD")

      const cli = fileURLToPath(new URL("./pr-net-diff.ts", import.meta.url))
      const output = execFileSync("bun", [cli, "--base", "main", "--head", "feature", "--json"], {
        cwd: root,
        encoding: "utf8"
      })
      const report = Schema.decodeUnknownSync(Schema.Struct({
        base: Schema.Struct({ comparisonBase: Schema.String, ref: Schema.String, sha: Schema.String }),
        changeBreakdown: Schema.Struct({
          total: Schema.Struct({
            additions: Schema.Number,
            binaryFiles: Schema.Number,
            deletions: Schema.Number,
            files: Schema.Number
          })
        }),
        head: Schema.String
      }))(JSON.parse(output) as unknown)

      assert.strictEqual(report.base.ref, "main")
      assert.strictEqual(report.base.sha, destination)
      assert.strictEqual(report.base.comparisonBase, mergeBase)
      assert.strictEqual(report.head, head)
      assert.deepStrictEqual(report.changeBreakdown.total, {
        files: 1,
        additions: 1,
        deletions: 0,
        binaryFiles: 0
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
