import { redirect } from "next/navigation";
import { graphQLRequest } from "../../../../lib/graphql";
import { DemandForm } from "../demand-form";

import { getSession } from "../../../../lib/session";
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
  const session = await getSession();

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