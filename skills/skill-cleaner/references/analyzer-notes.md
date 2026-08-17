# Analyzer Notes

- The script mirrors Codex's model-visible line shape:
  `- name: description (file: path)`.
- It applies Codex-like frontmatter rules: YAML frontmatter only, default name
  from parent dir, single-line sanitized `name` and `description`.
- It follows Codex `core-skills/src/render.rs`: 2% of raw `context_window`,
  token cost `ceil(utf8_bytes / 4)`, then full descriptions -> equal
  description truncation -> omitted minimum lines.
- It reads `~/.codex/models_cache.json` for GPT-5.5 `context_window`; fallback
  is 272,000 tokens and 2%.
- It uses `codex debug prompt-input` for the live, model-visible inventory when
  available. `--no-live` forces the filesystem fallback.
- It scans normal Codex/plugin/repo skill roots by default. Extra folders are
  included with `--root <path>`; `--root-only` scans only supplied roots.
- It realpath-dedupes roots, so symlinked roots do not create false duplicates.
- For duplicate names, it reports description/body similarity and suggests
  deletion candidates only when bodies are near copies.
- Keep priority defaults to direct Codex system skills, then direct Codex skills,
  then plugin skills, then personal/repo copies.
- It scans `~/.codex/history.jsonl` and recent `~/.codex/sessions/**/*.jsonl` by
  default. Add `--deep-logs` for archived Codex sessions.
- When auditing another harness, add its skill roots with `--root <path>` and
  use that harness's local history or usage logs as supporting evidence when
  available.
- Usage evidence comes only from user messages and actual tool-call arguments.
  Developer skill catalogs are ignored, and file reads are realpath-deduped.
