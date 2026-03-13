import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const asJson = process.argv.includes("--json");

const placeholderPatterns = [/^change-me$/i, /^https:\/\/.*\.example\.com/i, /^stub-/i];
const expectedOpenRouterBaseUrl = "https://openrouter.ai/api/v1";
const expectedEmbeddingModel = "text-embedding-3-small";

const filesByTarget = {
  web: ".env.production.web",
  api: ".env.production.api",
  ai: ".env.production.ai",
  mobile: ".env.production.mobile"
};

const hostByTarget = {
  web: "Vercel (Web)",
  api: "Render (API)",
  ai: "Render (AI Engine)",
  mobile: "Expo EAS (Mobile)"
};

const requiredByTarget = {
  web: ["NEXTAUTH_SECRET", "NEXTAUTH_URL", "NEXT_PUBLIC_GRAPHQL_API_URL"],
  api: [
    "DATABASE_URL",
    "DIRECT_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "OPENROUTER_API_KEY",
    "OPENROUTER_BASE_URL",
    "OPENROUTER_MODEL",
    "OPENROUTER_EMBEDDING_MODEL",
    "AI_ENGINE_URL",
    "CORS_ALLOWED_ORIGINS"
  ],
  ai: [
    "DATABASE_URL",
    "DIRECT_URL",
    "OPENROUTER_API_KEY",
    "OPENROUTER_BASE_URL",
    "OPENROUTER_MODEL",
    "OPENROUTER_EMBEDDING_MODEL"
  ],
  mobile: ["EXPO_PUBLIC_GRAPHQL_API_URL"]
};

const parseEnv = (content) => {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
};

const isTemplateDatabaseUrl = (value) => /^postgres(?:ql)?:\/\/user:password@host(?::\d+)?\//i.test(value);

const isLocalhostUrl = (value) => /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?(\/|$)/i.test(value);

const splitCsv = (value) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const isPlaceholder = (value) => {
  const candidates = value.includes(",") ? splitCsv(value) : [value];

  return candidates.some((candidate) => {
    if (placeholderPatterns.some((pattern) => pattern.test(candidate))) {
      return true;
    }

    if (isTemplateDatabaseUrl(candidate) || isLocalhostUrl(candidate)) {
      return true;
    }

    return false;
  });
};

const summarizeTarget = (target) => {
  const relativeFile = filesByTarget[target];
  const absoluteFile = path.join(repoRoot, relativeFile);

  if (!existsSync(absoluteFile)) {
    return {
      target,
      file: relativeFile,
      host: hostByTarget[target],
      exists: false,
      missing: requiredByTarget[target],
      placeholders: [],
      values: {}
    };
  }

  const values = parseEnv(readFileSync(absoluteFile, "utf8"));
  const missing = [];
  const placeholders = [];

  for (const key of requiredByTarget[target]) {
    const value = values[key];
    if (!value) {
      missing.push(key);
      continue;
    }

    if (isPlaceholder(value)) {
      placeholders.push(key);
    }
  }

  return {
    target,
    file: relativeFile,
    host: hostByTarget[target],
    exists: true,
    missing,
    placeholders,
    values
  };
};

const results = ["web", "api", "ai", "mobile"].map(summarizeTarget);
const byTarget = Object.fromEntries(results.map((entry) => [entry.target, entry]));

const valueLooksReady = (targetResult, key) => {
  if (!targetResult?.exists) {
    return false;
  }

  if (targetResult.missing.includes(key) || targetResult.placeholders.includes(key)) {
    return false;
  }

  return Boolean(targetResult.values?.[key]);
};

const crossTargetIssues = [];

if (
  valueLooksReady(byTarget.web, "NEXT_PUBLIC_GRAPHQL_API_URL") &&
  valueLooksReady(byTarget.api, "NEXT_PUBLIC_GRAPHQL_API_URL")
) {
  const webGraphQlUrl = byTarget.web.values.NEXT_PUBLIC_GRAPHQL_API_URL;
  const apiGraphQlUrl = byTarget.api.values.NEXT_PUBLIC_GRAPHQL_API_URL;

  if (webGraphQlUrl !== apiGraphQlUrl) {
    crossTargetIssues.push("web NEXT_PUBLIC_GRAPHQL_API_URL does not match api NEXT_PUBLIC_GRAPHQL_API_URL.");
  }
}

