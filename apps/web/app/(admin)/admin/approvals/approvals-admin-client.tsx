"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { createApolloClient } from "../../../../lib/apollo-client";
import Link from "next/link";

type DemandApprovalRecord = {
  id: string;
  title: string;
  status: string;
  approvalStatus: string;
  approvalNotes: string | null;
  hardToFill: boolean;
  location: string;
  remotePolicy: string;
  experienceLevel: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
    industry: string;
  };
  requiredSkills: Array<{
    id: string;
    skill: { displayName: string };
  }>;
};

type ApprovalsAdminClientProps = {
  accessToken: string;
  initialDemands: DemandApprovalRecord[];
};

const updateDemandApprovalMutation = gql`
  mutation UpdateDemandApproval($input: UpdateDemandApprovalInput!) {
    updateDemandApproval(input: $input) {
      id
      approvalStatus
      hardToFill
      status
      approvalNotes
    }
  }
`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export function ApprovalsAdminClient({ accessToken, initialDemands }: ApprovalsAdminClientProps) {
  const client = useMemo(() => createApolloClient(accessToken), [accessToken]);
  const [demands, setDemands] = useState(initialDemands);
  const [notesByDemand, setNotesByDemand] = useState<Record<string, string>>({});
  const [hardToFillByDemand, setHardToFillByDemand] = useState<Record<string, boolean>>(
    Object.fromEntries(initialDemands.map((demand) => [demand.id, demand.hardToFill]))
  );
  const [pendingDemandId, setPendingDemandId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolveDemand = async (demandId: string, approvalStatus: "APPROVED" | "CHANGES_REQUESTED") => {
    setError(null);
    setMessage(null);
    setPendingDemandId(demandId);

    try {
      await client.mutate({
        mutation: updateDemandApprovalMutation,
        variables: {
          input: {
            demandId,
            approvalStatus,
            approvalNotes: notesByDemand[demandId] ?? undefined,
            hardToFill: hardToFillByDemand[demandId] ?? false
          }
        }
      });

      setDemands((current) => current.filter((demand) => demand.id !== demandId));
      setMessage(approvalStatus === "APPROVED" ? "Demand approved and sent live." : "Changes requested for demand.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not update approval status.");
    } finally {
      setPendingDemandId(null);
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Role approvals</p>
        <h3 className="text-lg font-semibold text-white mt-1">Review demands before they go live</h3>
      </div>

      {message ? <p className="text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2 text-sm">{message}</p> : null}
      {error ? <p className="text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2 text-sm">{error}</p> : null}

      <div className="grid gap-4">
        {demands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Role approvals</p>
            <h4 className="text-lg font-semibold text-white mt-2">No demands are waiting on approval</h4>
            <p className="text-sm text-[#52525B] mt-1">There are no recruiter demands in a pending approval state at the moment.</p>
            <Link className="text-sm text-[#A1A1AA] hover:text-white mt-3 inline-block" href="/admin/companies">Review company demand</Link>
          </div>
        ) : (
          demands.map((demand) => (
            <article className="bg-[#111111] border border-[#27272A] rounded-lg p-5 space-y-4" key={demand.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950 text-amber-400">{demand.approvalStatus}</span>
                  <h4 className="text-sm font-medium text-white">{demand.title}</h4>
                </div>
                <span className="text-sm font-medium text-[#A1A1AA]">{demand.company.name}</span>
              </div>

              <p className="text-sm text-[#A1A1AA]">
                {demand.company.industry} • {demand.location} • {demand.remotePolicy} • {demand.experienceLevel}
              </p>

              <div className="flex flex-wrap gap-1">
                {demand.requiredSkills.slice(0, 8).map((skill) => (
                  <span className="px-2 py-0.5 bg-[#1A1A1A] border border-[#27272A] rounded text-xs text-[#A1A1AA]" key={skill.id}>
                    {skill.skill.displayName}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[#52525B] text-xs">Current status</span>
                  <p className="text-white font-medium">{demand.status}</p>
                </div>
                <div>
                  <span className="text-[#52525B] text-xs">Submitted</span>
                  <p className="text-white font-medium">{formatDate(demand.createdAt)}</p>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                <input
                  className="accent-[#EFFE5E]"
                  checked={hardToFillByDemand[demand.id] ?? false}
                  onChange={(event) => setHardToFillByDemand((current) => ({ ...current, [demand.id]: event.target.checked }))}
                  type="checkbox"
                />
                <span>Flag as hard-to-fill for concierge support</span>
              </label>

              <label className="block text-sm text-[#A1A1AA]">
                Approval notes
                <textarea
                  className="mt-1 w-full bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-2 text-sm placeholder:text-[#52525B]"
                  onChange={(event) => setNotesByDemand((current) => ({ ...current, [demand.id]: event.target.value }))}
                  placeholder="Capture approval notes or requested changes for the recruiter."
                  rows={3}
                  value={notesByDemand[demand.id] ?? demand.approvalNotes ?? ""}
                />
              </label>

              <div className="flex gap-3">
                <button className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] disabled:opacity-50 transition-colors" disabled={pendingDemandId === demand.id} onClick={() => resolveDemand(demand.id, "APPROVED")} type="button">
                  {pendingDemandId === demand.id ? "Processing..." : "Approve demand"}
                </button>
                <button className="px-4 py-2 rounded-md text-sm font-medium border border-[#27272A] text-[#A1A1AA] hover:text-white disabled:opacity-50 transition-colors" disabled={pendingDemandId === demand.id} onClick={() => resolveDemand(demand.id, "CHANGES_REQUESTED")} type="button">
                  Request changes
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}