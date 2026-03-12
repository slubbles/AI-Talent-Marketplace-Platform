import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const placeholderPatterns = [
  /^change-me$/i,
  /^https:\/\/api\.example\.com\/graphql$/i,
  /^https:\/\/example\.r2\.dev$/i,
  /^stub-/i
];

const targetConfigs = {
  web: {
    required: ["NEXTAUTH_SECRET", "NEXTAUTH_URL", "NEXT_PUBLIC_GRAPHQL_API_URL"],
    recommended: []
  },
  api: {
    required: [
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
    recommended: [
      "RESEND_API_KEY",
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
      "R2_PUBLIC_URL",
      "LINKEDIN_CLIENT_ID",
      "LINKEDIN_CLIENT_SECRET"
    ]
  },
  ai: {
    required: [
      "DATABASE_URL",
      "DIRECT_URL",
      "OPENROUTER_API_KEY",
      "OPENROUTER_BASE_URL",
      "OPENROUTER_MODEL",
      "OPENROUTER_EMBEDDING_MODEL"
    ],
    recommended: []
  },
  mobile: {
    required: ["EXPO_PUBLIC_GRAPHQL_API_URL"],
    recommended: []
  }
};

const targetAliases = {
  'ai-engine': 'ai',
  all: 'all'
};

const parseEnvFile = (content) => {
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

const isPlaceholderValue = (value) => placeholderPatterns.some((pattern) => pattern.test(value));

const getTargets = (requestedTarget) => {
  if (requestedTarget === "all") {
    return ["web", "api", "ai", "mobile"];
  }

  return [requestedTarget];
};

const resolveArgs = () => {
  const requestedTarget = (process.argv[2] ?? "all").toLowerCase();
  const normalizedTarget = targetAliases[requestedTarget] ?? requestedTarget;

  if (normalizedTarget !== "all" && !(normalizedTarget in targetConfigs)) {
    console.error(`Unknown target: ${requestedTarget}`);
    console.error("Usage: node ./scripts/validate-deploy-env.mjs [web|api|ai|mobile|all] [env-file]");
    process.exit(1);
  }

  const envFile = process.argv[3] ?? ".env";
  const envPath = path.isAbsolute(envFile) ? envFile : path.join(repoRoot, envFile);

  return {
    envPath,
    target: normalizedTarget
  };
};

const validateTarget = (target, values) => {
  const config = targetConfigs[target];
  const missing = [];
  const placeholders = [];
  const warnings = [];

  for (const key of config.required) {
    const value = values[key];
    if (!value) {
      missing.push(key);
      continue;
    }

    if (isPlaceholderValue(value)) {
      placeholders.push(key);
    }
  }

  for (const key of config.recommended) {
    const value = values[key];
    if (!value) {
      warnings.push(`Recommended variable missing: ${key}`);
      continue;
    }

    if (isPlaceholderValue(value)) {
      warnings.push(`Recommended variable still uses a placeholder value: ${key}`);
    }
  }

  if (target === "api") {
    const corsOrigins = values.CORS_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];

    if (corsOrigins.length === 0) {
      warnings.push("CORS_ALLOWED_ORIGINS is present but empty after parsing.");
    }

    if (values.NEXTAUTH_URL && !corsOrigins.includes(values.NEXTAUTH_URL)) {
      warnings.push("NEXTAUTH_URL is not included in CORS_ALLOWED_ORIGINS.");
    }
  }

  if (target === "web") {
    if (values.NEXTAUTH_URL && values.NEXT_PUBLIC_GRAPHQL_API_URL && values.NEXTAUTH_URL === values.NEXT_PUBLIC_GRAPHQL_API_URL) {
      warnings.push("NEXTAUTH_URL and NEXT_PUBLIC_GRAPHQL_API_URL are identical; verify the GraphQL URL points to the API, not the web app.");
    }
  }

  if (target === "mobile") {
    const mobileUrl = values.EXPO_PUBLIC_GRAPHQL_API_URL ?? "";
    if (/localhost|127\.0\.0\.1/i.test(mobileUrl)) {
      warnings.push("EXPO_PUBLIC_GRAPHQL_API_URL still points to localhost; replace it before cloud builds.");
    }
  }

  return { missing, placeholders, warnings };
};

const main = () => {
  const { envPath, target } = resolveArgs();

  if (!existsSync(envPath)) {
    console.error(`Environment file not found: ${envPath}`);
    process.exit(1);
  }

  const values = parseEnvFile(readFileSync(envPath, "utf8"));
  const targets = getTargets(target);
  let hasFailure = false;

  console.log(`Validating deployment environment: ${path.relative(repoRoot, envPath) || path.basename(envPath)}`);

  for (const currentTarget of targets) {
    const result = validateTarget(currentTarget, values);
    const failed = result.missing.length > 0 || result.placeholders.length > 0;
    hasFailure ||= failed;

    console.log(`\n[${currentTarget}] ${failed ? "FAILED" : "OK"}`);

    if (result.missing.length > 0) {
      console.log(`  Missing required: ${result.missing.join(", ")}`);
    }

    if (result.placeholders.length > 0) {
      console.log(`  Placeholder values: ${result.placeholders.join(", ")}`);
    }

    for (const warning of result.warnings) {
      console.log(`  Warning: ${warning}`);
    }

    if (!failed && result.warnings.length === 0) {
      console.log("  All required variables look ready.");
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
    console.log("\nDeployment environment validation failed.");
    return;
  }

  console.log("\nDeployment environment validation passed.");
};

main();