const { spawnSync } = require("child_process");

// On Windows, executables like `tsc` and `jest` are `.cmd` batch files and cannot be
// spawned directly — they require shell: true to resolve. On Unix, shell: true is
// unnecessary.
function spawnSyncWithAutoShell(command, args, options) {
  return spawnSync(command, args, { ...options, shell: process.platform === "win32" });
}

function run(cmd, args = []) {
  const result = spawnSyncWithAutoShell(cmd, args, { stdio: "inherit" });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

module.exports = { spawnSyncWithAutoShell, run };
