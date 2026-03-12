import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export function createApolloClient(accessToken?: string) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL ?? "http://localhost:4000/graphql",
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`
          }
        : undefined,
      fetch
    }),
    defaultOptions: {
      query: {
        fetchPolicy: "no-cache"
      },
      mutate: {
        errorPolicy: "all"
      }
    }
  });
}