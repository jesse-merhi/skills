import * as Schema from "effect/Schema"

export class ReviewSnapshotError extends Schema.TaggedError<ReviewSnapshotError>()("ReviewSnapshotError", { message: Schema.String }) {}

export { trustedExecutable, TrustedExecutableError } from "../../../packages/effect-cli/TrustedExecutable.ts"
