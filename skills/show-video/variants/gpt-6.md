---
name: show-video
description: Demonstrate UI, API or CLI changes in video, on request or when reporting visible changes and review fixes.
---

# Show video

Deliver an edited video, built from real application or terminal recordings, that shows what changed and the observable result.

## When to use it

Use video proactively when seeing a UI interaction, API exchange or CLI flow would make an implemented change or review fix easier to assess. Plan it while choosing proof so you can record a baseline before editing. Skip it for text-only requests and changes with no caller-visible difference. If capture isn't possible, deliver screenshots or request/response evidence and state the limit; an explicit video request still needs a video or a clear blocker.

## Get a real baseline

Show the shortest journey that demonstrates the change. Reuse recordings that still match the final revision. For before-and-after, record a genuine baseline and the changed build with equivalent data, permissions, viewport, theme and starting state. Capture the baseline before editing when you can; otherwise recover an earlier recording or run the prior build in isolation. Never reset or switch an active checkout, overwrite pending edits or repoint a shared stack to get one.

If no baseline is available, or a proactive demo would need substantial setup to rebuild one, deliver a clearly labelled after-only demonstration. If the user explicitly asked for A/B proof, report what's missing instead of calling an after-only video complete. Never fabricate previous behaviour; label any mockup, which doesn't count as recorded evidence.

## Record

Use safe demo data and keep credentials, private records, auth headers and unrelated windows out of frame. Exercise the real controls and show their effect. For backend or CLI work, record a real request, command or operator flow and its output; logs support UI proof but don't replace it. For API changes, show the method, route, safe inputs, status and changed fields, and include sanitized request/response text alongside the video. Run mutations only in a local or test environment, never as production writes. Label responsive web footage as such; it isn't native or device proof. Note action and result timestamps for alignment.

## Edit

For a change to existing behaviour, default to a simultaneous side-by-side: **A · Before** on the left, **B · After** on the right, labels visible throughout, with corresponding actions aligned. Playing the old flow and then the new one is not A/B. When a step disappeared, hold the shorter side on its result while the longer catches up. Use equal scale and matching crops.

Open with a short title and the user outcome, caption each difference as it happens, and end on the result. Aim for 30–60 seconds for a small change, silent with captions unless narration is requested.

Keep delays and intermediate states that are evidence of the behaviour, and count steps from the actual actions. Disclose pauses, cuts or speed changes that affect the comparison, for example "Pauses added to align actions." An edited video is not a benchmark: claims like "faster" need separate unedited measurements under comparable conditions.

Use the media guidance and `proof-media inspect` and `proof-media cut` commands in [pr-proof-pack](../pr-proof-pack/SKILL.md) when available, with an installed editor or FFmpeg for composition. Export H.264 MP4 in yuv420p with fast-start metadata, typically 30 fps at 1080p or higher.

## Verify and deliver

Inspect the final export, not just its sources: check every comparison beat at viewing size for readability, clipping, matched states and correct labels. Watch playback where possible; otherwise inspect frames at key timestamps and report that playback wasn't checked. Decode the whole file to catch broken frames or truncation, and check duration, dimensions and codec.

Show the video in the host's viewer with a direct file link. Where the host supports Markdown video embeds, also embed the absolute MP4 path using image syntax. For a PR, upload the media through [pr-proof-pack](../pr-proof-pack/SKILL.md); local paths only work in the host viewer. State what the clip shows and any material limit, without claiming playback, device coverage, speedups or uploads you didn't verify.
