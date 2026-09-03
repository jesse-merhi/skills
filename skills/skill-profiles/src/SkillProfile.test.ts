import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
// Catalogue discovery is exercised against real directories, symlinks, and files.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { execFile as execFileCallback } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { promisify } from "node:util"

import { applyProfile, catalogueOptions, discoverCatalogue, type LoadedProfile, loadProfile, renderAgentFile, renderConfigArgument, renderConfigBlocks } from "./SkillProfile.ts"

const script = new URL("../scripts/skills-profile", import.meta.url).pathname
const execFile = promisify(execFileCallback)
const live = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) => effect.pipe(
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer)
)

const writeSkill = async (directory: string, name: string) => {
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, "SKILL.md"), `---\nname: ${name}\ndescription: ${name} work.\n---\n# ${name}\n`)
  return join(directory, "SKILL.md")
}

const runScript = (args: ReadonlyArray<string>, environment: Record<string, string>, cwd: string) =>
  new Promise<{ readonly code: number; readonly stdout: string; readonly stderr: string }>((resolve) => {
    execFileCallback(script, [...args], {
      cwd,
      encoding: "utf8",
      // Executable-boundary tests intentionally build the child environment explicitly.
      // @effect-diagnostics-next-line processEnv:off
      env: { PATH: process.env.PATH ?? "", ...environment }
    }, (error, stdout, stderr) => resolve({ code: error === null ? 0 : Number(error.code ?? 1), stdout, stderr }))
  })

const isAbsent = async (file: string) => {
  try {
    await readFile(file, "utf8")
    return false
  } catch {
    return true
  }
}

const fixedProfile = (instructions: string): LoadedProfile => ({
  role: "demo",
  definition: {
    name: "demo-agent",
    description: 'Reviews "one" target.',
    model_reasoning_effort: "high",
    sandbox_mode: "read-only",
    instructions: "demo.md",
    allow: ["kept"]
  },
  instructions
})

