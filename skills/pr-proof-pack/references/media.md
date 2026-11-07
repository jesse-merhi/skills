# Screenshots and recordings

Frame the product area that shows the change and make it readable at the intended display size. Use comparable inputs, viewports, and visual scale for before/after captures. Keep private information out of the media.

Before sharing a recording, edit it into focused clips. Remove setup, idle time between actions, unrelated navigation, and trailing dead time. Split distinct flows into separately named clips; keep multiple ranges together when they show one flow. Each clip must retain enough starting state, the action, and the visible outcome to stand on its own. Export the edited files; timestamps or a proposed cut list do not complete preparation.

Preserve chronological order, important transitions, failures relevant to the claim, and any waiting whose duration is being demonstrated. Keep those intervals continuous at normal speed; disclose cuts that could otherwise imply an uninterrupted run. Keep the original capture and record the source ranges for each clip. An already focused recording can remain intact after inspection; explain briefly why no cut was needed.

Use the bundled helper with the installed FFmpeg, ffprobe, and ImageMagick tools:

```sh
proof-media inspect raw.mov --output-dir inspection
proof-media cut raw.mov --keep 1-5.8 --keep 14.2-20 --output proof.mp4
proof-media compare before.png after.png --output comparison.png
```

Run `cut` again with a different output name for each distinct flow. Use descriptive names such as `save-settings.mp4` and `reset-settings.mp4`.

Inspection provides metadata and timestamped frames to help choose cuts. Cuts preserve speed and audio unless `--drop-audio` is explicit. Comparisons require matching image dimensions; existing outputs are preserved.

Inspect the finished images and play each exported clip at normal speed, checking its opening, cuts, readable action, and final outcome. If editing or playback tools are unavailable, report the exact limitation and label unfinished or unverified media; do not present the raw capture as finished proof. Choose side-by-side media or separate labeled captures according to which makes the differences easiest to see. Share the edited paths with short captions explaining what each proves. For PR work, put them in the PR body with enough nearby context to understand and reproduce the result.
