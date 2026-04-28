#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const { run } = require("./utils");

const SUBTARGETS = ["plugin"];

console.log("🏗️ Preparing module");
fs.rmSync(path.join(process.cwd(), "build"), { recursive: true, force: true });
run("tsc");

for (const target of SUBTARGETS) {
  const targetDir = path.join(process.cwd(), target);

  if (fs.existsSync(targetDir) && fs.existsSync(path.join(targetDir, "tsconfig.json"))) {
    console.log(`🏗️ Preparing ${target}`);
    fs.rmSync(path.join(targetDir, "build"), { recursive: true, force: true });
    run("tsc", ["--build", targetDir]);
  }
}