if (
  valueLooksReady(byTarget.mobile, "EXPO_PUBLIC_GRAPHQL_API_URL") &&
  valueLooksReady(byTarget.api, "EXPO_PUBLIC_GRAPHQL_API_URL")
) {
  const mobileGraphQlUrl = byTarget.mobile.values.EXPO_PUBLIC_GRAPHQL_API_URL;
  const apiMobileGraphQlUrl = byTarget.api.values.EXPO_PUBLIC_GRAPHQL_API_URL;

  if (mobileGraphQlUrl !== apiMobileGraphQlUrl) {
    crossTargetIssues.push("mobile EXPO_PUBLIC_GRAPHQL_API_URL does not match api EXPO_PUBLIC_GRAPHQL_API_URL.");
  }
}

if (
  valueLooksReady(byTarget.web, "NEXTAUTH_URL") &&
  valueLooksReady(byTarget.api, "CORS_ALLOWED_ORIGINS")
) {
  const webOrigin = byTarget.web.values.NEXTAUTH_URL;
  const allowedOrigins = splitCsv(byTarget.api.values.CORS_ALLOWED_ORIGINS);

  if (!allowedOrigins.includes(webOrigin)) {
    crossTargetIssues.push("api CORS_ALLOWED_ORIGINS does not include web NEXTAUTH_URL.");
  }
}

for (const key of ["OPENROUTER_BASE_URL", "OPENROUTER_MODEL", "OPENROUTER_EMBEDDING_MODEL"]) {
  if (valueLooksReady(byTarget.api, key) && valueLooksReady(byTarget.ai, key)) {
    const apiValue = byTarget.api.values[key];
    const aiValue = byTarget.ai.values[key];

    if (apiValue !== aiValue) {
      crossTargetIssues.push(`api ${key} does not match ai ${key}.`);
    }
  }
}

const conflictKeys = [
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_GRAPHQL_API_URL",
  "EXPO_PUBLIC_GRAPHQL_API_URL",
  "AI_ENGINE_URL",
  "OPENROUTER_BASE_URL",
  "OPENROUTER_MODEL",
  "OPENROUTER_EMBEDDING_MODEL"
];
const conflicts = [];

for (const key of conflictKeys) {
  const entries = results
    .filter((result) => result.exists && result.values[key])
    .map((result) => ({
      file: result.file,
      value: result.values[key]
    }));

  if (entries.length < 2) {
    continue;
  }

  const distinctValues = Array.from(new Set(entries.map((entry) => entry.value)));
  if (distinctValues.length > 1) {
    conflicts.push(`${key}: ${entries.map((entry) => `${entry.file}=${entry.value}`).join("; ")}`);
  }
}

const pending = results.filter((result) => !result.exists || result.missing.length > 0 || result.placeholders.length > 0);

const trackedPrivateEnvFiles = [];

for (const file of Object.values(filesByTarget)) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", file], {
      cwd: repoRoot,
      stdio: "ignore"
    });

    trackedPrivateEnvFiles.push(file);
  } catch {
    // File is not tracked, which is expected for private env files.
  }
}

const easPath = path.join(repoRoot, "apps/mobile/eas.json");
const easIssues = [];

if (!existsSync(easPath)) {
  easIssues.push("apps/mobile/eas.json is missing.");
} else {
  try {
    const easConfig = JSON.parse(readFileSync(easPath, "utf8"));
    const previewUrl = easConfig?.build?.preview?.env?.EXPO_PUBLIC_GRAPHQL_API_URL;
    const productionUrl = easConfig?.build?.production?.env?.EXPO_PUBLIC_GRAPHQL_API_URL;

    if (!previewUrl) {
      easIssues.push("apps/mobile/eas.json missing build.preview.env.EXPO_PUBLIC_GRAPHQL_API_URL.");
    } else if (isPlaceholder(previewUrl)) {
      easIssues.push("apps/mobile/eas.json preview EXPO_PUBLIC_GRAPHQL_API_URL is still placeholder.");
    }

    if (!productionUrl) {
      easIssues.push("apps/mobile/eas.json missing build.production.env.EXPO_PUBLIC_GRAPHQL_API_URL.");
    } else if (isPlaceholder(productionUrl)) {
      easIssues.push("apps/mobile/eas.json production EXPO_PUBLIC_GRAPHQL_API_URL is still placeholder.");
    }

    if (previewUrl && productionUrl && previewUrl !== productionUrl) {
      easIssues.push("apps/mobile/eas.json preview and production EXPO_PUBLIC_GRAPHQL_API_URL values differ.");
    }

    if (valueLooksReady(byTarget.mobile, "EXPO_PUBLIC_GRAPHQL_API_URL") && previewUrl && productionUrl) {
      const mobileUrl = byTarget.mobile.values.EXPO_PUBLIC_GRAPHQL_API_URL;
      if (previewUrl !== mobileUrl || productionUrl !== mobileUrl) {
        easIssues.push("apps/mobile/eas.json EXPO_PUBLIC_GRAPHQL_API_URL values do not match .env.production.mobile.");
      }
    }
  } catch {
    easIssues.push("apps/mobile/eas.json could not be parsed as valid JSON.");
  }
}

