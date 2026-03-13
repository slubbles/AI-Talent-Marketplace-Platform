import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const targets = [
  {
    example: ".env.production.web.example",
    target: ".env.production.web"
  },
  {
    example: ".env.production.api.example",
    target: ".env.production.api"
  },
  {
    example: ".env.production.ai.example",
    target: ".env.production.ai"
  },
  {
    example: ".env.production.mobile.example",
    target: ".env.production.mobile"
  }
];

const created = [];
const skipped = [];

for (const entry of targets) {
  const examplePath = path.join(repoRoot, entry.example);
  const targetPath = path.join(repoRoot, entry.target);

  if (!existsSync(examplePath)) {
    throw new Error(`Missing template file: ${entry.example}`);
  }

  if (existsSync(targetPath)) {
    skipped.push(entry.target);
    continue;
  }

  copyFileSync(examplePath, targetPath);
  created.push(entry.target);
}

if (created.length > 0) {
  console.log("Created private deployment env files:");
  for (const file of created) {
    console.log(`- ${file}`);
  }
} else {
  console.log("No deployment env files were created (all targets already exist).");
}

if (skipped.length > 0) {
  console.log("Skipped existing deployment env files:");
  for (const file of skipped) {
    console.log(`- ${file}`);
  }
}

console.log("Reminder: replace placeholder values before running deploy verification.");
