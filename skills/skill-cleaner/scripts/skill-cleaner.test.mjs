import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

function fixture(t, codexDirectory = ".codex") {
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
    link(target, relativePath) {
      const link = path.join(home, relativePath);
      fs.mkdirSync(path.dirname(link), { recursive: true });
      fs.symlinkSync(path.join(home, target), link, "dir");
    },
    skill(directory, name) {
      return write(`${directory}/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Fixture for ${name}\n---\n`);
    },
    report(...args) {
      const script = fileURLToPath(new URL("./skill-cleaner", import.meta.url));
      return execFileSync(process.execPath, [script, "--no-live", "--model", "gpt-6", "--context-tokens", "128000", ...args], {
        encoding: "utf8",
        env: { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: codexDirectory ? path.join(home, codexDirectory) : "" },
      });
    },
  };
}

function unusedCandidates(report) {
  return report.split("## Unused Candidates\n")[1]?.split("\n## ")[0];
}

test("surfaces unused user-installed Codex skills without system and plugin entries", (t) => {
  const current = fixture(t, "");
  current.skill(".codex/skills", "user-skill");
  current.skill(".codex/skills/.system", "system-skill");
  current.skill(".codex/plugins/cache/marketplace/plugin/1/skills", "bundled-skill");

  const report = current.report();
  assert.match(report, /3 discovered, 3 live, 3 considered/);
  const candidates = unusedCandidates(report);
  assert.match(candidates, /^- user-skill: codex;/m);
  assert.doesNotMatch(candidates, /system-skill|bundled-skill/);
});

test("uses the alternate CODEX_HOME and home agent skills without counting default Codex skills or logs", (t) => {
  const current = fixture(t, "alternate-codex");
  const user = current.skill("alternate-codex/skills", "user-skill");
  current.skill("alternate-codex/skills/.system", "system-skill");
  current.skill("alternate-codex/plugins/cache/marketplace/plugin/1/skills", "bundled-skill");
  current.skill(".agents/skills", "home-agent-skill");
  current.skill(".codex/skills", "default-user-skill");
  current.write(".codex/history.jsonl", JSON.stringify({ session_id: "default", ts: 1, text: "Use $user-skill." }));
  current.write(".codex/sessions/rollout.log", "Use $user-skill.");
  const rollout = current.write("alternate-codex/sessions/rollout.log", "Use $user-skill.");
  current.link("alternate-codex/sessions", "alternate-codex/archived_sessions");

  const { skills, selectedSkills, usage, logFiles } = JSON.parse(current.report("--deep-logs", "--json"));
  const expectedNames = ["home-agent-skill", "plugin:bundled-skill", "system-skill", "user-skill"];
  assert.deepEqual(skills.map((skill) => skill.name).sort(), expectedNames);
  assert.deepEqual(selectedSkills.map((skill) => skill.name).sort(), expectedNames);
  assert.deepEqual(logFiles, [rollout]);
  assert.deepEqual(usage[user], { dollar: 1, fileRead: 0, text: 1 });
});

test("keeps built-in skills out of unused candidates for explicit skill roots and aliases", (t) => {
  const current = fixture(t, "linked-codex");
  current.skill("alternate-codex/skills", "user-skill");
  current.skill("alternate-codex/skills/.system", "system-skill");
  current.skill("alternate-codex/plugins/cache/marketplace/plugin/1/skills", "bundled-skill");
  current.skill("external/skills", "external-user-skill");
  current.skill("external/skills/.system", "external-system-skill");
  current.link("alternate-codex", "linked-codex");
  current.link("alternate-codex/skills/.system", "built-ins");

  const report = current.report("--root", "~/linked-codex/skills", "--root", "~/built-ins", "--root", "~/external/skills", "--root-only");
  assert.match(report, /4 discovered, 4 live, 4 considered/);
  const candidates = unusedCandidates(report);
  assert.match(candidates, /^- user-skill: codex;/m);
  assert.match(candidates, /^- external-user-skill: extra;/m);
  assert.doesNotMatch(candidates, /system-skill|bundled-skill/);
});

test("counts explicit user messages and filters injected instructions per response text item", (t) => {
  const current = fixture(t);
  const coding = current.skill(".codex/skills", "coding-standards");
  const testing = current.skill(".codex/skills", "writing-good-tests");
  const quoted = current.skill(".codex/skills", "writing-for-agents");
  const pasted = "# AGENTS.md instructions for /work\n\n<INSTRUCTIONS>\nUse $writing-for-agents:\n</INSTRUCTIONS>";
  const records = [
    {
      type: "response_item",
      payload: {
        type: "message",
        role: "user",
        internal_chat_message_metadata_passthrough: {
          content_item_kinds: ["agents_md.instructions", null, null, null],
        },
        content: [
          { type: "input_text", text: "Read coding-standards." },
          { type: "input_text", text: "# AGENTS.md instructions\n\n<INSTRUCTIONS>\nRead coding-standards.\n</INSTRUCTIONS>" },
          {
            type: "input_text",
            text: [
              "# AGENTS.md instructions for /work",
              "",
              "<INSTRUCTIONS>",
              "````xml",
              "```",
              "</INSTRUCTIONS>",
              "# AGENTS.md instructions for /example",
              "<INSTRUCTIONS>",
              "````",
              "~~~xml",
              "</INSTRUCTIONS>",
              "~~~",
              "Read coding-standards.",
              "</INSTRUCTIONS>",
            ].join("\n"),
          },
          { type: "input_text", text: "Please use writing-good-tests." },
        ],
      },
    },
    {
      type: "event_msg",
      payload: {
        type: "user_message",
        message: pasted,
      },
    },
  ];
  current.write(".codex/sessions/rollout.jsonl", records.map((record) => JSON.stringify(record)).join("\n"));
  current.write(".codex/history.jsonl", JSON.stringify({ session_id: "history", ts: 1, text: pasted }));

  const { usage } = JSON.parse(current.report("--json"));
  assert.deepEqual(usage[coding], { dollar: 0, fileRead: 0, text: 0 });
  assert.deepEqual(usage[testing], { dollar: 0, fileRead: 0, text: 1 });
  assert.deepEqual(usage[quoted], { dollar: 2, fileRead: 0, text: 2 });
});

test("skips injected AGENTS.md instructions in plain logs and keeps user mentions", (t) => {
  const current = fixture(t);
  const coding = current.skill(".codex/skills", "coding-standards");
  const testing = current.skill(".codex/skills", "writing-good-tests");
  current.write(".codex/sessions/rollout.log", [
    "<INSTRUCTIONS>",
    "Use `$writing-good-tests`.",
    "</INSTRUCTIONS>",
    "# AGENTS.md instructions for /work",
    "",
    "<INSTRUCTIONS>",
    "Read `coding-standards` in skills/coding-standards/SKILL.md.",
    "</INSTRUCTIONS>",
    "<INSTRUCTIONS>",
    "Please read writing-good-tests before editing.",
    "</INSTRUCTIONS>",
    "</INSTRUCTIONS>",
  ].join("\n"));

  const { usage } = JSON.parse(current.report("--json"));
  assert.deepEqual(usage[coding], { dollar: 0, fileRead: 0, text: 0 });
  assert.deepEqual(usage[testing], { dollar: 1, fileRead: 0, text: 2 });
});
