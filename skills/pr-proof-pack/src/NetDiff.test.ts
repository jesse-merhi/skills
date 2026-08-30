import { assert, describe, it } from "@effect/vitest"

import { changeBreakdownFromNumStat, parseNumStat, proofHintForPath } from "./NetDiff.ts"

describe("PR net diff change breakdown", () => {
  it("groups direct-base LOC by reviewer-meaningful part", () => {
    const report = changeBreakdownFromNumStat(parseNumStat([
      "120\t18\tsrc/review/runner.ts",
      "44\t3\ttest/review/runner.test.ts",
      "12\t2\tdocs/review.md",
      "8\t1\t.github/workflows/check.yml",
      "2\t2\tpnpm-lock.yaml"
    ].join("\n")))

    assert.deepStrictEqual(report.parts, [
      { part: "Implementation", files: 1, additions: 120, deletions: 18, binaryFiles: 0 },
      { part: "Tests and fixtures", files: 1, additions: 44, deletions: 3, binaryFiles: 0 },
      { part: "Documentation", files: 1, additions: 12, deletions: 2, binaryFiles: 0 },
      { part: "CI, config, and tooling", files: 1, additions: 8, deletions: 1, binaryFiles: 0 },
      { part: "Dependencies and generated files", files: 1, additions: 2, deletions: 2, binaryFiles: 0 }
    ])
    assert.deepStrictEqual(report.total, { files: 5, additions: 186, deletions: 26, binaryFiles: 0 })
  })

  it("counts binary files without pretending they have textual LOC", () => {
    const report = changeBreakdownFromNumStat(parseNumStat("-\t-\tassets/proof.png\n3\t1\tREADME.md"))

    assert.deepStrictEqual(report.parts, [
      { part: "Implementation", files: 1, additions: 0, deletions: 0, binaryFiles: 1 },
      { part: "Documentation", files: 1, additions: 3, deletions: 1, binaryFiles: 0 }
    ])
    assert.deepStrictEqual(report.total, { files: 2, additions: 3, deletions: 1, binaryFiles: 1 })
  })

  it("classifies root UI paths without treating app API routes as UI", () => {
    for (const [path, expected] of [
      ["app/page.tsx", /actual product pixels/], ["pages/index.tsx", /actual product pixels/],
      ["components/Button.tsx", /actual product pixels/], ["components/Router.tsx", /actual product pixels/],
      ["src/components/JobCard.tsx", /actual product pixels/], ["src/components/User.server.tsx", /actual product pixels/],
      ["src/routes/account.route.tsx", /actual product pixels/], ["src/app/api/users/route.ts", /Practical backend proof required/],
      ["src/app/users/route.ts", /Practical backend proof required/], ["src/components/api/Badge.tsx", /actual product pixels/],
      ["src/api/workers/job.ts", /Practical operator proof required/], ["src/api.ts", /Practical backend proof required/],
      ["routes/users.ts", /Practical backend proof required/], ["routes/account.tsx", /actual product pixels/],
      ["styles/theme.css.ts", /actual product pixels/], ["api.py", /Practical backend proof required/],
      ["src/api.go", /Practical backend proof required/], ["src/routes.ts", /Practical backend proof required/],
      ["src/handlers.ts", /Practical backend proof required/], ["src/controllers.ts", /Practical backend proof required/],
      ["app/api/users/schema.ts", /Practical backend proof required/], ["src/app/api/page.tsx", /actual product pixels/],
      ["src/styles/theme.ts", /actual product pixels/], ["components/README.md", /Practical documentation proof required/],
      ["app/README.md", /Practical documentation proof required/], ["pages/README.md", /Practical documentation proof required/],
      ["src/app/page.mdx", /actual product pixels/], ["src/components/Card.mdx", /actual product pixels/],
      ["src/components/README.mdx", /Practical documentation proof required/], ["src/pages/api/users.ts", /Practical backend proof required/],
      ["src/pages/reference/api/index.tsx", /actual product pixels/], ["src/styles.ts", /actual product pixels/],
      ["src/app/docs/page.tsx", /actual product pixels/], ["src/pages/specs/index.tsx", /actual product pixels/],
      ["app/jobs/report_job.rb", /Practical operator proof required/], ["src/routes/about.mdx", /actual product pixels/],
      ["src/users.routes.ts", /Practical backend proof required/], ["src/auth.server.ts", /Practical backend proof required/],
      ["src/app/card/card.component.html", /actual product pixels/], ["src/pages/index.astro", /actual product pixels/],
      ["src/components/Card.styles.ts", /actual product pixels/], ["docs/theme.css", /actual product pixels/],
      ["src/user_handler.py", /Practical backend proof required/], ["src/server-config.go", /Practical backend proof required/],
      ["src/UserController.java", /Practical backend proof required/], ["src/components/LoginViewModel.ts", /actual product pixels/],
      ["src/app/services/ThemeService.ts", /actual product pixels/], ["src/apis/users.ts", /Practical backend proof required/],
      ["src/servers/http.ts", /Practical backend proof required/], ["src/APIClient.ts", /Practical backend proof required/],
      ["app/models/user.py", /Practical backend proof required/], ["app/routers/users.py", /Practical backend proof required/],
      ["app/mailers/user_mailer.rb", /Practical backend proof required/], ["app/actions/createUser.ts", /Practical backend proof required/], ["src/routes/+page.ts", /actual product pixels/], ["src/routes/+layout.ts", /actual product pixels/],
      ["app/services/payment_processor.rb", /Practical backend proof required/], ["app/graphql/user_resolver.rb", /Practical backend proof required/], ["app/src/main/data/UserRepository.kt", /Practical behavior proof required/], ["components/cache/client.go", /Practical behavior proof required/],
      ["src/app/app.routes.ts", /actual product pixels/], ["src/app/card/card.component.ts", /actual product pixels/], ["src/app/card/card.directive.ts", /actual product pixels/], ["src/components/logo.svg", /actual product pixels/], ["src/app/templates/application.hbs", /actual product pixels/], ["src/components/my-element.ts", /actual product pixels/], ["src/components/server/client.ts", /Practical backend proof required/], ["app/src/main/java/com/example/MainActivity.java", /actual product pixels/], ["app/MainPage.cs", /actual product pixels/], ["app/src/main/java/com/example/UserService.java", /Practical behavior proof required/]
    ] as const) assert.match(proofHintForPath(path), expected)
    assert.match(proofHintForPath("components/Label.tsx"), /where appearance is not the claim, use copyable text instead/); assert.match(proofHintForPath("src/unknown.ts"), /actual product pixels.*recording.*both/s)
  })
})