const platformPolicyIssues = [];

for (const target of ["api", "ai"]) {
  const result = byTarget[target];
  if (!result?.exists) {
    continue;
  }

  const baseUrl = result.values.OPENROUTER_BASE_URL;
  const embeddingModel = result.values.OPENROUTER_EMBEDDING_MODEL;

  if (baseUrl && !isPlaceholder(baseUrl) && baseUrl !== expectedOpenRouterBaseUrl) {
    platformPolicyIssues.push(
      `${target} OPENROUTER_BASE_URL must be ${expectedOpenRouterBaseUrl} (found: ${baseUrl}).`
    );
  }

  if (embeddingModel && !isPlaceholder(embeddingModel) && embeddingModel !== expectedEmbeddingModel) {
    platformPolicyIssues.push(
      `${target} OPENROUTER_EMBEDDING_MODEL must be ${expectedEmbeddingModel} (found: ${embeddingModel}).`
    );
  }
}

const hasIssues =
  pending.length > 0 ||
  crossTargetIssues.length > 0 ||
  conflicts.length > 0 ||
  trackedPrivateEnvFiles.length > 0 ||
  easIssues.length > 0 ||
  platformPolicyIssues.length > 0;

if (asJson) {
  console.log(
    JSON.stringify(
      {
        hasIssues,
        summary: {
          pendingTargetCount: pending.length,
          crossTargetIssueCount: crossTargetIssues.length,
          conflictCount: conflicts.length,
          trackedPrivateEnvCount: trackedPrivateEnvFiles.length,
          easIssueCount: easIssues.length,
          platformPolicyIssueCount: platformPolicyIssues.length
        },
        targets: results.map((result) => ({
          target: result.target,
          host: result.host,
          file: result.file,
          exists: result.exists,
          missing: result.missing,
          placeholders: result.placeholders
        })),
        crossTargetIssues,
        duplicateKeyConflicts: conflicts,
        trackedPrivateEnvFiles,
        easIssues,
        platformPolicyIssues
      },
      null,
      2
    )
  );

  process.exit(hasIssues ? 1 : 0);
}

console.log("Deployment remediation report\n");

if (pending.length === 0) {
  console.log("No target-level missing/placeholder issues detected.\n");
} else {
  for (const result of pending) {
    console.log(`[${result.target}] ${result.host}`);
    console.log(`  env file: ${result.file}${result.exists ? "" : " (missing)"}`);

    if (!result.exists) {
      console.log("  action: run `npm run deploy:prepare` to scaffold this file.");
      console.log("");
      continue;
    }

    if (result.missing.length > 0) {
      console.log(`  missing keys: ${result.missing.join(", ")}`);
    }

    if (result.placeholders.length > 0) {
      console.log(`  placeholder keys: ${result.placeholders.join(", ")}`);
    }

    console.log("  next: replace values in this file, then re-run `npm run deploy:status`.");
    console.log("");
  }
}

console.log("Cross-target consistency\n");

if (crossTargetIssues.length === 0) {
  console.log("No cross-target mismatches detected from non-placeholder values.\n");
} else {
  for (const issue of crossTargetIssues) {
    console.log(`- ${issue}`);
  }
  console.log("");
}

console.log("Duplicate-key conflicts across env files\n");

if (conflicts.length === 0) {
  console.log("No conflicting duplicate keys detected.\n");
} else {
  for (const issue of conflicts) {
    console.log(`- ${issue}`);
  }
  console.log("");
}

console.log("Private env file tracking\n");

if (trackedPrivateEnvFiles.length === 0) {
  console.log("No private deployment env files are tracked by git.\n");
} else {
  for (const file of trackedPrivateEnvFiles) {
    console.log(`- ${file} is tracked by git; remove from index with \`git rm --cached ${file}\`.`);
  }
  console.log("");
}

console.log("Expo EAS profile alignment\n");

if (easIssues.length === 0) {
  console.log("No EAS profile alignment issues detected.\n");
} else {
  for (const issue of easIssues) {
    console.log(`- ${issue}`);
  }
  console.log("");
}

console.log("Platform policy checks\n");

if (platformPolicyIssues.length === 0) {
  console.log("No OpenRouter policy mismatches detected.\n");
} else {
  for (const issue of platformPolicyIssues) {
    console.log(`- ${issue}`);
  }
  console.log("");
}

if (!hasIssues) {
  console.log("All deployment remediation checks are clear. Run `npm run deploy:verify:all` to execute hosted verification.");
  process.exit(0);
}

console.log("After all sections are clear, run `npm run deploy:verify:all`.");
process.exit(1);