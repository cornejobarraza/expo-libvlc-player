const { fixupConfigRules } = require("@eslint/compat");
const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const globals = require("globals");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    extends: [...fixupConfigRules(compat.extends("universe/native"))],
    ignores: ["build"],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
