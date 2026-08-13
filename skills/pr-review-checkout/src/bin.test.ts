import { assert, describe, it } from "@effect/vitest"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawnSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { shellQuote } from "./PrReview.ts"

const executable = fileURLToPath(new URL("../scripts/pr-review", import.meta.url))

const run = (...args: ReadonlyArray<string>) => spawnSync(executable, args, { encoding: "utf8" })

const git = (repository: string, args: ReadonlyArray<string>) => {
  const result = spawnSync("git", args, { cwd: repository, encoding: "utf8" })
  assert.strictEqual(result.status, 0, result.stderr)
  return result.stdout.trim()
}

describe("pr-review", () => {
  it("prints POSIX-safe cleanup arguments for every shell-significant character", () => {
    const value = "repo $HOME `command` \\ 'quote'\nand newline"
    const result = spawnSync("/bin/sh", ["-c", `printf %s ${shellQuote(value)}`], { encoding: "utf8" })

    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout, value)
  })

  it("preserves the missing-argument usage and exit code", () => {
    const result = run()

    assert.strictEqual(result.status, 1)
    assert.match(result.stdout, /USAGE/u)
    assert.match(result.stderr, /Missing required argument/u)
  })

  it("preserves the extra-argument usage and exit code", () => {
    const result = run("42", "43")

    assert.strictEqual(result.status, 1)
    assert.match(result.stdout, /USAGE/u)
    assert.match(result.stderr, /Unexpected positional argument/u)
  })

  it("rejects negative PR numbers before invoking gh", () => {
    const result = run("--", "-1")

    assert.strictEqual(result.status, 1)
    assert.match(result.stdout, /USAGE/)
    assert.match(result.stderr, /Expected a value greater than 0/)
    assert.notMatch(result.stderr, /CliError|ShowHelp|\.ts:/)
  })

  it("prints typed CLI help", () => {
    const result = run("--help")

    assert.strictEqual(result.status, 0)
    assert.match(result.stdout, /Open a GitHub pull request/)
    assert.strictEqual(result.stderr, "")
  })

  it("forwards the completion flag advertised by typed CLI help", () => {
    const result = run("--completions", "bash")

    assert.strictEqual(result.status, 0, result.stderr)
    assert.match(result.stdout, /begin-pr-review-completions/)
    assert.strictEqual(result.stderr, "")
  })

  it("forwards equals-form global flags", () => {
    const result = run("--completions=bash")

    assert.strictEqual(result.status, 0, result.stderr)
    assert.match(result.stdout, /begin-pr-review-completions/)
    assert.strictEqual(result.stderr, "")
  })

  it("preserves an external tool's exit status and raw stderr", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-test-"))
    const gh = join(directory, "gh")
    try {
      writeFileSync(gh, "#!/bin/sh\nprintf 'authentication required  ' >&2\nexit 4\n")
      chmodSync(gh, 0o755)
      const result = spawnSync(executable, ["--log-level", "error", "42"], {
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: { ...process.env, PATH: `${directory}:${process.env.PATH ?? ""}` }
      })

      assert.strictEqual(result.status, 4)
      assert.strictEqual(result.stdout, "")
      assert.strictEqual(result.stderr, "authentication required  ")
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("preserves a subprocess signal as its shell-compatible exit status", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-signal-test-"))
    const gh = join(directory, "gh")
    try {
      writeFileSync(gh, "#!/bin/sh\nkill -TERM $$\n")
      chmodSync(gh, 0o755)
      const result = spawnSync(executable, ["42"], {
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: { ...process.env, PATH: `${directory}:${process.env.PATH ?? ""}` }
      })

      assert.strictEqual(result.status, 143)
      assert.strictEqual(result.stdout, "")
      assert.strictEqual(result.stderr, "")
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("preserves the shell command-not-found exit status", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-missing-command-test-"))
    try {
      const result = spawnSync(process.execPath, [fileURLToPath(new URL("./bin.ts", import.meta.url)), "--", "42"], {
        encoding: "utf8",
        env: { ...process.env, PATH: directory }
      })

      assert.strictEqual(result.status, 127)
      assert.strictEqual(result.stdout, "")
      assert.strictEqual(result.stderr, "gh: command not found\n")
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("does not reset an unattached local branch with the PR head name", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-branch-test-"))
    const repository = join(directory, "repo")
    const binaries = join(directory, "bin")
    const gh = join(binaries, "gh")
    const code = join(binaries, "code")
    const ghLog = join(directory, "gh.log")
    try {
      git(directory, ["init", "--quiet", "--initial-branch", "main", repository])
      git(repository, ["config", "user.name", "Test"])
      git(repository, ["config", "user.email", "test@example.com"])
      writeFileSync(join(repository, ".gitignore"), ".worktrees/\n")
      git(repository, ["add", ".gitignore"])
      git(repository, ["commit", "--quiet", "--allow-empty", "--message", "initial"])
      git(repository, ["branch", "pr-tip"])
      git(repository, ["switch", "--quiet", "--create", "feature/review"])
      git(repository, ["commit", "--quiet", "--allow-empty", "--message", "local only"])
      const localCommit = git(repository, ["rev-parse", "feature/review"])
      git(repository, ["switch", "--quiet", "main"])

      mkdirSync(binaries)
      writeFileSync(gh, `#!/bin/sh
set -eu
printf '%s\n' "$*" >> "$PR_REVIEW_TEST_LOG"
if [ "$1 $2" = "pr view" ]; then
  head_ref="\${PR_REVIEW_HEAD:-feature/review}"
  cross="\${PR_REVIEW_CROSS:-false}"
  url="\${PR_REVIEW_URL:-https://example.test/repo/pull/42}"
  printf '{"headRefName":"%s","baseRefName":"main","url":"%s","isCrossRepository":%s}\n' "$head_ref" "$url" "$cross"
  exit 0
fi
if [ "$1 $2" = "pr checkout" ]; then
  if [ "\${PR_REVIEW_GH_CHECKOUT_FAIL:-false}" = "true" ]; then
    printf '%s\n' "fatal: la référence distante est introuvable" >&2
    exit 8
  fi
  shift 3
  branch=""
  force=0
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --branch) branch="$2"; shift 2 ;;
      --force) force=1; shift ;;
      *) shift ;;
    esac
  done
  if [ "$force" -eq 1 ]; then
    git checkout --quiet "$branch"
    git reset --quiet --hard pr-tip
    if [ "\${PR_REVIEW_FAIL_AFTER_CHECKOUT:-false}" = "true" ]; then
      git config "branch.$branch.remote" changed-remote
      git config "branch.$branch.merge" refs/heads/changed-head
      exit 9
    fi
  else
    git checkout --quiet -b "$branch" pr-tip
  fi
  if ! git config --get "branch.$branch.merge" >/dev/null; then
    head_ref="\${PR_REVIEW_HEAD:-feature/review}"
    git config "branch.$branch.remote" origin
    git config "branch.$branch.merge" "refs/heads/$head_ref"
  fi
  exit 0
fi
exit 99
`)
      writeFileSync(code, "#!/bin/sh\nexit \"${PR_REVIEW_CODE_EXIT:-0}\"\n")
      chmodSync(gh, 0o755)
      chmodSync(code, 0o755)

      const result = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_TEST_LOG: ghLog
        }
      })

      assert.strictEqual(result.status, 0, result.stderr)
      assert.strictEqual(git(repository, ["rev-parse", "feature/review"]), localCommit)
      assert.match(git(repository, ["status", "--short"]), /^$/)
      assert.match(readFileSync(ghLog, "utf8"), /pr checkout 42 --branch agent-pr-review\/pr-42-/)
      const managedWorktree = join(repository, ".worktrees", "pr-42")
      const managedBranch = git(managedWorktree, ["branch", "--show-current"])
      const managedRemote = managedBranch.replaceAll("/", "-")
      assert.match(managedBranch, /^agent-pr-review\/pr-42-/)
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${managedBranch}.merge`]),
        "refs/heads/feature/review"
      )
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${managedBranch}.remote`]),
        managedRemote
      )
      assert.strictEqual(
        git(managedWorktree, ["rev-parse", "@{upstream}"]),
        git(managedWorktree, ["rev-parse", "HEAD"])
      )
      assert.match(result.stdout, new RegExp(`branch --delete --force '${managedBranch}'`))
      assert.match(result.stdout, new RegExp(`remote remove '${managedRemote}'`))

      const renamedHeadResult = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_HEAD: "feature/renamed",
          PR_REVIEW_TEST_LOG: ghLog
        }
      })
      assert.strictEqual(renamedHeadResult.status, 0, renamedHeadResult.stderr)
      const gitDirectory = git(managedWorktree, ["rev-parse", "--path-format=absolute", "--git-dir"])
      const ownerPath = join(gitDirectory, "agent-pr-review-owner.json")
      assert.strictEqual(JSON.parse(readFileSync(ownerPath, "utf8")).headRefName, "feature/renamed")
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${managedBranch}.merge`]),
        "refs/heads/feature/renamed"
      )

      git(repository, ["config", `branch.${managedBranch}.merge`, "refs/pull/42/head"])
      const forkRenameResult = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_CROSS: "true",
          PR_REVIEW_HEAD: "fork/renamed-again",
          PR_REVIEW_TEST_LOG: ghLog
        }
      })
      assert.strictEqual(forkRenameResult.status, 0, forkRenameResult.stderr)
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${managedBranch}.merge`]),
        "refs/pull/42/head"
      )

      git(repository, ["config", `branch.${managedBranch}.merge`, "refs/heads/fork/renamed-again"])
      const configuredForkRenameResult = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_CROSS: "true",
          PR_REVIEW_HEAD: "fork/final-name",
          PR_REVIEW_TEST_LOG: ghLog
        }
      })
      assert.strictEqual(configuredForkRenameResult.status, 0, configuredForkRenameResult.stderr)
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${managedBranch}.merge`]),
        "refs/heads/fork/final-name"
      )

      const commitBeforeFailedRefresh = git(managedWorktree, ["rev-parse", "HEAD"])
      const ownerBeforeFailedRefresh = readFileSync(ownerPath, "utf8")
      const mergeBeforeFailedRefresh = git(repository, ["config", "--get", `branch.${managedBranch}.merge`])
      const remoteBeforeFailedRefresh = git(repository, ["config", "--get", `branch.${managedBranch}.remote`])
      git(repository, ["commit", "--quiet", "--allow-empty", "--message", "new PR tip"])
      git(repository, ["branch", "--force", "pr-tip", "HEAD"])
      const failedRefresh = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_FAIL_AFTER_CHECKOUT: "true",
          PR_REVIEW_HEAD: "fork/interrupted-name",
          PR_REVIEW_TEST_LOG: ghLog
        }
      })
      assert.strictEqual(failedRefresh.status, 9)
      assert.strictEqual(git(managedWorktree, ["rev-parse", "HEAD"]), commitBeforeFailedRefresh)
      assert.strictEqual(readFileSync(ownerPath, "utf8"), ownerBeforeFailedRefresh)
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${managedBranch}.merge`]),
        mergeBeforeFailedRefresh
      )
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${managedBranch}.remote`]),
        remoteBeforeFailedRefresh
      )

      writeFileSync(join(managedWorktree, "uncommitted.txt"), "preserve me\n")
      const dirtyResult = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_TEST_LOG: ghLog
        }
      })
      assert.strictEqual(dirtyResult.status, 1)
      assert.match(dirtyResult.stderr, /uncommitted changes/)
      assert.strictEqual(readFileSync(join(managedWorktree, "uncommitted.txt"), "utf8"), "preserve me\n")
      rmSync(join(managedWorktree, "uncommitted.txt"))

      git(managedWorktree, ["switch", "--quiet", "--create", "repurposed"])
      writeFileSync(join(managedWorktree, "repurposed.txt"), "also preserve me\n")
      const repurposedResult = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_TEST_LOG: ghLog
        }
      })
      assert.strictEqual(repurposedResult.status, 1)
      assert.match(repurposedResult.stderr, /managed worktree is on "repurposed"/)
      assert.strictEqual(git(managedWorktree, ["branch", "--show-current"]), "repurposed")
      assert.strictEqual(readFileSync(join(managedWorktree, "repurposed.txt"), "utf8"), "also preserve me\n")
      rmSync(join(managedWorktree, "repurposed.txt"))
      git(managedWorktree, ["switch", "--quiet", managedBranch])
      git(repository, ["branch", "--delete", "--force", "repurposed"])

      const editorFailure = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_CODE_EXIT: "9",
          PR_REVIEW_TEST_LOG: ghLog
        }
      })
      assert.strictEqual(editorFailure.status, 9)
      assert.match(editorFailure.stdout, /When done reviewing this PR/)
      assert.match(editorFailure.stdout, new RegExp(`branch --delete --force '${managedBranch}'`))

      git(repository, ["worktree", "remove", managedWorktree])
      git(repository, ["branch", "--delete", "--force", managedBranch])
      assert.strictEqual(git(repository, ["branch", "--list", managedBranch]), "")

      const interruptedWorktree = join(repository, ".worktrees", "pr-44")
      const interruptedBranch = "agent-pr-review/pr-44-interrupted"
      git(repository, ["worktree", "add", "--detach", interruptedWorktree])
      const interruptedGitDirectory = git(
        interruptedWorktree,
        ["rev-parse", "--path-format=absolute", "--git-dir"]
      )
      const canonicalRepository = git(repository, ["rev-parse", "--show-toplevel"])
      writeFileSync(join(interruptedGitDirectory, "agent-pr-review-owner.json"), JSON.stringify({
        headRefName: "feature/interrupted",
        managedBranch: interruptedBranch,
        prNumber: 44,
        repository: canonicalRepository
      }))
      const recoveredResult = spawnSync(executable, ["44"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_HEAD: "feature/interrupted",
          PR_REVIEW_TEST_LOG: ghLog
        }
      })
      assert.strictEqual(recoveredResult.status, 0, recoveredResult.stderr)
      assert.strictEqual(git(interruptedWorktree, ["branch", "--show-current"]), interruptedBranch)
      git(repository, ["worktree", "remove", interruptedWorktree])
      git(repository, ["branch", "--delete", "--force", interruptedBranch])

      const forkRepository = join(directory, "fork.git")
      const baseRepository = join(directory, "base.git")
      git(directory, ["clone", "--quiet", "--bare", repository, forkRepository])
      git(directory, ["clone", "--quiet", "--bare", repository, baseRepository])
      git(repository, ["remote", "add", "origin", forkRepository])
      git(repository, ["remote", "add", "upstream", pathToFileURL(baseRepository).href])
      git(baseRepository, ["update-ref", "refs/pull/43/head", git(repository, ["rev-parse", "pr-tip"])])
      const basePullRequestUrl = pathToFileURL(join(directory, "base", "pull", "43")).href
      const baseFetchUrl = pathToFileURL(baseRepository).href
      const deletedHeadResult = spawnSync(executable, ["43"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_GH_CHECKOUT_FAIL: "true",
          PR_REVIEW_HEAD: "deleted/head",
          PR_REVIEW_TEST_LOG: ghLog,
          PR_REVIEW_URL: basePullRequestUrl
        }
      })
      assert.strictEqual(deletedHeadResult.status, 0, deletedHeadResult.stderr)
      const deletedHeadWorktree = join(repository, ".worktrees", "pr-43")
      const deletedHeadBranch = git(deletedHeadWorktree, ["branch", "--show-current"])
      const deletedHeadRemote = deletedHeadBranch.replaceAll("/", "-")
      assert.strictEqual(git(deletedHeadWorktree, ["rev-parse", "HEAD"]), git(repository, ["rev-parse", "pr-tip"]))
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${deletedHeadBranch}.merge`]),
        "refs/pull/43/head"
      )
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${deletedHeadBranch}.remote`]),
        deletedHeadRemote
      )
      assert.strictEqual(
        git(deletedHeadWorktree, ["rev-parse", "@{upstream}"]),
        git(repository, ["rev-parse", "pr-tip"])
      )
      const restoredHeadResult = spawnSync(executable, ["43"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_HEAD: "restored/head",
          PR_REVIEW_TEST_LOG: ghLog,
          PR_REVIEW_URL: basePullRequestUrl
        }
      })
      assert.strictEqual(restoredHeadResult.status, 0, restoredHeadResult.stderr)
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${deletedHeadBranch}.remote`]),
        deletedHeadRemote
      )
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${deletedHeadBranch}.merge`]),
        "refs/heads/restored/head"
      )
      const trackingRef = spawnSync(
        "git",
        ["show-ref", "--verify", "--quiet", "refs/remotes/agent-pr-review/pr-43/head"],
        { cwd: repository, encoding: "utf8" }
      )
      assert.strictEqual(trackingRef.status, 0, trackingRef.stderr)

      git(repository, ["update-ref", "refs/remotes/agent-pr-review/pr-43/head", "pr-tip"])
      git(repository, ["config", `branch.${deletedHeadBranch}.remote`, "."])
      git(repository, [
        "config",
        `branch.${deletedHeadBranch}.merge`,
        "refs/remotes/agent-pr-review/pr-43/head"
      ])
      git(repository, ["commit", "--quiet", "--allow-empty", "--message", "restored fork tip"])
      git(repository, ["branch", "--force", "pr-tip", "HEAD"])
      const restoredForkResult = spawnSync(executable, ["43"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_CROSS: "true",
          PR_REVIEW_HEAD: "fork/restored-head",
          PR_REVIEW_TEST_LOG: ghLog,
          PR_REVIEW_URL: basePullRequestUrl
        }
      })
      assert.strictEqual(restoredForkResult.status, 0, restoredForkResult.stderr)
      assert.strictEqual(
        git(deletedHeadWorktree, ["rev-parse", "@{upstream}"]),
        git(repository, ["rev-parse", "pr-tip"])
      )
      git(repository, ["worktree", "remove", deletedHeadWorktree])
      git(repository, ["branch", "--delete", "--force", deletedHeadBranch])
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  }, 60_000)

  it("configures a valid helper upstream for a fresh cross-repository checkout", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-cross-upstream-test-"))
    const repository = join(directory, "repo")
    const baseRepository = join(directory, "base.git")
    const forkRepository = join(directory, "fork.git")
    const binaries = join(directory, "bin")
    const gh = join(binaries, "gh")
    const code = join(binaries, "code")
    try {
      git(directory, ["init", "--quiet", "--initial-branch", "main", repository])
      git(repository, ["config", "user.name", "Test"])
      git(repository, ["config", "user.email", "test@example.com"])
      writeFileSync(join(repository, ".gitignore"), ".worktrees/\n")
      git(repository, ["add", ".gitignore"])
      git(repository, ["commit", "--quiet", "--message", "initial"])
      git(directory, ["clone", "--quiet", "--bare", repository, baseRepository])
      git(directory, ["clone", "--quiet", "--bare", repository, forkRepository])
      git(baseRepository, ["update-ref", "refs/pull/42/head", "refs/heads/main"])
      git(forkRepository, ["update-ref", "refs/heads/feature/review", "refs/heads/main"])
      git(repository, ["remote", "add", "fork", forkRepository])
      const basePullRequestUrl = pathToFileURL(join(directory, "base", "pull", "42")).href
      const baseFetchUrl = pathToFileURL(baseRepository).href
      mkdirSync(binaries)
      writeFileSync(gh, `#!/bin/sh
