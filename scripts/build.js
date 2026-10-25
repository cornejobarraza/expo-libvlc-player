#!/usr/bin/env node

const { spawnSyncWithAutoShell } = require("./utils");

const args = process.argv.slice(2);

if (
  process.stdout.isTTY &&
  !process.env.CI &&
  !process.env.EXPO_NONINTERACTIVE &&
  !args.includes("--watch")
) {
  args.push("--watch");
}

const result = spawnSyncWithAutoShell("tsc", args, { stdio: "inherit" });
process.exit(result.status ?? 0);
