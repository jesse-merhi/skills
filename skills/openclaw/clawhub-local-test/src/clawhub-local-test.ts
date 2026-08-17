import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Effect from "effect/Effect"
import { Command, Flag } from "effect/unstable/cli"
// CLI-boundary checkout discovery needs synchronous defaults before Effect command parsing.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { existsSync } from "node:fs"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"

import { clawhubLocalTest } from "./ClawhubLocalTest.ts"

// Environment defaults are captured once at the CLI boundary.
const environment = process.env
const environmentOr = (value: string | undefined, fallback: string) => value === undefined || value.length === 0 ? fallback : value
const currentDirectory = process.cwd()
const currentIsClawhub = existsSync(join(currentDirectory, "package.json")) && existsSync(join(currentDirectory, "convex"))
const defaultRepo = environmentOr(environment.CLAWHUB_LOCAL_TEST_REPO, currentIsClawhub ? currentDirectory : `${environmentOr(environment.HOME, "~")}/repos/clawhub`)
const command = Command.make("clawhub-local-test", {
  repo: Flag.string("repo").pipe(Flag.withDefault(defaultRepo)), stateDir: Flag.string("state-dir").pipe(Flag.withDefault(environmentOr(environment.CLAWHUB_LOCAL_TEST_STATE_DIR, "~/.clawhub-local-test"))),
  port: Flag.optional(Flag.integer("port")), refresh: Flag.boolean("refresh"), noRefresh: Flag.boolean("no-refresh"), snapshotMaxAgeHours: Flag.integer("snapshot-max-age").pipe(Flag.withDefault(Number(environmentOr(environment.CLAWHUB_LOCAL_TEST_SNAPSHOT_MAX_AGE_HOURS, "24")))),
  includeFileStorage: Flag.boolean("include-file-storage"), skipImport: Flag.boolean("skip-import"), noSeedFixtures: Flag.boolean("no-seed-fixtures"), noSeedAbuseFixtures: Flag.boolean("no-seed-abuse-fixtures"),
  noWorkers: Flag.boolean("no-workers"), open: Flag.boolean("open"), browser: Flag.string("browser").pipe(Flag.withDefault(environmentOr(environment.CLAWHUB_LOCAL_TEST_BROWSER, "Google Chrome"))),
  ttl: Flag.string("ttl").pipe(Flag.withDefault(environmentOr(environment.CLAWHUB_LOCAL_TEST_TTL, "8h"))), noTtl: Flag.boolean("no-ttl"), dryRun: Flag.boolean("dry-run"), status: Flag.boolean("status"), stop: Flag.boolean("stop")
}, Effect.fn("Clawhub.cli")(function*(args) {
  yield* clawhubLocalTest({ ...args, startPort: Number(environmentOr(environment.CLAWHUB_LOCAL_TEST_PORT, "3000")), refresh: args.refresh ? "force" : args.noRefresh ? "none" : "auto", seedFixtures: !args.noSeedFixtures, seedAbuseFixtures: !args.noSeedAbuseFixtures, workers: !args.noWorkers, ttl: args.noTtl ? "0" : args.ttl, action: args.stop ? "stop" : args.status ? "status" : "start", port: args.port })
})).pipe(Command.withDescription("Manage a guarded local ClawHub test instance"))

command.pipe(Command.run({ version: "2.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain)
