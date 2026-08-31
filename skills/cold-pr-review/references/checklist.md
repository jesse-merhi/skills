# Neutral checklist

Give the reviewer enough structure to be effective without leaking prior
rationale:

- Start with `review-flow-map`: identify changed flows, entrypoints,
  contracts, state, side effects, risk areas, and validation targets.
- Apply `frontend-ui-validation` expectations when rendered UI changed. The
  reviewer may request browser validation if screenshots or computed styles
  would materially affect confidence.
- Apply `pr-rubbish-audit` expectations to look for unrelated churn, dangerous
  removals, generated drift, stale branch-history comments, and unneeded
  refactors.
- Apply `typescript-discipline` expectations. If TypeScript production code,
  shared types, schemas, API/client contracts, exported helpers, typed React,
  casts, `any`, `unknown`, or ts-ignore comments changed, type-boundary and
  contract problems are actionable findings.
- Apply `improve-codebase-architecture` for boundary, dependency direction,
  ownership, and refactor-shape risks.
- Apply `reducing-cognitive-load` for dense, clever, stringly typed, weakly
  typed, over-abstracted, or hard-to-maintain code.
- Use `finding-discipline`: report only concrete actionable findings tied to
  changed lines or contracts, not style nits or vague risks. Require its
  reality, importance, and repair-quality gates before returning a finding.
