#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const { run } = require("./utils");

const darwin = process.platform === "darwin";
const repo_root = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const options = { tag: null, ref: "HEAD", dryRun: false, skipTests: false };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--tag") options.tag = argv[++i];
    else if (argv[i] === "--ref") options.ref = argv[++i];
    else if (argv[i] === "--dry-run") options.dryRun = !options.dryRun;
    else if (argv[i] === "--skip-tests") options.skipTests = !options.skipTests;
    else {
      console.error(`Unknown argument: ${argv[i]}`);
      process.exit(1);
    }
  }

  return options;
}

function trackedFiles(paths) {
  if (paths.length === 0) return new Set();
  const result = git(["ls-files", "-z", "--", ...paths]);
  return new Set(result.split("\0").filter(Boolean));
}

function git(args, options = {}) {
  const result = run("git", args, {
    cwd: repo_root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  return result.stdout;
}

function hasChanges(diffArgs, paths) {
  return git(["diff", ...diffArgs, "--name-only", "--", ...paths]).trim().length > 0;
}

function pack(cwd) {
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

function packAtRef(ref) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "publish-diff-"));
  git(["worktree", "add", "--detach", "--quiet", tmpDir, ref]);

  try {
    try {
      fs.symlinkSync(
        path.join(repo_root, "node_modules"),
        path.join(tmpDir, "node_modules"),
        process.platform === "win32" ? "junction" : "dir"
      );
    } catch (error) {
      console.warn(`Warning: could not link node_modules into ${tmpDir}: ${error.message}`);
    }

    return pack(tmpDir);
  } finally {
    git(["worktree", "remove", "--force", tmpDir]);
  }
}

function test(platform) {
  run("npm", ["run", `test:${platform}`], { cwd: path.join(repo_root, "example") });
}

function tests(diffArgs) {
  if (hasChanges(diffArgs, ["android"])) {
    if (!darwin) {
      console.log("Running Android tests");
      test("android");
      console.log("");
    } else {
      console.log("Skipping Android tests\n");
    }
  }

  if (hasChanges(diffArgs, ["ios"])) {
    if (darwin) {
      console.log("Running iOS tests");
      test("ios");
      console.log("");
    } else {
      console.log("Skipping iOS tests\n");
    }
  }
}

function patch() {
  run("npm", ["version", "patch"]);
}

function diff(options, diffArgs) {
  if (!hasChanges(diffArgs, ["CHANGELOG.md"])) {
    console.error("Update CHANGELOG.md before patching");
    process.exit(1);
  }

  const tag = diffArgs[0];
  const inWorkingTree = options.ref === "HEAD";

  console.log(`Latest tag: ${tag}`);
  console.log(`Comparing against: ${options.ref}${inWorkingTree ? " (working tree)" : ""}`);

  const tagFiles = new Set(packAtRef(tag));
  const refFiles = new Set(inWorkingTree ? pack(repo_root) : packAtRef(options.ref));

  const added = [...refFiles].filter((file) => !tagFiles.has(file)).sort();
  const removed = [...tagFiles].filter((file) => !refFiles.has(file)).sort();
  const common = [...tagFiles].filter((file) => refFiles.has(file)).sort();

  console.log(added.length ? "\nAdded:" : "\nNo files added");
  for (const file of added) console.log(` + ${file}`);

  console.log(removed.length ? "\nRemoved:" : "\nNo files removed");
  for (const file of removed) console.log(` - ${file}`);

  const diffPaths = [...common, ...added].sort();
  const addedTracked = inWorkingTree ? trackedFiles(added) : new Set(added);
  const untracked = new Set(added.filter((file) => !addedTracked.has(file)));

  const trackedDiffPaths = diffPaths.filter((file) => !untracked.has(file));

  if (trackedDiffPaths.length > 0) {
    const fullArgs = ["diff", ...diffArgs, "--stat", "--", ...trackedDiffPaths];
    const lineBreak = !options.dryRun ? "\n" : "";
    const diffOutput = git(fullArgs);

    if (diffOutput) {
      console.log("\nContent diff:");
      process.stdout.write(`${diffOutput}${lineBreak}`);

      if (added.length > 0 || removed.length > 0) {
        console.warn(`\n⚠️  Tarball contents changed${lineBreak}`);
      }
    } else {
      console.log(`\nNo files changed${lineBreak}`);
    }
  }
}

function version(options, diffArgs) {
  const { dryRun, skipTests } = options;
  if (!dryRun && !skipTests) tests(diffArgs);
  if (!dryRun) patch();
}

function main() {
  git(["fetch", "origin", "--tags", "--force"]);

  const options = parseArgs(process.argv.slice(2));
  const latestTag = git(["describe", "--tags", "--abbrev=0"]).trim();

  const tag = options.tag || latestTag;
  const diffArgs = options.ref === "HEAD" ? [tag] : [tag, options.ref];

  diff(options, diffArgs);
  version(options, diffArgs);
}

main();
