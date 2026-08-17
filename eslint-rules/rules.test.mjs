import parser from "@typescript-eslint/parser"
import { Linter } from "eslint"
import { assert, describe, it } from "vitest"

import noBannerComments from "./no-banner-comments.js"
import noLargeTestSnapshots from "./no-large-test-snapshots.js"
import noTrivialForwardingWrapper from "./no-trivial-forwarding-wrapper.js"

const rules = {
  banner: noBannerComments,
  forwarding: noTrivialForwardingWrapper,
  snapshot: noLargeTestSnapshots
}

const verify = (source, rule, filename = "example.ts") => new Linter().verify(source, [{
  files: ["**/*.ts"],
  languageOptions: { parser },
  plugins: { local: { rules } },
  rules: { [`local/${rule}`]: "error" }
}], { filename })

describe("local lint rules", () => {
  it("rejects named forwarding wrappers but permits type predicates", () => {
    assert.lengthOf(verify("const capture = (value: string) => target(value)", "forwarding"), 1)
    assert.lengthOf(verify("const isString = (value: unknown): value is string => typeof value === 'string'", "forwarding"), 0)
    assert.lengthOf(verify("const capture = async (value: string) => target(value)", "forwarding"), 0)
    assert.lengthOf(verify("function* capture(value: string) { return target(value) }", "forwarding"), 0)
  })

  it("rejects decorative banners and broad ordinary snapshots", () => {
    assert.lengthOf(verify("// ----------\nconst value = 1", "banner"), 1)
    assert.lengthOf(verify("expect(value).toMatchSnapshot()", "snapshot", "ordinary.test.ts"), 1)
    assert.lengthOf(verify("expect(value).toMatchSnapshot()", "snapshot", "deliberate.snapshot.test.ts"), 0)
  })
})
