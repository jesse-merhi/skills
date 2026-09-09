# Original skill prompts

The 44 original `SKILL.md` prompts are preserved here verbatim, alongside the
maintained model-specific versions in [`../skills/`](../skills/). The directory
layout mirrors `skills/`, including nested OpenClaw skills.

These are frozen source copies for comparison and future authoring, not a fifth
model profile. The installer only reads `skills/`, so it does not install or load
these originals. Keep their text unchanged when updating the model variants.

## Provenance

- The 43 skills already on main come from commit
  `12e6aa3aa17087410a907ed2a73bc2ca38e47b82`, the pre-conversion main snapshot.
- [`model-writing-guides/SKILL.md`](model-writing-guides/SKILL.md) was added on
  the feature branch. Its source is commit
  `1943d066fac0a629472106867270d715ce3d8128`, the last version before its standalone
  entry prompt was replaced with a model-variant symlink.

Only the entry prompts are archived here. Their relative references and helper
commands describe the repository at those commits; this directory is not a
standalone installation of the historical scripts, assets, or reference files.
Use Git at the recorded revision when you need the complete historical skill.

For example, compare [`diagnose/SKILL.md`](diagnose/SKILL.md) with the maintained
[`diagnose` variants](../skills/diagnose/variants/).
