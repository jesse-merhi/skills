import * as effect from "@effect/eslint-plugin/plugin"
import tsParser from "@typescript-eslint/parser"

import base from "./skills/coding-standards/eslint/presets/base.mjs"
import typescript from "./skills/coding-standards/eslint/presets/typescript.mjs"
import vitest from "./skills/coding-standards/eslint/presets/vitest.mjs"

const sourceFiles = ["packages/**/*.ts", "skills/**/*.ts", "vitest.config.ts"]
const testFiles = ["**/*.test.ts", "skills/coding-standards/**/*.test.mjs"]
const jsonParseAllowedFiles = ["**/*.test.ts", "**/*.test.mjs"]
const runtimeJavaScriptFiles = ["skills/**/*.mjs"]
const lintInfrastructureFiles = [
  "eslint.config.js",
  "skills/coding-standards/eslint/**/*.mjs"
]

const noJsonParse = {
  "no-restricted-syntax": ["error", {
    selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse']",
    message: "Decode JSON with Effect Schema.fromJsonString so parsing and validation stay at one typed boundary."
  }]
}

export default [
  { ignores: ["node_modules/**"] },
  ...base().map((config) => ({ ...config, files: [...sourceFiles, ...lintInfrastructureFiles] })),
  ...typescript({ files: sourceFiles }).map((config) => ({
    ...config,
    languageOptions: {
      ...config.languageOptions,
      parserOptions: { ...config.languageOptions.parserOptions, tsconfigRootDir: import.meta.dirname }
    }
  })),
  ...vitest({ files: testFiles }),
  {
    files: sourceFiles,
    languageOptions: { parser: tsParser },
    plugins: { effect },
    rules: {
      ...noJsonParse,
      // Effect.map and friends are member `.map` calls whose callbacks legitimately
      // return nothing, and array-callback-return cannot tell them from Array.map.
      "array-callback-return": "off",
      "effect/no-import-from-barrel-package": ["error", { packageNames: ["effect"] }]
    }
  },
  {
    files: runtimeJavaScriptFiles,
    plugins: { effect },
    rules: {
      ...noJsonParse,
      "effect/no-import-from-barrel-package": ["error", { packageNames: ["effect"] }]
    }
  },
  {
    files: jsonParseAllowedFiles,
    rules: { "no-restricted-syntax": "off" }
  }
]
