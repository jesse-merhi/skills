import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as FileSystem from "effect/FileSystem"
import * as Option from "effect/Option"
// Executable-level compatibility tests intentionally exercise Node process boundaries.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { execFile as execFileCallback } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdir, mkdtemp, readFile, realpath, rm, utimes, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { promisify } from "node:util"

import { archiveReviewSessions, planReview, preflightCodexAuthentication, reviewBaseCandidates, runNativeReview, selectReviewPlan, untilReviewStable } from "./NativeReview.ts"

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

  it("uses the committed branch target for automatic reviews", () => {
    const plan = planReview("auto", "origin/main", "HEAD")
    assert.strictEqual(plan.label, "branch against origin/main")
    assert.deepStrictEqual(plan.targets.map((target) => target.args), [["--base", "origin/main"]])
  })

  it("uses the native commit protocol", () => {
    assert.deepStrictEqual(planReview("commit", "origin/main", "abc123").targets[0]?.args, ["--commit", "abc123"])
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

  it.each([
    { profile: false, customHome: true, reviewFails: false },
    { profile: true, customHome: true, reviewFails: false },
    { profile: true, customHome: false, reviewFails: false },
    { profile: true, customHome: true, reviewFails: true }
  ])("runs native review with installed profile=$profile, custom home=$customHome, failure=$reviewFails", async ({ profile, customHome, reviewFails }) => {
    const directory = await mkdtemp(join(tmpdir(), "codex-review-output-"))
    const repository = join(directory, "repo")
    const bin = join(directory, "bin")
    const output = join(directory, "output", "review.txt")
    const home = join(directory, "home")
    const codexHome = customHome ? join(directory, "codex-home") : join(home, ".codex")
    const calls = join(directory, "calls")
    try {
      await mkdir(bin)
      await mkdir(repository)
      await mkdir(codexHome, { recursive: true })
      if (profile) await writeFile(join(codexHome, "findings-reviewer.config.toml"), await readFile(join(root, "codex/findings-reviewer.config.toml")))
      await writeFile(join(bin, "codex"), `#!/bin/sh
printf '%s\\0' "$@" >> "${calls}"
printf '\\n' >> "${calls}"
if [ "$1" = "--profile" ]; then shift 2; fi
case "$1" in
  login) exit 0 ;;
  doctor) printf '%s\\n' '{"checks":{"auth.credentials":{"status":"ok"}}}' ;;
  exec) printf 'ok\\n' ;;
  review) printf 'reviewed master\\n'; exit ${reviewFails ? 8 : 0} ;;
  *) exit 7 ;;
esac
`, { mode: 0o700 })
      await writeFile(join(bin, "gh"), "#!/bin/sh\nexit 1\n", { mode: 0o700 })
      await execFile("git", ["init", "-b", "master"], { cwd: repository })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: repository })
      await execFile("git", ["config", "user.name", "Test"], { cwd: repository })
      await writeFile(join(repository, "file.txt"), "base\n")
      await execFile("git", ["add", "file.txt"], { cwd: repository })
      await execFile("git", ["commit", "-m", "base"], { cwd: repository })
      let failed = false
      try {
        // @effect-diagnostics-next-line processEnv:off
        const { stdout } = await execFile(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "branch"], { cwd: repository, env: { ...process.env, HOME: home, CODEX_HOME: customHome ? codexHome : "", PATH: `${bin}:${process.env.PATH ?? ""}`, CODEX_BIN: join(bin, "codex"), GH_BIN: join(bin, "gh"), CODEX_REVIEW_OUTPUT: output } })
        assert.include(stdout, `review: ${join(bin, "codex")} ${profile ? "--profile findings-reviewer " : ""}review -c model="gpt-6-astra" -c review_model="gpt-6-astra" -c model_reasoning_effort="medium" --base master`)
      } catch {
        failed = true
      }
      assert.strictEqual(failed, reviewFails)
      const recorded = (await readFile(calls, "utf8")).trim().split("\n").map((call) => call.split("\0").slice(0, -1))
      assert.deepStrictEqual(recorded[0], ["login", "status"])
      assert.deepStrictEqual(recorded[1], ["doctor", "--json"])
      assert.deepStrictEqual(recorded[2]?.slice(0, 2), ["exec", "--ephemeral"])
      assert.deepStrictEqual(recorded.slice(3), [[
        ...(profile ? ["--profile", "findings-reviewer"] : []),
        "review", "-c", 'model="gpt-6-astra"', "-c", 'review_model="gpt-6-astra"',
        "-c", 'model_reasoning_effort="medium"', "--base", "master"
      ]])
      if (reviewFails) {
        assert.isFalse(await Effect.runPromise(live(FileSystem.FileSystem.pipe(Effect.flatMap((fs) => fs.exists(output))))))
      } else {
        assert.strictEqual(await readFile(output, "utf8"), "reviewed master\n")
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 15_000)

  it("requires an explicit base when the repository has no discoverable default", async () => {
    const directory = await mkdtemp(join(tmpdir(), "codex-review-no-base-"))
    const repository = join(directory, "repo")
    const bin = join(directory, "bin")
    try {
      await mkdir(bin)
      await mkdir(repository)
      await writeFile(join(bin, "codex"), "#!/bin/sh\nprintf 'review must not run\\n'\n", { mode: 0o700 })
      await writeFile(join(bin, "gh"), "#!/bin/sh\nexit 1\n", { mode: 0o700 })
      await execFile("git", ["init", "-b", "feature"], { cwd: repository })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: repository })
      await execFile("git", ["config", "user.name", "Test"], { cwd: repository })
      await writeFile(join(repository, "file.txt"), "feature\n")
      await execFile("git", ["add", "file.txt"], { cwd: repository })
      await execFile("git", ["commit", "-m", "feature"], { cwd: repository })
      const result = await new Promise<{ readonly failed: boolean; readonly output: string }>((resolve) => {
        execFileCallback(join(root, "skills/code-review/scripts/codex-review"), ["--mode", "branch"], { cwd: repository, encoding: "utf8", env: { ...process.env, CODEX_BIN: join(bin, "codex"), GH_BIN: join(bin, "gh") } }, (error, stdout, stderr) => resolve({ failed: error !== null, output: `${stdout}${stderr}` }))
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
      // Current review metadata includes instructions larger than the old 8 KB
      // prefix limit, and no entered_review_mode event is emitted.
      const driver = (id: string, cwd: string, source = "exec") =>
        `${JSON.stringify({ type: "session_meta", payload: { id, cwd, source, base_instructions: "instructions ".repeat(2000) } })}\n`
      const child = (id: string, cwd: string, parent: string, source = "review") =>
        `${JSON.stringify({ type: "session_meta", payload: { id, cwd, source: { subagent: source }, parent_thread_id: parent, base_instructions: "instructions ".repeat(2000) } })}\n{"type":"message"}\n`
      await writeFile(join(sessionsRoot, day, "rollout-a.jsonl"), driver("uuid-a", reviewDir))
      await writeFile(join(sessionsRoot, day, "rollout-a-sub.jsonl"), child("uuid-a-sub", reviewDir, "uuid-a"))
      // Other directories, ordinary exec/spawn sessions, interactive reviews,
      // and orphan children must not be swept up by this native review.
      await writeFile(join(sessionsRoot, day, "rollout-b.jsonl"), driver("uuid-b", otherDir))
      await writeFile(join(sessionsRoot, day, "rollout-b-sub.jsonl"), child("uuid-b-sub", otherDir, "uuid-b"))
      await writeFile(join(sessionsRoot, day, "rollout-c.jsonl"), driver("uuid-c", reviewDir))
      await writeFile(join(sessionsRoot, day, "rollout-c-sub.jsonl"), child("uuid-c-sub", reviewDir, "uuid-c", "thread_spawn"))
      await writeFile(join(sessionsRoot, day, "rollout-e.jsonl"), driver("uuid-e", reviewDir, "cli"))
      await writeFile(join(sessionsRoot, day, "rollout-e-sub.jsonl"), child("uuid-e-sub", reviewDir, "uuid-e"))
      await writeFile(join(sessionsRoot, day, "rollout-orphan.jsonl"), child("uuid-orphan", reviewDir, "missing-parent"))
      // A review from an earlier run, outside this run's window.
      await writeFile(join(sessionsRoot, day, "rollout-d.jsonl"), driver("uuid-d", reviewDir))
      await writeFile(join(sessionsRoot, day, "rollout-d-sub.jsonl"), child("uuid-d-sub", reviewDir, "uuid-d"))
      const old = new Date(now.getTime() - 3600_000)
      await utimes(join(sessionsRoot, day, "rollout-d.jsonl"), old, old)
      await utimes(join(sessionsRoot, day, "rollout-d-sub.jsonl"), old, old)
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
      await writeFile(join(dayDir, "rollout-a.jsonl"), `${JSON.stringify({ type: "session_meta", payload: { id: "uuid-a", cwd: reviewDir, source: "exec" } })}\n`)
      await writeFile(join(dayDir, "rollout-a-sub.jsonl"), `${JSON.stringify({ type: "session_meta", payload: { id: "uuid-a-sub", cwd: reviewDir, source: { subagent: "review" }, parent_thread_id: "uuid-a" } })}\n{"type":"message"}\n`)
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

  it("rejects staged, unstaged, and untracked review input", async () => {
    const directory = await mkdtemp(join(tmpdir(), "clean-review-tree-"))
    try {
      await execFile("git", ["init", "-b", "main"], { cwd: directory })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: directory })
      await execFile("git", ["config", "user.name", "Test"], { cwd: directory })
      await writeFile(join(directory, "base.txt"), "base\n")
      await execFile("git", ["add", "base.txt"], { cwd: directory })
      await execFile("git", ["commit", "-m", "base"], { cwd: directory })
      await execFile("git", ["switch", "-c", "feature"], { cwd: directory })
      await writeFile(join(directory, "untracked.txt"), "untracked\n")
      const previousCwd = process.cwd()
      process.chdir(directory)
      try {
        const dirtyMessage = async () => {
          const result = await Effect.runPromiseExit(live(selectReviewPlan("branch", Option.some("main"), "HEAD", false)))
          assert.isTrue(Exit.isFailure(result))
          return Exit.isFailure(result) ? String(Cause.squash(result.cause)) : ""
        }
        assert.match(await dirtyMessage(), /clean committed worktree/u)
        await execFile("git", ["add", "untracked.txt"], { cwd: directory })
        assert.match(await dirtyMessage(), /clean committed worktree/u)
        await execFile("git", ["commit", "-m", "feature"], { cwd: directory })
        await writeFile(join(directory, "untracked.txt"), "unstaged\n")
        assert.match(await dirtyMessage(), /clean committed worktree/u)
        await execFile("git", ["add", "untracked.txt"], { cwd: directory })
        await execFile("git", ["commit", "-m", "update"], { cwd: directory })
        await execFile("git", ["update-index", "--assume-unchanged", "untracked.txt"], { cwd: directory })
        await writeFile(join(directory, "untracked.txt"), "index-hidden\n")
        assert.match(await dirtyMessage(), /clean committed worktree/u)
        await execFile("git", ["update-index", "--no-assume-unchanged", "untracked.txt"], { cwd: directory })
        await writeFile(join(directory, "untracked.txt"), "unstaged\n")
        assert.strictEqual((await Effect.runPromise(live(selectReviewPlan("branch", Option.some("main"), "HEAD", false)))).label, "branch against main")
      } finally {
        process.chdir(previousCwd)
      }
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
        await Effect.runPromise(live(runNativeReview({ codexBin: reviewer, plan: planReview("branch", "main", "HEAD"), testCommand: Option.some('test "$(pwd)" = "$(git rev-parse --show-toplevel)"') })))
      } finally {
        process.chdir(previousCwd)
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
