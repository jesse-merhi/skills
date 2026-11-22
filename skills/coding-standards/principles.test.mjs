import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { decodeCatalog } from "./catalog.schema.ts";

test("the read-expectations sheet includes every catalog standard verbatim", () => {
  const catalog = decodeCatalog(fs.readFileSync(new URL("./catalog.json", import.meta.url), "utf8"));
  const sheet = fs.readFileSync(new URL("./principles.md", import.meta.url), "utf8");
  const entries = sheet.trimEnd().split(/^## /m).slice(1);
  const expected = catalog.standards.map(({ title, id, scope, principle }) =>
    `${title}\n\n\`${id}\` · \`${scope}\`\n\n${principle}`);
  assert.deepEqual(entries.map((entry) => entry.trimEnd()), expected);
});
