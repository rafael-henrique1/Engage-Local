import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["dotenv/config"],
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      exclude: ["node_modules/", "src/**/*.test.ts"],
    },
  },
});