set -eu
if [ "$1 $2" = "pr view" ]; then
  printf '%s\n' '{"headRefName":"feature/review","baseRefName":"main","url":"${basePullRequestUrl}","isCrossRepository":true}'
  exit 0
fi
if [ "$1 $2" = "pr checkout" ]; then
  if [ "\${PR_REVIEW_GH_CHECKOUT_FAIL:-false}" = "true" ]; then
    printf 'fork head unavailable\n' >&2
    exit 8
  fi
  shift 3
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --branch) branch="$2"; shift 2 ;;
      *) shift ;;
    esac
  done
  git fetch --quiet fork refs/heads/feature/review:refs/remotes/fork/feature/review
  git checkout --quiet "$branch"
  git reset --quiet --hard refs/remotes/fork/feature/review
  git config "branch.$branch.remote" '${forkRepository}'
  git config "branch.$branch.merge" refs/heads/feature/review
  exit 0
fi
exit 99
`)
      writeFileSync(code, "#!/bin/sh\nexit 0\n")
      chmodSync(gh, 0o755)
      chmodSync(code, 0o755)

      const result = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: { ...process.env, PATH: `${binaries}:${process.env.PATH ?? ""}` }
      })

      assert.strictEqual(result.status, 0, result.stderr)
      const worktree = join(repository, ".worktrees", "pr-42")
      const managedBranch = git(worktree, ["branch", "--show-current"])
      const managedRemote = managedBranch.replaceAll("/", "-")
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${managedBranch}.remote`]),
        managedRemote
      )
      assert.strictEqual(git(repository, ["remote", "get-url", managedRemote]), forkRepository)
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${managedBranch}.merge`]),
        "refs/heads/feature/review"
      )
      assert.strictEqual(git(worktree, ["rev-parse", "@{upstream}"]), git(worktree, ["rev-parse", "HEAD"]))

      const fallback = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_GH_CHECKOUT_FAIL: "true"
        }
      })
      assert.strictEqual(fallback.status, 0, fallback.stderr)
      assert.strictEqual(git(repository, ["remote", "get-url", managedRemote]), baseFetchUrl)
      assert.strictEqual(
        git(repository, ["config", "--get", `branch.${managedBranch}.merge`]),
        "refs/pull/42/head"
      )
      assert.strictEqual(git(worktree, ["rev-parse", "@{upstream}"]), git(worktree, ["rev-parse", "HEAD"]))
      const fetch = spawnSync("git", ["fetch", managedRemote], { cwd: worktree, encoding: "utf8" })
      assert.strictEqual(fetch.status, 0, fetch.stderr)
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  }, 15_000)

  it("rolls back both the worktree and generated branch when checkout fails", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-rollback-test-"))
    const repository = join(directory, "repo")
    const baseRepository = join(directory, "base.git")
    const binaries = join(directory, "bin")
    const gh = join(binaries, "gh")
    try {
      git(directory, ["init", "--quiet", "--initial-branch", "main", repository])
      git(repository, ["config", "user.name", "Test"])
      git(repository, ["config", "user.email", "test@example.com"])
      writeFileSync(join(repository, ".gitignore"), ".worktrees/\n")
      git(repository, ["add", ".gitignore"])
      git(repository, ["commit", "--quiet", "--message", "initial"])
      git(directory, ["clone", "--quiet", "--bare", repository, baseRepository])
      const basePullRequestUrl = pathToFileURL(join(directory, "base", "pull", "42")).href
      mkdirSync(binaries)
      writeFileSync(gh, `#!/bin/sh
