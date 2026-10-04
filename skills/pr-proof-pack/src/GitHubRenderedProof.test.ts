import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"

import { GitHubAttachmentError } from "./GitHubAttachment.ts"
import { verifyGitHubRenderedProof } from "./GitHubRenderedProof.ts"

const expectedHeadSha = "0123456789abcdef0123456789abcdef01234567"

const node = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) => effect.pipe(
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer)
)

const writeExecutable = (path: string, content: string) => {
  writeFileSync(path, content)
  chmodSync(path, 0o755)
}

const processIsRunning = (pid: number) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH") return false
    throw error
  }
}

const waitForFile = (path: string) => Effect.gen(function*() {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    if (existsSync(path)) return
    yield* Effect.sleep("10 millis")
  }
  return yield* new GitHubAttachmentError({ message: `Timed out waiting for verifier child readiness at ${path}` })
})

describe("rendered GitHub proof verification", () => {
  it.live("force-kills every interrupted verifier child and cleans temporary files", () => {
    const directory = mkdtempSync(join(tmpdir(), "github-rendered-deadline-test-"))
    const tool = `#!/usr/bin/env node
const fs = require("node:fs")
const path = require("node:path")
const name = path.basename(process.argv[1])
const args = process.argv.slice(2)
fs.appendFileSync(process.env.VERIFY_PROCESS_LOG, name + "\\t" + JSON.stringify(args) + "\\t" + process.pid + "\\n")
const run = () => {
  if (process.env.VERIFY_HANG_AT === name) {
    process.on("SIGTERM", () => {})
    fs.writeFileSync(process.env.VERIFY_READY_PATH, "ready")
    setInterval(() => {}, 1000)
    return
  }
  if (name === "gh") {
    process.stdout.write(JSON.stringify({
      body: "proof",
      body_html: '<p><img src="https://private-user-images.githubusercontent.com/proof"></p>',
      head: { sha: "${expectedHeadSha}" }
    }))
    return
  }
  if (name === "curl") {
    if (args[0] === "--version") {
      process.stdout.write("curl 8.4.0 (test)\\n")
      return
    }
    fs.writeFileSync(args[args.indexOf("--output") + 1], "proof")
    fs.writeFileSync(args[args.indexOf("--dump-header") + 1], "HTTP/1.1 200 OK\\r\\n")
    process.stdout.write('{"status":200,"contentType":"image/png"}')
    return
  }
  if (name === "file") {
    process.stdout.write("image/png\\n")
    return
  }
  process.exit(2)
}
if (name === "curl") {
  process.stdin.resume()
  process.stdin.on("end", run)
} else {
  run()
}
`
    for (const name of ["gh", "curl", "file"]) writeExecutable(join(directory, name), tool)
    const baseEnvironment: Record<string, string> = {}
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) baseEnvironment[key] = value
    }
    baseEnvironment.PATH = `${directory}:${baseEnvironment.PATH ?? ""}`

    return node(Effect.gen(function*() {
      for (const name of ["gh", "curl", "file"] as const) {
        const log = join(directory, `${name}.log`)
        const ready = join(directory, `${name}.ready`)
        const verifier = yield* verifyGitHubRenderedProof(
          "https://github.com/jesse-merhi/skills/pull/81",
          expectedHeadSha,
          {
            deadline: "30 seconds",
            processOptions: {
              env: {
                ...baseEnvironment,
                VERIFY_HANG_AT: name,
                VERIFY_PROCESS_LOG: log,
                VERIFY_READY_PATH: ready
              }
            }
          }
        ).pipe(Effect.scoped, Effect.forkChild)
        yield* waitForFile(ready)
        const interruptedAt = Date.now()
        yield* Fiber.interrupt(verifier)
        assert.isBelow(Date.now() - interruptedAt, 3_000)
        for (const line of readFileSync(log, "utf8").trim().split("\n")) {
          const [loggedName, encodedArgs, encodedPid] = line.split("\t", 3)
          const pid = Number(encodedPid)
          assert.isFalse(processIsRunning(pid), `expected ${loggedName ?? "child"} process ${pid} to exit`)
          if (loggedName !== "curl" || encodedArgs === undefined) continue
          const args: ReadonlyArray<string> = JSON.parse(encodedArgs)
          for (const flag of ["--output", "--dump-header"]) {
            const temporaryPath = args[args.indexOf(flag) + 1]
            if (temporaryPath !== undefined) assert.isFalse(existsSync(temporaryPath))
          }
        }
      }
    })).pipe(Effect.ensuring(Effect.sync(() => rmSync(directory, { force: true, recursive: true }))))
  }, 30_000)
})
