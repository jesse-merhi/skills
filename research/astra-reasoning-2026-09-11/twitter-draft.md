# Twitter thread draft

Prepared for Jesse to review and post. Nothing has been posted. Attach comparison.png to post 1; add the report link in a separate reply. Counts below use plain Unicode character counts, not the platform's weighted URL count.

## 1 (259 characters)

I ran Astra medium vs xhigh on 3 real Uplinked bugs: small, medium, large. 3 fresh runs per setting/task, 18 attempts total. Medium was faster and cheaper in every pair. Both passed the frozen tests. Then deeper review found defects in ALL 6 large-task fixes.

## 2 (224 characters)

Median time, medium → xhigh:
Small: 2:18 → 4:22
Medium: 2:34 → 6:38
Large: 8:19 → 13:15

Median API-equivalent cost:
$0.96 → $1.64
$1.46 → $2.50
$3.53 → $4.80

These are estimates from token counters, not subscription bills.

## 3 (246 characters)

The cost/hour twist: xhigh was ~16% cheaper per elapsed hour, yet ~52% more expensive for the same 9 submitted tasks. It took ~82% longer. Lower spend/hour can just mean slower progress—not cheaper completed work. I did not measure ChatGPT quota.

## 4 (258 characters)

Quality was the interesting bit. Frozen tests: 18/18 passes. Blinded review then exposed alias, dependency-ordering and recursion edge cases. Xhigh passed more of those selected probes, but every large attempt failed at least one. Test passes ≠ a robust fix.

## 5 (269 characters)

Controls: same source baseline, identical detailed bug briefs, fresh worktrees, no nested agents/web, sequential runs with alternating setting order. Raw input/cache/output/reasoning counters retained. In-run tests and repairs included; setup and later review excluded.

## 6 (273 characters)

Limits: 3 chosen bugs in one private repo, only 3 repeats/cell. Diagnosis-assisted fixes, not open-ended work. Post-hoc probes are exploratory. No universal winner or quota claim. My takeaway: medium can be efficient; subtle code needs deeper verification at either effort.
