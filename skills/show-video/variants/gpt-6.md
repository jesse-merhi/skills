---
name: show-video
description: Demonstrate UI, API or CLI changes in video, on request or when reporting visible changes and review fixes.
---

# Show video

Deliver an edited video that shows what changed, why it matters and the observable result. Use actual application or terminal recordings. Keep recording within the task's existing authority; this skill grants no product-change, deployment or external-publication permission.

## Choose when video helps

Use video proactively when seeing an implemented UI interaction, API request/response or CLI flow would make a change easier to assess. This includes repairs made during code review. Plan capture while choosing proof so a useful baseline can be recorded before edits; the coordinator or implementation owner owns capture and editing. Findings-only reviewers inspect supplied evidence without starting this workflow.

Honor text-only requests. Skip new footage for internal refactors or other work with no useful caller-visible difference. If proactive capture cannot run with available tools and permissions, deliver the available screenshots or request/response evidence and state the limit. An explicit video request still needs a video or a clear blocker.

## Choose the story and evidence

Infer the feature, outcome and relevant platforms from the task and diff. Use the user's feature or epic name when available; otherwise choose a plain title. Do not invent a ticket or claim the entire epic is complete. Choose the shortest journey that demonstrates the change, including failure and recovery when those are the change being shown.

Reuse recordings that still demonstrate the final revision, including implementation proof after a clean review. Verify which build, data and scenario each recording shows. Store new raw clips, action timestamps, edit instructions and exports in a task-owned artifact directory; preserve inputs and other sessions' files. Keep this provenance with the artifacts, not in product source or on-screen implementation details.

For before-and-after work, use a genuine baseline and the changed build with equivalent data, permissions, viewport, theme and starting state. If invoked before implementation, capture the baseline first. If invoked afterward, recover a suitable recording or run the relevant prior build in isolation. Never reset or switch an active checkout, overwrite pending edits or repoint a shared stack to reconstruct the baseline.

When a baseline cannot be obtained, say so and deliver a clearly labelled current-state demonstration if that still answers the request. For proactive demos, also use this format when reconstructing the baseline would require substantial setup. If the user explicitly requires A/B proof, report the missing baseline and what is needed; do not call an after-only video complete. Do not fabricate previous behavior. A mockup or still-image sequence must be labelled and cannot stand in for recorded interaction evidence.

## Record the real journey

Use the browser, device or terminal capture tools permitted by the current host. Discover their capabilities before choosing a recorder; follow the host's browser and device rules, including its fallback conditions. A video request is browser work when the subject is web UI. Missing recording support is a capability limit, not permission to bypass the required tool or install another harness.

Prefer safe demo data. Keep credentials, private records, notifications and unrelated windows out of the frame. Exercise the actual controls and show their visible effect. For backend or infrastructure work, record a real request, command or operator flow and its observable output. Console logs can support UI proof but do not replace it.

For API changes, show the method and route, relevant safe inputs, response status and changed fields or persisted effects. For comparisons, run equivalent requests against the baseline and updated build with comparable fixtures. Keep authentication headers and sensitive request/response data out of the recording. Use an authorized local or test environment for mutations; recording does not authorize replaying production writes. Label any simulated external boundary. Preserve the real responses when editing so the viewer can see the changed contract, and include copyable, sanitized request/response evidence alongside the video.

Record from a settled starting state through the result. Wait for application readiness and outcomes; add viewing pauses only to make actions readable. Record action and result timestamps for alignment during editing. Keep enough context to identify the screen, action and outcome. Label responsive web footage accurately; it is not proof of a native app or physical device.

## Edit for comparison and clarity

For a change to existing behavior, default to simultaneous A/B comparison: **A · Before** on the left and **B · After** on the right. Keep both sides and their labels visible throughout each comparison. Show the same task on both sides and align corresponding actions or milestones. Playing the entire old flow followed by the entire new flow is not an A/B comparison. If a step disappeared, let the shorter flow hold at its achieved state while the longer flow catches up.

Use equal scale and consistent crops. If full screens become unreadable, crop both to the relevant region while retaining the controls and results, or add matched close-ups. Separate desktop and phone chapters when both are relevant; do not add platforms merely to lengthen the video.

Open with a brief feature title and the user outcome. Add short captions describing the visible difference at the moment it happens, and finish on the achieved result. Keep labels and captions outside important controls and result rows. Aim for about 30–60 seconds for a small change, adapting to the task rather than hiding necessary steps. Silent, captioned output is the default unless the user requests narration or audio.

Preserve delays or intermediate states that are evidence of the behavior. Disclose added pauses, cuts or speed changes when they affect comparison, for example, “Pauses added to align actions.” An edited comparison is not a timing benchmark: claims such as “faster” or “half the time” need separate unedited measurements under comparable conditions. Derive step-count claims from the actual actions, not the edited duration.

Use the media guidance in [pr-proof-pack](../pr-proof-pack/SKILL.md) and its `proof-media inspect` and `proof-media cut` commands when available. Use an installed editor or FFmpeg for side-by-side composition and export; discover its supported filters. Prefer a browser-playable MP4 with H.264, yuv420p and fast-start metadata, typically 30 fps at 1080p or higher when comparison readability needs it. Avoid adding a rendering framework or dependency for a one-off edit.

## Verify and deliver

Inspect the final export, not only its sources. Check the opening, every comparison beat, transitions and ending at the intended viewing size. Verify text readability, unclipped content, matched states, correct A/B labels and captions supported by the footage. Watch playback where supported; otherwise inspect extracted frames at the important action and result timestamps and report that playback was not checked. Decode the complete export to catch broken frames or truncation, and inspect duration, dimensions and codec with the installed media tools.

Fix export problems and recheck the affected output. Preserve the final video and enough source/edit information to revise it. Remove only capture resources created for this task, following host rules; keep anything the user is actively using.

Show the video in the host's supported viewer and provide a direct download or file link. If the host supports Markdown video embeds, include the absolute MP4 path using image syntax as well as an ordinary file link. For an authorized PR update, use [pr-proof-pack](../pr-proof-pack/SKILL.md) to upload and verify the media; local file paths are only for the host viewer. Briefly state what the clip demonstrates and any material evidence limit. Do not claim playback, native-device coverage, performance gains or external upload unless actually verified. Finish with the artifact, not an offer to make it later.
