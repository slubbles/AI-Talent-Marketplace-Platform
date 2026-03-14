import { notFound, redirect } from "next/navigation";
import { graphQLRequest } from "../../../../../lib/graphql";
import { OfferDetailClient } from "./offer-detail-client";
import type { CandidateProfile } from "../../../shortlists/types";

import { getSession } from "../../../../../lib/session";
const offerDetailQuery = `#graphql
  query OfferDetailDemand($demandId: ID!, $id: ID!) {
    demand(id: $demandId) {
      id
      title
      status
      location
      remotePolicy
      currency
      company {
        id
        name
        industry
        size
      }
    }
    shortlist(demandId: $id) {
      id
      talentProfile {
        id
        firstName
        lastName
        headline
        summary
        seniorityLevel
        industries
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
        offer {
          id
          interviewId
          demandId
          talentProfileId
          hourlyRate
          startDate
          endDate
          terms
          status
        }
      }
    }
  }
`;

type PageProps = {
  params: {
    demandId: string;
    offerId: string;
  };
};

export default async function OfferDetailPage({ params }: PageProps) {
  const session = await getSession();

  if (!session?.accessToken) {
    redirect("/login");
  }

  const data = await graphQLRequest<{
    demand: {
      id: string;
      title: string;
      status: string;
      location: string;
      remotePolicy: string;
      currency: string;
      company: {
        id: string;
        name: string;
        industry: string;
        size: string;
      };
    } | null;
    shortlist: Array<{
      id: string;
      talentProfile: CandidateProfile;
      interviews: Array<{
        id: string;
        offer?: {
          id: string;
          interviewId: string;
          demandId: string;
          talentProfileId: string;
          hourlyRate: number;
          startDate: string;
          endDate: string | null;
          terms: string;
          status: string;
        } | null;
      }>;
    }>;
  }>(offerDetailQuery, { demandId: params.demandId, id: params.demandId }, session.accessToken);

  if (!data.demand) {
    notFound();
  }

  const shortlistEntry = data.shortlist.find((entry) => entry.interviews.some((interview) => interview.offer?.id === params.offerId));
  const offer = shortlistEntry?.interviews.find((entry) => entry.offer?.id === params.offerId)?.offer;

  if (!shortlistEntry || !offer) {
    notFound();
  }

  return (
    <OfferDetailClient
      accessToken={session.accessToken}
      demand={data.demand}
      offer={{
        ...offer,
        candidate: shortlistEntry.talentProfile
      }}
    />
  );
}