set -eu
if [ "$1 $2" = "pr view" ]; then
  printf '%s\n' '{"headRefName":"feature/review","baseRefName":"main","url":"${basePullRequestUrl}","isCrossRepository":false}'
  exit 0
fi
if [ "$1 $2" = "pr checkout" ]; then
  shift 3
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --branch) branch="$2"; shift 2 ;;
      *) shift ;;
    esac
  done
  git checkout --quiet "$branch"
  printf 'checkout failed\n' >&2
  exit 7
fi
exit 99
`)
      chmodSync(gh, 0o755)

      const result = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: { ...process.env, PATH: `${binaries}:${process.env.PATH ?? ""}` }
      })

      assert.strictEqual(result.status, 7)
      assert.strictEqual(result.stderr, "checkout failed\n")
      assert.notMatch(git(repository, ["worktree", "list", "--porcelain"]), /\.worktrees\/pr-42/)
      assert.strictEqual(git(repository, ["branch", "--list", "agent-pr-review/*"]), "")
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("removes a worktree when its post-checkout hook makes creation report failure", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-hook-rollback-test-"))
    const repository = join(directory, "repo")
    const binaries = join(directory, "bin")
    const gh = join(binaries, "gh")
    try {
      git(directory, ["init", "--quiet", "--initial-branch", "main", repository])
      git(repository, ["config", "user.name", "Test"])
      git(repository, ["config", "user.email", "test@example.com"])
      writeFileSync(join(repository, ".gitignore"), ".worktrees/\n")
      git(repository, ["add", ".gitignore"])
      git(repository, ["commit", "--quiet", "--message", "initial"])
      mkdirSync(binaries)
      writeFileSync(gh, `#!/bin/sh
