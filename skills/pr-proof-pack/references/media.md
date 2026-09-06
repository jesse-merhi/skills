# Screenshots and recordings

Frame the product area that shows the change and make it readable at the PR's display size. Use comparable inputs, viewports, and visual scale for before/after captures. Keep private information out of the media.

For recordings, show the starting state, action, and outcome at a pace someone can follow. Trim setup and dead time while preserving important transitions and any waiting that is part of the claim.

Use the bundled helper with the installed FFmpeg, ffprobe, and ImageMagick tools:

```sh
proof-media inspect raw.mov --output-dir inspection
proof-media cut raw.mov --keep 1-5.8 --keep 14.2-20 --output proof.mp4
proof-media compare before.png after.png --output comparison.png
```

Inspection provides metadata and timestamped frames to help choose cuts. Cuts preserve speed and audio unless `--drop-audio` is explicit. Comparisons require matching image dimensions; existing outputs are preserved.

Inspect the finished images and play the edited recording at normal speed. Choose side-by-side media or separate labeled captures according to which makes the differences easiest to see. Put them in the PR body with enough nearby context to understand and reproduce the result.
