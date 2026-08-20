# Prototype picker contract

Use this fixed picker for every prototype. It is picker chrome, not part of
the design being judged. Keep its classes, values, and behavior stable across
projects.

## Markup

Use one button per variant. Include the divider and replay button only when a
variant has motion worth replaying.

```html
<nav class="proto-picker" aria-label="Prototype variants">
  <span class="proto-picker-highlight" aria-hidden="true"></span>
  <button class="proto-picker-item" data-active aria-current="true">Quiet</button>
  <button class="proto-picker-item">Editorial</button>
  <button class="proto-picker-item">Direct</button>
  <span class="proto-picker-divider" aria-hidden="true"></span>
  <button class="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)">↻</button>
</nav>
```

## Styles

```css
.proto-picker {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(10, 10, 10, 0.82);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  backdrop-filter: blur(12px) saturate(1.4);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 8px 24px rgba(0, 0, 0, 0.24),
    0 2px 6px rgba(0, 0, 0, 0.12);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
}

.proto-picker-highlight {
  position: absolute;
  top: 4px;
  left: 0;
  height: 44px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  will-change: transform;
}

.proto-picker[data-ready] .proto-picker-highlight {
  transition:
    transform 250ms cubic-bezier(0.23, 1, 0.32, 1),
    width 250ms cubic-bezier(0.23, 1, 0.32, 1);
}

.proto-picker-item {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 44px;
  height: 44px;
  justify-content: center;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.62);
  font: inherit;
  cursor: pointer;
  transition: color 150ms ease-out;
}

@media (hover: hover) and (pointer: fine) {
  .proto-picker-item:hover { color: rgba(255, 255, 255, 0.88); }
}

.proto-picker-item:active { transform: scale(0.97); }

.proto-picker-item:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.55);
  outline-offset: 2px;
}

.proto-picker-item[data-active] { color: #fff; }

.proto-picker-divider {
  width: 1px;
  height: 20px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.14);
}

.proto-picker-replay {
  padding: 0 10px;
  font-size: 16px;
}

.proto-picker[data-position="top"] {
  bottom: auto;
  top: 24px;
}

@media (prefers-reduced-motion: reduce) {
  .proto-picker[data-ready] .proto-picker-highlight { transition: none; }
}

@media (max-width: 560px) {
  .proto-picker {
    bottom: 12px;
    max-width: calc(100vw - 24px);
    overflow-x: auto;
  }
}
```

The 44px controls deliberately strengthen the upstream 28px picker for touch
and narrow-screen use.

## Behavior

- Number keys `1–N` and arrow keys switch variants.
- `R` replays the current variant when replay is available.
- Ignore shortcuts when focus is in an input, textarea, select, or editable
  element, and whenever a modifier is held.
- Exactly one item has `data-active` and `aria-current="true"`.
- Persist the choice as `?v=2`, falling back to the first variant.
- Position the highlight before adding `data-ready`, so first paint does not
  animate.
- Re-mount the active variant on replay; variant switching itself stays
  instant.
- Set `data-position="top"` only when bottom-center would cover the prototype.

## Standalone wiring

```js
const stage = document.getElementById('stage');
const picker = document.querySelector('.proto-picker');
const highlight = picker.querySelector('.proto-picker-highlight');
const items = [...picker.querySelectorAll('.proto-picker-item:not(.proto-picker-replay)')];
const replay = picker.querySelector('.proto-picker-replay');
let current = 0;

function moveHighlight() {
  const item = items[current];
  highlight.style.width = `${item.offsetWidth}px`;
  highlight.style.transform = `translateX(${item.offsetLeft}px)`;
}

function mount(index) {
  stage.replaceChildren();
  requestAnimationFrame(() => stage.append(variants[index]()));
}

function setActive(index) {
  if (index < 0 || index >= variants.length) return;
  current = index;
  items.forEach((item, itemIndex) => {
    item.toggleAttribute('data-active', itemIndex === index);
    if (itemIndex === index) item.setAttribute('aria-current', 'true');
    else item.removeAttribute('aria-current');
  });
  moveHighlight();
  const url = new URL(location);
  url.searchParams.set('v', String(index + 1));
  history.replaceState(null, '', url);
  mount(index);
}

items.forEach((item, index) => {
  item.addEventListener('click', () => setActive(index));
});
replay?.addEventListener('click', () => mount(current));
window.addEventListener('resize', moveHighlight);

document.addEventListener('keydown', (event) => {
  const target = event.target;
  if (target.matches('input, textarea, select') || target.isContentEditable) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const number = Number.parseInt(event.key, 10);
  if (number >= 1 && number <= variants.length) setActive(number - 1);
  else if (event.key === 'ArrowRight') setActive((current + 1) % variants.length);
  else if (event.key === 'ArrowLeft') setActive((current - 1 + variants.length) % variants.length);
  else if (event.key.toLowerCase() === 'r') mount(current);
});

const requested = Number.parseInt(new URLSearchParams(location.search).get('v'), 10);
setActive(Number.isNaN(requested) ? 0 : requested - 1);
requestAnimationFrame(() => {
  requestAnimationFrame(() => picker.setAttribute('data-ready', ''));
});
```

In a framework, keep the same behavior using local state, refs, URL state, and
a keyed re-mount.
