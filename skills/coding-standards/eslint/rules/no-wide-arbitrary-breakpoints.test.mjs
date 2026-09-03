import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import rule from "./no-wide-arbitrary-breakpoints.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
	languageOptions: {
		parser: tsParser,
		sourceType: "module",
		parserOptions: { ecmaVersion: 2022, ecmaFeatures: { jsx: true } },
	},
});

ruleTester.run("no-wide-arbitrary-breakpoints", rule, {
	valid: [
		{
			name: "allows named breakpoints and smaller component-specific breakpoints",
			code: '\n\t\t\tfunction Toolbar() {\n\t\t\t\treturn <span className="hidden min-[900px]:inline lg:mr-1 xl:block 2xl:flex">Publish</span>;\n\t\t\t}\n\t\t',
		},
		{
			name: "allows documented exceptions",
			code: '\n\t\t\tfunction Toolbar() {\n\t\t\t\t// @allow-wide-breakpoint print preview shell matches an embedded report width.\n\t\t\t\treturn <span className="min-[1200px]:inline 3xl:block">Publish</span>;\n\t\t\t}\n\t\t',
		},
		{
			name: "allows a wider arbitrary breakpoint once maximumPx is raised",
			code: '\n\t\t\tfunction Toolbar() {\n\t\t\t\treturn <span className="min-[1000px]:inline">Publish</span>;\n\t\t\t}\n\t\t',
			options: [{ maximumPx: 1200 }],
		},
		{
			name: "allows 3xl once it is removed from disallowedNamedBreakpoints",
			code: '\n\t\t\tfunction Shell() {\n\t\t\t\treturn <nav className="flex 3xl:hidden">Menu</nav>;\n\t\t\t}\n\t\t',
			options: [{ disallowedNamedBreakpoints: [] }],
		},
	],
	invalid: [
		{
			name: "rejects a breakpoint above a lowered maximumPx",
			code: '\n\t\t\tfunction Toolbar() {\n\t\t\t\treturn <span className="min-[900px]:inline">Publish</span>;\n\t\t\t}\n\t\t',
			options: [{ maximumPx: 800 }],
			errors: [{ messageId: "wideArbitraryBreakpoint" }],
		},
		{
			name: "rejects oversized arbitrary min breakpoints",
			code: '\n\t\t\tfunction Toolbar() {\n\t\t\t\treturn <span className="hidden min-[1000px]:inline">Publish</span>;\n\t\t\t}\n\t\t',
			errors: [{ messageId: "wideArbitraryBreakpoint" }],
		},
		{
			name: "rejects oversized arbitrary max breakpoints",
			code: '\n\t\t\tfunction Toolbar() {\n\t\t\t\treturn <button className="max-[80rem]:px-2">Save</button>;\n\t\t\t}\n\t\t',
			errors: [{ messageId: "wideArbitraryBreakpoint" }],
		},
		{
			name: "rejects disallowed extra-wide named breakpoints",
			code: '\n\t\t\tfunction Shell() {\n\t\t\t\treturn <nav className="flex 3xl:hidden">Menu</nav>;\n\t\t\t}\n\t\t',
			errors: [{ messageId: "disallowedNamedBreakpoint" }],
		},
		{
			name: "checks class-like object properties",
			code: '\n\t\t\tconst classes = {\n\t\t\t\tcontainerClassName: "max-[1024px]:overflow-auto",\n\t\t\t};\n\t\t',
			errors: [{ messageId: "wideArbitraryBreakpoint" }],
		},
	],
});
