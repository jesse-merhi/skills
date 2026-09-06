#!/usr/bin/env node
import * as Schema from "effect/Schema";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

const Probe = Schema.fromJsonString(Schema.Struct({
  streams: Schema.Array(Schema.Struct({
    codec_type: Schema.String,
    codec_name: Schema.optional(Schema.String),
    width: Schema.optional(Schema.Number),
    height: Schema.optional(Schema.Number),
  })),
  format: Schema.Struct({ duration: Schema.String, size: Schema.String }),
}));

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.trim()}`);
  return result.stdout;
}

function probe(input) {
  const source = fs.realpathSync(input);
  if (!fs.statSync(source).isFile()) throw new Error("Input must be a local file");
  const result = Schema.decodeUnknownSync(Probe)(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", source]));
  const video = result.streams.find(stream => stream.codec_type === "video");
  const duration = Number(result.format.duration);
  if (!video?.width || !video.height || !Number.isFinite(duration) || duration <= 0) throw new Error("Input must contain finite-duration video");
  return { source, width: video.width, height: video.height, duration, codec: video.codec_name, bytes: Number(result.format.size), hasAudio: result.streams.some(stream => stream.codec_type === "audio") };
}

function ranges(values, duration) {
  if (!values?.length) throw new Error("Supply at least one --keep START-END in seconds");
  let previousEnd = 0;
  return values.map(value => {
    const match = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/u.exec(value);
    if (!match) throw new Error(`Invalid keep range: ${value}`);
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start < previousEnd || end <= start || end > duration) throw new Error("Keep ranges must be ordered, nonoverlapping, and inside the recording");
    previousEnd = end;
    return { start, end };
  });
}

function publish(output, build) {
  const destination = path.resolve(output);
  if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite ${destination}`);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "proof-media-"));
  try {
    const candidate = path.join(temporary, path.basename(destination));
    build(candidate);
    fs.copyFileSync(candidate, destination, fs.constants.COPYFILE_EXCL);
    return destination;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function imageSize(input) {
  const source = fs.realpathSync(input);
  const output = run("magick", ["identify", "-ping", "-format", "%w %h", `${source}[0]`]);
  const dimensions = /^(\d+) (\d+)$/u.exec(output);
  if (!dimensions) throw new Error("Expected one readable image");
  return { source, width: Number(dimensions[1]), height: Number(dimensions[2]) };
}

function font() {
  const selected = /Font:\s*([^\r\n]+)/u.exec(run("magick", ["-list", "font"]))?.[1]?.trim();
  if (selected) return selected;
  const systemFont = "/System/Library/Fonts/Supplemental/Arial.ttf";
  if (process.platform === "darwin" && fs.existsSync(systemFont)) return systemFont;
  throw new Error("ImageMagick needs an installed font for evidence labels");
}

function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    help: { type: "boolean", short: "h" },
    output: { type: "string" },
    "output-dir": { type: "string" },
    keep: { type: "string", multiple: true },
    "drop-audio": { type: "boolean" },
  } });
  if (values.help || positionals.length === 0) {
    console.log("proof-media inspect FILE [--output-dir NEW-DIRECTORY]\nproof-media cut FILE --keep START-END [--keep START-END] --output NEW.mp4 [--drop-audio]\nproof-media compare BEFORE AFTER --output NEW.png\nAll operations are local. Originals and existing outputs are never overwritten. Keep ranges use seconds, preserve speed, and retain audio unless explicitly dropped.");
    return;
  }
  const [action, input, after] = positionals;
  if (!input) throw new Error("Supply an input file");
  if (action === "compare") {
    if (!after || !values.output || path.extname(values.output).toLowerCase() !== ".png") throw new Error("compare requires BEFORE AFTER --output NEW.png");
    const beforeSize = imageSize(input);
    const afterSize = imageSize(after);
    if (beforeSize.width !== afterSize.width || beforeSize.height !== afterSize.height) throw new Error("Before/after dimensions differ; recapture at a matching viewport rather than silently resize evidence");
    const output = publish(values.output, candidate => run("magick", [
      "(", `${beforeSize.source}[0]`, "-background", "white", "-fill", "black", "-font", font(), "-pointsize", "24", "-gravity", "North", "-splice", "0x40", "-annotate", "+0+8", "Before", ")",
      "(", `${afterSize.source}[0]`, "-background", "white", "-fill", "black", "-font", font(), "-pointsize", "24", "-gravity", "North", "-splice", "0x40", "-annotate", "+0+8", "After", ")",
      "+append", candidate,
    ]));
    console.log(JSON.stringify({ output, width: beforeSize.width * 2, height: beforeSize.height + 40 }));
    return;
  }
  const metadata = probe(input);
  if (action === "cut") {
    if (!values.output || path.extname(values.output).toLowerCase() !== ".mp4") throw new Error("cut requires --output NEW.mp4");
    const selected = ranges(values.keep, metadata.duration);
    const audio = metadata.hasAudio && !values["drop-audio"];
    const filters = selected.flatMap(({ start, end }, index) => [
      `[0:v:0]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[v${index}]`,
      ...(audio ? [`[0:a:0]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[a${index}]`] : []),
    ]);
    filters.push(`${selected.map((_, index) => `[v${index}]${audio ? `[a${index}]` : ""}`).join("")}concat=n=${selected.length}:v=1:a=${audio ? 1 : 0}[video]${audio ? "[audio]" : ""}`);
    filters.push("[video]pad=ceil(iw/2)*2:ceil(ih/2)*2[output]");
    const output = publish(values.output, candidate => run("ffmpeg", ["-v", "error", "-nostdin", "-i", metadata.source, "-filter_complex", filters.join(";"), "-map", "[output]", ...(audio ? ["-map", "[audio]", "-c:a", "aac"] : ["-an"]), "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", candidate]));
    console.log(JSON.stringify({ ...probe(output), output, original: metadata.source, kept: selected }));
    return;
  }
  if (action !== "inspect") throw new Error(`Unknown action: ${action}`);
  const directory = values["output-dir"] ? path.resolve(values["output-dir"]) : fs.mkdtempSync(path.join(os.tmpdir(), "proof-media-inspect-"));
  if (values["output-dir"]) fs.mkdirSync(directory);
  const selectedFont = font();
  const frames = Array.from({ length: 8 }, (_, index) => ({ time: metadata.duration * index / 8, path: path.join(directory, `frame-${index}.png`) }));
  for (const frame of frames) {
    run("ffmpeg", ["-v", "error", "-nostdin", "-ss", String(frame.time), "-i", metadata.source, "-frames:v", "1", "-vf", "scale=320:-1", frame.path]);
    const labeled = path.join(directory, `labeled-${frames.indexOf(frame)}.png`);
    run("magick", [frame.path, "-background", "white", "-fill", "black", "-font", selectedFont, "-pointsize", "18", "-gravity", "South", "-splice", "0x28", "-annotate", "+0+5", `${frame.time.toFixed(2)}s`, labeled]);
    frame.labeled = labeled;
  }
  const contactSheet = path.join(directory, "contact-sheet.png");
  run("magick", ["montage", "-font", selectedFont, ...frames.map(frame => frame.labeled), "-tile", "4x2", "-geometry", "+4+4", "-background", "white", contactSheet]);
  const result = { ...metadata, contactSheet, frames };
  fs.writeFileSync(path.join(directory, "inspection.json"), JSON.stringify(result, null, 2), { flag: "wx" });
  console.log(JSON.stringify(result));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
