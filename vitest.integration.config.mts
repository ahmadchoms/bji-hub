import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    env: {
      DATA_SOURCE: "prisma",
    },
    setupFiles: ["./lib/test/integration-setup.ts"],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      "server-only": path.resolve(import.meta.dirname, "lib/test/server-only.ts"),
    },
  },
});
