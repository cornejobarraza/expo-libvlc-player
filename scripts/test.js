#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const { spawnSyncWithAutoShell } = require('./utils');

let args = process.argv.slice(2);

if (args[0] === 'plugin') {
  const target = args[0];
  const targetDir = path.join(process.cwd(), target);
  const restArgs = args.slice(1);
  args = ['--rootDir', target];

  if (fs.existsSync(path.join(targetDir, 'jest.config.js'))) {
    args.push('--config', `${target}/jest.config.js`);
  }

  args.push(...restArgs);
}

if (
  process.stdout.isTTY &&
  !process.env.CI &&
  !process.env.EXPO_NONINTERACTIVE &&
  !args.includes('--watch')
) {
  args.push('--watch');
}

const result = spawnSyncWithAutoShell('jest', args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
