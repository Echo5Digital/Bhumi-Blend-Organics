import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // The admin back office (src/admin) was written as its own app and never linted against these
    // rules. They are style / compiler hints rather than bugs, so they are off for that folder only.
    files: ["src/admin/**"],
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
