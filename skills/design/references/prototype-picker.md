# Prototype picker

Copy `assets/prototype-picker/` from this skill into the prototype; its README shows the wiring. Do not rebuild the control from prose. Supply named variant factories, a stage, and a picker container. The returned disposer removes listeners on unmount.

Keep the picker visually stable across alternatives: it frames the designs and is not being judged. Controls are 44px for touch, sit bottom-center, and scroll on narrow screens. Set `data-position="top"` only when bottom-center obscures the design.

Number and arrow keys switch variants. Optional R replay remounts the current variant. Editable controls and modified shortcuts are untouched. Exactly one variant is current; `?v=2` selects the second, with invalid values falling back to the first. Switching is immediate, initial highlight positioning does not animate, and reduced motion disables highlight transitions.

For framework-native integration, retain the same contract using local state, refs, URL state, and keyed remounts. Verify every variant, keyboard operation, replay, narrow layout, and reduced motion in the rendered prototype.
