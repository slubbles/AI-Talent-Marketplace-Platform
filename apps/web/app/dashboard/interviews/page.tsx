import { redirect } from "next/navigation";
import { graphQLRequest } from "../../../lib/graphql";
import Link from "next/link";
import { ListChecks } from "lucide-react";

import { getSession } from "../../../lib/session";
const demandQueueQuery = `#graphql
  query InterviewDemandQueue {
    myDemands(pagination: { first: 30 }) {
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
        }
      }
    }
  }
`;

const demandPipelineQuery = `#graphql
  query InterviewDemandPipeline($demandId: ID!) {
    shortlist(demandId: $demandId) {
      id
      talentProfile {
        id
        firstName
        lastName
        headline
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

type InterviewsPageProps = {
  searchParams?: {
    status?: string;
  };
};

const statusFilters = ["ALL", "SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export default async function InterviewsPage({ searchParams }: InterviewsPageProps) {
  const session = await getSession();

  if (!session?.accessToken) {
    redirect("/login");
  }

  const activeStatus = searchParams?.status && statusFilters.includes(searchParams.status as (typeof statusFilters)[number])
    ? searchParams.status
    : "ALL";

  const demandData = await graphQLRequest<{
    myDemands: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          status: string;
          location: string;
          remotePolicy: string;
          company: {
            id: string;
            name: string;
            industry: string;
            size: string;
          };
        };
      }>;
    };
  }>(demandQueueQuery, undefined, session.accessToken);

  const demands = demandData.myDemands.edges.map((edge) => edge.node);
  const pipelines = await Promise.all(
    demands.map((demand) => graphQLRequest<{ shortlist: Array<{ id: string; talentProfile: { id: string; firstName: string; lastName: string; headline: string }; interviews: Array<{ id: string; shortlistId?: string; scheduledAt: string; duration: number; status: string; meetingUrl: string | null; feedback: string | null; rating: number | null; createdAt: string; updatedAt: string; offer?: { id: string; status: string } | null }> }> }>(demandPipelineQuery, { demandId: demand.id }, session.accessToken))
  );

  const interviews = demands.flatMap((demand, demandIndex) =>
    (pipelines[demandIndex]?.shortlist ?? []).flatMap((entry) =>
      entry.interviews.map((interview) => ({
        ...interview,
        candidateName: `${entry.talentProfile.firstName} ${entry.talentProfile.lastName}`,
        candidateHeadline: entry.talentProfile.headline,
        demandId: demand.id,
        demandTitle: demand.title,
        companyName: demand.company.name,
        companyIndustry: demand.company.industry
      }))
    )
  );

  const visibleInterviews = interviews
    .filter((interview) => activeStatus === "ALL" || interview.status === activeStatus)
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime());

  const statusStyles: Record<string, string> = {
    SCHEDULED: "bg-blue-950 text-blue-400",
    COMPLETED: "bg-green-950 text-green-400",
    CANCELLED: "bg-[#27272A] text-[#52525B]",
    NO_SHOW: "bg-amber-950 text-amber-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Interviews</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Recruiter interview operations</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Scheduled</span>
          <p className="text-2xl font-bold text-white mt-1">{interviews.filter((item) => item.status === "SCHEDULED").length}</p>
          <p className="text-xs text-[#52525B] mt-1">Upcoming sessions waiting on recruiter or candidate action.</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Completed</span>
          <p className="text-2xl font-bold text-white mt-1">{interviews.filter((item) => item.status === "COMPLETED").length}</p>
          <p className="text-xs text-[#52525B] mt-1">Sessions with feedback submitted or marked complete.</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Offers linked</span>
          <p className="text-2xl font-bold text-white mt-1">{interviews.filter((item) => item.offer).length}</p>
          <p className="text-xs text-[#52525B] mt-1">Interviews that already advanced into the offer stage.</p>
        </div>
      </div>

      <div className="flex gap-1">
        {statusFilters.map((status) => {
          const isActive = activeStatus === status;
          const href = status === "ALL" ? "/dashboard/interviews" : `/dashboard/interviews?status=${status}`;
          return (
            <Link
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                isActive
                  ? "bg-[rgba(239,254,94,0.12)] text-white border-b-2 border-[#EFFE5E]"
                  : "text-[#A1A1AA] hover:text-white"
              }`}
              href={href}
              key={status}
            >
              {status}
            </Link>
          );
        })}
      </div>

      {visibleInterviews.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <ListChecks className="h-12 w-12 text-[#52525B] mb-4" />
          <p className="text-sm text-[#A1A1AA]">No interviews in this status. Interview rows appear once shortlisted candidates are scheduled.</p>
          <Link
            className="mt-4 inline-flex items-center px-4 py-2 bg-[#222222] border border-[#27272A] text-white rounded-md text-sm hover:bg-[#222222]/80"
            href="/dashboard/shortlists"
          >
            Review shortlists
          </Link>
        </div>
      ) : (
        <div className="border border-[#27272A] rounded-[14px] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#27272A] bg-[#0A0A0A]">
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Candidate</th>
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Scheduled</th>
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Duration</th>
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Company</th>
                <th className="text-right px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide" />
              </tr>
            </thead>
            <tbody>
              {visibleInterviews.map((interview) => (
                <tr key={interview.id} className="h-14 border-b border-[#27272A] last:border-b-0 hover:bg-[#222222] transition-colors">
                  <td className="px-4">
                    <p className="text-white font-medium">{interview.candidateName}</p>
                    <p className="text-xs text-[#52525B]">{interview.candidateHeadline}</p>
                  </td>
                  <td className="px-4 text-[#A1A1AA]">{interview.demandTitle}</td>
                  <td className="px-4 text-[#A1A1AA]">{formatDateTime(interview.scheduledAt)}</td>
                  <td className="px-4 text-[#A1A1AA]">{interview.duration} min</td>
                  <td className="px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[interview.status] ?? "bg-[#27272A] text-[#A1A1AA]"}`}>
                      {interview.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 text-[#A1A1AA]">{interview.companyName}</td>
                  <td className="px-4 text-right">
                    <Link
                      className="text-xs text-[#EFFE5E] hover:underline"
                      href={`/dashboard/interviews/${interview.demandId}/${interview.id}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}