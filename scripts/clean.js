#!/usr/bin/env node

const { clean } = require("./utils");

console.log("🧹  Cleaning module");
clean("module");

console.log("🧹  Cleaning plugin");
clean("plugin");
