#!/usr/bin/env node

const { spawnSyncWithAutoShell } = require("./utils");

let args = process.argv.slice(2);

if (args[0] === "plugin") {
  const target = args[0];
  const restArgs = args.slice(1);
  args = ["--rootDir", target, ...restArgs];
}

if (
  process.stdout.isTTY &&
  !process.env.CI &&
  !process.env.EXPO_NONINTERACTIVE &&
  !args.includes("--watch")
) {
  args.push("--watch");
}

const result = spawnSyncWithAutoShell("jest", args, { stdio: "inherit" });
process.exit(result.status ?? 1);
