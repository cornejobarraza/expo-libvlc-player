#!/usr/bin/env node

const { spawnSync } = require("child_process");

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

module.exports = { spawnSyncWithAutoShell, run };
