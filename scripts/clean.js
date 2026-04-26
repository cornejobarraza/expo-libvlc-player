#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const SUBTARGETS = ["plugin"];

console.log("🧹 Cleaning module");
fs.rmSync(path.join(process.cwd(), "build"), { recursive: true, force: true });

for (const target of SUBTARGETS) {
  console.log(`🧹 Cleaning ${target}`);
  fs.rmSync(path.join(process.cwd(), target, "build"), { recursive: true, force: true });
}
