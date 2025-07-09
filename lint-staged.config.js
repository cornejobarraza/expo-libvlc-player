module.exports = {
  "**/*.js?(x)": "eslint --fix",
  "**/*.ts?(x)": [() => "tsc --noEmit --skipLibCheck", "eslint --fix"],
  "**/*.kt": "ktlint android/ --format",
  "**/*.swift": "swiftformat ios/ --swiftversion 5.4",
};
