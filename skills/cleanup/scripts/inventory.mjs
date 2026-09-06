import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

export function inventory(root, composeProject) {
  const directory = fs.realpathSync(root);
  const observe = (command, args, ownership) => {
    const result = spawnSync(command, args, { cwd: directory, encoding: "utf8", timeout: 15_000, maxBuffer: 4_000_000 });
    return { command: [command, ...args], ownership, available: result.status === 0, output: result.stdout ?? "", limitation: result.error?.message ?? (result.status === 0 ? undefined : result.stderr?.trim()), safeToDelete: false };
  };
  const identity = observe("git", ["rev-parse", "--show-toplevel", "--git-common-dir"], "repository metadata");
  if (!identity.available) throw new Error("Choose a Git working directory; no inventory was performed outside one");
  const observations = [
    identity,
    observe("git", ["worktree", "list", "--porcelain"], "shared repository; each worktree needs its own status check"),
    observe("git", ["status", "--short", "--branch"], "selected working directory; preserve uncommitted files"),
    observe("git", ["for-each-ref", "--format=%(refname) %(objectname) %(upstream)", "refs/heads"], "shared local branches; merge/publication status not established"),
    observe("git", ["stash", "list", "--format=%gd %ci %gs"], "shared repository; not necessarily this task"),
    observe("git", ["clean", "-ndX"], "ignored candidates only; ignored does not mean disposable"),
    observe("lsof", ["-a", "-d", "cwd", "--", directory], "process cwd matches selected directory; task ownership still requires confirmation")
  ];
  if (composeProject) {
    for (const resource of ["container", "volume", "network"]) {
      observations.push(observe("docker", [resource, "ls", ...(resource === "container" ? ["-a"] : []), "--filter", `label=com.docker.compose.project=${composeProject}`, "--format", "{{json .}}"], "exact Compose project label; volume purpose and sharing still require inspection"));
    }
  }
  return { root: directory, capturedAt: new Date().toISOString(), mode: "read-only", observations,
    limits: ["No deletion commands are produced or run.", "No remote refs are refreshed; local ancestry cannot prove current PR merge status.", "Nested process cwd, watchers, mobile devices, shared caches, and task-created temp paths require their native owner tools.", "Unknown ownership must be resolved, never treated as approval to delete."] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values } = parseArgs({ options: { root: { type: "string", default: process.cwd() }, "compose-project": { type: "string" }, output: { type: "string" }, help: { type: "boolean" } } });
  if (values.help) console.log("node inventory.mjs [--root REPO] [--compose-project NAME] [--output NEW.json]\nRead-only ownership evidence. Keep inventories private. Nothing is marked safe to delete.");
  else {
    const report = JSON.stringify(inventory(values.root, values["compose-project"]), null, 2);
    if (values.output) fs.writeFileSync(path.resolve(values.output), report, { flag: "wx", mode: 0o600 });
    else console.log(report);
  }
}
