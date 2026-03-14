import { notFound, redirect } from "next/navigation";
import { graphQLRequest } from "../../../../lib/graphql";
import { RoleDetailClient } from "./role-detail-client";
import type { RoleSkillReference, ShortlistEntry } from "../../shortlists/types";

import { getSession } from "../../../../lib/session";
const roleDetailQuery = `#graphql
  query RoleDetail($id: ID!, $demandId: ID!) {
    demand(id: $id) {
      id
      title
      description
      aiGeneratedDescription
      experienceLevel
      location
      remotePolicy
      startDate
      contractDuration
      budgetMin
      budgetMax
      currency
      projectRequirements
      status
      company {
        id
        name
        industry
        size
      }
      requiredSkills {
        id
        isRequired
        minimumYears
        skill {
          id
          name
          displayName
          category
        }
      }
    }
    shortlist(demandId: $demandId) {
      id
      demandId
      talentProfileId
      matchScore
      scoreBreakdown
      aiExplanation
      status
      talentStatus
      talentProfile {
        id
        firstName
        lastName
        headline
        summary
        careerTrajectory
        availability
        availableFrom
        hourlyRateMin
        hourlyRateMax
        currency
        locationPreferences
        workVisaEligibility
        portfolioUrls
        verificationStatus
        skills {
          id
          proficiency
          yearsOfExperience
          skill {
            id
            name
            displayName
            category
          }
        }
        experiences {
          id
          title
          companyName
          location
          startDate
          endDate
          isCurrent
          description
        }
        certifications {
          id
          name
          issuer
          issueDate
          expirationDate
          credentialUrl
        }
        educationEntries {
          id
          institution
          degree
          fieldOfStudy
          startDate
          endDate
          description
        }
      }
      interviews {
        id
        shortlistId
        scheduledAt
        duration
        status
        meetingUrl
        offer {
          id
          hourlyRate
          startDate
          status
          talentProfile {
            firstName
            lastName
          }
        }
      }
    }
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

type RoleDetailPageProps = {
  params: {
    id: string;
  };
};

type RoleDetailDemand = {
  id: string;
  title: string;
  description: string;
  aiGeneratedDescription: string | null;
  experienceLevel: string;
  location: string;
  remotePolicy: string;
  startDate: string | null;
  contractDuration: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  projectRequirements: string | null;
  status: string;
  company: {
    id: string;
    name: string;
    industry: string;
    size: string;
  };
  requiredSkills: RoleSkillReference[];
};

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const session = await getSession();

  if (!session?.accessToken) {
    redirect("/login");
  }

  const data = await graphQLRequest<{
    demand: RoleDetailDemand | null;
    shortlist: ShortlistEntry[];
    companies: { edges: Array<{ node: { id: string; name: string; industry: string; size: string } }> };
  }>(roleDetailQuery, { id: params.id, demandId: params.id }, session.accessToken);

  if (!data.demand) {
    notFound();
  }

  return (
    <RoleDetailClient
      accessToken={session.accessToken}
      companies={data.companies.edges.map((edge) => edge.node)}
      demand={data.demand}
      shortlist={data.shortlist}
    />
  );
}