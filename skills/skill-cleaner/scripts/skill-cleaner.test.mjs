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
  current.skill("Projects/example/.agents/skills", "project-agent-skill");
  current.skill(".codex/skills", "default-user-skill");
  current.write(".codex/history.jsonl", JSON.stringify({ session_id: "default", ts: 1, text: "Use $user-skill." }));
  current.write(".codex/sessions/rollout.log", "Use $user-skill.");
  const rollout = current.write("alternate-codex/sessions/rollout.log", "Use $user-skill.");
  current.link("alternate-codex/sessions", "alternate-codex/archived_sessions");

  const { skills, selectedSkills, usage, logFiles } = JSON.parse(current.report("--deep-logs", "--json"));
  const expectedNames = ["home-agent-skill", "plugin:bundled-skill", "project-agent-skill", "system-skill", "user-skill"];
  assert.deepEqual(skills.map((skill) => skill.name).sort(), expectedNames);
  assert.deepEqual(selectedSkills.map((skill) => skill.name).sort(), expectedNames);
  assert.equal(skills.find((skill) => skill.name === "home-agent-skill")?.scope, "user");
  assert.equal(skills.find((skill) => skill.name === "project-agent-skill")?.scope, "repo");
  assert.deepEqual(logFiles, [rollout]);
  assert.deepEqual(usage[user], { dollar: 1, fileRead: 0, text: 1 });
});

test("preserves history and active session usage under the default and deep log caps", (t) => {
  const current = fixture(t);
  const historySkill = current.skill(".codex/skills", "history-skill");
  const sessionSkill = current.skill(".codex/skills", "session-skill");
  const oversizedSkill = current.skill(".codex/skills", "oversized-skill");
  const maxLogBytes = 4 * 1024;
  const historyText = JSON.stringify({ session_id: "older", ts: 1, text: "Use $history-skill." });
  const sessionText = "Use $session-skill.\n";
  const remainingAfterHistory = maxLogBytes - Buffer.byteLength(historyText);
  const history = current.write(".codex/history.jsonl", historyText);
  const filler = current.write(".codex/sessions/a-filler.log", "A previous session.\n".padEnd(remainingAfterHistory));
  const session = current.write(".codex/sessions/z-active.log", sessionText);
  const archive = current.write(".codex/archived_sessions/rollout.log", "An archived session.\n".padEnd(remainingAfterHistory));
  const oversized = current.write(".codex/sessions/rollout-oversized.log", "Use $oversized-skill.\n".padEnd(maxLogBytes + 1));
  current.link(".codex/sessions", ".openclaw");
  const now = Date.now() / 1000;
  fs.utimesSync(history, now - 90, now - 90);
  fs.utimesSync(filler, now - 60, now - 60);
  fs.utimesSync(session, now - 30, now - 30);
  fs.utimesSync(archive, now - 15, now - 15);
  fs.utimesSync(oversized, now, now);

  const maxLogMb = String(maxLogBytes / (1024 * 1024));
  for (const flags of [[], ["--deep-logs"]]) {
    const { usage } = JSON.parse(current.report("--max-log-mb", maxLogMb, "--json", ...flags));
    assert.deepEqual(
      [usage[historySkill].dollar, usage[sessionSkill].dollar, usage[oversizedSkill].dollar],
      [1, 1, 0],
      flags[0] ?? "default scan",
    );
  }
});

test("keeps built-in and bundled skills out of unused candidates for explicit root aliases", (t) => {
  const current = fixture(t, "linked-codex");
  current.skill("alternate-codex/skills", "user-skill");
  current.skill("alternate-codex/skills/.system", "system-skill");
  current.skill("external/skills", "external-user-skill");
  current.skill("external/skills/.system", "external-system-skill");
  current.skill("external/plugins/cache/marketplace/plugin/1/skills", "bundled-skill");
  current.skill(".agents/skills", "home-agent-skill");
  current.link("alternate-codex", "linked-codex");
  current.link("alternate-codex/skills/.system", "built-ins");
  current.link("external/skills", "linked-alt-skills");
  current.link("external/plugins/cache", "linked-alt-cache");
  current.link(".agents/skills", "linked-home-agents");

  const report = current.report(
    "--root", "~/linked-codex/skills", "--root", "~/built-ins", "--root", "~/linked-alt-skills",
    "--root", "~/linked-alt-cache", "--root", "~/linked-home-agents", "--root-only",
  );
  assert.match(report, /6 discovered, 6 live, 6 considered/);
  const candidates = unusedCandidates(report);
  assert.match(candidates, /^- user-skill: codex;/m);
  assert.match(candidates, /^- external-user-skill: extra;/m);
  assert.match(candidates, /^- home-agent-skill: user;/m);
  assert.doesNotMatch(candidates, /system-skill|bundled-skill/);
});

test("keeps built-in and bundled skills out of unused candidates when scanning nested roots", (t) => {
  const current = fixture(t);
  const systemRoot = "external/skills/.system";
  const pluginRoot = "external/plugins/cache/marketplace/plugin/1/skills";
  current.skill(systemRoot, "system-skill");
  current.skill(pluginRoot, "bundled-skill");

  const report = current.report("--root", `~/${systemRoot}/system-skill`, "--root", `~/${pluginRoot}`, "--root-only");
  assert.match(report, /2 discovered, 2 live, 2 considered/);
  assert.match(unusedCandidates(report), /^- none$/m);
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
            text: "# AGENTS.md instructions for /work\r\n \r\n<INSTRUCTIONS>\r\n```md\r\nUse $coding-standards.\r\n</INSTRUCTIONS>\r\n",
          },
          { type: "input_text", text: "Please use writing-good-tests." },
        ],
      },
    },
    {
      type: "response_item",
      payload: {
        type: "message",
        role: "user",
        internal_chat_message_metadata_passthrough: { content_item_kinds: ["user.text"] },
        content: [{ type: "input_text", text: pasted }],
      },
    },
    {
      type: "response_item",
      payload: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: `Please follow these instructions.\n${pasted}` }],
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
  assert.deepEqual(usage[quoted], { dollar: 4, fileRead: 0, text: 4 });
});

test("skips injected AGENTS.md instructions in plain logs and keeps user mentions", (t) => {
  const current = fixture(t);
  const coding = current.skill(".codex/skills", "coding-standards");
  const testing = current.skill(".codex/skills", "writing-good-tests");
  current.write(".codex/sessions/rollout.log", [
    "~~~",
    "<INSTRUCTIONS>",
    "Use `$writing-good-tests`.",
    "</INSTRUCTIONS>",
    "# AGENTS.md instructions for /work",
    "",
    "<INSTRUCTIONS>",
    "````xml",
    "```",
    "</INSTRUCTIONS>",
    "````",
    "~~~xml",
    "</INSTRUCTIONS>",
    "~~~",
    "```foo```",
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
