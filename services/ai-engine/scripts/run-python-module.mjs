import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serviceDir = path.resolve(currentDir, "..");
const repoRoot = path.resolve(serviceDir, "..", "..");

const pythonExecutable = process.platform === "win32"
  ? path.join(repoRoot, ".venv", "Scripts", "python.exe")
  : path.join(repoRoot, ".venv", "bin", "python");

const pythonCommand = existsSync(pythonExecutable) ? pythonExecutable : "python";
const moduleName = process.argv[2];
const moduleArgs = process.argv.slice(3);

if (!moduleName) {
  console.error("A Python module name is required.");
  process.exit(1);
}

const child = spawn(
  pythonCommand,
  ["-m", moduleName, ...moduleArgs],
  {
    cwd: serviceDir,
    stdio: "inherit",
    env: process.env
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});