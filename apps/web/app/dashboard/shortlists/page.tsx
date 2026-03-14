import Link from "next/link";
import { redirect } from "next/navigation";
import { graphQLRequest } from "../../../lib/graphql";
import { ShortlistWorkbench } from "./shortlist-workbench";
import type { ShortlistDemandSummary, ShortlistEntry } from "./types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getSession } from "../../../lib/session";
const shortlistOverviewQuery = `#graphql
  query ShortlistsOverview {
    myDemands(pagination: { first: 12 }) {
      edges {
        node {
          id
          title
          status
          location
          remotePolicy
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
      }
    }
  }
`;

const shortlistDetailQuery = `#graphql
  query ShortlistDetail($demandId: ID!) {
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
  }
`;

type ShortlistsPageProps = {
  searchParams?: {
    demandId?: string;
  };
};

export default async function ShortlistsPage({ searchParams }: ShortlistsPageProps) {
  const session = await getSession();

  if (!session?.accessToken) {
    redirect("/login");
  }

  const roleData = await graphQLRequest<{
    myDemands: {
      edges: Array<{ node: ShortlistDemandSummary }>;
    };
  }>(shortlistOverviewQuery, undefined, session.accessToken);

  const roles = roleData.myDemands.edges.map((edge) => edge.node);

  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[#A1A1AA] mb-4">No role shortlists yet. Create a recruiter demand and trigger AI matching.</p>
        <div className="flex gap-3">
          <Button asChild><Link href="/dashboard/roles/new"><Plus className="h-4 w-4" /> Create Role</Link></Button>
          <Button asChild variant="ghost"><Link href="/dashboard/search">Open Talent Search</Link></Button>
        </div>
      </div>
    );
  }

  const shortlistResults = await Promise.all(
    roles.map((role) => graphQLRequest<{ shortlist: ShortlistEntry[] }>(shortlistDetailQuery, { demandId: role.id }, session.accessToken))
  );

  const roleQueues = roles.map((role, index) => ({
    ...role,
    shortlist: shortlistResults[index]?.shortlist ?? []
  }));

  const activeQueue = roleQueues.find((role) => role.id === searchParams?.demandId) ?? roleQueues[0];
  const totalCandidates = roleQueues.reduce((sum, role) => sum + role.shortlist.length, 0);
  const totalShortlisted = roleQueues.reduce((sum, role) => sum + role.shortlist.filter((item) => item.status === "SHORTLISTED").length, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold">Shortlists</h1>
          <p className="text-sm text-[#A1A1AA]">Review AI-matched candidates across all your active roles.</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/roles/${activeQueue.id}`}>Open Role Detail</Link>
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4">
          <span className="text-xs text-[#52525B]">Roles with AI matches</span>
          <p className="text-xl font-bold mt-1">{roleQueues.length}</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4">
          <span className="text-xs text-[#52525B]">Visible candidates</span>
          <p className="text-xl font-bold mt-1">{totalCandidates}</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4">
          <span className="text-xs text-[#52525B]">Shortlisted</span>
          <p className="text-xl font-bold mt-1">{totalShortlisted}</p>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex items-center gap-0.5 mt-4">
        {roleQueues.map((role) => {
          const isActive = role.id === activeQueue.id;
          return (
            <Link
              key={role.id}
              href={`/dashboard/shortlists?demandId=${role.id}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isActive ? "bg-primary/10 text-white border-b-2 border-primary" : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              {role.title} ({role.shortlist.length})
            </Link>
          );
        })}
      </div>

      {/* Active role summary */}
      <div className="mt-4 bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-950 text-green-400">{activeQueue.status}</span>
          <h3 className="font-semibold">{activeQueue.title}</h3>
          <span className="text-sm text-[#A1A1AA]">{activeQueue.company.name} · {activeQueue.location} · {activeQueue.remotePolicy}</span>
        </div>
        <div className="flex gap-1">
          {activeQueue.requiredSkills.map((skill) => (
            <span key={skill.id} className="px-2 py-0.5 bg-[#1A1A1A] border border-[#27272A] rounded text-xs text-[#A1A1AA]">{skill.skill.displayName}</span>
          ))}
        </div>
      </div>

      {/* Workbench */}
      <div className="mt-4">
        <ShortlistWorkbench
          accessToken={session.accessToken}
          demandId={activeQueue.id}
          demandTitle={activeQueue.title}
          requiredSkillNames={activeQueue.requiredSkills.map((skill) => skill.skill.displayName)}
          shortlist={activeQueue.shortlist}
        />
      </div>
    </div>
  );
}