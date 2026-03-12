import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { graphQLRequest } from "../../../../lib/graphql";
import { DemandForm } from "../demand-form";

const companiesQuery = `#graphql
  query CompaniesForDemandForm {
    companies(pagination: { first: 50 }) {
      edges {
        node {
          id
          name
          industry
          size
        }
      }
    }
  }
`;

export default async function NewRolePage() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    redirect("/login");
  }

  const data = await graphQLRequest<{
    companies: {
      edges: Array<{
        node: {
          id: string;
          name: string;
          industry: string;
          size: string;
        };
      }>;
    };
  }>(companiesQuery, undefined, session.accessToken);

  return (
    <DemandForm accessToken={session.accessToken} companies={data.companies.edges.map((edge) => edge.node)} mode="create" />
  );
}