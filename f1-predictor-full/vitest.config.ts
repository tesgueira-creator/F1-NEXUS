import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    include: ["tests/**/*.{test,spec}.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    css: true,
    environmentOptions: {
      jsdom: {
        url: "http://localhost",
      },
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
});
