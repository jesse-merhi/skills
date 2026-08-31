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
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, utimes, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { promisify } from "node:util"

import { archiveReviewSessions, planReview, preflightCodexAuthentication, reviewBaseCandidates, reviewIdentity, runNativeReview, selectReviewPlan, untilReviewStable } from "./NativeReview.ts"

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
      assert.isTrue(executedFrom.startsWith(join(await realpath(tmpdir()), "codex-auth-preflight.")))
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
    assert.deepStrictEqual(plan.targets.map((target) => ({ args: target.args, envelope: target.envelope })), [{
      args: ["--base", "origin/main"],
      envelope: { base: "origin/main", head: "HEAD", comparison: "merge-base", includeWorkingTree: true, allowEmptyBase: false }
    }])
  })

  it("preserves the requested commit identity for the frozen envelope", () => {
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

  it("tracks an untracked embedded repository by its HEAD", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-identity-embedded-"))
    const embedded = join(directory, "embedded")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "tracked.txt"), "tracked\n")
      await execFile("git", ["add", "tracked.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await execFile("git", ["init", "--quiet", embedded], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: embedded })
      await execFile("git", ["config", "user.name", "Test"], { cwd: embedded })
      await writeFile(join(embedded, "file.txt"), "one\n")
      await execFile("git", ["add", "file.txt"], { cwd: embedded })
      await execFile("git", ["commit", "--quiet", "-m", "one"], { cwd: embedded })
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const before = await Effect.runPromise(live(reviewIdentity()))
        await writeFile(join(embedded, "file.txt"), "two\n")
        await execFile("git", ["commit", "-am", "two"], { cwd: embedded })
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

  it("archives the review driver and its subagent thread, and nothing else", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-session-archive-"))
    const reviewDir = join(directory, "repo")
    const otherDir = join(directory, "elsewhere")
    const sessionsRoot = join(directory, "sessions")
    const reviewer = join(directory, "codex")
    const calls = join(directory, "calls")
    try {
      await mkdir(reviewDir)
      await mkdir(otherDir)
      const now = new Date()
      const day = join(...now.toISOString().slice(0, 10).split("-"))
      await mkdir(join(sessionsRoot, day), { recursive: true })
      await writeFile(reviewer, `#!/bin/sh\nprintf '%s\\n' "$*" >> "${calls}"\n`, { mode: 0o700 })
      const driver = (id: string, cwd: string, marker: boolean) =>
        `${JSON.stringify({ type: "session_meta", payload: { id, cwd } })}\n${marker ? "{\"type\":\"entered_review_mode\"}\n" : ""}`
      const child = (id: string, cwd: string, parent: string) =>
        `${JSON.stringify({ type: "session_meta", payload: { id, cwd, parent_thread_id: parent } })}\n{"type":"message"}\n`
      // Driver plus its subagent thread: both belong to this run.
      await writeFile(join(sessionsRoot, day, "rollout-a.jsonl"), driver("uuid-a", reviewDir, true))
      await writeFile(join(sessionsRoot, day, "rollout-a-sub.jsonl"), child("uuid-a-sub", reviewDir, "uuid-a"))
      // A review in another directory, an unrelated interactive session, and a
      // subagent whose parent was not a review here.
      await writeFile(join(sessionsRoot, day, "rollout-b.jsonl"), driver("uuid-b", otherDir, true))
      await writeFile(join(sessionsRoot, day, "rollout-c.jsonl"), driver("uuid-c", reviewDir, false))
      await writeFile(join(sessionsRoot, day, "rollout-c-sub.jsonl"), child("uuid-c-sub", reviewDir, "uuid-c"))
      // A review from an earlier run, outside this run's window.
      await writeFile(join(sessionsRoot, day, "rollout-d.jsonl"), driver("uuid-d", reviewDir, true))
      const old = new Date(now.getTime() - 3600_000)
      await utimes(join(sessionsRoot, day, "rollout-d.jsonl"), old, old)
      const archived = await Effect.runPromise(live(archiveReviewSessions({
        reviewer,
        reviewCwds: [reviewDir],
        since: new Date(now.getTime() - 60_000),
        sessionsRoot
      })))
      assert.deepStrictEqual(archived, ["uuid-a", "uuid-a-sub"])
      assert.strictEqual(await readFile(calls, "utf8"), "archive uuid-a\narchive uuid-a-sub\n")
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("does not re-archive a subagent thread that the driver archive already moved", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-session-cascade-"))
    const reviewDir = join(directory, "repo")
    const sessionsRoot = join(directory, "sessions")
    const reviewer = join(directory, "codex")
    const calls = join(directory, "calls")
    try {
      await mkdir(reviewDir)
      const now = new Date()
      const day = join(...now.toISOString().slice(0, 10).split("-"))
      const dayDir = join(sessionsRoot, day)
      await mkdir(dayDir, { recursive: true })
      // Stands in for codex archive moving the driver and its subagent together.
      await writeFile(
        reviewer,
        `#!/bin/sh\nprintf '%s\\n' "$*" >> "${calls}"\nrm -f "${join(dayDir, "rollout-a.jsonl")}" "${join(dayDir, "rollout-a-sub.jsonl")}"\n`,
        { mode: 0o700 }
      )
      await writeFile(join(dayDir, "rollout-a.jsonl"), `${JSON.stringify({ type: "session_meta", payload: { id: "uuid-a", cwd: reviewDir } })}\n{"type":"entered_review_mode"}\n`)
      await writeFile(join(dayDir, "rollout-a-sub.jsonl"), `${JSON.stringify({ type: "session_meta", payload: { id: "uuid-a-sub", cwd: reviewDir, parent_thread_id: "uuid-a" } })}\n{"type":"message"}\n`)
      const archived = await Effect.runPromise(live(archiveReviewSessions({
        reviewer,
        reviewCwds: [reviewDir],
        since: new Date(now.getTime() - 60_000),
        sessionsRoot
      })))
      assert.deepStrictEqual(archived, ["uuid-a"])
      assert.strictEqual(await readFile(calls, "utf8"), "archive uuid-a\n")
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("reviews whole-mode committed and local changes as one frozen-base envelope", async () => {
    const directory = await mkdtemp(join(tmpdir(), "whole-review-snapshot-"))
    const reviewer = join(directory, "reviewer")
    const reviewedCommit = join(directory, "reviewed-commit")
    const nestedRepository = join(directory, "reviewer-nested-repository")
    const embeddedRepository = join(directory, "embedded")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "base.txt"), "base\n")
      await writeFile(join(directory, "case.txt"), "case\n")
      await writeFile(join(directory, "converted"), "tracked file\n")
      await writeFile(join(directory, "link-change"), "tracked file\n")
      await mkdir(join(directory, "scoped"))
      await writeFile(join(directory, "scoped", "AGENTS.md"), "scoped instructions\n")
      await mkdir(join(directory, "replacement"))
      await writeFile(join(directory, "replacement", "tracked.txt"), "tracked directory\n")
      await execFile("git", ["add", "base.txt", "case.txt", "converted", "link-change", "replacement/tracked.txt", "scoped/AGENTS.md"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await execFile("git", ["switch", "-c", "feature"], { cwd: directory })
      await writeFile(join(directory, "committed.txt"), "committed\n")
      await execFile("git", ["mv", "-f", "case.txt", "CASE.txt"], { cwd: directory })
      await execFile("git", ["add", "committed.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "feature"], { cwd: directory })
      await writeFile(join(directory, "staged.txt"), "staged\n")
      await execFile("git", ["add", "staged.txt"], { cwd: directory })
      await writeFile(join(directory, "base.txt"), "unstaged\n")
      await rm(join(directory, "converted"))
      await mkdir(join(directory, "converted"))
      await writeFile(join(directory, "converted", "AGENTS.md"), "untracked active instructions\n")
      await writeFile(join(directory, "converted", "code.txt"), "untracked code\n")
      await rm(join(directory, "link-change"))
      await symlink("missing-target", join(directory, "link-change"))
      await rm(join(directory, "replacement"), { recursive: true, force: true })
      await writeFile(join(directory, "replacement"), "untracked file replacement\n")
      await rm(join(directory, "scoped"), { recursive: true, force: true })
      await writeFile(join(directory, "scoped"), "working scoped-directory replacement\n")
      await writeFile(join(directory, "untracked.txt"), "untracked\n")
      await symlink("untracked.txt", join(directory, "untracked-link"))
      await mkdir(join(directory, "untracked-directory"))
      await writeFile(join(directory, "untracked-directory", "file.txt"), "directory content\n")
      await symlink("untracked-directory", join(directory, "untracked-directory-link"))
      await execFile("git", ["init", "--quiet", embeddedRepository], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: embeddedRepository })
      await execFile("git", ["config", "user.name", "Test"], { cwd: embeddedRepository })
      await writeFile(join(embeddedRepository, "embedded.txt"), "embedded\n")
      await execFile("git", ["add", "embedded.txt"], { cwd: embeddedRepository })
      await execFile("git", ["commit", "--quiet", "-m", "embedded"], { cwd: embeddedRepository })
      const embeddedHead = (await execFile("git", ["rev-parse", "HEAD"], { cwd: embeddedRepository })).stdout.trim()
      await writeFile(reviewer, `#!/bin/sh
set -eu
test "$1" = review
test "$2" = --commit
target=$3
printf '%s\n' "$target" > "${reviewedCommit}"
test "$(cat base.txt)" = base
test "$(git show "$target:base.txt")" = unstaged
test "$(git show "$target:replacement")" = 'untracked file replacement'
test "$(git show "$target:scoped")" = 'working scoped-directory replacement'
test "$(git show "$target:converted/code.txt")" = 'untracked code'
test "$(git show "$target:link-change")" = missing-target
! git cat-file -e "$target:converted/AGENTS.md"
git show "$target:.codex-review-target-control.patch" | grep -q 'untracked active instructions'
git cat-file -e "$target:committed.txt"
git cat-file -e "$target:staged.txt"
git cat-file -e "$target:untracked.txt"
git cat-file -e "$target:CASE.txt"
git ls-tree -r --name-only "$target" | grep -qx CASE.txt
! git ls-tree -r --name-only "$target" | grep -qx case.txt
test "$(git show "$target:untracked-link")" = untracked.txt
test "$(git show "$target:untracked-directory-link")" = untracked-directory
git ls-tree "$target" untracked-directory-link | grep -q '^120000 blob '
git ls-tree "$target" embedded | grep -q "^160000 commit ${embeddedHead}"
git init --quiet "${nestedRepository}"
git -C "${nestedRepository}" config user.email test@example.com
git -C "${nestedRepository}" config user.name Test
printf 'nested\n' > "${join(nestedRepository, "nested.txt")}"
git -C "${nestedRepository}" add nested.txt
git -C "${nestedRepository}" commit --quiet -m nested
printf 'reviewed combined snapshot\n'
`, { mode: 0o700 })
      await writeFile(join(directory, ".git", "info", "exclude"), "reviewer\n")
      const { stdout: dryRun } = await execFile(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "whole", "--base", "main", "--dry-run"], { cwd: directory })
      assert.match(dryRun, /snapshot: untouched frozen-base checkout with target diff as a synthetic commit/u)
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
      const syntheticCommit = (await readFile(reviewedCommit, "utf8")).trim()
      let retainedSyntheticCommit = true
      try {
        await execFile("git", ["cat-file", "-e", syntheticCommit], { cwd: directory })
      } catch {
        retainedSyntheticCommit = false
      }
      assert.isFalse(retainedSyntheticCommit)
      await execFile("git", ["cat-file", "-e", "HEAD:nested.txt"], { cwd: nestedRepository })
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("keeps base instructions active and exposes target instructions only as review data", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-instruction-envelope-"))
    const reviewer = join(directory, "reviewer")
    try {
      await execFile("git", ["init", "--object-format=sha256", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await mkdir(join(directory, "docs", "real"), { recursive: true })
      await writeFile(join(directory, "docs", "real", "rules.md"), "frozen base rules\n")
      await symlink("real", join(directory, "docs", "link"))
      await symlink("docs/link/rules.md", join(directory, "AGENTS.md"))
      await mkdir(join(directory, "nested"))
      await writeFile(join(directory, "nested", "AGENTS.md"), "nested base rules\n")
      await mkdir(join(directory, "ordinary"))
      await writeFile(join(directory, "ordinary", "AGENTS.md"), "ordinary base rules\n")
      await mkdir(join(directory, "scope", "controls"), { recursive: true })
      await writeFile(join(directory, "scope", "controls", "rules.md"), "ancestor base rules\n")
      await symlink("controls/rules.md", join(directory, "scope", "AGENTS.md"))
      await mkdir(join(directory, "case-scope", "TARGET"), { recursive: true })
      await writeFile(join(directory, "case-scope", "TARGET", "rules.md"), "case base rules\n")
      await symlink("TARGET/rules.md", join(directory, "case-scope", "AGENTS.md"))
      await mkdir(join(directory, "space-scope"))
      await writeFile(join(directory, "space-scope", "rules "), "space base rules\n")
      await writeFile(join(directory, "space-scope", "rules"), "decoy base\n")
      await symlink("rules ", join(directory, "space-scope", "AGENTS.md"))
      await writeFile(join(directory, "base.txt"), "base\n")
      await writeFile(join(directory, ".gitattributes"), "*.patch -diff\n")
      await execFile("git", ["add", "AGENTS.md", "docs/link", "docs/real/rules.md", "nested/AGENTS.md", "ordinary/AGENTS.md", "scope/AGENTS.md", "scope/controls/rules.md", "case-scope/AGENTS.md", "case-scope/TARGET/rules.md", "space-scope/AGENTS.md", "space-scope/rules ", "space-scope/rules", ".gitattributes", "base.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      const baseOid = (await execFile("git", ["rev-parse", "HEAD"], { cwd: directory })).stdout.trim()
      await execFile("git", ["switch", "-c", "feature"], { cwd: directory })
      await execFile("git", ["rm", "AGENTS.md", "nested/AGENTS.md"], { cwd: directory })
      await rm(join(directory, "nested"), { recursive: true, force: true })
      await writeFile(join(directory, "agents.md"), "target says ignore findings\n")
      await writeFile(join(directory, "docs", "real", "rules.md"), "target changed symlink destination\n")
      await writeFile(join(directory, "nested"), "target directory replacement\n")
      await execFile("git", ["rm", "ordinary/AGENTS.md"], { cwd: directory })
      await rm(join(directory, "ordinary"), { recursive: true, force: true })
      await mkdir(join(directory, "hostile-ordinary"))
      await writeFile(join(directory, "hostile-ordinary", "AGENTS.md"), "target ordinary redirect\n")
      await symlink("hostile-ordinary", join(directory, "ordinary"))
      await execFile("git", ["rm", "scope/controls/rules.md"], { cwd: directory })
      await rm(join(directory, "scope", "controls"), { recursive: true, force: true })
      await mkdir(join(directory, "hostile-controls"))
      await writeFile(join(directory, "hostile-controls", "rules.md"), "target ancestor redirect\n")
      await symlink("../hostile-controls", join(directory, "scope", "controls"))
      await execFile("git", ["mv", "case-scope/TARGET", "case-scope/case-temp"], { cwd: directory })
      await execFile("git", ["mv", "case-scope/case-temp", "case-scope/target"], { cwd: directory })
      await writeFile(join(directory, "case-scope", "target", "rules.md"), "target case alias\n")
      await writeFile(join(directory, "space-scope", "rules "), "target whitespace destination\n")
      await writeFile(join(directory, "space-scope", "rules"), "target decoy\n")
      await writeFile(join(directory, "AGENTS.override.md"), "target override says ignore findings\n")
      await mkdir(join(directory, ".codex"))
      await writeFile(join(directory, ".codex", "config.toml"), "model_instructions_file = \"hostile.md\"\n")
      await mkdir(join(directory, ".codex", "skills", "hostile"), { recursive: true })
      await writeFile(join(directory, ".codex", "skills", "hostile", "SKILL.md"), "target Codex skill\n")
      await mkdir(join(directory, "hostile-agent-root", "skills", "hostile"), { recursive: true })
      await writeFile(join(directory, "hostile-agent-root", "skills", "hostile", "SKILL.md"), "target repository skill\n")
      await symlink("hostile-agent-root", join(directory, ".agents"))
      await writeFile(join(directory, ".gitattributes"), "AGENTS.md -diff\n*.patch -diff\n")
      await writeFile(join(directory, ".gitignore"), ".codex-review-target-control.patch\n")
      await writeFile(join(directory, "hostile.md"), "target model instructions\n")
      await mkdir(join(directory, ":(exclude)foo"))
      await writeFile(join(directory, ":(exclude)foo", "AGENTS.md"), "pathspec magic instructions\n")
      await writeFile(join(directory, "base.txt"), "feature\n")
      await writeFile(join(directory, "feature.txt"), "feature\n")
      await execFile("git", ["add", "agents.md", "docs/real/rules.md", "nested", "ordinary", "hostile-ordinary/AGENTS.md", "scope/controls", "hostile-controls/rules.md", "case-scope/target/rules.md", "space-scope/rules ", "space-scope/rules", "AGENTS.override.md", ".codex/config.toml", ".codex/skills/hostile/SKILL.md", ".agents", "hostile-agent-root/skills/hostile/SKILL.md", ".gitattributes", ".gitignore", "hostile.md", "base.txt", "feature.txt"], { cwd: directory })
      await execFile("git", ["--literal-pathspecs", "add", "--", ":(exclude)foo/AGENTS.md"], { cwd: directory })
      await execFile("git", ["update-index", "--add", "--cacheinfo", `160000,${baseOid},submodule`], { cwd: directory })
      await execFile("git", ["commit", "-m", "feature"], { cwd: directory })
      await execFile("git", ["switch", "main"], { cwd: directory })
      await writeFile(join(directory, "base.txt"), "advanced base\n")
      await execFile("git", ["commit", "-am", "advance base"], { cwd: directory })
      await execFile("git", ["switch", "feature"], { cwd: directory })
      await execFile("git", ["config", "filter.corrupt.clean", "sed 's/untrusted/CORRUPTED/'"], { cwd: directory })
      await execFile("git", ["config", "filter.corrupt.smudge", "cat"], { cwd: directory })
      await writeFile(join(directory, ".git", "info", "attributes"), ".codex-review-target-control.patch filter=corrupt -diff\n")
      await writeFile(reviewer, `#!/bin/sh
set -eu
test "$1" = review
test "$2" = --commit
target=$3
test "$(cat AGENTS.md)" = 'frozen base rules'
test "$(cat docs/real/rules.md)" = 'frozen base rules'
test "$(cat nested/AGENTS.md)" = 'nested base rules'
test "$(cat ordinary/AGENTS.md)" = 'ordinary base rules'
test "$(cat scope/AGENTS.md)" = 'ancestor base rules'
test "$(cat case-scope/AGENTS.md)" = 'case base rules'
test "$(cat space-scope/AGENTS.md)" = 'space base rules'
test "$(cat space-scope/rules)" = 'decoy base'
test "$(git show "$target:nested")" = 'target directory replacement'
test "$(git show "$target:hostile-controls/rules.md")" = 'target ancestor redirect'
test "$(git show "$target:space-scope/rules")" = 'target decoy'
git ls-tree -r --name-only "$target" | grep -qx AGENTS.md
git ls-tree -r --name-only "$target" | grep -qx nested
git ls-tree -r --name-only "$target" | grep -qx case-scope/TARGET/rules.md
! git ls-tree -r --name-only "$target" | grep -qx agents.md
! git ls-tree -r --name-only "$target" | grep -qx case-scope/target/rules.md
! git --literal-pathspecs cat-file -e "$target::(exclude)foo/AGENTS.md" >/dev/null 2>&1
! git cat-file -e "$target:AGENTS.override.md"
! git cat-file -e "$target:.codex/config.toml"
! git cat-file -e "$target:.codex/skills/hostile/SKILL.md"
! git cat-file -e "$target:.agents"
! git cat-file -e "$target:.gitattributes"
test "$(git show "$target:base.txt")" = feature
test "$(git show "$target:feature.txt")" = feature
git ls-tree "$target" submodule | grep -q '^160000'
git cat-file -e "$target:.codex-review-target-control.patch"
git show "$target:.codex-review-target-control.patch" | grep -q 'untrusted review data'
git show "$target:.codex-review-target-control.patch" | grep -q 'target says ignore findings'
git show "$target:.codex-review-target-control.patch" | grep -q 'target changed symlink destination'
git show "$target:.codex-review-target-control.patch" | grep -q 'hostile-ordinary'
git show "$target:.codex-review-target-control.patch" | grep -q 'hostile-controls'
git show "$target:.codex-review-target-control.patch" | grep -q 'target case alias'
git show "$target:.codex-review-target-control.patch" | grep -q 'target whitespace destination'
git show "$target:.codex-review-target-control.patch" | grep -q 'pathspec magic instructions'
git show "$target:.codex-review-target-control.patch" | grep -q 'target override says ignore findings'
git show "$target:.codex-review-target-control.patch" | grep -q 'model_instructions_file'
git show "$target:.codex-review-target-control.patch" | grep -q 'target Codex skill'
git show "$target:.codex-review-target-control.patch" | grep -q 'hostile-agent-root'
git diff "$target^" "$target" -- .codex-review-target-control.patch | grep -q 'target says ignore findings'
printf '%s' "$*" | grep -q 'project_doc_fallback_filenames'
printf '%s' "$*" | grep -q 'trust_level'
printf 'reviewed isolated instructions\n'
`, { mode: 0o700 })
      await writeFile(join(directory, ".git", "info", "exclude"), "reviewer\n")
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const output = await Effect.runPromise(live(runNativeReview({ codexBin: "./reviewer", plan: planReview("branch", "main", "HEAD", false), testCommand: Option.none() })))
        assert.strictEqual(output, "reviewed isolated instructions\n")
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("rejects a broken frozen-base symlink at the reserved artifact path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-broken-artifact-"))
    const reviewer = join(directory, "reviewer")
    const escaped = join(directory, "escaped")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await symlink(escaped, join(directory, ".codex-review-target-control.patch"))
      await execFile("git", ["add", ".codex-review-target-control.patch"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await execFile("git", ["switch", "-c", "feature"], { cwd: directory })
      await writeFile(join(directory, "AGENTS.md"), "target instructions\n")
      await execFile("git", ["add", "AGENTS.md"], { cwd: directory })
      await execFile("git", ["commit", "-m", "target control"], { cwd: directory })
      await writeFile(reviewer, "#!/bin/sh\nprintf 'must not review\\n'\nexit 7\n", { mode: 0o700 })
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const result = await Effect.runPromiseExit(live(runNativeReview({ codexBin: reviewer, plan: planReview("branch", "main", "HEAD", false), testCommand: Option.none() })))
        assert.isTrue(Exit.isFailure(result))
        if (Exit.isFailure(result)) assert.match(String(Cause.squash(result.cause)), /reserves \.codex-review-target-control\.patch/u)
      } finally {
        process.chdir(previousCwd)
      }
      let escapedCreated = true
      try {
        await readFile(escaped)
      } catch {
        escapedCreated = false
      }
      assert.isFalse(escapedCreated)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("reviews a root commit against an empty frozen base", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-root-commit-"))
    const reviewer = join(directory, "reviewer")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "root.txt"), "root\n")
      await execFile("git", ["add", "root.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "root", "-m", "parent message text is not metadata"], { cwd: directory })
      await writeFile(reviewer, "#!/bin/sh\nset -eu\ntest \"$1\" = review\ntest \"$2\" = --commit\ntest ! -e root.txt\ntest \"$(git show \"$3:root.txt\")\" = root\nprintf 'reviewed root commit\\n'\n", { mode: 0o700 })
      await writeFile(join(directory, ".git", "info", "exclude"), "reviewer\n")
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const output = await Effect.runPromise(live(runNativeReview({ codexBin: "./reviewer", plan: planReview("commit", "main", "HEAD", false), testCommand: Option.none() })))
        assert.strictEqual(output, "reviewed root commit\n")
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("rejects an absolute frozen-control symlink", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-absolute-control-"))
    const reviewer = join(directory, "reviewer")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "rules.md"), "base rules\n")
      await symlink(join(directory, "rules.md"), join(directory, "AGENTS.md"))
      await execFile("git", ["add", "AGENTS.md", "rules.md"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await writeFile(reviewer, "#!/bin/sh\nprintf 'must not review\\n'\nexit 7\n", { mode: 0o700 })
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const result = await Effect.runPromiseExit(live(runNativeReview({ codexBin: reviewer, plan: planReview("branch", "main", "HEAD", false), testCommand: Option.none() })))
        assert.isTrue(Exit.isFailure(result))
        if (Exit.isFailure(result)) assert.match(String(Cause.squash(result.cause)), /must be repository-relative/u)
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("rejects a frozen-control symlink whose target is absent from the base tree", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-missing-control-"))
    const reviewer = join(directory, "reviewer")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await symlink("missing-rules.md", join(directory, "AGENTS.md"))
      await execFile("git", ["add", "AGENTS.md"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await writeFile(reviewer, "#!/bin/sh\nprintf 'must not review\\n'\nexit 7\n", { mode: 0o700 })
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const result = await Effect.runPromiseExit(live(runNativeReview({ codexBin: reviewer, plan: planReview("branch", "main", "HEAD", false), testCommand: Option.none() })))
        assert.isTrue(Exit.isFailure(result))
        if (Exit.isFailure(result)) assert.match(String(Cause.squash(result.cause)), /target is absent from the base tree/u)
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("rejects a target file that blocks a frozen-control symlink destination", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-blocked-control-"))
    const reviewer = join(directory, "reviewer")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await mkdir(join(directory, "docs"))
      await writeFile(join(directory, "docs", "rules.md"), "base rules\n")
      await symlink("docs/rules.md", join(directory, "AGENTS.md"))
      await execFile("git", ["add", "AGENTS.md", "docs/rules.md"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await execFile("git", ["switch", "-c", "feature"], { cwd: directory })
      await execFile("git", ["rm", "docs/rules.md"], { cwd: directory })
      await rm(join(directory, "docs"), { recursive: true, force: true })
      await writeFile(join(directory, "docs"), "target replacement\n")
      await execFile("git", ["add", "docs"], { cwd: directory })
      await execFile("git", ["commit", "-m", "replace destination ancestor"], { cwd: directory })
      await writeFile(reviewer, "#!/bin/sh\nprintf 'must not review\\n'\nexit 7\n", { mode: 0o700 })
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const result = await Effect.runPromiseExit(live(runNativeReview({ codexBin: reviewer, plan: planReview("branch", "main", "HEAD", false), testCommand: Option.none() })))
        assert.isTrue(Exit.isFailure(result))
        if (Exit.isFailure(result)) assert.match(String(Cause.squash(result.cause)), /blocks a frozen review control symlink destination/u)
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("rejects an untracked file that blocks a frozen-control symlink destination", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-dirty-blocked-control-"))
    const reviewer = join(directory, "reviewer")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await mkdir(join(directory, "docs"))
      await writeFile(join(directory, "docs", "rules.md"), "base rules\n")
      await symlink("docs/rules.md", join(directory, "AGENTS.md"))
      await execFile("git", ["add", "AGENTS.md", "docs/rules.md"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await rm(join(directory, "docs"), { recursive: true, force: true })
      await writeFile(join(directory, "docs"), "working replacement\n")
      await writeFile(reviewer, "#!/bin/sh\nprintf 'must not review\\n'\nexit 7\n", { mode: 0o700 })
      await writeFile(join(directory, ".git", "info", "exclude"), "reviewer\n")
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const result = await Effect.runPromiseExit(live(runNativeReview({ codexBin: reviewer, plan: planReview("whole", "main", "HEAD", true), testCommand: Option.none() })))
        assert.isTrue(Exit.isFailure(result))
        if (Exit.isFailure(result)) assert.match(String(Cause.squash(result.cause)), /blocks a frozen review control symlink destination/u)
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("rejects a target-controlled symlink that escapes the review repository", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-escaping-target-link-"))
    const reviewer = join(directory, "reviewer")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "base.txt"), "base\n")
      await execFile("git", ["add", "base.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await execFile("git", ["switch", "-c", "feature"], { cwd: directory })
      await symlink("/etc/passwd", join(directory, "leak"))
      await execFile("git", ["add", "leak"], { cwd: directory })
      await execFile("git", ["commit", "-m", "add escaping symlink"], { cwd: directory })
      await writeFile(reviewer, "#!/bin/sh\nprintf 'must not review\\n'\nexit 7\n", { mode: 0o700 })
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const result = await Effect.runPromiseExit(live(runNativeReview({ codexBin: reviewer, plan: planReview("branch", "main", "HEAD", false), testCommand: Option.none() })))
        assert.isTrue(Exit.isFailure(result))
        if (Exit.isFailure(result)) assert.match(String(Cause.squash(result.cause)), /target symlink escapes the review repository/u)
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("materializes out-of-cone files from a sparse source checkout", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-sparse-checkout-"))
    const reviewer = join(directory, "reviewer")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await mkdir(join(directory, "keep"))
      await mkdir(join(directory, "omit"))
      await writeFile(join(directory, "keep", "a.txt"), "base\n")
      await writeFile(join(directory, "omit", "b.txt"), "out of cone\n")
      await execFile("git", ["add", "keep/a.txt", "omit/b.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await execFile("git", ["sparse-checkout", "init", "--cone"], { cwd: directory })
      await execFile("git", ["sparse-checkout", "set", "keep"], { cwd: directory })
      await writeFile(join(directory, "keep", "a.txt"), "working\n")
      await writeFile(reviewer, "#!/bin/sh\nset -eu\ntest \"$1\" = review\ntest \"$2\" = --commit\ntest \"$(cat keep/a.txt)\" = base\ntest \"$(cat omit/b.txt)\" = 'out of cone'\ntest \"$(git show \"$3:keep/a.txt\")\" = working\ntest \"$(git show \"$3:omit/b.txt\")\" = 'out of cone'\nprintf 'reviewed sparse source\\n'\n", { mode: 0o700 })
      await writeFile(join(directory, ".git", "info", "exclude"), "reviewer\n")
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const output = await Effect.runPromise(live(runNativeReview({ codexBin: reviewer, plan: planReview("whole", "main", "HEAD", true), testCommand: Option.none() })))
        assert.strictEqual(output, "reviewed sparse source\n")
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("rejects a tracked source redirected outside the repository", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-external-source-"))
    const repo = join(directory, "repo")
    const external = join(directory, "external")
    const reviewer = join(directory, "reviewer")
    try {
      await mkdir(repo)
      await mkdir(external)
      await execFile("git", ["init", "-b", "main"], { cwd: repo })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: repo })
      await execFile("git", ["config", "user.name", "Test"], { cwd: repo })
      await mkdir(join(repo, "dir"))
      await writeFile(join(repo, "dir", "secret.txt"), "repository value\n")
      await execFile("git", ["add", "dir/secret.txt"], { cwd: repo })
      await execFile("git", ["commit", "-m", "base"], { cwd: repo })
      await writeFile(join(external, "secret.txt"), "host secret\n")
      await rm(join(repo, "dir"), { recursive: true, force: true })
      await symlink(external, join(repo, "dir"))
      await writeFile(reviewer, "#!/bin/sh\nprintf 'must not review\\n'\nexit 7\n", { mode: 0o700 })
      const previousCwd = process.cwd()
      process.chdir(repo)
      try {
        const result = await Effect.runPromiseExit(live(runNativeReview({ codexBin: reviewer, plan: planReview("whole", "main", "HEAD", true), testCommand: Option.none() })))
        assert.isTrue(Exit.isFailure(result))
        if (Exit.isFailure(result)) assert.match(String(Cause.squash(result.cause)), /resolves outside the repository/u)
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("rejects a missing shallow parent instead of reviewing an empty base", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-shallow-parent-"))
    const source = join(directory, "source")
    const clone = join(directory, "clone")
    const reviewer = join(directory, "reviewer")
    try {
      await mkdir(source)
      await execFile("git", ["init", "-b", "main"], { cwd: source })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: source })
      await execFile("git", ["config", "user.name", "Test"], { cwd: source })
      await writeFile(join(source, "file.txt"), "one\n")
      await execFile("git", ["add", "file.txt"], { cwd: source })
      await execFile("git", ["commit", "-m", "one"], { cwd: source })
      await writeFile(join(source, "file.txt"), "two\n")
      await execFile("git", ["commit", "-am", "two"], { cwd: source })
      await execFile("git", ["clone", "--depth", "1", `file://${source}`, clone], { cwd: directory })
      await writeFile(reviewer, "#!/bin/sh\nprintf 'must not review\\n'\nexit 7\n", { mode: 0o700 })
      const previousCwd = process.cwd()
      process.chdir(clone)
      try {
        const result = await Effect.runPromiseExit(live(runNativeReview({ codexBin: reviewer, plan: planReview("commit", "main", "HEAD", false), testCommand: Option.none() })))
        assert.isTrue(Exit.isFailure(result))
        if (Exit.isFailure(result)) assert.match(String(Cause.squash(result.cause)), /fetch or deepen repository history/u)
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("materializes frozen-base objects through a partial clone before isolation", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-partial-clone-"))
    const source = join(directory, "source")
    const clone = join(directory, "clone")
    const reviewer = join(directory, "reviewer")
    try {
      await mkdir(source)
      await execFile("git", ["init", "-b", "main"], { cwd: source })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: source })
      await execFile("git", ["config", "user.name", "Test"], { cwd: source })
      await execFile("git", ["config", "uploadpack.allowFilter", "true"], { cwd: source })
      await writeFile(join(source, "base-only.txt"), "base-only content\n")
      await execFile("git", ["add", "base-only.txt"], { cwd: source })
      await execFile("git", ["commit", "-m", "base"], { cwd: source })
      await execFile("git", ["switch", "-c", "feature"], { cwd: source })
      await execFile("git", ["rm", "base-only.txt"], { cwd: source })
      await writeFile(join(source, "feature.txt"), "feature\n")
      await execFile("git", ["add", "feature.txt"], { cwd: source })
      await execFile("git", ["commit", "-m", "feature"], { cwd: source })
      await execFile("git", ["clone", "--filter=blob:none", "--no-local", "--no-single-branch", "--branch", "feature", `file://${source}`, clone], { cwd: directory })
      const { stdout: missingBefore } = await execFile("git", ["rev-list", "--objects", "--all", "--missing=print"], { cwd: clone })
      assert.match(missingBefore, /^\?/mu)
      await writeFile(reviewer, "#!/bin/sh\nset -eu\ntest \"$1\" = review\ntest \"$2\" = --commit\ntest \"$(cat base-only.txt)\" = 'base-only content'\ntest \"$(git show \"$3:feature.txt\")\" = feature\nprintf 'reviewed partial clone\\n'\n", { mode: 0o700 })
      const previousCwd = process.cwd()
      process.chdir(clone)
      try {
        const output = await Effect.runPromise(live(runNativeReview({ codexBin: reviewer, plan: planReview("branch", "origin/main", "HEAD", false), testCommand: Option.none() })))
        assert.strictEqual(output, "reviewed partial clone\n")
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("reviews staged, unstaged, and untracked files before the first commit", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-unborn-worktree-"))
    const reviewer = join(directory, "reviewer")
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "tracked.txt"), "staged\n")
      await execFile("git", ["add", "tracked.txt"], { cwd: directory })
      await writeFile(join(directory, "tracked.txt"), "unstaged\n")
      await writeFile(join(directory, "untracked.txt"), "untracked\n")
      await writeFile(reviewer, "#!/bin/sh\nset -eu\ncase \"$1\" in\n  login) exit 0 ;;\n  doctor) printf '%s\\n' '{\"checks\":{\"auth.credentials\":{\"status\":\"ok\"}}}' ;;\n  exec) printf 'ok\\n' ;;\n  review) test \"$2\" = --commit; test ! -e tracked.txt; test \"$(git show \"$3:tracked.txt\")\" = unstaged; test \"$(git show \"$3:untracked.txt\")\" = untracked; printf 'reviewed unborn worktree\\n' ;;\n  *) exit 7 ;;\nesac\n", { mode: 0o700 })
      await writeFile(join(directory, ".git", "info", "exclude"), "reviewer\n")
      const { stdout } = await execFile(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "uncommitted", "--codex-bin", reviewer], { cwd: directory })
      assert.match(stdout, /reviewed unborn worktree/u)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("archives a failed native review session", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-failed-session-"))
    const reviewer = join(directory, "reviewer")
    const sessionsRoot = join(directory, "sessions")
    const calls = join(directory, "calls")
    const day = join(...new Date().toISOString().slice(0, 10).split("-"))
    const dayDirectory = join(sessionsRoot, day)
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "file.txt"), "base\n")
      await execFile("git", ["add", "file.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await mkdir(dayDirectory, { recursive: true })
      await writeFile(reviewer, `#!/bin/sh
set -eu
case "$1" in
  review)
    printf '{"type":"session_meta","payload":{"id":"uuid-failed","cwd":"%s"}}\\n{"type":"entered_review_mode"}\\n' "$(pwd)" > "${join(dayDirectory, "rollout-failed.jsonl")}"
    exit 9
    ;;
  archive)
    printf '%s\\n' "$*" >> "${calls}"
    ;;
  *) exit 7 ;;
esac
`, { mode: 0o700 })
      await writeFile(join(directory, ".git", "info", "exclude"), "reviewer\n")
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const result = await Effect.runPromiseExit(live(runNativeReview({
          codexBin: reviewer,
          plan: planReview("branch", "main", "HEAD", false),
          sessionsRoot,
          testCommand: Option.none()
        })))
        assert.isTrue(Exit.isFailure(result))
      } finally {
        process.chdir(previousCwd)
      }
      assert.strictEqual(await readFile(calls, "utf8"), "archive uuid-failed\n")
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
