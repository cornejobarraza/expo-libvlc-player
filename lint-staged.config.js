module.exports = {
  "**/*.js?(x)": "eslint --fix",
  "**/*.ts?(x)": [
    () => "tsc -p tsconfig.eslint.json",
    "eslint --fix",
    "jest --bail --findRelatedTests --passWithNoTests",
  ],
  "**/*.kt": "ktlint android/ --format",
  "**/*.swift": "swiftformat ios/",
};
