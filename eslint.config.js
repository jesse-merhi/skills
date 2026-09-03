import * as effect from "@effect/eslint-plugin/plugin"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import vitest from "@vitest/eslint-plugin"
import importX from "eslint-plugin-import-x"
import perfectionist from "eslint-plugin-perfectionist"
import promise from "eslint-plugin-promise"
import sonarjs from "eslint-plugin-sonarjs"

import noBannerComments from "./eslint-rules/no-banner-comments.js"
import noLargeTestSnapshots from "./eslint-rules/no-large-test-snapshots.js"
import noTrivialForwardingWrapper from "./eslint-rules/no-trivial-forwarding-wrapper.js"

const sourceFiles = ["packages/**/*.ts", "skills/**/*.ts", "vitest.config.ts"]
const testFiles = ["**/*.test.ts"]
const jsonParseAllowedFiles = ["**/*.test.ts", "**/*.test.mjs"]
const runtimeJavaScriptFiles = ["skills/**/*.mjs"]
const lintInfrastructureFiles = ["eslint.config.js", "eslint-rules/**/*.js", "eslint-rules/**/*.mjs"]
const local = {
  rules: {
    "no-banner-comments": noBannerComments,
    "no-large-test-snapshots": noLargeTestSnapshots,
    "no-trivial-forwarding-wrapper": noTrivialForwardingWrapper
  }
}

export default [
  { ignores: ["node_modules/**"] },
  {
    files: lintInfrastructureFiles,
    plugins: { local, promise, sonarjs },
    rules: {
      "array-callback-return": "error",
      "local/no-banner-comments": "error",
      "promise/no-multiple-resolved": "error",
      "promise/no-return-in-finally": "error",
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",
      "promise/valid-params": "error",
      "sonarjs/no-all-duplicated-branches": "error",
      "sonarjs/no-useless-catch": "error",
      "sonarjs/updated-loop-counter": "error"
    }
  },
  {
    files: sourceFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      effect,
      "import-x": importX,
      local,
      perfectionist,
      promise,
      sonarjs
    },
    settings: {
      "import-x/parsers": { "@typescript-eslint/parser": [".ts"] },
      "import-x/resolver": { typescript: { alwaysTryTypes: true, project: "./tsconfig.json" }, node: { extensions: [".js", ".ts", ".d.ts"] } }
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "effect/no-import-from-barrel-package": ["error", { packageNames: ["effect"] }],
      "import-x/no-duplicates": "error",
      "import-x/no-import-module-exports": "error",
      "import-x/no-self-import": "error",
      "local/no-banner-comments": "error",
      "local/no-trivial-forwarding-wrapper": "error",
      "no-restricted-syntax": ["error", {
        selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse']",
        message: "Decode JSON with Effect Schema.fromJsonString so parsing and validation stay at one typed boundary."
      }],
      "perfectionist/sort-exports": ["error", { type: "alphabetical", order: "asc", fallbackSort: { type: "unsorted" }, ignoreCase: true, specialCharacters: "keep", newlinesBetween: "ignore", newlinesInside: "ignore" }],
      "perfectionist/sort-imports": ["error", { type: "alphabetical", order: "asc", fallbackSort: { type: "unsorted" }, ignoreCase: true, specialCharacters: "keep", sortBy: "path", internalPattern: ["^@/.+", "^~/.+", "^#.+"], partitionByComment: false, partitionByNewLine: false, newlinesBetween: 1, newlinesInside: 0, groups: ["type-import", ["value-builtin", "value-external"], "type-internal", "value-internal", ["type-parent", "type-sibling", "type-index"], ["value-parent", "value-sibling", "value-index"], "ts-equals-import", "unknown"] }],
      "perfectionist/sort-named-exports": ["error", { type: "alphabetical", order: "asc", fallbackSort: { type: "unsorted" }, ignoreAlias: false, ignoreCase: true, specialCharacters: "keep", newlinesBetween: "ignore", newlinesInside: "ignore" }],
      "perfectionist/sort-named-imports": ["error", { type: "alphabetical", order: "asc", fallbackSort: { type: "unsorted" }, ignoreCase: true, specialCharacters: "keep" }],
      "promise/no-multiple-resolved": "error",
      "promise/no-return-in-finally": "error",
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",
      "promise/valid-params": "error",
      "sonarjs/no-all-duplicated-branches": "error",
      "sonarjs/no-useless-catch": "error",
      "sonarjs/updated-loop-counter": "error"
    }
  },
  {
    files: runtimeJavaScriptFiles,
    plugins: { effect },
    rules: {
      "effect/no-import-from-barrel-package": ["error", { packageNames: ["effect"] }],
      "no-restricted-syntax": ["error", {
        selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse']",
        message: "Decode JSON with Effect Schema.fromJsonString so parsing and validation stay at one typed boundary."
      }]
    }
  },
  {
    files: testFiles,
    plugins: { "@vitest": vitest, local },
    rules: {
      "@vitest/consistent-each-for": ["error", { test: "each", it: "each", describe: "each" }],
      "@vitest/no-commented-out-tests": "error",
      "@vitest/no-conditional-tests": "error",
      "@vitest/no-disabled-tests": "error",
      "@vitest/no-done-callback": "error",
      "@vitest/no-duplicate-hooks": "error",
      "@vitest/no-focused-tests": "error",
      "@vitest/no-identical-title": "error",
      "@vitest/no-import-node-test": "error",
      "@vitest/no-interpolation-in-snapshots": "error",
      "@vitest/no-mocks-import": "error",
      "@vitest/no-standalone-expect": "error",
      "@vitest/no-test-return-statement": "error",
      "@vitest/no-unneeded-async-expect-function": "error",
      "@vitest/prefer-each": "error",
      "@vitest/prefer-mock-return-shorthand": "error",
      "@vitest/prefer-to-have-length": "error",
      "@vitest/prefer-vi-mocked": "error",
      "@vitest/require-awaited-expect-poll": "error",
      "@vitest/require-local-test-context-for-concurrent-snapshots": "error",
      "@vitest/require-to-throw-message": "error",
      "@vitest/valid-describe-callback": "error",
      "@vitest/valid-expect": ["error", { maxArgs: 2 }],
      "@vitest/valid-expect-in-promise": "error",
      "@vitest/valid-title": "error",
      "local/no-large-test-snapshots": "error"
    }
  },
  {
    files: jsonParseAllowedFiles,
    rules: { "no-restricted-syntax": "off" }
  }
]
