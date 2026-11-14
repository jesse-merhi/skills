# Skill variants

Use this when changing a skill's variants or adding a model. [writing-for-agents](../SKILL.md) links each model's guide.

Read the human-owned, model-neutral `BASE.md` and relevant shared resources first, then the applicable model guide. Astra, Sol (including GPT-6.1 Sol) and Luna share one GPT-6 profile and complete prompt per skill.

Change shared behaviour in the base first, then adapt every supported `variants/<profile>.md`. Existing variants do not override the base. Preserve behaviour, permissions, exact commands, evidence and completion criteria. Model guidance adds no gates or delegation. Share resources and metadata unless runtime behaviour differs.

Keep a complete prompt at every profile path. Byte-identical variants should use relative symlinks to one regular file in the same `variants/` directory. Before a profile-specific edit, replace its link with a copy; review all consuming models when editing shared text. Keep `BASE.md` separate and root `SKILL.md` linked to `variants/gpt-6.md`.

The applicable `AGENTS.md` assigns execution roles. Keep shared skills available to coordinators, reviewers and workers; variants adapt wording, not ownership or authority.

File presence, including these links, records coverage. The materializer copies the selected authored prompt; it does not generate text or call a model. Validate prompts against the base through independent agent exercises and installation through the materializer test.

For a new model, verify its official guidance and update matching in this skill's `scripts/materialize-skill-variants.mjs`. Reuse the family profile when its guidance applies; add a guide and complete variants only when a distinct profile is needed. The script owns same-family fallback and the once-per-session warning. Keep source links and review dates current.
