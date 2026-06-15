import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Ignore generated, built, and vendored artifacts BEFORE the rule sets, so the
  // typescript-eslint recommended rules never run against minified bundles. Globs are
  // prefixed with **/ so they also match nested copies.
  globalIgnores([
    "**/node_modules/**", // dependencies (default-ignored too; explicit for clarity)
    "**/.next/**", // Next.js build output
    "**/out/**", // Next.js export output (unused here: this app is SSR, kept for safety)
    "**/build/**", // generic build output
    "**/dist/**", // generic build output
    "**/coverage/**", // test coverage reports
    ".firebase/**", // Firebase Hosting deploy cache
    "**/next-env.d.ts", // Next.js generated ambient types
  ]),
  ...nextVitals,
  ...nextTs,
]);

export default eslintConfig;
