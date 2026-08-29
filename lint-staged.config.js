module.exports = {
  "**/*.js?(x)": "eslint --fix",
  "**/*.ts?(x)": [
    () => "tsc --noEmit",
    "eslint --fix",
    "jest --bail --findRelatedTests --passWithNoTests",
  ],
  "**/*.kt": "ktlint android/ --format",
  "**/*.swift": "swiftformat ios/",
};
