import { constants as osConstants } from "node:os"
import { Cause, Effect, Exit, PlatformError, Schema, Stream } from "effect"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"

export class CheckedProcessError extends Schema.TaggedError<CheckedProcessError>()("CheckedProcessError", {
  command: Schema.String,
  exitCode: Schema.Number,
  message: Schema.String,
  stderr: Schema.String,
  cause: Schema.optional(Schema.Unknown)
}) {}

const signalExitCode = (cause: unknown) => {
  const messages: Array<string> = []
  let current: unknown = cause
  for (let depth = 0; depth < 4 && current !== undefined; depth += 1) {
    messages.push(current instanceof Error ? current.message : String(current))
    if (current instanceof PlatformError.PlatformError && "cause" in current.reason) current = current.reason.cause
    else if (typeof current === "object" && current !== null && "cause" in current) current = current.cause
    else current = undefined
  }
  const signal = messages.flatMap((message) => /signal: '([^']+)'/u.exec(message)?.[1] ?? []).at(0)
  const number = signal === undefined ? undefined : osConstants.signals[signal as keyof typeof osConstants.signals]
  return number === undefined ? 1 : 128 + number
}

export const checkedText = Effect.fn("CheckedProcess.text")(function*(
  executable: string,
  args: ReadonlyArray<string>,
  options?: { readonly cwd?: string; readonly env?: Record<string, string>; readonly extendEnv?: boolean }
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  const commandText = [executable, ...args].join(" ")
  return yield* Effect.scoped(Effect.gen(function*() {
    const handle = yield* spawner.spawn(ChildProcess.make(executable, args, options)).pipe(
      Effect.mapError((cause) => {
        const notFound = cause instanceof PlatformError.PlatformError && cause.reason._tag === "NotFound"
        return new CheckedProcessError({ command: commandText, exitCode: notFound ? 127 : 1, message: notFound ? `${executable}: command not found` : `failed to start ${commandText}`, stderr: "", cause })
      })
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
      return yield* new CheckedProcessError({ command: commandText, exitCode: signalExitCode(cause), message: `${commandText} was interrupted`, stderr: result.stderr, cause })
    }
    if (result.exit.value !== 0) {
      return yield* new CheckedProcessError({ command: commandText, exitCode: Number(result.exit.value), message: result.stderr.trim() || `${commandText} exited ${result.exit.value}`, stderr: result.stderr })
    }
    return result.stdout
  }))
})

export const checkedTrimmedText = (executable: string, args: ReadonlyArray<string>, options?: { readonly cwd?: string; readonly env?: Record<string, string>; readonly extendEnv?: boolean }) =>
  checkedText(executable, args, options).pipe(Effect.map((output) => output.trim()))
