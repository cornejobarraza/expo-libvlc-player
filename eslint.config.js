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
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: ["fbjs/*", "fbjs"],
        },
      ],
    },
    languageOptions: {
      globals: {
        ...globals.node,
        __DEV__: true,
      },
    },
  },
  {
    files: ["**/__tests__/*"],
  },
  {
    files: ["./*.config.js", "./.*rc.js"],
    extends: [...fixupConfigRules(compat.extends("universe/node"))],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.d.ts"],
    rules: {
      "no-redeclare": "off",
      "@typescript-eslint/no-redeclare": "off",
      "no-unused-expressions": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  globalIgnores(["**/build"]),
]);
