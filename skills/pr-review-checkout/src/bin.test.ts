// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawnSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { assert, describe, it } from "@effect/vitest"

const executable = fileURLToPath(new URL("../scripts/pr-review.sh", import.meta.url))

const run = (...args: ReadonlyArray<string>) => spawnSync(executable, args, { encoding: "utf8" })

const git = (repository: string, args: ReadonlyArray<string>) => {
  const result = spawnSync("git", args, { cwd: repository, encoding: "utf8" })
  assert.strictEqual(result.status, 0, result.stderr)
  return result.stdout.trim()
}

describe("pr-review.sh", () => {
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

  it("keeps external-tool failures off stdout", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-test-"))
    const gh = join(directory, "gh")
    try {
      writeFileSync(gh, "#!/bin/sh\nprintf 'gh failed\\n' >&2\nexit 1\n")
      chmodSync(gh, 0o755)
      const result = spawnSync(executable, ["42"], {
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: { ...process.env, PATH: `${directory}:${process.env.PATH ?? ""}` }
      })

      assert.strictEqual(result.status, 1)
      assert.strictEqual(result.stdout, "")
      assert.match(result.stderr, /gh failed/)
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
  printf '%s\n' '{"headRefName":"feature/review","baseRefName":"main","url":"https://example.test/pr/42","isCrossRepository":false}'
  exit 0
fi
if [ "$1 $2" = "pr checkout" ]; then
  shift 3
  branch=""
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --branch) branch="$2"; shift 2 ;;
      --force) exit 91 ;;
      *) shift ;;
    esac
  done
  git checkout --quiet -b "$branch" pr-tip
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
      assert.match(
        git(join(repository, ".worktrees", "pr-42"), ["branch", "--show-current"]),
        /^agent-pr-review\/pr-42-/
      )
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })
})
