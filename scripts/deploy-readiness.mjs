import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const placeholderPatterns = [/^change-me$/i, /^https:\/\/.*\.example\.com/i, /^stub-/i];
const expectedOpenRouterBaseUrl = "https://openrouter.ai/api/v1";
const expectedEmbeddingModel = "text-embedding-3-small";

const filesByTarget = {
  web: ".env.production.web",
  api: ".env.production.api",
  ai: ".env.production.ai",
  mobile: ".env.production.mobile"
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

    if (isTemplateDatabaseUrl(candidate)) {
      return true;
    }

    if (isLocalhostUrl(candidate)) {
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
    crossTargetIssues.push(
      "web NEXT_PUBLIC_GRAPHQL_API_URL does not match api NEXT_PUBLIC_GRAPHQL_API_URL."
    );
  }
}

if (
  valueLooksReady(byTarget.mobile, "EXPO_PUBLIC_GRAPHQL_API_URL") &&
  valueLooksReady(byTarget.api, "EXPO_PUBLIC_GRAPHQL_API_URL")
) {
  const mobileGraphQlUrl = byTarget.mobile.values.EXPO_PUBLIC_GRAPHQL_API_URL;
  const apiMobileGraphQlUrl = byTarget.api.values.EXPO_PUBLIC_GRAPHQL_API_URL;

  if (mobileGraphQlUrl !== apiMobileGraphQlUrl) {
    crossTargetIssues.push(
      "mobile EXPO_PUBLIC_GRAPHQL_API_URL does not match api EXPO_PUBLIC_GRAPHQL_API_URL."
    );
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

let hasFailure = false;

console.log("Deployment readiness status\n");

for (const result of results) {
  const ok = result.exists && result.missing.length === 0 && result.placeholders.length === 0;
  hasFailure ||= !ok;

  console.log(`[${result.target}] ${ok ? "READY" : "NOT READY"}`);
  console.log(`  env file: ${result.file}${result.exists ? "" : " (missing)"}`);

  if (!result.exists) {
    console.log("  action: run `npm run deploy:prepare` to scaffold private env files from templates.");
  }

  if (result.missing.length > 0) {
    console.log(`  missing: ${result.missing.join(", ")}`);
  }

  if (result.placeholders.length > 0) {
    console.log(`  placeholders: ${result.placeholders.join(", ")}`);
  }

  if (ok) {
    console.log("  all required values look ready.");
  }

  console.log("");
}

console.log("Cross-target consistency\n");

if (crossTargetIssues.length === 0) {
  console.log("No cross-target mismatches detected from non-placeholder values.\n");
} else {
  hasFailure = true;
  for (const issue of crossTargetIssues) {
    console.log(`- ${issue}`);
  }
  console.log("");
}

console.log("Platform policy checks\n");

if (platformPolicyIssues.length === 0) {
  console.log("No OpenRouter policy mismatches detected.\n");
} else {
  hasFailure = true;
  for (const issue of platformPolicyIssues) {
    console.log(`- ${issue}`);
  }
  console.log("");
}

if (hasFailure) {
  console.log("Overall: NOT READY for hosted verification.");
  process.exit(1);
}

console.log("Overall: READY for hosted verification.");
