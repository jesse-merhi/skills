// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  compactDescription,
  discoverRoots,
  parseLiveSkillsPrompt,
  plainLogSkillReads,
  referencedSkillPaths,
  usageEvidence,
} from "./skill-cleaner.ts";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("skill-cleaner", () => {
  it("limits root discovery to explicitly supplied roots", () => {
    const temporary = mkdtempSync(join(tmpdir(), "skill-cleaner-roots-"));
    temporaryDirectories.push(temporary);
    const defaultRoots = [
      join(temporary, ".codex/skills"),
      join(temporary, ".codex/plugins/cache"),
      join(temporary, "Projects/agent-scripts/skills"),
      join(temporary, "Projects/demo/.agents/skills"),
    ];
    const isolatedRoot = join(temporary, "isolated/skills");
    for (const root of [...defaultRoots, isolatedRoot]) mkdirSync(root, { recursive: true });

    expect(discoverRoots(temporary, [isolatedRoot], true)).toEqual([isolatedRoot]);
    expect(discoverRoots(temporary, [isolatedRoot], false)).toEqual([...defaultRoots, isolatedRoot].sort());
  });

  it("parses Codex skill roots and model-visible lines", () => {
    const raw = JSON.stringify([{
      role: "developer",
      content: [{
        type: "input_text",
        text: `<skills_instructions>
## Skills
### Skill roots
- \`r0\` = \`/tmp/skills\`
### Available skills
- demo: Demo work. (file: r0/demo/SKILL.md)
### How to use skills
</skills_instructions>`,
      }],
    }]);

    const parsed = parseLiveSkillsPrompt(raw);
    expect(parsed.roots.get("r0")).toBe("/tmp/skills");
    expect(parsed.skillLines).toEqual(["- demo: Demo work. (file: r0/demo/SKILL.md)"]);
  });

  it("compacts prose into a readable trigger phrase", () => {
    const compact = compactDescription(
      "Use this skill when the user wants to inspect calendars, compare availability, review conflicts, and schedule a meeting with timezone-aware details.",
      90,
    );
    expect(compact).toBe("inspect calendars, compare availability, review conflicts, and schedule a meeting with...");
    expect(compact.length).toBeLessThanOrEqual(90);
    expect(compact).not.toMatch(/audit, clean, verify/);
  });

  it("extracts user and tool evidence without counting developer prompt listings", () => {
    expect(usageEvidence({ session_id: "abc", text: "use $skill-cleaner", ts: 123 })).toEqual({
      userText: "use $skill-cleaner",
    });
    expect(usageEvidence({
      type: "response_item",
      payload: { type: "function_call", arguments: '{"cmd":"cat /tmp/skills/demo/SKILL.md"}' },
    })).toEqual({ callArgs: '{"cmd":"cat /tmp/skills/demo/SKILL.md"}' });
    expect(usageEvidence({
      type: "response_item",
      payload: { type: "custom_tool_call", input: '{"cmd":"cat /tmp/skills/demo/SKILL.md"}' },
    })).toEqual({ callArgs: '{"cmd":"cat /tmp/skills/demo/SKILL.md"}' });
    expect(usageEvidence({
      type: "response_item",
      payload: { type: "message", role: "developer", content: ["$skill-cleaner"] },
    })).toEqual({});
  });

  it("resolves relative skill reads from function-call workdirs", () => {
    expect(referencedSkillPaths(JSON.stringify({
      cmd: "cat skills/demo/SKILL.md",
      workdir: "/tmp/repo",
    }))).toEqual(["/tmp/repo/skills/demo/SKILL.md"]);
  });

  it("counts command-like plain-log reads but ignores rendered listings", () => {
    expect(plainLogSkillReads([
      "cat skills/demo/SKILL.md",
      "- other: description (file: /tmp/skills/other/SKILL.md)",
    ].join("\n"))).toEqual(["demo"]);
  });
});
