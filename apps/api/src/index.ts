import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const typeDefs = `#graphql
  type Healthcheck {
    status: String!
    service: String!
  }

  type Query {
    healthcheck: Healthcheck!
  }
`;

const resolvers = {
  Query: {
    healthcheck: () => ({
      status: "ok",
      service: "api"
    })
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

const bootstrap = async () => {
  const { url } = await startStandaloneServer(server, {
    listen: { port, host }
  });

  console.log(`GraphQL API ready at ${url}`);
};

bootstrap().catch((error: unknown) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
