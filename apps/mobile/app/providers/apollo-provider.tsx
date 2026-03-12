import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { useMemo } from "react";
import { useAuth } from "./auth-provider";

export function MobileApolloProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();

  const client = useMemo(
    () =>
      new ApolloClient({
        cache: new InMemoryCache(),
        link: new HttpLink({
          uri: process.env.EXPO_PUBLIC_GRAPHQL_API_URL ?? "http://localhost:4000/graphql",
          headers: session?.tokens.accessToken
            ? {
                Authorization: `Bearer ${session.tokens.accessToken}`
              }
            : undefined,
          fetch
        }),
        defaultOptions: {
          query: { fetchPolicy: "no-cache" },
          mutate: { errorPolicy: "all" }
        }
      }),
    [session?.tokens.accessToken]
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}