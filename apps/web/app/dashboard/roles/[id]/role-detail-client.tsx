"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { createApolloClient } from "../../../../lib/apollo-client";
import { ShortlistWorkbench } from "../../shortlists/shortlist-workbench";
import type { RoleSkillReference, ShortlistEntry, ShortlistInterview, ShortlistOffer } from "../../shortlists/types";
import { DemandForm } from "../demand-form";
import { Button } from "@/components/ui/button";

type CompanyOption = {
  id: string;
  name: string;
  industry: string;
  size: string;
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
  company: CompanyOption;
  requiredSkills: RoleSkillReference[];
};

type RoleDetailClientProps = {
  accessToken: string;
  companies: CompanyOption[];
  demand: RoleDetailDemand;
  shortlist: ShortlistEntry[];
};

type InterviewListItem = ShortlistInterview & {
  candidateName: string;
  demandTitle: string;
};

type OfferListItem = ShortlistOffer & {
  candidateName: string;
  demandTitle: string;
};

const pauseDemandMutation = gql`
  mutation PauseDemand($id: ID!) {
    pauseDemand(id: $id) {
      id
      status
    }
  }
`;

const cancelDemandMutation = gql`
  mutation CancelDemand($id: ID!) {
    cancelDemand(id: $id) {
      id
      status
    }
  }
`;

const fillDemandMutation = gql`
  mutation FillDemand($id: ID!) {
    fillDemand(id: $id) {
      id
      status
    }
  }
`;

const updateDemandMutation = gql`
  mutation ActivateDemand($id: ID!, $input: UpdateDemandInput!) {
    updateDemand(id: $id, input: $input) {
      id
      status
    }
  }
`;

const tabs = ["OVERVIEW", "SHORTLIST", "INTERVIEWS", "OFFERS"] as const;

