const resolveGraphQlUrl = (): string => {
  const configuredUrl = process.env.EXPO_PUBLIC_GRAPHQL_API_URL ?? "http://localhost:4000/graphql";

  if (!__DEV__ && /localhost|127\.0\.0\.1/i.test(configuredUrl)) {
    throw new Error(
      "EXPO_PUBLIC_GRAPHQL_API_URL points to localhost in a non-development build. Configure the hosted GraphQL URL before building mobile preview/production."
    );
  }

  return configuredUrl;
};

export async function graphQLRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
  accessToken?: string
): Promise<TData> {
  const response = await fetch(resolveGraphQlUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });

  const payload = (await response.json()) as {
    data?: TData;
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "GraphQL request failed.");
  }

  if (!payload.data) {
    throw new Error("GraphQL response did not include data.");
  }

  return payload.data;
}