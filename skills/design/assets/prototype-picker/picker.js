export function mountPrototypePicker({ stage, picker, variants, replay = true }) {
  if (!variants.length) throw new Error("Supply at least one named variant factory");
  const controller = new AbortController();
  const listen = (target, event, listener) => target.addEventListener(event, listener, { signal: controller.signal });
  picker.classList.add("proto-picker");
  picker.setAttribute("aria-label", "Prototype variants");
  const highlight = document.createElement("span");
  highlight.className = "proto-picker-highlight";
  highlight.setAttribute("aria-hidden", "true");
  const items = variants.map(({ name }, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "proto-picker-item";
    button.textContent = name;
    listen(button, "click", () => select(index));
    return button;
  });
  picker.replaceChildren(highlight, ...items);
  let current = 0;
  const position = () => {
    highlight.style.width = `${items[current].offsetWidth}px`;
    highlight.style.transform = `translateX(${items[current].offsetLeft}px)`;
  };
  const render = () => stage.replaceChildren(variants[current].render());
  function select(index) {
    current = Number.isInteger(index) && index >= 0 && index < variants.length ? index : 0;
    items.forEach((item, itemIndex) => {
      item.toggleAttribute("data-active", current === itemIndex);
      if (current === itemIndex) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    });
    const url = new URL(location.href);
    url.searchParams.set("v", String(current + 1));
    history.replaceState(history.state, "", url);
    render();
    position();
  }
  if (replay) {
    const divider = document.createElement("span");
    divider.className = "proto-picker-divider";
    divider.setAttribute("aria-hidden", "true");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "proto-picker-item proto-picker-replay";
    button.textContent = "↻";
    button.setAttribute("aria-label", "Replay animation (R)");
    listen(button, "click", render);
    picker.append(divider, button);
  }
  listen(window, "resize", position);
  listen(window, "popstate", () => select(Number(new URL(location.href).searchParams.get("v")) - 1));
  listen(document, "keydown", event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey
      || (event.target instanceof Element && event.target.closest("input,textarea,select,[contenteditable]:not([contenteditable=false])"))) return;
    const number = Number(event.key);
    if (Number.isInteger(number) && number >= 1 && number <= variants.length) select(number - 1);
    else if (event.key === "ArrowRight") select((current + 1) % variants.length);
    else if (event.key === "ArrowLeft") select((current - 1 + variants.length) % variants.length);
    else if (event.key.toLowerCase() === "r" && replay) render();
    else return;
    event.preventDefault();
  });
  select(Number(new URL(location.href).searchParams.get("v")) - 1);
  const frame = requestAnimationFrame(() => picker.setAttribute("data-ready", ""));
  return () => { controller.abort(); cancelAnimationFrame(frame); picker.replaceChildren(); picker.removeAttribute("data-ready"); };
}
