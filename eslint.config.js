const { fixupConfigRules } = require("@eslint/compat");
const { FlatCompat } = require("@eslint/eslintrc");
const { defineConfig, globalIgnores } = require("eslint/config");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = defineConfig([
  {
    extends: [...fixupConfigRules(compat.extends("universe/native")), globalIgnores(["**/build"])],
    languageOptions: {
      globals: {
        __dirname: "readonly",
      },
      parserOptions: {
        project: ["./tsconfig.eslint.json", "./example/tsconfig.json"],
      },
    },
  },
]);
