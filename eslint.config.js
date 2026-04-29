const { fixupConfigRules } = require("@eslint/compat");
const { FlatCompat } = require("@eslint/eslintrc");
const { defineConfig, globalIgnores } = require("eslint/config");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = defineConfig([
  ...fixupConfigRules(compat.extends("universe/native")),
  globalIgnores(["**/build"]),
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.d.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.eslint.json", "./example/tsconfig.json"],
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
]);
