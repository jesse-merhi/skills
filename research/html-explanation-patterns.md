# Better HTML explanations

Research date: 2026-07-31

## Outcome

The current `html-explanations` gallery is broad, but it is not a strong default
library. It has 20 large pages whose differences are often visual or
task-specific rather than structural. That makes an agent search a lot of HTML
without learning the central lesson: the page shape should follow the reader's
question.

Replace the default gallery with a small set of repo-owned patterns:

1. **Decision brief** — recommendation, criteria, evidence, trade-offs, next
   action.
2. **Code flow** — observable result, invariant, flow, exact files and symbols,
   proof.
3. **Incident report** — impact, timeline, causal chain, recovery, follow-ups.
4. **Interactive model** — assumptions, live result, sensitivity, formula and
   source data.
5. **Concept lesson** — mission, invariant, worked example, edge cases,
   retrieval check.
6. **Implementation plan** — target behavior, phases and dependencies, risks,
   acceptance proof.

Keep the upstream galleries as research references, not as the templates an
agent copies by default.

## What is weak in the current gallery

- **Too many near-peers.** Twenty examples make selection harder. Several are
  different interfaces or themes rather than different explanation strategies.
- **The visual shell leads.** Cards, badges, gradients, and fictional product
  chrome can dominate the actual claim and evidence.
- **Some controls are demonstrations, not explanations.** Interaction should
  let a reader test a claim or inspect a state. A control that merely makes the
  page feel like an app adds work without improving understanding.
- **The examples are large.** Copying a 400–800 line page encourages cargo-cult
  editing and leaves stale sample details behind.
- **The quality bar is implicit.** The gallery does not make narrow-screen
  reflow, keyboard operation, reduced motion, print behavior, and evidence
  labeling obvious requirements.

These are maintenance observations about the local vendored copy, not claims
about every possible use of the upstream project.

## What the stronger references do

### Start with the answer

GOV.UK's content patterns use a single lead paragraph to summarize a page and
recommend readable line lengths rather than full-width prose. Its layout
guidance is mobile-first and usually starts with one column. This supports a
simple first viewport: status or topic, answer, short summary, then the visual
body.

Sources:

- [GOV.UK paragraph and lead paragraph guidance](https://design-system.service.gov.uk/styles/paragraphs/)
- [GOV.UK layout guidance](https://design-system.service.gov.uk/styles/layout/)

### Couple claims with the thing that proves them

Distill's explainers place prose, diagrams, and manipulable examples next to
the concept they explain. MDN's live-example guidance similarly asks authors to
show the code and its exact output, introduce why the example matters, and
explain the result immediately afterward. The reusable pattern is not
"interactive article"; it is **claim → inspectable example → interpretation**.

Sources:

- [Distill: Feature Visualization](https://distill.pub/2017/feature-visualization/)
- [MDN live samples](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Page_structures/Live_samples)
- [MDN code example guidelines](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Page_structures/Code_examples)

### Use interaction only when it changes understanding

Observable Plot's composable marks and small multiples are useful because they
let a reader compare the same measure across conditions. A slider, toggle, or
filter earns its place when it changes an assumption and makes the consequence
visible. Static facts should stay static.

Source:

- [Observable Plot features](https://observablehq.com/plot/features/plots)

### Let the document stay a document

Tufte CSS demonstrates a durable alternative to dashboard chrome: readable
measure, nearby annotations, figures integrated with prose, and progressive
detail. This is especially useful for code walkthroughs and concept lessons,
where a long chain of cards can fragment the argument.

Sources:

- [Tufte CSS demonstration](https://edwardtufte.github.io/tufte-css/)
- [Tufte CSS source](https://github.com/edwardtufte/tufte-css)

### Hide only optional detail

GOV.UK recommends testing whether a page works without an accordion before
using one and warns against hiding content every reader needs. In these
explanations, `<details>` should hold long code, raw logs, formulas, or source
notes—not the recommendation, key evidence, or required next action.

Source:

- [GOV.UK accordion guidance](https://design-system.service.gov.uk/components/accordion/)

### Make reflow a designed state

WCAG's reflow guidance uses 320 CSS pixels as the narrow reference and expects
content to work without two-dimensional scrolling except where the content
itself requires it, such as a data table. Large controls should have generous
targets; WCAG's enhanced target criterion uses 44 by 44 CSS pixels.

Sources:

- [WCAG 2.2: Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow)
- [WCAG 2.2: Understanding Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced)

## Assessment of the new upstream Codex HTML examples

Thariq Shafi's newer `unknowns/` gallery contains eleven useful prompts:
blindspot analysis, teaching an unfamiliar concept, comparing design
directions, mocking a toolbar, brainstorming churn interventions, interviewing
the user, porting a visual reference, making a tweakable plan, recording
implementation notes, writing a buy-in document, and quizzing before merge.

The strongest ideas to absorb are:

- state assumptions and unknowns beside the plan;
- compare genuinely different directions against shared criteria;
- make plans inspectable and adjustable;
- end teaching or change explanations with a retrieval check.

The pages are still 200–1,000 line bespoke artifacts with a shared editorial
visual treatment. Importing all eleven would deepen the selection and
maintenance problem. Their ideas belong in the pattern guidance; their markup
does not need to become the default template set.

Source:

- [ThariqS/html-effectiveness `unknowns` gallery](https://github.com/ThariqS/html-effectiveness/tree/1787245d94aa680edf18b52027e3f859032776ba/unknowns)

## Proposed quality contract

Every repo-owned example should satisfy this checklist:

- The first viewport states the answer, result, or target behavior.
- The main prose measure stays near 70–75 characters.
- Layout becomes one column at 320 CSS pixels without page-level horizontal
  scrolling.
- Color is not the only carrier of status.
- Controls are keyboard reachable, have visible labels, and use comfortable
  hit targets.
- Motion honors `prefers-reduced-motion`.
- Print removes controls and decorative background while keeping the argument.
- Code blocks override inline-code pill styles and scroll inside their own
  container.
- JavaScript has no console errors and exists only where a reader can test or
  inspect a claim.
- Exact evidence—files, symbols, commands, dates, measurements, or source
  links—sits next to the claim it supports.

## Implementation recommendation

Make the six repo-owned patterns the documented first choice. Keep one compact
base template for small one-off pages. Remove the current vendored gallery and
keep its upstream repository as a cited research reference. Do not add the new
`unknowns/` HTML files. Fold their best reasoning ideas into the concept,
decision, and plan patterns instead.