set -eu
if [ "$1 $2" = "pr view" ]; then
  printf '%s\n' '{"headRefName":"feature/review","baseRefName":"main","url":"https://example.test/pr/42","isCrossRepository":false}'
  exit 0
fi
exit 99
`)
      chmodSync(gh, 0o755)
      const postCheckout = join(repository, ".git", "hooks", "post-checkout")
      writeFileSync(postCheckout, "#!/bin/sh\nexit 7\n")
      chmodSync(postCheckout, 0o755)

      const result = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: { ...process.env, PATH: `${binaries}:${process.env.PATH ?? ""}` }
      })

      assert.strictEqual(result.status, 7)
      assert.notMatch(git(repository, ["worktree", "list", "--porcelain"]), /\.worktrees\/pr-42/)
      assert.strictEqual(git(repository, ["branch", "--list", "agent-pr-review/*"]), "")
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("preserves an unrelated worktree that wins the managed-path race", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-path-race-test-"))
    const repository = join(directory, "repo")
    const binaries = join(directory, "bin")
    const gh = join(binaries, "gh")
    const gitWrapper = join(binaries, "git")
    const target = join(repository, ".worktrees", "pr-42")
    const injected = join(directory, "injected")
    try {
      git(directory, ["init", "--quiet", "--initial-branch", "main", repository])
      git(repository, ["config", "user.name", "Test"])
      git(repository, ["config", "user.email", "test@example.com"])
      writeFileSync(join(repository, ".gitignore"), ".worktrees/\n")
      git(repository, ["add", ".gitignore"])
      git(repository, ["commit", "--quiet", "--message", "initial"])
      git(repository, ["branch", "victim"])
      mkdirSync(binaries)
      writeFileSync(gh, `#!/bin/sh
