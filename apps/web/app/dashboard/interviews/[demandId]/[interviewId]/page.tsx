import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { graphQLRequest } from "../../../../../lib/graphql";
import { InterviewDetailClient } from "./interview-detail-client";
import type { CandidateProfile } from "../../../shortlists/types";

const interviewDetailQuery = `#graphql
  query InterviewDetailDemand($demandId: ID!, $id: ID!) {
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
        shortlistId
        scheduledAt
        duration
        status
        meetingUrl
        feedback
        rating
        createdAt
        updatedAt
        offer {
          id
          status
        }
      }
    }
  }
`;

type PageProps = {
  params: {
    demandId: string;
    interviewId: string;
  };
};

export default async function InterviewDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

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
        shortlistId: string;
        scheduledAt: string;
        duration: number;
        status: string;
        meetingUrl: string | null;
        feedback: string | null;
        rating: number | null;
        createdAt: string;
        updatedAt: string;
        offer?: {
          id: string;
          status: string;
        } | null;
      }>;
    }>;
  }>(interviewDetailQuery, { demandId: params.demandId, id: params.demandId }, session.accessToken);

  if (!data.demand) {
    notFound();
  }

  const shortlistEntry = data.shortlist.find((entry) => entry.interviews.some((interview) => interview.id === params.interviewId));
  const interview = shortlistEntry?.interviews.find((entry) => entry.id === params.interviewId);

  if (!shortlistEntry || !interview) {
    notFound();
  }

  return (
    <InterviewDetailClient
      accessToken={session.accessToken}
      demand={data.demand}
      interview={{
        ...interview,
        candidate: shortlistEntry.talentProfile
      }}
    />
  );
}