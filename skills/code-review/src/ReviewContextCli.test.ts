// Executable-level compatibility tests intentionally exercise Node process boundaries.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { execFile as execFileCallback } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"

const execFile = promisify(execFileCallback)
const root = join(dirname(fileURLToPath(import.meta.url)), "../../..")
const cli = join(root, "skills/code-review/scripts/review-findings")

const git = (repo: string, args: ReadonlyArray<string>) => execFile("git", ["-C", repo, ...args])

const createRepository = async () => {
  const directory = await mkdtemp(join(tmpdir(), "review-context-"))
  const repo = join(directory, "repo")
  await mkdir(repo)
  await git(repo, ["init", "-b", "main"])
  const repoRoot = (await git(repo, ["rev-parse", "--show-toplevel"])).stdout.trim()
  await git(repo, ["config", "user.email", "fixture@example.invalid"])
  await git(repo, ["config", "user.name", "Fixture"])
  await writeFile(join(repo, "README.md"), "base\n")
  await git(repo, ["add", "README.md"])
  await git(repo, ["commit", "-m", "base"])
  await git(repo, ["switch", "-c", "stack-base"])
  await writeFile(join(repo, "stack.ts"), "stack\n")
  await git(repo, ["add", "stack.ts"])
  await git(repo, ["commit", "-m", "stack base"])
  await git(repo, ["switch", "-c", "feature"])
  await mkdir(join(repo, "nested"))
  await writeFile(join(repo, "nested", "fixture.txt"), "feature\n")
  await git(repo, ["add", "nested/fixture.txt"])
  await git(repo, ["commit", "-m", "feature"])
  return { directory, repo: repoRoot, nested: join(repoRoot, "nested"), db: join(directory, "state", "reviews.sqlite") }
}

const environment = (overrides: Readonly<Record<string, string>>) => ({
  ...process.env,
  ...overrides
})

const runReview = (cwd: string, args: ReadonlyArray<string>, overrides: Readonly<Record<string, string>> = {}) =>
  execFile(cli, args, { cwd, env: environment(overrides) })

const jsonLines = (stdout: string) => stdout.split("\n")
  .filter((line) => line.startsWith("{"))
  .map((line): unknown => JSON.parse(line))

const reviewOutput = (stdout: string) => {
  const lines = jsonLines(stdout)
  const value = lines.find((line): line is Record<string, unknown> => typeof line === "object" && line !== null && "identity" in line)
  if (value === undefined) throw new Error(`Missing review context in output:\n${stdout}`)
  return value
}

const scopeIdentity = (fixture: Awaited<ReturnType<typeof createRepository>>, target: string, base = "main") => [
  "--db", fixture.db, "--repo", "acme/widget", "--repo-path", fixture.repo,
  "--branch", "feature", "--target", target, "--base", base
] as const

const completeScope = async (fixture: Awaited<ReturnType<typeof createRepository>>, target: string, base = "main") => {
  const identity = scopeIdentity(fixture, target, base)
  await runReview(fixture.repo, ["scope-start", ...identity, "--scope-summary", `Review ${target}`])
  await runReview(fixture.repo, ["scope-check", ...identity, "--reason", `Checked ${target}`])
  await runReview(fixture.repo, ["scope-complete", ...identity, "--reason", `Completed ${target}`])
}

const missing = async (path: string) => {
  try {
    await stat(path)
    return false
  } catch {
    return true
  }
}

