import * as NodeServices from "@effect/platform-node/NodeServices"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as ManagedRuntime from "effect/ManagedRuntime"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"
import { afterAll, expect, it } from "vitest"

import { checkedText } from "../effect-cli/CheckedProcess.ts"
import { SourceBundle } from "./Model.ts"

const runtime = ManagedRuntime.make(NodeServices.layer)
afterAll(() => runtime.dispose())

it("captures exact text, binary bytes, and symlink targets without following supporting links", async () => {
  const result = await runtime.runPromise(Effect.gen(function*() {
    const fileSystem = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const directory = yield* fileSystem.makeTempDirectoryScoped()
    const skill = path.join(directory, "skill")
    yield* fileSystem.makeDirectory(path.join(skill, "variants"), { recursive: true })
    yield* fileSystem.writeFileString(path.join(skill, "variants", "base.md"), "\uFEFF# Original\r\nExact bytes\r\n")
    yield* fileSystem.symlink("variants/base.md", path.join(skill, "SKILL.md"))
    yield* fileSystem.writeFile(path.join(skill, "image.bin"), new Uint8Array([0, 255, 128, 10]))
    yield* fileSystem.writeFileString(path.join(directory, "outside.txt"), "must not be copied")
    yield* fileSystem.symlink("../outside.txt", path.join(skill, "outside-link"))
    const code = `import {captureSkill} from './packages/skill-review/source.mjs'; console.log(JSON.stringify(captureSkill({name:'example',directory:process.argv[1]},'captured-head')))`
    const output = yield* checkedText("bun", ["--eval", code, skill], { cwd: path.resolve(import.meta.dirname, "../..") })
    return Schema.decodeUnknownSync(Schema.fromJsonString(SourceBundle))(output)
  }).pipe(Effect.scoped))
  expect(result.entry).toBe("\uFEFF# Original\r\nExact bytes\r\n")
  expect(result.files.find((file) => file.path === "variants/base.md")?.content).toBe(result.entry)
  expect(result.files.find((file) => file.path === "image.bin")).toMatchObject({ encoding: "base64", content: "AP+ACg==" })
  expect(result.files.find((file) => file.path === "outside-link")).toMatchObject({ encoding: "symlink", content: "../outside.txt" })
  expect(result.files).toHaveLength(4)
})
