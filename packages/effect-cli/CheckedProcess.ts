import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Option from "effect/Option"
import * as PlatformError from "effect/PlatformError"
import * as Runtime from "effect/Runtime"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"
import { constants as osConstants } from "node:os"

export class CheckedProcessError extends Schema.TaggedError<CheckedProcessError>()("CheckedProcessError", {
  command: Schema.String,
  exitCode: Schema.Number,
  message: Schema.String,
  stderr: Schema.String,
  cause: Schema.optional(Schema.Unknown)
}) {
  override get [Runtime.errorExitCode]() { return this.exitCode }
}

export interface CheckedProcessOptions {
  readonly cwd?: string
  readonly env?: Record<string, string>
  readonly extendEnv?: boolean
  readonly displayCommand?: string
  readonly forceKillAfter?: ChildProcess.KillOptions["forceKillAfter"]
  readonly stdin?: string
}
export interface CheckedTextOptions extends CheckedProcessOptions {
  readonly allowedExitCodes?: ReadonlyArray<number>
  readonly includeStdoutInError?: boolean
  readonly redactions?: ReadonlyArray<string>
}

const commandInput = (stdin: string | undefined) => stdin === undefined
  ? "inherit" as const
  : Stream.make(stdin).pipe(Stream.encodeText)
const capturedInput = (stdin: string | undefined) => stdin === undefined
  ? Stream.empty
  : Stream.make(stdin).pipe(Stream.encodeText)

const processError = (executable: string, command: string, cause: PlatformError.PlatformError) => {
  const notFound = cause.reason._tag === "NotFound"
  return new CheckedProcessError({ command, exitCode: notFound ? 127 : platformErrorExitCode(cause) ?? 1, message: notFound ? `${executable}: command not found` : `failed to run ${command}`, stderr: "", cause })
}

export const platformErrorExitCode = (error: PlatformError.PlatformError): number | undefined => {
  if (error.reason.module !== "ChildProcess" || error.reason.method !== "exitCode") return undefined
  const original = error.reason.cause
  if (!(original instanceof Error)) return undefined
  const signal = /signal: '([^']+)'/u.exec(original.message)?.[1]
  const number = Object.entries(osConstants.signals).find(([name]) => name === signal)?.[1]
  return signal === undefined || number === undefined ? undefined : 128 + number
}

export const checkedText = Effect.fn("CheckedProcess.text")(function*(
  executable: string,
  args: ReadonlyArray<string>,
  options?: CheckedTextOptions
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  const { allowedExitCodes = [], displayCommand, forceKillAfter, includeStdoutInError = true, redactions = [], stdin, ...childOptions } = options ?? {}
  const commandText = displayCommand ?? [executable, ...args].join(" ")
  const redact = (text: string) => redactions.reduce(
    (output, value) => value.length === 0 ? output : output.replaceAll(value, "[redacted]"),
    text
  )
  return yield* Effect.scoped(Effect.gen(function*() {
    const handle = yield* spawner.spawn(ChildProcess.make(executable, args, { ...childOptions, forceKillAfter, stdin: capturedInput(stdin) })).pipe(
      Effect.mapError((cause) => processError(executable, commandText, cause))
    )
    const result = yield* Effect.all({
      exit: Effect.exit(handle.exitCode),
      stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
      stdout: Stream.mkString(Stream.decodeText(handle.stdout))
    }, { concurrency: "unbounded" }).pipe(
      Effect.mapError((cause) => new CheckedProcessError({ command: commandText, exitCode: 1, message: `failed while running ${commandText}`, stderr: "", cause }))
    )
    if (Exit.isFailure(result.exit)) {
      const cause = Cause.squash(result.exit.cause)
      const platformError = Cause.findErrorOption(result.exit.cause)
      const exitCode = Option.isSome(platformError) ? platformErrorExitCode(platformError.value) ?? 1 : 1
      return yield* new CheckedProcessError({ command: commandText, exitCode, message: `${commandText} was interrupted`, stderr: redact(result.stderr), cause })
    }
    if (result.exit.value !== 0 && !allowedExitCodes.includes(Number(result.exit.value))) {
      const stderr = redact(result.stderr)
      const diagnostics = [stderr.trim(), ...(includeStdoutInError ? [redact(result.stdout).trim()] : [])]
        .filter((text) => text.length > 0).join("\n")
      return yield* new CheckedProcessError({ command: commandText, exitCode: Number(result.exit.value), message: diagnostics || `${commandText} exited ${result.exit.value}`, stderr })
    }
    return result.stdout
  }))
})

export const checkedTrimmedText = (executable: string, args: ReadonlyArray<string>, options?: CheckedTextOptions) =>
  checkedText(executable, args, options).pipe(Effect.map((output) => output.trim()))

export const checkedInherit = Effect.fn("CheckedProcess.inherit")(function*(executable: string, args: ReadonlyArray<string>, options?: CheckedProcessOptions) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  const { displayCommand, forceKillAfter, stdin, ...childOptions } = options ?? {}
  const command = displayCommand ?? [executable, ...args].join(" ")
  const exitCode = yield* spawner.exitCode(ChildProcess.make(executable, args, { ...childOptions, forceKillAfter, stdin: commandInput(stdin), stdout: "inherit", stderr: "inherit" })).pipe(
    Effect.mapError((cause) => processError(executable, command, cause))
  )
  if (exitCode !== 0) return yield* new CheckedProcessError({ command, exitCode: Number(exitCode), message: `${command} exited ${exitCode}`, stderr: "" })
})
