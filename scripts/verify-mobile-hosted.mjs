import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PLACEHOLDER_PATTERNS = [
  /^https:\/\/api\.example\.com\/graphql$/i,
  /^https:\/\/.*\.example\.com(?:\/|$)/i,
  /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i,
  /^change-me$/i
];

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

const isPlaceholder = (value) => PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));

const requestJson = async (url, init = {}) => {
  const response = await fetch(url, init);
  const text = await response.text();

  try {
    return { ok: response.ok, status: response.status, body: JSON.parse(text), text };
  } catch {
    return { ok: response.ok, status: response.status, body: text, text };
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const resolvePath = (inputPath, fallback) => {
  const target = inputPath ?? fallback;
  return path.isAbsolute(target) ? target : path.join(repoRoot, target);
};

const main = async () => {
  const envFileArg = process.argv[2] ?? ".env.production.mobile";
  const easFileArg = process.argv[3] ?? "apps/mobile/eas.json";

  const envPath = resolvePath(envFileArg, ".env.production.mobile");
  const easPath = resolvePath(easFileArg, "apps/mobile/eas.json");

  assert(existsSync(envPath), `Mobile env file not found: ${envPath}`);
  assert(existsSync(easPath), `EAS config file not found: ${easPath}`);

  const envValues = parseEnvFile(readFileSync(envPath, "utf8"));
  const mobileGraphQlUrl = envValues.EXPO_PUBLIC_GRAPHQL_API_URL;

  assert(mobileGraphQlUrl, "Missing EXPO_PUBLIC_GRAPHQL_API_URL in mobile env file.");
  assert(!isPlaceholder(mobileGraphQlUrl), "EXPO_PUBLIC_GRAPHQL_API_URL still uses placeholder value.");

  const easConfig = JSON.parse(readFileSync(easPath, "utf8"));
  const previewUrl = easConfig?.build?.preview?.env?.EXPO_PUBLIC_GRAPHQL_API_URL;
  const productionUrl = easConfig?.build?.production?.env?.EXPO_PUBLIC_GRAPHQL_API_URL;

  assert(previewUrl, "Missing apps/mobile/eas.json build.preview.env.EXPO_PUBLIC_GRAPHQL_API_URL.");
  assert(productionUrl, "Missing apps/mobile/eas.json build.production.env.EXPO_PUBLIC_GRAPHQL_API_URL.");
  assert(!isPlaceholder(previewUrl), "eas.json preview EXPO_PUBLIC_GRAPHQL_API_URL still uses placeholder value.");
  assert(!isPlaceholder(productionUrl), "eas.json production EXPO_PUBLIC_GRAPHQL_API_URL still uses placeholder value.");

  if (previewUrl !== mobileGraphQlUrl || productionUrl !== mobileGraphQlUrl) {
    console.warn("Warning: EXPO_PUBLIC_GRAPHQL_API_URL differs between env file and eas.json profiles.");
  }

  console.log(`Verifying mobile GraphQL endpoint: ${mobileGraphQlUrl}`);
  const graphQl = await requestJson(mobileGraphQlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: "query MobileDeployCheck { __typename }" })
  });

  assert(graphQl.ok, `GraphQL endpoint check failed with status ${graphQl.status}.`);
  assert(!graphQl.body?.errors, `GraphQL endpoint returned errors: ${graphQl.body?.errors?.[0]?.message ?? "unknown"}`);
  assert(graphQl.body?.data?.__typename === "Query", "GraphQL endpoint did not respond with Query root typename.");

  console.log("Mobile hosted verification passed.");
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
