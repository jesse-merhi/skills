import a11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import reactEffect from "eslint-plugin-react-you-might-not-need-an-effect";

const DEFAULT_FILES = ["**/*.{jsx,tsx}"];
const DEFAULT_COMPONENTS = {
	Button: "button",
	Checkbox: "input",
	Input: "input",
	Label: "label",
	SelectTrigger: "button",
	Switch: "input",
	Textarea: "textarea",
};
const DEFAULT_CONTROL_COMPONENTS = ["Checkbox", "Input", "Select", "SelectTrigger", "Switch", "Textarea"];
const DEFAULT_LABEL_COMPONENTS = ["Label"];

export default function react(options = {}) {
	const components = options.a11y?.components ?? DEFAULT_COMPONENTS;
	const controlComponents = options.a11y?.controlComponents ?? DEFAULT_CONTROL_COMPONENTS;
	const labelComponents = options.a11y?.labelComponents ?? DEFAULT_LABEL_COMPONENTS;

	return [
		{
			files: options.files ?? DEFAULT_FILES,
			languageOptions: {
				parserOptions: { ecmaFeatures: { jsx: true } },
			},
			plugins: {
				"jsx-a11y": a11y,
				"react-hooks": reactHooks,
				"react-refresh": reactRefresh,
				"react-you-might-not-need-an-effect": reactEffect,
			},
			settings: {
				"jsx-a11y": {
					attributes: { for: ["htmlFor", "for"] },
					components,
					polymorphicPropName: "as",
				},
			},
			rules: {
				"jsx-a11y/alt-text": "error",
				"jsx-a11y/anchor-has-content": "error",
				"jsx-a11y/anchor-is-valid": "error",
				"jsx-a11y/aria-activedescendant-has-tabindex": "error",
				"jsx-a11y/aria-props": "error",
				"jsx-a11y/aria-proptypes": "error",
				"jsx-a11y/aria-role": "error",
				"jsx-a11y/aria-unsupported-elements": "error",
				"jsx-a11y/autocomplete-valid": "error",
				"jsx-a11y/click-events-have-key-events": "error",
				"jsx-a11y/control-has-associated-label": [
					"error",
					{
						controlComponents: ["Button", "SelectTrigger"],
						depth: 3,
						ignoreElements: ["audio", "canvas", "embed", "input", "textarea", "tr", "video"],
						ignoreRoles: [
							"grid",
							"listbox",
							"menu",
							"menubar",
							"radiogroup",
							"row",
							"tablist",
							"toolbar",
							"tree",
							"treegrid",
						],
						labelAttributes: ["aria-label", "aria-labelledby", "label", "title"],
					},
				],
				"jsx-a11y/heading-has-content": "error",
				"jsx-a11y/html-has-lang": "error",
				"jsx-a11y/iframe-has-title": "error",
				"jsx-a11y/img-redundant-alt": "error",
				"jsx-a11y/interactive-supports-focus": "error",
				"jsx-a11y/label-has-associated-control": [
					"error",
					{ assert: "either", controlComponents, depth: 5, labelComponents },
				],
				"jsx-a11y/lang": "error",
				"jsx-a11y/media-has-caption": "error",
				"jsx-a11y/mouse-events-have-key-events": "error",
				"jsx-a11y/no-access-key": "error",
				"jsx-a11y/no-aria-hidden-on-focusable": "error",
				"jsx-a11y/no-distracting-elements": "error",
				"jsx-a11y/no-noninteractive-element-interactions": "error",
				"jsx-a11y/no-noninteractive-tabindex": "error",
				"jsx-a11y/no-redundant-roles": "error",
				"jsx-a11y/no-static-element-interactions": "error",
				"jsx-a11y/role-has-required-aria-props": "error",
				"jsx-a11y/role-supports-aria-props": "error",
				"jsx-a11y/scope": "error",
				"jsx-a11y/tabindex-no-positive": "error",
				"react-hooks/config": "error",
				"react-hooks/error-boundaries": "error",
				"react-hooks/gating": "error",
				"react-hooks/globals": "error",
				"react-hooks/immutability": "error",
				"react-hooks/incompatible-library": "error",
				"react-hooks/preserve-manual-memoization": "error",
				"react-hooks/purity": "error",
				"react-hooks/refs": "error",
				"react-hooks/set-state-in-effect": "error",
				"react-hooks/set-state-in-render": "error",
				"react-hooks/static-components": "error",
				"react-hooks/unsupported-syntax": "error",
				"react-hooks/use-memo": "error",
				"react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
				"react-you-might-not-need-an-effect/no-adjust-state-on-prop-change": "error",
				"react-you-might-not-need-an-effect/no-chain-state-updates": "error",
				"react-you-might-not-need-an-effect/no-derived-state": "error",
				"react-you-might-not-need-an-effect/no-event-handler": "error",
				"react-you-might-not-need-an-effect/no-external-store-subscription": "error",
				"react-you-might-not-need-an-effect/no-initialize-state": "error",
				"react-you-might-not-need-an-effect/no-pass-data-to-parent": "error",
				"react-you-might-not-need-an-effect/no-pass-live-state-to-parent": "error",
				"react-you-might-not-need-an-effect/no-reset-all-state-on-prop-change": "error",
			},
		},
	];
}
