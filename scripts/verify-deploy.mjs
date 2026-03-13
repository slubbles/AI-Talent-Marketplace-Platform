import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const placeholderPatterns = [/^change-me$/i, /^https:\/\/.*\.example\.com/i, /^stub-/i];
const expectedOpenRouterBaseUrl = "https://openrouter.ai/api/v1";
const expectedEmbeddingModel = "text-embedding-3-small";

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

const resolveEnvPath = (envFile) => (path.isAbsolute(envFile) ? envFile : path.join(repoRoot, envFile));

const readEnvValues = (envFiles) => {
  const uniqueFiles = Array.from(new Set(envFiles));

  if (uniqueFiles.length === 0) {
    throw new Error("At least one env file path is required for deploy verification.");
  }

  const loaded = uniqueFiles.map((envFile) => {
    const envPath = resolveEnvPath(envFile);

    if (!existsSync(envPath)) {
      throw new Error(`Environment file not found: ${envPath}`);
    }

    return {
      envFile,
      envPath,
      values: parseEnvFile(readFileSync(envPath, "utf8"))
    };
  });

  const mergedValues = loaded.reduce((acc, current) => ({ ...acc, ...current.values }), {});

  return {
    files: loaded,
    values: mergedValues
  };
};

const resolveUrls = (values) => {
  const webUrl = values.NEXTAUTH_URL;
  const graphQlUrl = values.NEXT_PUBLIC_GRAPHQL_API_URL ?? values.GRAPHQL_API_URL ?? values.EXPO_PUBLIC_GRAPHQL_API_URL;
  const aiUrl = values.AI_ENGINE_URL;

  if (!webUrl) {
    throw new Error("NEXTAUTH_URL is required for deploy verification.");
  }

  if (!graphQlUrl) {
    throw new Error("NEXT_PUBLIC_GRAPHQL_API_URL, GRAPHQL_API_URL, or EXPO_PUBLIC_GRAPHQL_API_URL is required for deploy verification.");
  }

  if (!aiUrl) {
    throw new Error("AI_ENGINE_URL is required for deploy verification.");
  }

  return {
    aiHealthUrl: new URL("/health", aiUrl).toString(),
    apiHealthUrl: new URL("/healthz", graphQlUrl).toString(),
    graphQlUrl,
    webUrl
  };
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

const assertNoPlaceholders = (files, values) => {
  const keysToCheck = [
    "NEXTAUTH_URL",
    "NEXT_PUBLIC_GRAPHQL_API_URL",
    "GRAPHQL_API_URL",
    "AI_ENGINE_URL",
    "DATABASE_URL",
    "DIRECT_URL",
    "CORS_ALLOWED_ORIGINS",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "OPENROUTER_API_KEY"
  ];

  const placeholderKeys = keysToCheck
    .map((key) => ({ key, value: values[key] }))
    .filter((entry) => entry.value && isPlaceholder(entry.value))
    .map((entry) => entry.key);

  if (placeholderKeys.length > 0) {
    const placeholderHits = [];

    for (const key of placeholderKeys) {
      for (const file of files) {
        const value = file.values[key];
        if (value && isPlaceholder(value)) {
          placeholderHits.push(`${key}@${path.relative(repoRoot, file.envPath) || path.basename(file.envPath)}`);
        }
      }
    }

    const uniqueHits = Array.from(new Set(placeholderHits));

    throw new Error(
      `Deployment env files still contain placeholder values for: ${uniqueHits.join(", ")}. Replace placeholders before running deploy verification.`
    );
  }
};

const assertNoConflictingValues = (files) => {
  const keysToMatch = [
    "NEXTAUTH_URL",
    "NEXT_PUBLIC_GRAPHQL_API_URL",
    "EXPO_PUBLIC_GRAPHQL_API_URL",
    "AI_ENGINE_URL",
    "OPENROUTER_BASE_URL",
    "OPENROUTER_MODEL",
    "OPENROUTER_EMBEDDING_MODEL"
  ];
  const conflicts = [];

  for (const key of keysToMatch) {
    const entries = files
      .map((entry) => ({
        file: path.relative(repoRoot, entry.envPath) || path.basename(entry.envPath),
        value: entry.values[key]
      }))
      .filter((entry) => Boolean(entry.value));

    if (entries.length < 2) {
      continue;
    }

    const distinctValues = Array.from(new Set(entries.map((entry) => entry.value)));
    if (distinctValues.length > 1) {
      const detail = entries.map((entry) => `${entry.file}=${entry.value}`).join("; ");
      conflicts.push(`${key} has conflicting values across env files: ${detail}`);
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `Deployment env files disagree on duplicated keys. Resolve before verification. ${conflicts.join(" | ")}`
    );
  }
};

const assertPlatformPolicy = (files) => {
  const policyIssues = [];

  for (const file of files) {
    const relativeFile = path.relative(repoRoot, file.envPath) || path.basename(file.envPath);
    const baseUrl = file.values.OPENROUTER_BASE_URL;
    const embeddingModel = file.values.OPENROUTER_EMBEDDING_MODEL;

    if (baseUrl && !isPlaceholder(baseUrl) && baseUrl !== expectedOpenRouterBaseUrl) {
      policyIssues.push(
        `OPENROUTER_BASE_URL@${relativeFile} must be ${expectedOpenRouterBaseUrl} (found: ${baseUrl}).`
      );
    }

    if (embeddingModel && !isPlaceholder(embeddingModel) && embeddingModel !== expectedEmbeddingModel) {
      policyIssues.push(
        `OPENROUTER_EMBEDDING_MODEL@${relativeFile} must be ${expectedEmbeddingModel} (found: ${embeddingModel}).`
      );
    }
  }

  if (policyIssues.length > 0) {
    throw new Error(`OpenRouter platform policy mismatch detected. ${policyIssues.join(" | ")}`);
  }
};

const requestJson = async (url, init = {}) => {
  let response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Request failed for ${url}: ${reason}`);
  }

  const text = await response.text();

  try {
    return {
      body: JSON.parse(text),
      ok: response.ok,
      response,
      text
    };
  } catch {
    return {
      body: text,
      ok: response.ok,
      response,
      text
    };
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const main = async () => {
  const envFiles = process.argv.slice(2);
  const normalizedEnvFiles = envFiles.length > 0 ? envFiles : [".env"];
  const { files, values } = readEnvValues(normalizedEnvFiles);
  assertNoConflictingValues(files);
  assertNoPlaceholders(files, values);
  assertPlatformPolicy(files);
  const urls = resolveUrls(values);
  const fileList = files.map((entry) => path.relative(repoRoot, entry.envPath) || path.basename(entry.envPath)).join(", ");

  console.log(`Verifying deployed services using ${fileList}`);

  console.log("1. Checking web application...");
  const web = await requestJson(urls.webUrl, { redirect: "follow" });
  assert(web.ok, `Web app did not return success at ${urls.webUrl}`);

  console.log("2. Checking API health endpoint...");
  const apiHealth = await requestJson(urls.apiHealthUrl);
  assert(apiHealth.ok, `API health endpoint failed at ${urls.apiHealthUrl}`);
  assert(apiHealth.body?.status === "ok", "API health endpoint did not return status=ok.");

  console.log("3. Checking GraphQL endpoint...");
  const graphQl = await requestJson(urls.graphQlUrl, {
    body: JSON.stringify({ query: "query DeployCheck { __typename }" }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  assert(graphQl.ok, `GraphQL endpoint failed at ${urls.graphQlUrl}`);
  assert(!graphQl.body?.errors, `GraphQL endpoint returned errors: ${graphQl.body?.errors?.[0]?.message ?? "unknown"}`);
  assert(graphQl.body?.data?.__typename === "Query", "GraphQL endpoint did not respond with the Query root typename.");

  console.log("4. Checking AI health endpoint...");
  const aiHealth = await requestJson(urls.aiHealthUrl);
  assert(aiHealth.ok, `AI health endpoint failed at ${urls.aiHealthUrl}`);
  assert(aiHealth.body?.status === "ok", "AI health endpoint did not return status=ok.");

  console.log("5. Checking API CORS allowlist against NEXTAUTH_URL...");
  const corsResponse = await fetch(urls.graphQlUrl, {
    headers: {
      Origin: urls.webUrl,
      "Access-Control-Request-Method": "POST"
    },
    method: "OPTIONS"
  });
  const allowedOrigin = corsResponse.headers.get("access-control-allow-origin");
  assert(corsResponse.ok, `CORS preflight failed at ${urls.graphQlUrl}`);
  assert(allowedOrigin === urls.webUrl, `CORS allow-origin mismatch. Expected ${urls.webUrl}, received ${allowedOrigin ?? "none"}.`);

  if (values.EXPO_PUBLIC_GRAPHQL_API_URL && values.EXPO_PUBLIC_GRAPHQL_API_URL !== urls.graphQlUrl) {
    console.log("Warning: EXPO_PUBLIC_GRAPHQL_API_URL does not match NEXT_PUBLIC_GRAPHQL_API_URL/GRAPHQL_API_URL.");
  }

  console.log("Deployment verification passed.");
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});