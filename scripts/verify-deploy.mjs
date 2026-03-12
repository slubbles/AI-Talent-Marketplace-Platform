import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

const readEnvValues = (envFile) => {
  const envPath = path.isAbsolute(envFile) ? envFile : path.join(repoRoot, envFile);

  if (!existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envPath}`);
  }

  return {
    envPath,
    values: parseEnvFile(readFileSync(envPath, "utf8"))
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
  const envFile = process.argv[2] ?? ".env";
  const { envPath, values } = readEnvValues(envFile);
  const urls = resolveUrls(values);

  console.log(`Verifying deployed services using ${path.relative(repoRoot, envPath) || path.basename(envPath)}`);

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