describe("skill catalogue discovery", () => {
  it("walks every configured root, skips missing ones, and leaves system skills alone", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skill-profile-roots-"))
    try {
      const codexHome = join(directory, ".codex")
      const home = join(directory, "home")
      const repository = join(directory, "repo")
      await writeSkill(join(codexHome, "skills", "kept"), "kept")
      await writeSkill(join(codexHome, "skills", ".system", "imagegen"), "imagegen")
      await writeSkill(join(home, ".agents", "skills", "from-home"), "from-home")
      await writeSkill(join(repository, ".agents", "skills", "from-repo"), "from-repo")

      const catalogue = discoverCatalogue({ codexHome, home, repos: [repository, join(directory, "absent")] })

      assert.deepStrictEqual(catalogue.map((skill) => skill.name), ["kept", "from-home", "from-repo"])
      assert.deepStrictEqual(catalogue.map((skill) => skill.plugin), [undefined, undefined, undefined])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("reports a symlinked skill under the root it was discovered through", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skill-profile-symlink-"))
    try {
      const codexHome = join(directory, ".codex")
      await writeSkill(join(directory, "source", "linked"), "linked")
      await mkdir(join(codexHome, "skills"), { recursive: true })
      await symlink(join(directory, "source", "linked"), join(codexHome, "skills", "linked"))

      const catalogue = discoverCatalogue({ codexHome, home: join(directory, "home"), repos: [] })

      assert.deepStrictEqual(catalogue.map((skill) => skill.path), [join(codexHome, "skills", "linked", "SKILL.md")])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("qualifies a cached plugin skill so the allowlist can name plugin:skill", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skill-profile-plugin-"))
    try {
      const codexHome = join(directory, ".codex")
      const cached = await writeSkill(join(codexHome, "plugins", "cache", "openai-bundled", "browser", "1.2.3", "skills", "control-chrome"), "control-chrome")
      const catalogue = discoverCatalogue({ codexHome, home: join(directory, "home"), repos: [] })
      assert.deepStrictEqual(catalogue, [{ name: "control-chrome", plugin: "browser", path: cached }])

      assert.deepStrictEqual(applyProfile(["browser:control-chrome"], catalogue).disabledPaths, [])
      assert.deepStrictEqual(applyProfile(["control-chrome"], catalogue).disabledPaths, [])
      assert.deepStrictEqual(applyProfile(["other:control-chrome"], catalogue).disabledPaths, [cached])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("treats the working directory and each ancestor up to the repository root as skill roots", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skill-profile-nested-"))
    try {
      const codexHome = join(directory, ".codex")
      const repository = join(directory, "repo")
      const nested = join(repository, "packages", "app")
      await mkdir(nested, { recursive: true })
      await execFile("git", ["init", "-q"], { cwd: repository })
      const top = await writeSkill(join(repository, ".agents", "skills", "top-skill"), "top-skill")
      const deep = await writeSkill(join(nested, ".agents", "skills", "nested-skill"), "nested-skill")

      const options = await Effect.runPromise(live(catalogueOptions({ codexHome, cwd: nested, home: join(directory, "home") })))

      const paths = discoverCatalogue(options).map((skill) => skill.path)
      assert.include(paths, await realpath(top))
      assert.include(paths, await realpath(deep))
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("adds the trusted projects listed in the Codex config", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skill-profile-projects-"))
    try {
      const codexHome = join(directory, ".codex")
      const trusted = join(directory, "trusted")
      await mkdir(codexHome, { recursive: true })
      await writeFile(join(codexHome, "config.toml"), `model = "gpt"\n\n[projects."${trusted}"]\ntrust_level = "trusted"\n`)
      await writeSkill(join(trusted, ".agents", "skills", "trusted-skill"), "trusted-skill")

      const options = await Effect.runPromise(live(catalogueOptions({ codexHome, home: join(directory, "home") })))
      assert.include(options.repos, await realpath(trusted))
      assert.include(
        discoverCatalogue(options).map((skill) => skill.path),
        await realpath(join(trusted, ".agents", "skills", "trusted-skill", "SKILL.md"))
      )
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})

describe("profile application", () => {
  it("names allowlist entries that matched no discovered skill", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skill-profile-missing-allow-"))
    try {
      const codexHome = join(directory, ".codex")
      await writeSkill(join(codexHome, "skills", "kept"), "kept")
      await writeSkill(join(codexHome, "skills", "dropped"), "dropped")
      const catalogue = discoverCatalogue({ codexHome, home: join(directory, "home"), repos: [] })

      const applied = applyProfile(["kept", "never-installed"], catalogue)

      assert.deepStrictEqual(applied.missingAllow, ["never-installed"])
      assert.deepStrictEqual(applied.disabledPaths, [join(codexHome, "skills", "dropped", "SKILL.md")])
      assert.deepStrictEqual(applied.entries.map((entry) => [entry.skill.name, entry.enabled]), [["dropped", false], ["kept", true]])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})

describe("renderers", () => {
  it("writes the inline-table override Codex accepts, escaping quotes and backslashes", () => {
    assert.strictEqual(
      renderConfigArgument(["/a/SKILL.md", "/b\\\"c/SKILL.md"]),
      'skills.config=[{path="/a/SKILL.md",enabled=false},{path="/b\\\\\\"c/SKILL.md",enabled=false}]'
    )
  })

  it("writes one blank-line separated config block per disabled skill", () => {
    assert.strictEqual(
      renderConfigBlocks(["/a/SKILL.md", "/b/SKILL.md"]),
      '[[skills.config]]\npath = "/a/SKILL.md"\nenabled = false\n\n[[skills.config]]\npath = "/b/SKILL.md"\nenabled = false\n'
    )
  })

  it("renders the agent file exactly", async () => {
    const rendered = await Effect.runPromise(renderAgentFile(fixedProfile("# Demo\n\nBody line.\n"), ["/a/SKILL.md"]))

    assert.strictEqual(rendered, `# Generated by skills/skill-profiles/scripts/skills-profile from profiles/demo.json; edit the profile, then regenerate.
name = "demo-agent"
description = "Reviews \\"one\\" target."
model_reasoning_effort = "high"
sandbox_mode = "read-only"
developer_instructions = '''
# Demo

Body line.
'''

[[skills.config]]
path = "/a/SKILL.md"
enabled = false
`)
  })

  it("includes an optional model line", async () => {
    const profile = fixedProfile("body\n")
    const rendered = await Effect.runPromise(renderAgentFile({ ...profile, definition: { ...profile.definition, model: "gpt-5.1-codex" } }, []))
    assert.match(rendered, /^sandbox_mode = "read-only"$/mu)
    assert.match(rendered, /^model = "gpt-5\.1-codex"\nmodel_reasoning_effort = "high"$/mu)
  })

  it("refuses instructions that would terminate the multi-line literal early", async () => {
    const failure = await Effect.runPromise(Effect.flip(renderAgentFile(fixedProfile("before ''' after\n"), [])))
    assert.match(failure.message, /cannot be written as a TOML multi-line literal string/u)
  })
})

describe("profile loading", () => {
  it("loads the shipped cold-reviewer profile and its instructions", async () => {
    const profile = await Effect.runPromise(loadProfile("cold-reviewer"))
    assert.strictEqual(profile.definition.name, "cold-reviewer")
    assert.strictEqual(profile.definition.sandbox_mode, "read-only")
    assert.include(profile.definition.allow, "cold-pr-review")
  })

  it("rejects a role that is not a plain profile name", async () => {
    const failure = await Effect.runPromise(Effect.flip(loadProfile("../../etc/passwd")))
    assert.match(failure.message, /invalid profile name/u)
  })

  it("names the profile file that does not exist", async () => {
    const failure = await Effect.runPromise(Effect.flip(loadProfile("not-a-profile")))
    assert.match(failure.message, /no such skill profile: .*not-a-profile\.json/u)
  })
})

describe("skills-profile command", () => {
  it("checks, installs, repairs a stale file, and refuses to write without consent", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skill-profile-cli-"))
    try {
      const codexHome = join(directory, ".codex")
      const home = join(directory, "home")
      const target = join(codexHome, "agents", "cold-reviewer.toml")
      await mkdir(home, { recursive: true })
      await writeSkill(join(codexHome, "skills", "cold-pr-review"), "cold-pr-review")
      await writeSkill(join(codexHome, "skills", "other"), "other")
      const environment = { CODEX_HOME: codexHome, HOME: home }

      const missing = await runScript(["cold-reviewer", "--check"], environment, directory)
      assert.strictEqual(missing.code, 1)
      assert.include(missing.stderr, `missing: ${target}`)
      assert.include(missing.stderr, 'warning: allowlist entry "project" matched no discovered skill')
      assert.isTrue(await isAbsent(target))

      const refused = await runScript(["cold-reviewer", "--install"], environment, directory)
      assert.strictEqual(refused.code, 1)
      assert.include(refused.stderr, "refusing to write outside the repository without --yes")
      assert.isTrue(await isAbsent(target))

      const written = await runScript(["cold-reviewer", "--install", "--yes"], environment, directory)
      assert.strictEqual(written.code, 0)
      assert.include(written.stdout, `wrote ${target}`)
      const installed = await readFile(target, "utf8")
      assert.include(installed, `path = "${join(codexHome, "skills", "other", "SKILL.md")}"`)
      assert.notInclude(installed, join(codexHome, "skills", "cold-pr-review"))

      const repeated = await runScript(["cold-reviewer", "--install", "--yes"], environment, directory)
      assert.strictEqual(repeated.code, 0)
      assert.strictEqual(repeated.stdout.trim(), `${target} is up to date`)
      assert.strictEqual(await readFile(target, "utf8"), installed)

      assert.strictEqual((await runScript(["cold-reviewer", "--check"], environment, directory)).code, 0)

      await writeFile(target, "# stale\n")
      const stale = await runScript(["cold-reviewer", "--check"], environment, directory)
      assert.strictEqual(stale.code, 1)
      assert.notInclude(stale.stderr, `missing: ${target}`)
      assert.include(stale.stderr, "-# stale")
      assert.strictEqual(await readFile(target, "utf8"), "# stale\n")

      const repaired = await runScript(["cold-reviewer", "--install", "--yes"], environment, directory)
      assert.strictEqual(repaired.code, 0)
      assert.include(repaired.stdout, `wrote ${target}`)
      assert.strictEqual(await readFile(target, "utf8"), installed)

      assert.strictEqual((await runScript(["cold-reviewer", "--check"], environment, directory)).code, 0)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 60_000)

  it("reads the codex home and the extra repository from the flags", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skill-profile-cli-roots-"))
    try {
      const codexHome = join(directory, ".codex")
      const home = join(directory, "home")
      const repository = join(directory, "extra-repo")
      await mkdir(home, { recursive: true })
      await writeSkill(join(codexHome, "skills", "other"), "other")
      const extra = await writeSkill(join(repository, ".agents", "skills", "extra-skill"), "extra-skill")

      // CODEX_HOME is absent here: a broken --codex-home would fall back to the environment,
      // and a broken --repo would drop the extra repository's skills. The repository is
      // passed relative to the working directory and must come back as a real absolute path.
      const rendered = await runScript(
        ["cold-reviewer", "--as-config-blocks", "--codex-home", codexHome, "--repo", "extra-repo"],
        { HOME: home },
        directory
      )

      assert.strictEqual(rendered.code, 0)
      assert.include(rendered.stdout, `[[skills.config]]\npath = "${await realpath(extra)}"\nenabled = false`)
      assert.include(
        rendered.stdout,
        `[[skills.config]]\npath = "${join(codexHome, "skills", "other", "SKILL.md")}"\nenabled = false`
      )
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 60_000)

  it("resolves git outside the reviewed checkout unless GIT_BIN says otherwise", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skill-profile-cli-git-"))
    try {
      const codexHome = join(directory, ".codex")
      const home = join(directory, "home")
      const reviewed = join(directory, "reviewed")
      const marker = join(directory, "hijacked")
      const hijack = join(reviewed, "bin", "git")
      await mkdir(join(reviewed, ".git"), { recursive: true })
      await mkdir(join(reviewed, "bin"), { recursive: true })
      await mkdir(home, { recursive: true })
      await writeFile(hijack, `#!/bin/sh\ntouch ${marker}\nexit 0\n`, { mode: 0o755 })
      await writeSkill(join(codexHome, "skills", "cold-pr-review"), "cold-pr-review")
      const disallowed = await writeSkill(join(codexHome, "skills", "other"), "other")
      // Executable-boundary tests intentionally build the child environment explicitly.
      // @effect-diagnostics-next-line processEnv:off
      const parentPath = process.env.PATH ?? ""
      const environment = { CODEX_HOME: codexHome, HOME: home, PATH: `${join(reviewed, "bin")}:${parentPath}` }

      // The hijacked git is first on PATH, but it lives inside the checkout being read.
      const trusted = await runScript(["cold-reviewer", "--as-config-arg"], environment, reviewed)
      assert.strictEqual(trusted.code, 0)
      assert.isTrue(await isAbsent(marker))
      assert.include(trusted.stdout, `{path="${disallowed}",enabled=false}`)

      const overridden = await runScript(["cold-reviewer", "--as-config-arg"], { ...environment, GIT_BIN: hijack }, reviewed)
      assert.strictEqual(overridden.code, 0)
      assert.isFalse(await isAbsent(marker))
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 60_000)

  it("refuses more than one output selector", async () => {
    const directory = await mkdtemp(join(tmpdir(), "skill-profile-cli-selectors-"))
    try {
      const result = await runScript(["cold-reviewer", "--list", "--as-agent"], { CODEX_HOME: join(directory, ".codex"), HOME: directory }, directory)
      assert.strictEqual(result.code, 2)
      assert.include(result.stderr, "choose one output: --as-agent, --list")
      assert.strictEqual(result.stdout, "")
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 30_000)
})
