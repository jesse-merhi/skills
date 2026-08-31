import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"

import { allowedScopeGrowth, decodeFinding, deriveRuntimeOutcome, type FindingInput } from "./ReviewFindings.ts"

const runtimeFinding = {
  decisionId: "D1",
  status: "open",
  source: "cold-review",
  fingerprint: "src/queue.ts schedule payload ownership",
  summary: "Reachable scheduled work exceeds the platform contract",
  area: "workflow",
  material: false,
  userImpact: "Operators lose queued work until they retry.",
  decision: "Fix the owning queue boundary.",
  text: "",
  findingKind: "runtime",
  productionPath: "supported request -> queue producer -> scheduler",
  reachabilityEvidence: "A current caller produces the measured payload.",
  likelihood: "likely",
  impact: "medium",
  actualConsequence: "The scheduler rejects the job and the request fails.",
  maintenanceEvidence: "",
  presentCost: "",
  contractEvidence: "The scheduler contract accepts jobs below its documented limit; this payload exceeds it.",
  rootCause: "The queue boundary owns copied payloads instead of durable work identifiers.",
  recommendedFix: "Persist the work and schedule its identifier.",
  interventionJustification: "The supported path currently loses work; using the existing job store removes the payload failure without a new fallback.",
  rejectionGate: "",
  fixScope: "local",
  handling: "fix",
  ownerResolution: ""
} satisfies FindingInput

describe("review scope growth", () => {
  it("uses exactly 30 percent with no absolute floor", () => {
    assert.strictEqual(allowedScopeGrowth(1, 30), 0)
    assert.strictEqual(allowedScopeGrowth(40, 30), 12)
    assert.strictEqual(allowedScopeGrowth(600, 30), 180)
  })
})

describe("review finding risk outcomes", () => {
  it("derives every severity and disposition from likelihood and impact", () => {
    const cases = [
      ["likely", "low", "p3", "accept"], ["likely", "medium", "p2", "accept"],
      ["likely", "high", "p1", "accept"], ["likely", "critical", "p0", "accept"],
      ["possible", "low", "", "reject"], ["possible", "medium", "p2", "accept"],
      ["possible", "high", "p1", "accept"], ["possible", "critical", "p1", "accept"],
      ["rare", "low", "", "reject"], ["rare", "medium", "", "reject"],
      ["rare", "high", "p2", "consult"], ["rare", "critical", "p1", "consult"],
      ["unknown", "low", "", "investigate"], ["unknown", "medium", "", "investigate"],
      ["unknown", "high", "", "investigate"], ["unknown", "critical", "", "investigate"],
      ["theoretical", "low", "", "reject"], ["theoretical", "medium", "", "reject"],
      ["theoretical", "high", "", "reject"], ["theoretical", "critical", "", "reject"]
    ] as const
    for (const [likelihood, impact, severity, disposition] of cases) {
      assert.deepStrictEqual(deriveRuntimeOutcome(likelihood, impact), { severity, disposition })
    }
  })

  it.effect("accepts an actionable finding only with complete repair evidence", () =>
    decodeFinding(runtimeFinding).pipe(
      Effect.map((finding) => {
        assert.strictEqual(finding.disposition, "accept")
        assert.strictEqual(finding.recommendedFix, "Persist the work and schedule its identifier.")
      })
    ))

  it.effect("rejects an actionable finding without root-cause repair evidence", () =>
    decodeFinding({ ...runtimeFinding, rootCause: "" }).pipe(
      Effect.flip,
      Effect.map((error) => assert.match(error.message, /actionable findings require --root-cause/u))
    ))

  it.effect("keeps optional repairs off rejected candidates", () =>
    decodeFinding({
      ...runtimeFinding,
      status: "rejected",
      likelihood: "theoretical",
      decision: "No current producer reaches the claimed state.",
      rejectionGate: "reality",
      rootCause: "",
      interventionJustification: ""
    }).pipe(
      Effect.flip,
      Effect.map((error) => assert.match(error.message, /reject candidates must omit repair field --recommended-fix/u))
    ))

  it.effect("records the gate that rejected a candidate", () =>
    decodeFinding({
      ...runtimeFinding,
      status: "rejected",
      likelihood: "theoretical",
      decision: "No current producer reaches the claimed state.",
      rejectionGate: "reality",
      rootCause: "",
      recommendedFix: "",
      interventionJustification: ""
    }).pipe(
      Effect.map((finding) => {
        assert.strictEqual(finding.disposition, "reject")
        assert.strictEqual(finding.rejectionGate, "reality")
      })
    ))

  it.effect("requires a rejection gate before discarding a candidate", () =>
    decodeFinding({
      ...runtimeFinding,
      status: "rejected",
      likelihood: "theoretical",
      decision: "No current producer reaches the claimed state.",
      rootCause: "",
      recommendedFix: "",
      interventionJustification: ""
    }).pipe(
      Effect.flip,
      Effect.map((error) => assert.match(error.message, /rejected candidates require --rejection-gate/u))
    ))

  it.effect("can reject a proven maintenance concern whose intervention is not worthwhile", () =>
    decodeFinding({
      ...runtimeFinding,
      status: "rejected",
      findingKind: "maintenance",
      productionPath: "",
      reachabilityEvidence: "",
      likelihood: "",
      impact: "",
      actualConsequence: "",
      contractEvidence: "",
      maintenanceEvidence: "The changed helper duplicates an existing branch.",
      presentCost: "Readers must compare both branches before changing behavior.",
      rootCause: "",
      recommendedFix: "",
      interventionJustification: "",
      rejectionGate: "repair",
      handling: "reject",
      decision: "Removing it now would create more churn than the current reading cost."
    }).pipe(
      Effect.map((finding) => {
        assert.strictEqual(finding.disposition, "reject")
        assert.strictEqual(finding.rejectionGate, "repair")
      })
    ))
})
