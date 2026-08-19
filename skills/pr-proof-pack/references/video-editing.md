# Proof Video Editing

The finished recording should show context, action, transition, and outcome
without making the reviewer wait for the useful part.

## Capture For Editing

- Record a little extra time before and after the flow so cuts do not clip the
  starting state or outcome.
- Perform pointer movement, typing, and interactions at a natural deliberate
  pace. Editing removes inactivity; it does not accelerate the demonstration.
- For before/after proof, use the same route, fixture, data, viewport, starting
  state, and actions on the direct base and PR branch.

## Trim Standard

- Keep about one second of the recognizable starting state before the first
  action and a short hold after each important transition and final outcome.
- Cut setup outside the proof, accidental hesitation, and idle stretches longer
  than the viewer needs to recognize the state. Use a clean jump cut between
  meaningful moments.
- Do not speed up pointer movement, typing, animation, or the changed
  interaction. The result should remain calm, not become a speed run.
- Do not trim loading or waiting when elapsed time, performance, timeout, or
  progress behavior is part of the claim. For a long necessary wait unrelated
  to performance, retain its beginning and end and cut the uneventful middle.
- Keep the raw capture until the edited upload plays correctly in the rendered
  PR.

## Before And After

Use two clearly labeled recordings (`Before: direct base` and `After: PR`) or
one recording with explicit title cards between matched segments. Never make the
reviewer infer which version is shown.

For static comparison, create one labeled side-by-side image with matched crop,
scale, data, and viewport. Use separate full-size images only when a composite
would make the details unreadable. Do not add standalone screenshots that merely
repeat the after-state already clear in the video.

## FFmpeg Recipe

Use an installed video editor when available. With FFmpeg, keep one continuous
range with:

```sh
ffmpeg -i raw.mov -ss 00:00:01.000 -to 00:00:14.500 \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -movflags +faststart proof.mp4
```

To remove a dead interval, join the meaningful video ranges and omit audio when
the screen recording has no useful narration:

```sh
ffmpeg -i raw.mov -filter_complex \
  '[0:v]trim=start=1.0:end=5.8,setpts=PTS-STARTPTS[v0];
   [0:v]trim=start=14.2:end=20.0,setpts=PTS-STARTPTS[v1];
   [v0][v1]concat=n=2:v=1:a=0[v]' \
  -map '[v]' -an -c:v libx264 -crf 20 -preset medium \
  -pix_fmt yuv420p -movflags +faststart proof.mp4
```

Inspect duration with `ffprobe`, then play the full edited file at 1× speed:

```sh
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 proof.mp4
```

Recut when the first useful action arrives late, an idle stretch remains, a
meaningful state disappears too quickly, or a label is ambiguous.
