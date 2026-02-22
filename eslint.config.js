const { fixupConfigRules } = require("@eslint/compat");
const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const { defineConfig, globalIgnores } = require("eslint/config");
const globals = require("globals");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    extends: [...fixupConfigRules(compat.extends("universe/native"))],
    languageOptions: {
      globals: globals.node,
    },
  },
  globalIgnores(["**/build"]),
]);
