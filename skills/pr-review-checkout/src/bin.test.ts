// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawnSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { assert, describe, it } from "@effect/vitest"
import { shellQuote } from "./PrReview.ts"

const executable = fileURLToPath(new URL("../scripts/pr-review.sh", import.meta.url))

const run = (...args: ReadonlyArray<string>) => spawnSync(executable, args, { encoding: "utf8" })

const git = (repository: string, args: ReadonlyArray<string>) => {
  const result = spawnSync("git", args, { cwd: repository, encoding: "utf8" })
  assert.strictEqual(result.status, 0, result.stderr)
  return result.stdout.trim()
}

describe("pr-review.sh", () => {
  it("prints POSIX-safe cleanup arguments for every shell-significant character", () => {
    const value = "repo $HOME `command` \\ 'quote'\nand newline"
    const result = spawnSync("/bin/sh", ["-c", `printf %s ${shellQuote(value)}`], { encoding: "utf8" })

    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout, value)
  })

  it("preserves the missing-argument usage and exit code", () => {
    const result = run()

    assert.strictEqual(result.status, 2)
    assert.strictEqual(result.stdout, "")
    assert.strictEqual(result.stderr, "usage: pr-review.sh <pr-number>\n")
  })

  it("rejects negative PR numbers before invoking gh", () => {
    const result = run("-1")

    assert.strictEqual(result.status, 1)
    assert.match(result.stdout, /USAGE/)
    assert.match(result.stderr, /Expected a value greater than 0/)
  })

  it("prints typed CLI help", () => {
    const result = run("--help")

    assert.strictEqual(result.status, 0)
    assert.match(result.stdout, /Open a GitHub pull request/)
    assert.strictEqual(result.stderr, "")
  })

  it("preserves an external tool's exit status and raw stderr", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-test-"))
    const gh = join(directory, "gh")
    try {
      writeFileSync(gh, "#!/bin/sh\nprintf 'authentication required\\n' >&2\nexit 4\n")
      chmodSync(gh, 0o755)
      const result = spawnSync(executable, ["42"], {
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: { ...process.env, PATH: `${directory}:${process.env.PATH ?? ""}` }
      })

      assert.strictEqual(result.status, 4)
      assert.strictEqual(result.stdout, "")
      assert.strictEqual(result.stderr, "authentication required\n")
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
  printf '{"headRefName":"%s","baseRefName":"main","url":"https://example.test/pr/42","isCrossRepository":false}\n' "$head_ref"
  exit 0
fi
if [ "$1 $2" = "pr checkout" ]; then
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
  else
    git checkout --quiet -b "$branch" pr-tip
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
      assert.match(managedBranch, /^agent-pr-review\/pr-42-/)
      assert.match(result.stdout, new RegExp(`branch --delete --force '${managedBranch}'`))

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
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("rolls back both the worktree and generated branch when checkout fails", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-rollback-test-"))
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
if [ "$1 $2" = "pr checkout" ]; then
  shift 3
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --branch) branch="$2"; shift 2 ;;
      *) shift ;;
    esac
  done
  git checkout --quiet -b "$branch"
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
})
