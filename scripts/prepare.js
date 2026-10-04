#!/usr/bin/env node

const path = require("path");

const { clean, run } = require("./utils");

console.log("🏗️  Preparing module");
clean("module");
run("tsc");

console.log("🏗️  Preparing plugin");
clean("plugin");
run("tsc", ["--build", path.join(process.cwd(), "plugin")]);
