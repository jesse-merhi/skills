import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Option from "effect/Option"
// Executable-level compatibility tests intentionally exercise Node process boundaries.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { execFile as execFileCallback } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { promisify } from "node:util"

import { planReview, preflightCodexAuthentication, reviewBaseCandidates, reviewIdentity, runNativeReview, selectReviewPlan, untilReviewStable } from "./NativeReview.ts"

const execFile = promisify(execFileCallback)
const root = new URL("../../..", import.meta.url).pathname
const live = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) => effect.pipe(
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer)
)

describe("native review target", () => {
  it("uses redacted diagnostics and a live request even when cached login status fails", async () => {
    const directory = await mkdtemp(join(tmpdir(), "codex-auth-preflight-"))
    const reviewer = join(directory, "codex")
    const calls = join(directory, "calls")
    const probeCwd = join(directory, "probe-cwd")
    try {
      await writeFile(reviewer, `#!/bin/sh
printf '%s\\n' "$*" >> "${calls}"
case "$1" in
  login) exit 9 ;;
  doctor) printf '%s\\n' '{"checks":{"auth.credentials":{"status":"warning"}}}' ;;
  exec) pwd > "${probeCwd}"; printf 'ok\\n' ;;
  *) exit 7 ;;
esac
`, { mode: 0o700 })
      await Effect.runPromise(live(preflightCodexAuthentication(reviewer)))
      const recorded = await readFile(calls, "utf8")
      assert.match(recorded, /^login status$/mu)
      assert.match(recorded, /^doctor --json$/mu)
      assert.match(recorded, /^exec --ephemeral --skip-git-repo-check --sandbox read-only /mu)
      const executedFrom = (await readFile(probeCwd, "utf8")).trim()
      assert.notStrictEqual(executedFrom, process.cwd())
      assert.isTrue(executedFrom.startsWith(join(tmpdir(), "codex-auth-preflight.")))
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("falls through to the live request when doctor is unavailable", async () => {
    const directory = await mkdtemp(join(tmpdir(), "codex-auth-legacy-"))
    const reviewer = join(directory, "codex")
    try {
      await writeFile(reviewer, `#!/bin/sh
case "$1" in
  login) exit 0 ;;
  doctor) exit 2 ;;
  exec) printf 'ok\\n' ;;
  *) exit 7 ;;
esac
`, { mode: 0o700 })
      await Effect.runPromise(live(preflightCodexAuthentication(reviewer)))
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("does not expose doctor details when authentication fails", async () => {
    const directory = await mkdtemp(join(tmpdir(), "codex-auth-redaction-"))
    const reviewer = join(directory, "codex")
    try {
      await writeFile(reviewer, `#!/bin/sh
case "$1" in
  login) exit 0 ;;
  doctor) printf '%s\\n' '{"checks":{"auth.credentials":{"status":"fail","details":"secret-token service.internal"}}}'; exit 1 ;;
  exec) printf 'must-not-run\\n'; exit 7 ;;
esac
`, { mode: 0o700 })
      const result = await Effect.runPromiseExit(live(preflightCodexAuthentication(reviewer)))
      assert.isTrue(Exit.isFailure(result))
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause)
        assert.instanceOf(error, Error)
        if (error instanceof Error) {
          assert.match(error.message, /Codex authentication preflight failed/u)
          assert.notInclude(error.message, "secret-token")
          assert.notInclude(error.message, "service.internal")
        }
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("does not misclassify or expose live provider failures", async () => {
    const directory = await mkdtemp(join(tmpdir(), "codex-provider-preflight-"))
    const reviewer = join(directory, "codex")
    try {
      await writeFile(reviewer, `#!/bin/sh
case "$1" in
  login) exit 0 ;;
  doctor) printf '%s\\n' '{"checks":{"auth.credentials":{"status":"ok"}}}' ;;
  exec) printf 'secret-token service.internal\\n' >&2; exit 8 ;;
esac
`, { mode: 0o700 })
      const result = await Effect.runPromiseExit(live(preflightCodexAuthentication(reviewer)))
      assert.isTrue(Exit.isFailure(result))
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause)
        assert.instanceOf(error, Error)
        if (error instanceof Error) {
          assert.match(error.message, /rejected or expired credentials, network, rate-limit, model, or configuration errors/u)
          assert.match(error.message, /shared host auth path/u)
          assert.notInclude(error.message, "authentication preflight failed")
          assert.notInclude(error.message, "secret-token")
          assert.notInclude(error.message, "service.internal")
        }
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

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

  it("tracks untracked files outside the invocation subdirectory", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-identity-root-"))
    const child = join(directory, "nested")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "tracked.txt"), "tracked\n")
      await execFile("git", ["add", "tracked.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await mkdir(child)
      await writeFile(join(directory, "outside.txt"), "one\n")
      const previousCwd = process.cwd()
      process.chdir(child)
      try {
        const before = await Effect.runPromise(live(reviewIdentity()))
        await writeFile(join(directory, "outside.txt"), "two\n")
        const after = await Effect.runPromise(live(reviewIdentity()))
        assert.notStrictEqual(before, after)
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("tracks untracked symlinks without dereferencing them", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-identity-symlink-"))
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "tracked.txt"), "tracked\n")
      await execFile("git", ["add", "tracked.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await symlink("missing-one", join(directory, "link"))
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const before = await Effect.runPromise(live(reviewIdentity()))
        await rm(join(directory, "link"))
        await symlink("missing-two", join(directory, "link"))
        const after = await Effect.runPromise(live(reviewIdentity()))
        assert.notStrictEqual(before, after)
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("discovers a master base and writes the environment output path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "codex-review-output-"))
    const bin = join(directory, "bin")
    const output = join(directory, "nested", "review.txt")
    try {
      await mkdir(bin)
      await writeFile(join(bin, "codex"), `#!/bin/sh
case "$1" in
  login) exit 0 ;;
  doctor) printf '%s\\n' '{"checks":{"auth.credentials":{"status":"ok"}}}' ;;
  exec) printf 'ok\\n' ;;
  review) printf 'generated during review\\n' > generated.pyc; printf 'reviewed master\\n' ;;
  *) exit 7 ;;
esac
`, { mode: 0o700 })
      await writeFile(join(bin, "gh"), "#!/bin/sh\nexit 1\n", { mode: 0o700 })
      await execFile("git", ["init", "-b", "master"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "file.txt"), "base\n")
      await execFile("git", ["add", "file.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      // @effect-diagnostics-next-line processEnv:off
      await execFile(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "branch"], { cwd: directory, env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}`, CODEX_BIN: join(bin, "codex"), GH_BIN: join(bin, "gh"), CODEX_REVIEW_OUTPUT: output } })
      assert.strictEqual(await readFile(output, "utf8"), "reviewed master\n")
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 15_000)

  it("requires an explicit base when the repository has no discoverable default", async () => {
    const directory = await mkdtemp(join(tmpdir(), "codex-review-no-base-"))
    const bin = join(directory, "bin")
    try {
      await mkdir(bin)
      await writeFile(join(bin, "codex"), "#!/bin/sh\nprintf 'review must not run\\n'\n", { mode: 0o700 })
      await writeFile(join(bin, "gh"), "#!/bin/sh\nexit 1\n", { mode: 0o700 })
      await execFile("git", ["init", "-b", "feature"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "file.txt"), "feature\n")
      await execFile("git", ["add", "file.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "feature"], { cwd: directory })
      const result = await new Promise<{ readonly failed: boolean; readonly output: string }>((resolve) => {
        execFileCallback(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "branch"], { cwd: directory, encoding: "utf8", env: { ...process.env, CODEX_BIN: join(bin, "codex"), GH_BIN: join(bin, "gh") } }, (error, stdout, stderr) => resolve({ failed: error !== null, output: `${stdout}${stderr}` }))
      })
      assert.isTrue(result.failed)
      assert.match(result.output, /could not discover a review base; pass --base/u)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("removes stale output before a failing review", async () => {
    const directory = await mkdtemp(join(tmpdir(), "codex-review-stale-output-"))
    const bin = join(directory, "bin")
    const output = join(directory, "review.txt")
    try {
      await mkdir(bin)
      await writeFile(join(bin, "codex"), "#!/bin/sh\nexit 8\n", { mode: 0o700 })
      await writeFile(join(bin, "gh"), "#!/bin/sh\nexit 1\n", { mode: 0o700 })
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "file.txt"), "base\n")
      await execFile("git", ["add", "file.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await writeFile(output, "stale clean review\n")
      let reviewFailed = false
      try {
        // @effect-diagnostics-next-line processEnv:off
        await execFile(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "branch"], { cwd: directory, env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}`, CODEX_BIN: join(bin, "codex"), GH_BIN: join(bin, "gh"), CODEX_REVIEW_OUTPUT: output } })
      } catch {
        reviewFailed = true
      }
      assert.isTrue(reviewFailed)
      let staleOutputExists = true
      try {
        await readFile(output, "utf8")
      } catch {
        staleOutputExists = false
      }
      assert.isFalse(staleOutputExists)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("removes stale output before target resolution fails", async () => {
    const directory = await mkdtemp(join(tmpdir(), "codex-review-invalid-base-"))
    const output = join(directory, "review.txt")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "file.txt"), "base\n")
      await execFile("git", ["add", "file.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await writeFile(output, "stale clean review\n")
      await new Promise<void>((resolve) => {
        execFileCallback(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "branch", "--base", "missing", "--output", output], { cwd: directory }, () => resolve())
      })
      let staleOutputExists = true
      try {
        await readFile(output, "utf8")
      } catch {
        staleOutputExists = false
      }
      assert.isFalse(staleOutputExists)
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
      const { stdout } = await execFile(join(root, "skills/pr-proof-pack/scripts/pr-net-diff"), ["--json", "file.txt", "missing.txt"], { cwd: directory, env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}` } })
      const report = JSON.parse(stdout)
      assert.strictEqual(report.base.ref, "origin/main")
      assert.deepStrictEqual(report.fileDetails.map(({ path, status, branch_commits }: { path: string; status: string; branch_commits: ReadonlyArray<string> }) => ({ path, status, commitCount: branch_commits.length })), [
        { path: "file.txt", status: "modified", commitCount: 1 },
        { path: "missing.txt", status: "not touched in branch", commitCount: 0 }
      ])
      // @effect-diagnostics-next-line processEnv:off
      const { stdout: markdown } = await execFile(join(root, "skills/pr-proof-pack/scripts/pr-net-diff"), ["--markdown", "file.txt"], { cwd: directory, env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}` } })
      assert.match(markdown, /## Requested File Details\n- file\.txt: modified/u)
      // Executable-boundary compatibility test intentionally inherits the caller environment.
      // @effect-diagnostics-next-line processEnv:off
      const { stdout: relativeMarkdown } = await execFile(join(root, "skills/pr-proof-pack/scripts/pr-net-diff"), ["--markdown", "./file.txt"], { cwd: directory, env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}` } })
      assert.match(relativeMarkdown, /## Requested File Details\n- \.\/file\.txt: modified/u)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 15_000)

  it("prefers the current remote base over GitHub's stale PR base object", async () => {
    const directory = await mkdtemp(join(tmpdir(), "net-diff-current-base-"))
    const bin = join(directory, "bin")
    try {
      await mkdir(bin)
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "base.txt"), "base\n")
      await execFile("git", ["add", "base.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      const { stdout: staleBaseOutput } = await execFile("git", ["rev-parse", "HEAD"], { cwd: directory })
      const staleBase = staleBaseOutput.trim()
      await writeFile(join(bin, "gh"), `#!/bin/sh\nprintf '%s\\n' '{"baseRefName":"main","baseRefOid":"${staleBase}"}'\n`, { mode: 0o700 })
      await writeFile(join(directory, "upstream.txt"), "upstream\n")
      await execFile("git", ["add", "upstream.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "upstream"], { cwd: directory })
      const { stdout: currentBaseOutput } = await execFile("git", ["rev-parse", "HEAD"], { cwd: directory })
      const currentBase = currentBaseOutput.trim()
      await execFile("git", ["update-ref", "refs/remotes/origin/main", currentBase], { cwd: directory })
      await writeFile(join(directory, "feature.txt"), "feature\n")
      await execFile("git", ["add", "feature.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "feature"], { cwd: directory })
      // @effect-diagnostics-next-line processEnv:off
      const { stdout } = await execFile(join(root, "skills/pr-proof-pack/scripts/pr-net-diff"), ["--json"], { cwd: directory, env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}` } })
      const report = JSON.parse(stdout)
      assert.strictEqual(report.base.ref, "origin/main")
      assert.strictEqual(report.base.sha, currentBase)
      assert.strictEqual(report.base.source, "git remote base")
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 15_000)

  it("refreshes an explicit remote-tracking base before planning review", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-base-refresh-"))
    const repository = join(directory, "repo")
    const remote = join(directory, "remote.git")
    const updater = join(directory, "updater")
    try {
      await mkdir(repository)
      await execFile("git", ["init", "--bare", remote])
      await execFile("git", ["init", "-b", "main"], { cwd: repository })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: repository })
      await execFile("git", ["config", "user.name", "Test"], { cwd: repository })
      await writeFile(join(repository, "file.txt"), "base\n")
      await execFile("git", ["add", "file.txt"], { cwd: repository })
      await execFile("git", ["commit", "-m", "base"], { cwd: repository })
      await execFile("git", ["remote", "add", "origin", remote], { cwd: repository })
      await execFile("git", ["push", "-u", "origin", "main"], { cwd: repository })
      await execFile("git", ["clone", "-b", "main", remote, updater])
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: updater })
      await execFile("git", ["config", "user.name", "Test"], { cwd: updater })
      await writeFile(join(updater, "file.txt"), "advanced\n")
      await execFile("git", ["commit", "-am", "advance"], { cwd: updater })
      await execFile("git", ["push", "origin", "main"], { cwd: updater })
      const beforeDryRun = (await execFile("git", ["rev-parse", "origin/main"], { cwd: repository })).stdout.trim()
      await execFile(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "branch", "--base", "origin/main", "--dry-run"], { cwd: repository })
      assert.strictEqual((await execFile("git", ["rev-parse", "origin/main"], { cwd: repository })).stdout.trim(), beforeDryRun)
      const previousCwd = process.cwd()
      process.chdir(repository)
      try {
        await Effect.runPromise(live(selectReviewPlan("branch", Option.some("origin/main"), "HEAD")))
      } finally {
        process.chdir(previousCwd)
      }
      const refreshed = (await execFile("git", ["rev-parse", "origin/main"], { cwd: repository })).stdout.trim()
      const remoteHead = (await execFile("git", ["rev-parse", "refs/heads/main"], { cwd: remote })).stdout.trim()
      assert.strictEqual(refreshed, remoteHead)
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
      await symlink("untracked.txt", join(directory, "untracked-link"))
      await writeFile(reviewer, "#!/bin/sh\nset -eu\ntest -z \"$(git status --porcelain)\"\ntest \"$(readlink untracked-link)\" = untracked.txt\nprintf '%s\\n' base.txt committed.txt staged.txt untracked-link untracked.txt > expected\ngit diff --name-only main...HEAD | sort > actual\ndiff -u expected actual\nrm expected actual\nprintf 'reviewed combined snapshot\\n'\n", { mode: 0o700 })
      await writeFile(join(directory, ".git", "info", "exclude"), "reviewer\n")
      const { stdout: dryRun } = await execFile(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "whole", "--base", "main", "--dry-run"], { cwd: directory })
      assert.match(dryRun, /snapshot: temporary worktree with local overlay/u)
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const output = await Effect.runPromise(live(runNativeReview({ codexBin: "./reviewer", plan: planReview("whole", "main", "HEAD", true), testCommand: Option.none() })))
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

  it("runs parallel tests from the repository root when invoked below it", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-test-root-"))
    const child = join(directory, "nested")
    const reviewer = join(directory, "reviewer")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "file.txt"), "base\n")
      await execFile("git", ["add", "file.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await mkdir(child)
      await writeFile(reviewer, "#!/bin/sh\nprintf 'clean review\\n'\n", { mode: 0o700 })
      const previousCwd = process.cwd()
      process.chdir(child)
      try {
        await Effect.runPromise(live(runNativeReview({ codexBin: reviewer, plan: planReview("branch", "main", "HEAD", false), testCommand: Option.some('test "$(pwd)" = "$(git rev-parse --show-toplevel)"') })))
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
