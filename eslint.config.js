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
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          // fbjs is a Facebook-internal package not intended to be a public API
          patterns: ["fbjs/*", "fbjs"],
        },
      ],
    },
    ignores: ["**/build"],
  },
  {
    files: ["**/__tests__/*"],
    languageOptions: {
      globals: {
        ...globals.node,
        __DEV__: true,
      },
    },
  },
  {
    extends: [...fixupConfigRules(compat.extends("universe/node"))],
    files: ["./*.config.js", "./.*rc.js"],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.d.ts"],
    rules: {
      // NOTE: This is already handled by TypeScript itself
      // Turning this on blocks legitimate type overloads
      "no-redeclare": "off",
      "@typescript-eslint/no-redeclare": "off",
      // NOTE: Handled by TypeScript
      "no-unused-expressions": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);
