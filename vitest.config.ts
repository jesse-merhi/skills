import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["skills/**/*.test.ts", "skills/coding-standards/**/*.test.mjs", "packages/**/*.test.ts"]
  }
})