set -eu
if [ "$1 $2" = "pr view" ]; then
  printf '%s\n' '{"headRefName":"feature/review","baseRefName":"main","url":"https://example.test/pr/42","isCrossRepository":false}'
  exit 0
fi
exit 99
`)
      writeFileSync(gitWrapper, `#!/bin/sh
set -eu
if [ "$1 $2" = "worktree add" ] && [ ! -e "$PR_REVIEW_INJECTED" ]; then
  : > "$PR_REVIEW_INJECTED"
  "$PR_REVIEW_REAL_GIT" -C "$PR_REVIEW_REPOSITORY" worktree add --quiet "$PR_REVIEW_TARGET" victim
  printf 'preserve me\n' > "$PR_REVIEW_TARGET/uncommitted.txt"
fi
exec "$PR_REVIEW_REAL_GIT" "$@"
`)
      chmodSync(gh, 0o755)
      chmodSync(gitWrapper, 0o755)
      const realGit = spawnSync("/bin/sh", ["-c", "command -v git"], { encoding: "utf8" }).stdout.trim()

      const result = spawnSync(executable, ["42"], {
        cwd: repository,
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: {
          ...process.env,
          PATH: `${binaries}:${process.env.PATH ?? ""}`,
          PR_REVIEW_INJECTED: injected,
          PR_REVIEW_REAL_GIT: realGit,
          PR_REVIEW_REPOSITORY: repository,
          PR_REVIEW_TARGET: target
        }
      })

      assert.strictEqual(result.status, 128)
      assert.strictEqual(git(target, ["branch", "--show-current"]), "victim")
      assert.strictEqual(readFileSync(join(target, "uncommitted.txt"), "utf8"), "preserve me\n")
      assert.strictEqual(git(repository, ["branch", "--list", "agent-pr-review/*"]), "")
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })
})
