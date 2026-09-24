import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/", "node_modules/"] },
  js.configs.recommended,
  {
    languageOptions: { sourceType: "module", ecmaVersion: 2022 },
    rules: {
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-shadow": "error",
      "object-shorthand": "error",
      curly: ["error", "multi-line"],
      // small modules: one responsibility per file (see ARCHITECTURE.md)
      "max-lines": ["error", { max: 150, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["src/**/*.js"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["scripts/**/*.mjs", "*.mjs"],
    languageOptions: { globals: globals.node },
  },
  {
    // a test file is a scenario list, not a module to split
    files: ["tests/**/*.js"],
    languageOptions: { globals: globals.node },
    rules: { "max-lines": "off", "max-lines-per-function": "off" },
  },
];
