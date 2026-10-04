import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    bail: 1,
    include: ["skills/**/*.test.ts", "packages/**/*.test.ts"]
  }
})
