import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Effect, Option } from "effect"
import { Command, Flag } from "effect/unstable/cli"
import { clawhubLocalTest } from "./ClawhubLocalTest.ts"

// Environment defaults are captured once at the CLI boundary.
const environment = process.env
const defaultRepo = environment.CLAWHUB_LOCAL_TEST_REPO ?? process.cwd()
const command = Command.make("clawhub-local-test", {
  repo: Flag.string("repo").pipe(Flag.withDefault(defaultRepo)), stateDir: Flag.string("state-dir").pipe(Flag.withDefault(environment.CLAWHUB_LOCAL_TEST_STATE_DIR ?? "~/.clawhub-local-test")),
  port: Flag.optional(Flag.integer("port")), refresh: Flag.boolean("refresh"), noRefresh: Flag.boolean("no-refresh"), snapshotMaxAgeHours: Flag.integer("snapshot-max-age").pipe(Flag.withDefault(Number(environment.CLAWHUB_LOCAL_TEST_SNAPSHOT_MAX_AGE_HOURS ?? 24))),
  includeFileStorage: Flag.boolean("include-file-storage"), skipImport: Flag.boolean("skip-import"), noSeedFixtures: Flag.boolean("no-seed-fixtures"), noSeedAbuseFixtures: Flag.boolean("no-seed-abuse-fixtures"),
  noWorkers: Flag.boolean("no-workers"), open: Flag.boolean("open"), browser: Flag.string("browser").pipe(Flag.withDefault(environment.CLAWHUB_LOCAL_TEST_BROWSER ?? "Google Chrome")),
  ttl: Flag.string("ttl").pipe(Flag.withDefault(environment.CLAWHUB_LOCAL_TEST_TTL ?? "8h")), noTtl: Flag.boolean("no-ttl"), dryRun: Flag.boolean("dry-run"), status: Flag.boolean("status"), stop: Flag.boolean("stop")
}, Effect.fn("Clawhub.cli")(function*(args) {
  yield* clawhubLocalTest({ ...args, startPort: Number(environment.CLAWHUB_LOCAL_TEST_PORT ?? 3000), refresh: args.refresh ? "force" : args.noRefresh ? "none" : "auto", seedFixtures: !args.noSeedFixtures, seedAbuseFixtures: !args.noSeedAbuseFixtures, workers: !args.noWorkers, ttl: args.noTtl ? "0" : args.ttl, action: args.stop ? "stop" : args.status ? "status" : "start", port: args.port as Option.Option<number> })
})).pipe(Command.withDescription("Manage a guarded local ClawHub test instance"))

command.pipe(Command.run({ version: "2.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain)
