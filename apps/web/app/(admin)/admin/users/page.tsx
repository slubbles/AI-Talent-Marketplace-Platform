import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { graphQLRequest } from "../../../../lib/graphql";
import { UsersAdminClient } from "./users-admin-client";

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
  const session = await getServerSession(authOptions);
  const data = await graphQLRequest<UsersQuery>(usersQuery, undefined, session?.accessToken);

  return <UsersAdminClient accessToken={session?.accessToken ?? ""} initialUsers={data.users.edges.map((edge) => edge.node)} />;
}