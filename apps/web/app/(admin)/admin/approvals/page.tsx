import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { graphQLRequest } from "../../../../lib/graphql";
import { ApprovalsAdminClient } from "./approvals-admin-client";

type ApprovalsQuery = {
  demands: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        status: string;
        approvalStatus: string;
        approvalNotes: string | null;
        hardToFill: boolean;
        location: string;
        remotePolicy: string;
        experienceLevel: string;
        createdAt: string;
        company: {
          id: string;
          name: string;
          industry: string;
        };
        requiredSkills: Array<{
          id: string;
          skill: { displayName: string };
        }>;
      };
    }>;
  };
};

const approvalsQuery = `#graphql
  query PendingDemandApprovals {
    demands(filters: { approvalStatus: PENDING }, pagination: { first: 50 }) {
      edges {
        node {
          id
          title
          status
          approvalStatus
          approvalNotes
          hardToFill
          location
          remotePolicy
          experienceLevel
          createdAt
          company {
            id
            name
            industry
          }
          requiredSkills {
            id
            skill {
              displayName
            }
          }
        }
      }
    }
  }
`;

export default async function AdminApprovalsPage() {
  const session = await getServerSession(authOptions);
  const data = await graphQLRequest<ApprovalsQuery>(approvalsQuery, undefined, session?.accessToken);

  return <ApprovalsAdminClient accessToken={session?.accessToken ?? ""} initialDemands={data.demands.edges.map((edge) => edge.node)} />;
}