export function RoleDetailClient({ accessToken, companies, demand, shortlist }: RoleDetailClientProps) {
  const client = useMemo(() => createApolloClient(accessToken), [accessToken]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("OVERVIEW");
  const [isEditing, setIsEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(demand.status);

  const interviews: InterviewListItem[] = shortlist.flatMap((item) =>
    item.interviews.map((interview) => ({
      ...interview,
      candidateName: `${item.talentProfile.firstName} ${item.talentProfile.lastName}`,
      demandTitle: demand.title
    }))
  );
  const offers: OfferListItem[] = shortlist.flatMap((item) =>
    item.interviews.flatMap((interview) =>
      interview.offer
        ? [
            {
              ...interview.offer,
              candidateName: `${item.talentProfile.firstName} ${item.talentProfile.lastName}`,
              demandTitle: demand.title
            }
          ]
        : []
    )
  );

  const runAction = async (action: "pause" | "activate" | "cancel" | "fill") => {
    setActionError(null);
    setActionMessage(null);

    try {
      if (action === "pause") {
        await client.mutate({ mutation: pauseDemandMutation, variables: { id: demand.id } });
      }

      if (action === "cancel") {
        await client.mutate({ mutation: cancelDemandMutation, variables: { id: demand.id } });
      }

      if (action === "fill") {
        await client.mutate({ mutation: fillDemandMutation, variables: { id: demand.id } });
      }

      if (action === "activate") {
        await client.mutate({ mutation: updateDemandMutation, variables: { id: demand.id, input: { status: "ACTIVE" } } });
      }

      setCurrentStatus(action === "pause" ? "PAUSED" : action === "activate" ? "ACTIVE" : action === "cancel" ? "CANCELLED" : "FILLED");
      setActionMessage(`Role status updated via ${action}.`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update role status.");
    }
  };

  const statusStyles: Record<string, string> = {
    ACTIVE: "bg-green-950 text-green-400",
    DRAFT: "bg-[#27272A] text-[#A1A1AA]",
    PAUSED: "bg-blue-950 text-blue-400",
    FILLED: "bg-[#1a1c00] text-[#EFFE5E]",
    CANCELLED: "bg-[#27272A] text-[#52525B]",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{demand.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[currentStatus] ?? statusStyles.DRAFT}`}>{currentStatus}</span>
          </div>
          <p className="text-sm text-[#A1A1AA]">{demand.company.name} · {demand.company.industry} · {demand.location} · {demand.remotePolicy}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing((c) => !c)}>{isEditing ? "Close Edit" : "Edit Role"}</Button>
          <Button variant="ghost" size="sm" onClick={() => void runAction("pause")}>Pause</Button>
          <Button variant="ghost" size="sm" onClick={() => void runAction("activate")}>Activate</Button>
          <Button variant="ghost" size="sm" className="text-green-400" onClick={() => void runAction("fill")}>Mark Filled</Button>
          <Button variant="ghost" size="sm" className="text-red-400" onClick={() => void runAction("cancel")}>Cancel</Button>
        </div>
      </div>

      {/* Error / success */}
      {actionError && <p className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2 mb-4">{actionError}</p>}
      {actionMessage && <p className="text-sm text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2 mb-4">{actionMessage}</p>}

      {/* Meta row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ["Experience", demand.experienceLevel],
          ["Budget", demand.budgetMin && demand.budgetMax ? `${demand.currency} ${demand.budgetMin}–${demand.budgetMax}` : "Not set"],
          ["Duration", demand.contractDuration ?? "Not set"],
          ["Shortlist", `${shortlist.length} candidates`],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4">
            <span className="text-xs text-[#52525B]">{label}</span>
            <p className="text-sm font-semibold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      {isEditing && <div className="mb-6"><DemandForm accessToken={accessToken} companies={companies} initialDemand={demand} mode="edit" /></div>}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#27272A] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab ? "text-white border-primary" : "text-[#A1A1AA] border-transparent hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">Role Description</h3>
            <p className="text-sm text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">{demand.description}</p>
          </div>
          {demand.aiGeneratedDescription && (
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">AI-Enhanced Description</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">{demand.aiGeneratedDescription}</p>
            </div>
          )}
          {demand.projectRequirements && (
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">Project Requirements</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">{demand.projectRequirements}</p>
            </div>
          )}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
            <h3 className="font-semibold mb-3">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {demand.requiredSkills.map((item) => (
                <span key={item.id} className="px-2 py-1 bg-[#1A1A1A] border border-[#27272A] rounded text-xs text-[#A1A1AA]">{item.skill.displayName}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "SHORTLIST" && (
        <ShortlistWorkbench
          accessToken={accessToken}
          demandId={demand.id}
          demandTitle={demand.title}
          requiredSkillNames={demand.requiredSkills.map((item) => item.skill.displayName)}
          shortlist={shortlist}
        />
      )}

      {activeTab === "INTERVIEWS" && (
        <div>
          {interviews.length === 0 ? (
            <p className="text-[#A1A1AA] text-sm py-8 text-center">No interviews are attached to this role yet.</p>
          ) : (
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#27272A]">
                    {["Candidate", "Date", "Duration", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#52525B] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((item) => (
                    <tr key={item.id} className="h-14 border-b border-[#27272A] last:border-b-0 hover:bg-[#222222] transition-colors">
                      <td className="px-4 font-medium">{item.candidateName}</td>
                      <td className="px-4 text-[#A1A1AA]">{new Date(item.scheduledAt).toLocaleString()}</td>
                      <td className="px-4 text-[#A1A1AA]">{item.duration} min</td>
                      <td className="px-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-950 text-blue-400">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "OFFERS" && (
        <div>
          {offers.length === 0 ? (
            <p className="text-[#A1A1AA] text-sm py-8 text-center">No offers are attached to this role yet.</p>
          ) : (
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#27272A]">
                    {["Candidate", "Rate", "Start Date", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#52525B] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {offers.map((item) => (
                    <tr key={item.id} className="h-14 border-b border-[#27272A] last:border-b-0 hover:bg-[#222222] transition-colors">
                      <td className="px-4 font-medium">{item.candidateName}</td>
                      <td className="px-4 text-[#A1A1AA]">{item.hourlyRate} {demand.currency}/hr</td>
                      <td className="px-4 text-[#A1A1AA]">{new Date(item.startDate).toLocaleDateString()}</td>
                      <td className="px-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-950 text-blue-400">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}