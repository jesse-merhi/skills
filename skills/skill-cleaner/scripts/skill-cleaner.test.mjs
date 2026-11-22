import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

function fixture(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "skill-cleaner-"));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const write = (relativePath, content) => {
    const file = path.join(home, relativePath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return fs.realpathSync(file);
  };
  return {
    write,
    skill(directory, name) {
      return write(`${directory}/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Fixture for ${name}\n---\n`);
    },
    report(...args) {
      const script = fileURLToPath(new URL("./skill-cleaner", import.meta.url));
      return execFileSync(process.execPath, [script, "--no-live", "--model", "gpt-6", "--context-tokens", "128000", ...args], {
        encoding: "utf8",
        env: { ...process.env, HOME: home, USERPROFILE: home },
      });
    },
  };
}

function unusedCandidates(report) {
  return report.split("## Unused Candidates\n")[1]?.split("\n## ")[0];
}

test("surfaces unused user-installed Codex skills without system and plugin entries", (t) => {
  const current = fixture(t);
  current.skill(".codex/skills", "user-skill");
  current.skill(".codex/skills/.system", "system-skill");
  current.skill(".codex/plugins/cache/marketplace/plugin/1/skills", "bundled-skill");

  const report = current.report();
  assert.match(report, /3 discovered, 3 live, 3 considered/);
  const candidates = unusedCandidates(report);
  assert.match(candidates, /^- user-skill: codex;/m);
  assert.doesNotMatch(candidates, /system-skill|bundled-skill/);
});

test("counts real Codex skill mentions before and after injected AGENTS.md instructions", (t) => {
  const current = fixture(t);
  const coding = current.skill(".codex/skills", "coding-standards");
  const testing = current.skill(".codex/skills", "writing-good-tests");
  const records = [
    {
      type: "response_item",
      payload: {
        type: "message",
        role: "user",
        content: [{
          type: "input_text",
          text: "# AGENTS.md instructions for /work\n\n<INSTRUCTIONS>\nRead `coding-standards`.\n</INSTRUCTIONS>",
        }],
      },
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: "Please use `writing-good-tests`.\n<INSTRUCTIONS>\nUse `$coding-standards`.\n</INSTRUCTIONS>\nRead writing-good-tests before editing.",
      },
    },
  ];
  current.write(".codex/sessions/rollout.jsonl", records.map((record) => JSON.stringify(record)).join("\n"));

  const { usage } = JSON.parse(current.report("--json"));
  assert.deepEqual(usage[coding], { dollar: 0, fileRead: 0, text: 0 });
  assert.deepEqual(usage[testing], { dollar: 0, fileRead: 0, text: 2 });
});
