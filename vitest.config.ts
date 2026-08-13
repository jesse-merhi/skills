import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["eslint-rules/**/*.test.mjs", "skills/**/*.test.ts", "packages/**/*.test.ts"]
  }
})
