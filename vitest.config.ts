import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Run tests in Node environment (no browser needed for contract tests)
    environment: "node",
    // Glob patterns for test files
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    // Show verbose output for each test
    reporters: ["verbose"],
    // Timeout per test (ZK proof simulation can be slow)
    testTimeout: 15_000,
    // Code coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/**", "contracts/**"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
