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
    rules: {
      // Allow inline styles for dynamic colors and positioning
      "react/forbid-dom-props": "off",
      "react/no-unknown-property": ["error", { ignore: ["style"] }],
      // Disable Next.js inline style warnings
      "@next/next/no-img-element": "off",
      "@next/next/inline-script-id": "off",
      // Allow any types in GitHub webhook handlers and external API integrations
      "@typescript-eslint/no-explicit-any": [
        "error",
        {
          ignoreRestArgs: true,
          fixToUnknown: false,
        },
      ],
    }
  }
]);

export default eslintConfig;
