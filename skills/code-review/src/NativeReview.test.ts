// Executable-level compatibility tests intentionally exercise Node process boundaries.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { execFile as execFileCallback } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { promisify } from "node:util"
import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Option } from "effect"
import { planReview, reviewBaseCandidates, runNativeReview, untilReviewStable } from "./NativeReview.ts"

const execFile = promisify(execFileCallback)
const root = new URL("../../..", import.meta.url).pathname
const live = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) => effect.pipe(
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer)
)

describe("native review target", () => {
  it("reviews a dirty branch and its local overlay", () => {
    const plan = planReview("auto", "origin/main", "HEAD", true)
    assert.strictEqual(plan.label, "current branch against origin/main, including uncommitted changes")
    assert.deepStrictEqual(plan.targets.map((target) => ({ args: target.args, snapshot: target.snapshot })), [{ args: ["--base", "origin/main"], snapshot: true }])
  })

  it("uses the native commit protocol without preparing a synthetic tree", () => {
    assert.deepStrictEqual(planReview("commit", "origin/main", "abc123", false).targets[0]?.args, ["--commit", "abc123"])
  })

  it("prefers the PR base and supports master default branches", () => {
    assert.deepStrictEqual(reviewBaseCandidates("release", "origin/master"), ["origin/release", "release", "origin/master", "origin/main", "main", "master"])
  })

  it.effect("reruns when the target changes during review", () => {
    let identity = "a"
    let runs = 0
    return untilReviewStable({
      identity: Effect.sync(() => identity),
      operation: Effect.sync(() => { runs += 1; if (runs === 1) identity = "b"; return `result-${runs}` })
    }).pipe(Effect.map((result) => {
      assert.strictEqual(result.value, "result-2")
      assert.strictEqual(result.runs, 2)
    }))
  })

  it("discovers a master base and writes the environment output path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "codex-review-output-"))
    const bin = join(directory, "bin")
    const output = join(directory, "nested", "review.txt")
    try {
      await mkdir(bin)
      await writeFile(join(bin, "codex"), "#!/bin/sh\nprintf 'reviewed master\\n'\n", { mode: 0o700 })
      await writeFile(join(bin, "gh"), "#!/bin/sh\nexit 1\n", { mode: 0o700 })
      await execFile("git", ["init", "-b", "master"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "file.txt"), "base\n")
      await execFile("git", ["add", "file.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      // @effect-diagnostics-next-line processEnv:off
      await execFile(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "branch"], { cwd: directory, env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}`, CODEX_REVIEW_OUTPUT: output } })
      assert.strictEqual(await readFile(output, "utf8"), "reviewed master\n")
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("falls back when GitHub's PR base object is missing locally", async () => {
    const directory = await mkdtemp(join(tmpdir(), "net-diff-fallback-"))
    const bin = join(directory, "bin")
    try {
      await mkdir(bin)
      await writeFile(join(bin, "gh"), "#!/bin/sh\nprintf '%s\\n' '{\"baseRefName\":\"main\",\"baseRefOid\":\"ffffffffffffffffffffffffffffffffffffffff\"}'\n", { mode: 0o700 })
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "file.txt"), "base\n")
      await execFile("git", ["add", "file.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await execFile("git", ["update-ref", "refs/remotes/origin/main", "HEAD"], { cwd: directory })
      await writeFile(join(directory, "file.txt"), "changed\n")
      await execFile("git", ["commit", "-am", "change"], { cwd: directory })
      // @effect-diagnostics-next-line processEnv:off
      const { stdout } = await execFile(join(root, "skills/pr-proof-pack/scripts/pr-net-diff"), ["--json"], { cwd: directory, env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}` } })
      assert.strictEqual(JSON.parse(stdout).base.ref, "origin/main")
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("reviews whole-mode committed and local changes in one clean snapshot", async () => {
    const directory = await mkdtemp(join(tmpdir(), "whole-review-snapshot-"))
    const reviewer = join(directory, "reviewer")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "base.txt"), "base\n")
      await execFile("git", ["add", "base.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await execFile("git", ["switch", "-c", "feature"], { cwd: directory })
      await writeFile(join(directory, "committed.txt"), "committed\n")
      await execFile("git", ["add", "committed.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "feature"], { cwd: directory })
      await writeFile(join(directory, "staged.txt"), "staged\n")
      await execFile("git", ["add", "staged.txt"], { cwd: directory })
      await writeFile(join(directory, "base.txt"), "unstaged\n")
      await writeFile(join(directory, "untracked.txt"), "untracked\n")
      await writeFile(reviewer, "#!/bin/sh\nset -eu\ntest -z \"$(git status --porcelain)\"\nprintf '%s\\n' base.txt committed.txt staged.txt untracked.txt > expected\ngit diff --name-only main...HEAD | sort > actual\ndiff -u expected actual\nrm expected actual\nprintf 'reviewed combined snapshot\\n'\n", { mode: 0o700 })
      await writeFile(join(directory, ".git", "info", "exclude"), "reviewer\n")
      const { stdout: dryRun } = await execFile(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "whole", "--base", "main", "--dry-run"], { cwd: directory })
      assert.match(dryRun, /snapshot: temporary worktree with local overlay/u)
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const output = await Effect.runPromise(live(runNativeReview({ codexBin: reviewer, plan: planReview("whole", "main", "HEAD", true), testCommand: Option.none() })))
        assert.strictEqual(output, "reviewed combined snapshot\n")
      } finally {
        process.chdir(previousCwd)
      }
      const { stdout } = await execFile("git", ["worktree", "list", "--porcelain"], { cwd: directory })
      assert.strictEqual(stdout.split("\n").filter((line) => line.startsWith("worktree ")).length, 1)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
