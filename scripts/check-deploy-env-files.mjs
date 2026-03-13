import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  ".env.production.web",
  ".env.production.api",
  ".env.production.ai",
  ".env.production.mobile"
];

const missing = requiredFiles
  .map((file) => ({ file, absolutePath: path.join(repoRoot, file) }))
  .filter((entry) => !existsSync(entry.absolutePath));

if (missing.length > 0) {
  console.error("Missing required private deployment env files:");
  for (const entry of missing) {
    console.error(`- ${entry.file}`);
  }

  console.error("\nCreate these from the committed *.example templates before running deploy verification.");
  process.exit(1);
}

const tracked = [];

for (const file of requiredFiles) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", file], {
      cwd: repoRoot,
      stdio: "ignore"
    });

    tracked.push(file);
  } catch {
    // File is not tracked, which is expected for private env files.
  }
}

if (tracked.length > 0) {
  console.error("Private deployment env files must not be tracked by git:");
  for (const file of tracked) {
    console.error(`- ${file}`);
  }

  console.error(
    "\nRemove them from git index (keep local file) before verification, e.g. `git rm --cached <file>`, then commit."
  );
  process.exit(1);
}

console.log("Required private deployment env files are present.");
