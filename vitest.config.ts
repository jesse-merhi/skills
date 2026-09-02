import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["skills/**/*.test.mjs", "skills/**/*.test.ts", "packages/**/*.test.ts"]
  }
})
