# A/B decision deck

Copy `template.html`, `deck.css` and `deck.js` together. Serve the directory over HTTP for standalone viewing, or prepare a self-contained HTML file for T3.

- Keep the tab list and navigation, approval and copy hooks. Give each `[data-screen]` a unique HTML `id` and an `h2`. Each `[data-item]` needs a stable item ID and an `h3` for its decision label.
- Pass a unique `deckId` per batch to `mountAbDecisionDeck(root, { deckId })`. Reuse it and the item IDs across checkpoints in that batch. If the frame blocks browser storage, copy decisions before leaving or reloading.
- Mark screen Approve sets every vote on that screen to Approve and keeps the notes. Copy decisions includes notes on unmarked items. If automatic copy is blocked, copy the selected text manually.
- Call the returned `dispose()` when unmounting.

For T3 `html_render`, replace the stylesheet link with the contents of `deck.css` in a `<style>` tag. Replace the import with the contents of `deck.js` in the existing `<script type="module">` tag and keep the mount call at the end. Use absolute file paths in screenshot `src` attributes so `html_preview` and `html_render` inline the images.
