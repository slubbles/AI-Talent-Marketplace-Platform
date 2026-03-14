import { graphQLRequest } from "../../../../lib/graphql";
import { CompaniesAdminClient } from "./companies-admin-client";

import { getSession } from "../../../../lib/session";
type CompaniesQuery = {
  companies: {
    edges: Array<{
      node: {
        id: string;
        recruiterId: string;
        name: string;
        industry: string;
        size: "STARTUP" | "SMB" | "ENTERPRISE";
        logoUrl: string | null;
        website: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>;
  };
  users: {
    edges: Array<{
      node: {
        id: string;
        email: string;
      };
    }>;
  };
  adminDashboard: {
    companyMetrics: Array<{
      id: string;
      name: string;
      industry: string;
      activeDemandCount: number;
      pendingApprovalsCount: number;
      hardToFillCount: number;
      placementsCount: number;
    }>;
  };
};

const companiesQuery = `#graphql
  query AdminCompaniesPage {
    companies(pagination: { first: 50 }) {
      edges {
        node {
          id
          recruiterId
          name
          industry
          size
          logoUrl
          website
          createdAt
          updatedAt
        }
      }
    }
    users(filters: { role: RECRUITER, isActive: true }, pagination: { first: 50 }) {
      edges {
        node {
          id
          email
        }
      }
    }
    adminDashboard {
      companyMetrics {
        id
        name
        industry
        activeDemandCount
        pendingApprovalsCount
        hardToFillCount
        placementsCount
      }
    }
  }
`;

export default async function AdminCompaniesPage() {
  const session = await getSession();
  const data = await graphQLRequest<CompaniesQuery>(companiesQuery, undefined, session?.accessToken);

  return (
    <CompaniesAdminClient
      accessToken={session?.accessToken ?? ""}
      initialCompanies={data.companies.edges.map((edge) => edge.node)}
      metrics={data.adminDashboard.companyMetrics}
      recruiters={data.users.edges.map((edge) => edge.node)}
    />
  );
}