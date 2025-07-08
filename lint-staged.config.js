module.exports = {
  "**/*.js?(x)": "eslint --fix",
  "**/*.ts?(x)": [() => "tsc --noEmit --skipLibCheck", "eslint --fix"],
};
