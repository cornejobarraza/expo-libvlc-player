const { defineConfig, globalIgnores } = require("eslint/config");
const universe = require("eslint-config-universe/flat/native");

module.exports = defineConfig([
  ...universe,
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
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.eslint.json", "./example/tsconfig.json"],
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "import/consistent-type-specifier-style": ["error", "prefer-inline"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { enableAutofixRemoval: { imports: true }, ignoreRestSiblings: true },
      ],
      "no-unused-vars": "off",
      "react/jsx-fragments": ["error", "element"],
    },
  },
]);
