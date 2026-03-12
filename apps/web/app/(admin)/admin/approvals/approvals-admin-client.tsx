"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { createApolloClient } from "../../../../lib/apollo-client";

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
    <section className="dashboard-panel-card admin-page-stack">
      <div className="dashboard-section-heading">
        <div>
          <span className="eyebrow">Role approvals</span>
          <h3>Review demands before they go live</h3>
        </div>
      </div>

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="admin-card-grid">
        {demands.length === 0 ? (
          <p className="dashboard-empty-state">No demands are waiting on admin approval.</p>
        ) : (
          demands.map((demand) => (
            <article className="role-list-card admin-approval-card" key={demand.id}>
              <div className="role-list-card-header">
                <div>
                  <span className="role-status-badge">{demand.approvalStatus}</span>
                  <h4>{demand.title}</h4>
                </div>
                <strong>{demand.company.name}</strong>
              </div>

              <p>
                {demand.company.industry} • {demand.location} • {demand.remotePolicy} • {demand.experienceLevel}
              </p>

              <div className="selected-skill-list">
                {demand.requiredSkills.slice(0, 8).map((skill) => (
                  <span className="selected-skill-chip is-static" key={skill.id}>
                    {skill.skill.displayName}
                  </span>
                ))}
              </div>

              <div className="role-list-meta-grid">
                <div>
                  <span>Current status</span>
                  <strong>{demand.status}</strong>
                </div>
                <div>
                  <span>Submitted</span>
                  <strong>{formatDate(demand.createdAt)}</strong>
                </div>
              </div>

              <label className="admin-toggle-row">
                <input
                  checked={hardToFillByDemand[demand.id] ?? false}
                  onChange={(event) => setHardToFillByDemand((current) => ({ ...current, [demand.id]: event.target.checked }))}
                  type="checkbox"
                />
                <span>Flag as hard-to-fill for concierge support</span>
              </label>

              <label>
                Approval notes
                <textarea
                  onChange={(event) => setNotesByDemand((current) => ({ ...current, [demand.id]: event.target.value }))}
                  placeholder="Capture approval notes or requested changes for the recruiter."
                  rows={3}
                  value={notesByDemand[demand.id] ?? demand.approvalNotes ?? ""}
                />
              </label>

              <div className="admin-inline-actions">
                <button className="primary-link" disabled={pendingDemandId === demand.id} onClick={() => resolveDemand(demand.id, "APPROVED")} type="button">
                  {pendingDemandId === demand.id ? "Processing..." : "Approve demand"}
                </button>
                <button className="secondary-button" disabled={pendingDemandId === demand.id} onClick={() => resolveDemand(demand.id, "CHANGES_REQUESTED")} type="button">
                  Request changes
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}