import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { graphQLRequest } from "../../../../lib/graphql";
import { ConciergeAdminClient } from "./concierge-admin-client";

type ConciergeQuery = {
  users: {
    edges: Array<{
      node: {
        id: string;
        email: string;
        role: string;
      };
    }>;
  };
  demands: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        approvalStatus: string;
        hardToFill: boolean;
        company: { name: string };
      };
    }>;
  };
  headhunterAssignments: Array<{
    id: string;
    notes: string | null;
    demand: { id: string; title: string };
    headhunterUser: { id: string; email: string };
  }>;
  externalCandidateSubmissions: Array<{
    id: string;
    firstName: string;
    lastName: string;
    headline: string;
    status: "SUBMITTED" | "REVIEWED" | "SHORTLISTED" | "REJECTED";
    reviewNotes: string | null;
    demand: { id: string; title: string };
    headhunterUser: { id: string; email: string };
  }>;
};

const conciergeQuery = `#graphql
  query ConciergeDesk {
    users(filters: { role: HEADHUNTER, isActive: true }, pagination: { first: 50 }) {
      edges {
        node {
          id
          email
          role
        }
      }
    }
    demands(filters: { status: ACTIVE }, pagination: { first: 50 }) {
      edges {
        node {
          id
          title
          approvalStatus
          hardToFill
          company {
            name
          }
        }
      }
    }
    headhunterAssignments {
      id
      notes
      demand {
        id
        title
      }
      headhunterUser {
        id
        email
      }
    }
    externalCandidateSubmissions {
      id
      firstName
      lastName
      headline
      status
      reviewNotes
      demand {
        id
        title
      }
      headhunterUser {
        id
        email
      }
    }
  }
`;

export default async function AdminConciergePage() {
  const session = await getServerSession(authOptions);
  const data = await graphQLRequest<ConciergeQuery>(conciergeQuery, undefined, session?.accessToken);

  return (
    <ConciergeAdminClient
      accessToken={session?.accessToken ?? ""}
      demands={data.demands.edges.map((edge) => edge.node)}
      headhunters={data.users.edges.map((edge) => edge.node)}
      initialAssignments={data.headhunterAssignments}
      initialSubmissions={data.externalCandidateSubmissions}
    />
  );
}