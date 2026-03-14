import { redirect } from "next/navigation";
import { graphQLRequest } from "../../../lib/graphql";
import Link from "next/link";
import { FileText } from "lucide-react";

import { getSession } from "../../../lib/session";
const demandQueueQuery = `#graphql
  query OfferDemandQueue {
    myDemands(pagination: { first: 30 }) {
      edges {
        node {
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
      }
    }
  }
`;

const demandPipelineQuery = `#graphql
  query OfferDemandPipeline($demandId: ID!) {
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
          createdAt
          updatedAt
          talentProfile {
            id
            firstName
            lastName
          }
        }
      }
    }
  }
`;

type OffersPageProps = {
  searchParams?: {
    status?: string;
  };
};

const statusFilters = ["ALL", "DRAFT", "SENT", "ACCEPTED", "DECLINED", "WITHDRAWN"] as const;

export default async function OffersPage({ searchParams }: OffersPageProps) {
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
          currency: string;
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
    demands.map((demand) => graphQLRequest<{ shortlist: Array<{ id: string; talentProfile: { id: string; firstName: string; lastName: string; headline: string }; interviews: Array<{ id: string; offer?: { id: string; interviewId: string; demandId: string; talentProfileId: string; hourlyRate: number; startDate: string; endDate: string | null; terms: string; status: string; createdAt: string; updatedAt: string; talentProfile: { id: string; firstName: string; lastName: string } } | null }> }> }>(demandPipelineQuery, { demandId: demand.id }, session.accessToken))
  );

  const offers = demands.flatMap((demand, demandIndex) =>
    (pipelines[demandIndex]?.shortlist ?? []).flatMap((entry) =>
      entry.interviews.flatMap((interview) =>
        interview.offer
          ? [{
              ...interview.offer,
              candidateName: `${entry.talentProfile.firstName} ${entry.talentProfile.lastName}`,
              candidateHeadline: entry.talentProfile.headline,
              demandTitle: demand.title,
              demandId: demand.id,
              companyName: demand.company.name,
              currency: demand.currency
            }]
          : []
      )
    )
  );

  const visibleOffers = offers.filter((offer) => activeStatus === "ALL" || offer.status === activeStatus);

  const statusStyles: Record<string, string> = {
    DRAFT: "bg-[#27272A] text-[#A1A1AA]",
    SENT: "bg-blue-950 text-blue-400",
    ACCEPTED: "bg-green-950 text-green-400",
    DECLINED: "bg-red-950 text-red-400",
    WITHDRAWN: "bg-[#27272A] text-[#52525B]",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Offers</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Recruiter offer pipeline</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Drafts</span>
          <p className="text-2xl font-bold text-[#EFFE5E] mt-1">{offers.filter((item) => item.status === "DRAFT").length}</p>
          <p className="text-xs text-[#52525B] mt-1">Offers that still need recruiter review before sending.</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Sent</span>
          <p className="text-2xl font-bold text-[#EFFE5E] mt-1">{offers.filter((item) => item.status === "SENT").length}</p>
          <p className="text-xs text-[#52525B] mt-1">Offers visible to talent and waiting on a decision.</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Accepted</span>
          <p className="text-2xl font-bold text-[#EFFE5E] mt-1">{offers.filter((item) => item.status === "ACCEPTED").length}</p>
          <p className="text-xs text-[#52525B] mt-1">Offers ready for contract generation and onboarding.</p>
        </div>
      </div>

      <div className="flex gap-1">
        {statusFilters.map((status) => {
          const isActive = activeStatus === status;
          const href = status === "ALL" ? "/dashboard/offers" : `/dashboard/offers?status=${status}`;
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

      {visibleOffers.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <FileText className="h-12 w-12 text-[#52525B] mb-4" />
          <p className="text-sm text-[#A1A1AA]">No offers in this status. Offers populate after interviews move forward into compensation and term drafting.</p>
          <Link
            className="mt-4 inline-flex items-center px-4 py-2 bg-[#222222] border border-[#27272A] text-white rounded-md text-sm hover:bg-[#222222]/80"
            href="/dashboard/interviews"
          >
            Review interviews
          </Link>
        </div>
      ) : (
        <div className="border border-[#27272A] rounded-[14px] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#27272A] bg-[#0A0A0A]">
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Candidate</th>
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Rate</th>
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Start</th>
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide">Company</th>
                <th className="text-right px-4 py-3 text-[#52525B] font-medium text-xs uppercase tracking-wide" />
              </tr>
            </thead>
            <tbody>
              {visibleOffers.map((offer) => (
                <tr key={offer.id} className="h-14 border-b border-[#27272A] last:border-b-0 hover:bg-[#222222] transition-colors">
                  <td className="px-4">
                    <p className="text-white font-medium">{offer.candidateName}</p>
                    <p className="text-xs text-[#52525B]">{offer.candidateHeadline}</p>
                  </td>
                  <td className="px-4 text-[#A1A1AA]">{offer.demandTitle}</td>
                  <td className="px-4 text-white">{offer.hourlyRate} {offer.currency}/hr</td>
                  <td className="px-4 text-[#A1A1AA]">{new Date(offer.startDate).toLocaleDateString()}</td>
                  <td className="px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[offer.status] ?? "bg-[#27272A] text-[#A1A1AA]"}`}>
                      {offer.status}
                    </span>
                  </td>
                  <td className="px-4 text-[#A1A1AA]">{offer.companyName}</td>
                  <td className="px-4 text-right">
                    <Link
                      className="text-xs text-[#EFFE5E] hover:underline"
                      href={`/dashboard/offers/${offer.demandId}/${offer.id}`}
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