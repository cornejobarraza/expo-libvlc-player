#!/usr/bin/env node

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function clean(target) {
  switch (target) {
    case "plugin":
      fs.rmSync(path.join(process.cwd(), "plugin", "build"), { recursive: true, force: true });
      fs.rmSync(path.join(process.cwd(), "plugin", ".tsbuildinfo"), { force: true });
      break;
    default:
      fs.rmSync(path.join(process.cwd(), "build"), { recursive: true, force: true });
      fs.rmSync(path.join(process.cwd(), ".tsbuildinfo"), { force: true });
  }
}

// On Windows, executables like tsc are .cmd batch files and cannot be
// spawned directly as they require shell: true to resolve
function spawnSyncWithAutoShell(command, args, options) {
  return spawnSync(command, args, { ...options, shell: process.platform === "win32" });
}

function run(cmd, args = [], options = {}) {
  const result = spawnSyncWithAutoShell(cmd, args, { stdio: "inherit", ...options });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result;
}

module.exports = { clean, spawnSyncWithAutoShell, run };
