import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * The frontend had no test runner at all.
 *
 * Every frontend defect that reached production in the payments work came from that gap — an
 * effect re-firing on an unstable dependency, a padlock colliding with a tooltip, a cache keyed
 * by tenant instead of by user, and a success animation rendered underneath a spinner with a
 * higher z-index. The backend caught its equivalents automatically; this side had nothing.
 *
 * Deliberately NOT wired into `next build`. A test suite that can block a deploy is a test suite
 * people delete; this one runs on demand and in CI, and the first job is to make it cheap enough
 * that writing a test is the easy path.
 */
export default defineConfig({
  // No @vitejs/plugin-react. Vitest transforms TSX with esbuild using the tsconfig's
  // "jsx": "preserve"/react-jsx setting, and the plugin exists mainly for Fast Refresh, which a
  // test run has no use for. Adding it couples this config to a specific vite major for no gain.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Only our own tests. Playwright specs live in e2e/ and are a different runner.
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    css: false,
  },
  resolve: {
    // Mirrors the "@/*" path alias in tsconfig, so a test imports exactly what the app imports.
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
