#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const { run } = require("./utils");

const REPO_ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const options = { tag: null, ref: "HEAD", stat: true };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--tag") options.tag = argv[++i];
    else if (argv[i] === "--ref") options.ref = argv[++i];
    else {
      console.error(`Unknown argument: ${argv[i]}`);
      process.exit(1);
    }
  }

  return options;
}

function git(args, options = {}) {
  const result = run("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  return result.stdout;
}

function latestTag() {
  return git(["describe", "--tags", "--abbrev=0"]).trim();
}

function packFiles(cwd) {
  const result = run("npm", ["pack", "--dry-run", "--json"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, HUSKY: "0" },
  });

  const jsonStart = result.stdout.indexOf("[");
  const data = JSON.parse(result.stdout.slice(jsonStart));

  return data[0].files.map((file) => file.path);
}

function packFilesAtRef(ref) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "publish-diff-"));
  git(["worktree", "add", "--detach", "--quiet", tmpDir, ref]);

  try {
    try {
      fs.symlinkSync(
        path.join(REPO_ROOT, "node_modules"),
        path.join(tmpDir, "node_modules"),
        process.platform === "win32" ? "junction" : "dir"
      );
    } catch (error) {
      console.warn(`Warning: could not link node_modules into ${tmpDir}: ${error.message}`);
    }

    return packFiles(tmpDir);
  } finally {
    git(["worktree", "remove", "--force", tmpDir]);
  }
}

function trackedFiles(paths) {
  if (paths.length === 0) return new Set();
  const result = git(["ls-files", "-z", "--", ...paths]);
  return new Set(result.split("\0").filter(Boolean));
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const tag = options.tag || latestTag();
  const usingWorkingTree = options.ref === "HEAD";

  console.log(`\nLatest tag: ${tag}`);
  console.log(`Comparing against: ${options.ref}\n`);

  const tagFiles = new Set(packFilesAtRef(tag));
  const refFiles = new Set(usingWorkingTree ? packFiles(REPO_ROOT) : packFilesAtRef(options.ref));

  const added = [...refFiles].filter((file) => !tagFiles.has(file)).sort();
  const removed = [...tagFiles].filter((file) => !refFiles.has(file)).sort();
  const common = [...tagFiles].filter((file) => refFiles.has(file)).sort();

  console.log(added.length ? `Added:` : "No files added");
  for (const file of added) console.log(` + ${file}`);

  console.log(removed.length ? `\nRemoved:` : "\nNo files removed");
  for (const file of removed) console.log(` - ${file}`);

  const diffPaths = [...common, ...added].sort();
  const addedTracked = usingWorkingTree ? trackedFiles(added) : new Set(added);
  const untracked = new Set(added.filter((file) => !addedTracked.has(file)));

  const trackedDiffPaths = diffPaths.filter((file) => !untracked.has(file));

  if (trackedDiffPaths.length > 0) {
    const diffArgs = usingWorkingTree ? [tag] : [tag, options.ref];
    const fullArgs = options.stat
      ? ["diff", ...diffArgs, "--stat", "--", ...trackedDiffPaths]
      : ["diff", ...diffArgs, "--", ...trackedDiffPaths];

    const diffOutput = git(fullArgs);

    if (diffOutput) {
      console.log(`\nContent diff:`);
      process.stdout.write(`${diffOutput}\n`);

      if (added.length > 0 || removed.length > 0) {
        console.log("⚠️  Tarball contents changed\n");
      }
    } else {
      console.log("\nNo files changed\n");
    }
  }
}

main();
