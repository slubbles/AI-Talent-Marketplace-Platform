import { graphQLRequest } from "../../../../lib/graphql";
import { VerificationAdminClient } from "./verification-admin-client";

import { getSession } from "../../../../lib/session";
type VerificationQuery = {
  talentProfiles: {
    edges: Array<{
      node: {
        id: string;
        firstName: string;
        lastName: string;
        headline: string;
        summary: string;
        resumeUrl: string | null;
        locationPreferences: string[];
        workVisaEligibility: string[];
        identityDocumentUrls: string[];
        industries: string[];
        verificationStatus: string;
        user: { email: string };
        certifications: Array<{
          id: string;
          name: string;
          issuer: string;
          credentialUrl: string | null;
        }>;
        skills: Array<{
          id: string;
          yearsOfExperience: number;
          skill: { displayName: string };
        }>;
      };
    }>;
  };
};

const verificationQuery = `#graphql
  query PendingVerificationQueue {
    talentProfiles(filters: { verificationStatus: PENDING }, pagination: { first: 50 }) {
      edges {
        node {
          id
          firstName
          lastName
          headline
          summary
          resumeUrl
          locationPreferences
          workVisaEligibility
          identityDocumentUrls
          industries
          verificationStatus
          user {
            email
          }
          certifications {
            id
            name
            issuer
            credentialUrl
          }
          skills {
            id
            yearsOfExperience
            skill {
              displayName
            }
          }
        }
      }
    }
  }
`;

export default async function AdminVerificationPage() {
  const session = await getSession();
  const data = await graphQLRequest<VerificationQuery>(verificationQuery, undefined, session?.accessToken);

  return <VerificationAdminClient accessToken={session?.accessToken ?? ""} initialProfiles={data.talentProfiles.edges.map((edge) => edge.node)} />;
}