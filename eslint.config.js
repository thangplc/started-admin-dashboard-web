import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores([
    "dist",
    "src/routeTree.gen.ts",
    "src/api/generated",
    "packages/create-admin-starter/template",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  {
    // shadcn files export variants next to components; route files export `Route`;
    // providers export their hook (`useTheme`) next to the provider.
    files: [
      "src/components/ui/**",
      "src/components/common/**",
      "src/components/*-provider.tsx",
      "src/routes/**",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
])
