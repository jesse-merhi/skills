# Prototype picker

Copy this directory into the prototype. Import `picker.css`, then call:

```js
import { mountPrototypePicker } from "./picker.js";
const dispose = mountPrototypePicker({
  stage: document.querySelector("#stage"),
  picker: document.querySelector("#picker"),
  variants: [
    { name: "Quiet", render: () => renderQuiet() },
    { name: "Editorial", render: () => renderEditorial() },
  ],
  replay: true,
});
```

Each render function returns a fresh DOM node. Call `dispose()` when unmounting. Buttons, number/arrow shortcuts, optional R replay, URL choice, and highlight are handled here. Editable controls and modifier shortcuts are left alone. Copy the behavior into native framework state only when importing a DOM component would conflict with that framework; keep the same contract.
