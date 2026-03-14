import { graphQLRequest } from "../../../../lib/graphql";
import { UsersAdminClient } from "./users-admin-client";

import { getSession } from "../../../../lib/session";
type UsersQuery = {
  users: {
    edges: Array<{
      node: {
        id: string;
        email: string;
        role: "TALENT" | "RECRUITER" | "ADMIN" | "HEADHUNTER";
        emailVerified: boolean;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    }>;
  };
};

const usersQuery = `#graphql
  query AdminUsers {
    users(pagination: { first: 100 }) {
      edges {
        node {
          id
          email
          role
          emailVerified
          isActive
          createdAt
          updatedAt
        }
      }
    }
  }
`;

export default async function AdminUsersPage() {
  const session = await getSession();
  const data = await graphQLRequest<UsersQuery>(usersQuery, undefined, session?.accessToken);

  return <UsersAdminClient accessToken={session?.accessToken ?? ""} initialUsers={data.users.edges.map((edge) => edge.node)} />;
}