describe("review CLI Git context", () => {
  it("starts native review from a nested checkout using the matching stacked PR", async () => {
    const fixture = await createRepository()
    const bin = join(fixture.directory, "bin")
    const gh = join(bin, "gh")
    const codex = join(bin, "codex")
    const ghCalls = join(fixture.directory, "gh-calls")
    try {
      await mkdir(bin)
      await git(fixture.repo, ["remote", "add", "origin", "git@github.com:wrong/origin.git"])
      await git(fixture.repo, ["remote", "add", "upstream", "ssh://git@ghe.example.com/acme/widget.git"])
      await git(fixture.repo, ["config", "branch.feature.remote", "upstream"])
      await git(fixture.repo, ["update-ref", "refs/remotes/upstream/stack-base", "stack-base"])
      await git(fixture.repo, ["config", "branch.stack-base.remote", "upstream"])
      await git(fixture.repo, ["config", "branch.stack-base.merge", "refs/heads/stack-base"])
      await writeFile(gh, `#!/bin/sh\nprintf '%s\\n' "$*" >> '${ghCalls}'\nprintf '{"url":"https://ghe.example.com/acme/widget/pull/7","baseRefName":"stack-base","baseRefOid":"%s","headRefName":"feature","headRefOid":"%s","headRepository":{"nameWithOwner":"acme/widget"},"state":"OPEN"}\\n' "$(git rev-parse stack-base)" "$(git rev-parse HEAD)"\n`, { mode: 0o700 })
      await writeFile(codex, "#!/bin/sh\nprintf 'native review complete\\n'\n", { mode: 0o700 })

      const result = await runReview(fixture.nested, [
        "review", "native", "--db", fixture.db, "--codex-bin", codex,
        "--scope-summary", "Review the stacked feature", "--required-phase", "native", "--native-clean-target", "1"
      ], { GH_BIN: gh })
      const output = reviewOutput(result.stdout)
      expect(output.identity).toMatchObject({
        db: fixture.db,
        repo: "ghe.example.com/acme/widget",
        repoPath: fixture.repo,
        branch: "feature",
        target: "https://ghe.example.com/acme/widget/pull/7",
        base: "upstream/stack-base"
      })
      expect(output.recording).toMatchObject({ command: expect.stringContaining(`--db ${fixture.db}`) })
      expect(output.report).toBe(join(fixture.directory, "state", "review-output", `${String(output.reviewId)}.txt`))
      expect(await readFile(String(output.report), "utf8")).toBe("native review complete\n")
      expect(await readFile(ghCalls, "utf8")).toContain("pr view --json url,baseRefName,baseRefOid,headRefName,headRefOid,headRepository,state")

      const resumed = await runReview(fixture.nested, [
        "review", "start", "--db", fixture.db, "--base", "stack-base",
        "--phase", "native", "--evidence", "Resume the native review"
      ], { GH_BIN: gh })
      expect(reviewOutput(resumed.stdout).identity).toMatchObject({
        runId: output.runId,
        target: "https://ghe.example.com/acme/widget/pull/7",
        base: "upstream/stack-base"
      })
      expect((await readFile(ghCalls, "utf8")).trim().split("\n")).toHaveLength(1)
    } finally {
      await rm(fixture.directory, { recursive: true, force: true })
    }
  }, 45_000)

  it("reuses one completed identity offline even when it was completed more than once", async () => {
    const fixture = await createRepository()
    const gh = join(fixture.directory, "unavailable-gh")
    const marker = join(fixture.directory, "gh-ran")
    try {
      await writeFile(gh, `#!/bin/sh\nprintf called > '${marker}'\nexit 7\n`, { mode: 0o700 })
      await completeScope(fixture, "saved-review")
      await completeScope(fixture, "saved-review")

      const result = await runReview(fixture.nested, [
        "review", "start", "--db", fixture.db, "--phase", "cold", "--evidence", "Independent reviewer"
      ], { GH_BIN: gh })
      expect(reviewOutput(result.stdout).identity).toMatchObject({ target: "saved-review", base: "main" })
      expect(await missing(marker)).toBe(true)
    } finally {
      await rm(fixture.directory, { recursive: true, force: true })
    }
  }, 45_000)

  it("uses an explicitly targeted pull request to infer its base", async () => {
    const fixture = await createRepository()
    const gh = join(fixture.directory, "gh")
    const calls = join(fixture.directory, "gh-calls")
    const target = "https://github.com/acme/widget/pull/7"
    try {
      await git(fixture.repo, ["remote", "add", "origin", "git@github.com:acme/widget.git"])
      const main = (await git(fixture.repo, ["rev-parse", "main"])).stdout.trim()
      const stack = (await git(fixture.repo, ["rev-parse", "stack-base"])).stdout.trim()
      await writeFile(gh, `#!/bin/sh
printf '%s\\n' "$*" >> '${calls}'
if [ "$3" = '${target}' ]; then
  printf '{"url":"${target}","baseRefName":"stack-base","baseRefOid":"${stack}","headRefName":"feature","headRefOid":"%s","headRepository":{"nameWithOwner":"acme/widget"},"state":"OPEN"}\\n' "$(git rev-parse HEAD)"
else
  printf '{"url":"https://github.com/acme/widget/pull/8","baseRefName":"main","baseRefOid":"${main}","headRefName":"feature","headRefOid":"%s","headRepository":{"nameWithOwner":"acme/widget"},"state":"OPEN"}\\n' "$(git rev-parse HEAD)"
fi
`, { mode: 0o700 })

      const result = await runReview(fixture.nested, [
        "review", "start", "--db", fixture.db, "--target", target,
        "--phase", "native", "--evidence", "Explicit pull request review"
      ], { GH_BIN: gh })
      expect(reviewOutput(result.stdout).identity).toMatchObject({ target, base: "stack-base" })
      expect(await readFile(calls, "utf8")).toContain(`pr view ${target} --json`)
    } finally {
      await rm(fixture.directory, { recursive: true, force: true })
    }
  }, 45_000)

  it("resolves fork clones and configured upstream pull refs while rejecting unrelated forks", async () => {
    const fixture = await createRepository()
    const gh = join(fixture.directory, "gh")
    try {
      await git(fixture.repo, ["remote", "add", "origin", "git@github.com:acme/widget.git"])
      await git(fixture.repo, ["config", "branch.feature.remote", "origin"])
      const main = (await git(fixture.repo, ["rev-parse", "main"])).stdout.trim()
      await writeFile(gh, `#!/bin/sh
printf '{"url":"https://github.com/acme/widget/pull/7","baseRefName":"main","baseRefOid":"${main}","headRefName":"feature","headRefOid":"%s","headRepository":{"nameWithOwner":"contributor/widget"},"state":"OPEN"}\\n' "$(git rev-parse HEAD)"
`, { mode: 0o700 })

      await git(fixture.repo, ["config", "branch.feature.merge", "refs/heads/feature"])
      await expect(runReview(fixture.nested, [
        "review", "start", "--db", fixture.db, "--phase", "native", "--evidence", "Unrelated fork probe"
      ], { GH_BIN: gh })).rejects.toMatchObject({ stderr: expect.stringContaining("different head branch or repository") })
      expect(await missing(fixture.db)).toBe(true)

      await git(fixture.repo, ["config", "branch.feature.merge", "refs/pull/8/head"])
      await expect(runReview(fixture.nested, [
        "review", "start", "--db", fixture.db, "--phase", "native", "--evidence", "Wrong pull ref probe"
      ], { GH_BIN: gh })).rejects.toMatchObject({ stderr: expect.stringContaining("different head branch or repository") })
      expect(await missing(fixture.db)).toBe(true)

      await git(fixture.repo, ["config", "branch.feature.merge", "refs/pull/7/head"])
      await git(fixture.repo, ["branch", "-m", "review-contribution"])
      const result = await runReview(fixture.nested, [
        "review", "start", "--db", fixture.db, "--phase", "native", "--evidence", "Upstream pull ref review"
      ], { GH_BIN: gh })
      expect(reviewOutput(result.stdout).identity).toMatchObject({
        repo: "acme/widget", branch: "review-contribution", target: "https://github.com/acme/widget/pull/7", base: "main"
      })

      await git(fixture.repo, ["branch", "-m", "feature"])
      await git(fixture.repo, ["remote", "set-url", "origin", "git@github.com:contributor/widget.git"])
      await git(fixture.repo, ["config", "branch.feature.merge", "refs/heads/feature"])
      const fork = await runReview(fixture.nested, [
        "review", "start", "--db", join(fixture.directory, "fork.sqlite"),
        "--phase", "native", "--evidence", "Contributor clone review"
      ], { GH_BIN: gh })
      expect(reviewOutput(fork.stdout).identity).toMatchObject({
        repo: "contributor/widget", branch: "feature", target: "https://github.com/acme/widget/pull/7", base: "main"
      })
    } finally {
      await rm(fixture.directory, { recursive: true, force: true })
    }
  }, 45_000)

  it("uses an explicit base with a stable branch target without GitHub access", async () => {
    const fixture = await createRepository()
    const marker = join(fixture.directory, "gh-ran")
    const gh = join(fixture.directory, "gh")
    try {
      await git(fixture.repo, ["remote", "add", "origin", "https://github.com/acme/widget.git"])
      await writeFile(gh, `#!/bin/sh\nprintf called > '${marker}'\nexit 7\n`, { mode: 0o700 })
      await mkdir(dirname(fixture.db), { recursive: true })
      await writeFile(fixture.db, "")
      const result = await runReview(fixture.nested, [
        "review", "start", "--db", fixture.db, "--base", "stack-base",
        "--phase", "native", "--evidence", "Manual native review"
      ], { GH_BIN: gh })
      const first = reviewOutput(result.stdout)
      expect(first.identity).toMatchObject({
        repo: "acme/widget", repoPath: fixture.repo, branch: "feature", target: "feature", base: "stack-base"
      })
      expect(await missing(marker)).toBe(true)

      await runReview(fixture.repo, [
        "review", "finish", "--db", fixture.db, "--review", String(first.reviewId),
        "--outcome", "blocked", "--evidence", "Reviewer interrupted"
      ])
      const followUp = join(fixture.repo, "follow-up.ts")
      await writeFile(followUp, "follow up\n")
      await git(fixture.repo, ["add", "follow-up.ts"])
      await git(fixture.repo, ["commit", "-m", "follow up"])
      const secondResult = await runReview(fixture.nested, [
        "review", "start", "--db", fixture.db, "--phase", "native", "--evidence", "Manual native review after repair"
      ], { GH_BIN: gh })
      const second = reviewOutput(secondResult.stdout)
      expect(second.identity).toMatchObject({ runId: first.runId, target: "feature", base: "stack-base" })
      expect(second.head).not.toBe(first.head)
      expect(second.head).toBe((await git(fixture.repo, ["rev-parse", "HEAD"])).stdout.trim())
      expect(await missing(marker)).toBe(true)
    } finally {
      await rm(fixture.directory, { recursive: true, force: true })
    }
  }, 45_000)

  it("keeps a fully explicit historical identity independent of GitHub", async () => {
    const fixture = await createRepository()
    const head = (await git(fixture.repo, ["rev-parse", "stack-base"])).stdout.trim()
    const gh = join(fixture.directory, "missing-gh")
    try {
      const result = await runReview(fixture.repo, [
        "review", "start", "--db", fixture.db, "--repo", "manual/repo", "--repo-path", fixture.repo,
        "--branch", "feature", "--target", "historical-review", "--base", "main", "--head", head,
        "--phase", "cold", "--evidence", "Historical reviewer"
      ], { GH_BIN: gh })
      expect(reviewOutput(result.stdout).identity).toMatchObject({ repo: "manual/repo", target: "historical-review", base: "main", head })
    } finally {
      await rm(fixture.directory, { recursive: true, force: true })
    }
  }, 45_000)

  it("rejects missing, failed, ambiguous, and detached context without creating review state", async () => {
    const fixture = await createRepository()
    const emptyGh = join(fixture.directory, "empty-gh")
    const failedGh = join(fixture.directory, "failed-gh")
    try {
      await git(fixture.repo, ["remote", "add", "origin", "git@github.com:acme/widget.git"])
      await writeFile(emptyGh, "#!/bin/sh\nprintf '[]\\n'\n", { mode: 0o700 })
      await writeFile(failedGh, "#!/bin/sh\nexit 7\n", { mode: 0o700 })

      await expect(runReview(fixture.nested, [
        "review", "start", "--db", fixture.db, "--phase", "native", "--evidence", "Native reviewer"
      ], { GH_BIN: emptyGh })).rejects.toMatchObject({ stderr: expect.stringContaining("pass --base <ref> explicitly") })
      expect(await missing(fixture.db)).toBe(true)

      await expect(runReview(fixture.nested, [
        "review", "start", "--db", fixture.db, "--phase", "native", "--evidence", "Native reviewer"
      ], { GH_BIN: failedGh })).rejects.toMatchObject({ stderr: expect.stringContaining("GitHub could not resolve one open pull request") })
      expect(await missing(fixture.db)).toBe(true)

      await completeScope(fixture, "first", "main")
      await completeScope(fixture, "second", "stack-base")
      const before = (await stat(fixture.db)).mtimeMs
      await expect(runReview(fixture.nested, [
        "review", "start", "--db", fixture.db, "--phase", "native", "--evidence", "Native reviewer"
      ], { GH_BIN: emptyGh })).rejects.toMatchObject({ stderr: expect.stringContaining("pass --base <ref> explicitly") })
      expect((await stat(fixture.db)).mtimeMs).toBe(before)

      await git(fixture.repo, ["switch", "--detach"])
      const detachedDb = join(fixture.directory, "detached", "reviews.sqlite")
      await expect(runReview(fixture.repo, [
        "review", "start", "--db", detachedDb, "--repo", "acme/widget", "--target", "detached",
        "--base", "main", "--phase", "native", "--evidence", "Native reviewer"
      ])).rejects.toMatchObject({ stderr: expect.stringContaining("detached HEAD") })
      expect(await missing(detachedDb)).toBe(true)
    } finally {
      await rm(fixture.directory, { recursive: true, force: true })
    }
  }, 60_000)
})
