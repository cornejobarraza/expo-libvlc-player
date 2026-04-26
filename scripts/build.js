#!/usr/bin/env node
const { spawnSyncWithAutoShell } = require("./utils");

const ARGS = process.argv.slice(2);
const TSC_ARGS = [...ARGS];

if (
  process.stdout.isTTY &&
  !process.env.CI &&
  !process.env.EXPO_NONINTERACTIVE &&
  !TSC_ARGS.includes("--watch")
) {
  TSC_ARGS.push("--watch");
}

const result = spawnSyncWithAutoShell("tsc", TSC_ARGS, { stdio: "inherit" });
process.exit(result.status ?? 0);
