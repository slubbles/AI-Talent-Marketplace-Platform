"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { createApolloClient } from "../../../../lib/apollo-client";
import { ShortlistWorkbench } from "../../shortlists/shortlist-workbench";
import type { RoleSkillReference, ShortlistEntry, ShortlistInterview, ShortlistOffer } from "../../shortlists/types";
import { DemandForm } from "../demand-form";

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

  return (
    <div className="dashboard-grid">
      <section className="dashboard-panel-card role-detail-hero">
        <div className="role-detail-hero-top">
          <div>
            <span className="eyebrow">Role detail</span>
            <h2>{demand.title}</h2>
            <p>
              {demand.company.name} • {demand.company.industry} • {demand.location} • {demand.remotePolicy}
            </p>
          </div>
          <div className="role-detail-actions">
            <span className="role-status-badge">{currentStatus}</span>
            <button className="secondary-button" onClick={() => setIsEditing((current) => !current)} type="button">
              {isEditing ? "Close edit" : "Edit role"}
            </button>
          </div>
        </div>
        <div className="role-list-meta-grid">
          <div>
            <span>Experience</span>
            <strong>{demand.experienceLevel}</strong>
          </div>
          <div>
            <span>Budget</span>
            <strong>
              {demand.budgetMin && demand.budgetMax ? `${demand.currency} ${demand.budgetMin} - ${demand.budgetMax}` : "Not set"}
            </strong>
          </div>
          <div>
            <span>Timeline</span>
            <strong>{demand.contractDuration ?? "Not set"}</strong>
          </div>
          <div>
            <span>Shortlist count</span>
            <strong>{shortlist.length}</strong>
          </div>
        </div>
        <div className="dashboard-actions">
          <button onClick={() => void runAction("pause")} type="button">Pause</button>
          <button className="secondary-button" onClick={() => void runAction("activate")} type="button">Activate</button>
          <button className="secondary-button" onClick={() => void runAction("cancel")} type="button">Cancel</button>
          <button className="secondary-button" onClick={() => void runAction("fill")} type="button">Mark filled</button>
        </div>
        {actionError ? <p className="form-error">{actionError}</p> : null}
        {actionMessage ? <p className="form-success">{actionMessage}</p> : null}
      </section>

      {isEditing ? <DemandForm accessToken={accessToken} companies={companies} initialDemand={demand} mode="edit" /> : null}

      <section className="dashboard-panel-card">
        <div className="role-tab-row">
          {tabs.map((tab) => (
            <button
              className={`roles-filter-chip${activeTab === tab ? " is-active" : ""}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "OVERVIEW" ? (
          <div className="role-overview-grid">
            <div>
              <h3>Raw description</h3>
              <p>{demand.description}</p>
            </div>
            <div>
              <h3>AI-enhanced version</h3>
              <p>{demand.aiGeneratedDescription ?? "No AI-enhanced description stored yet."}</p>
            </div>
            <div>
              <h3>Project requirements</h3>
              <p>{demand.projectRequirements ?? "No project requirements added yet."}</p>
            </div>
            <div>
              <h3>Required skills</h3>
              <div className="selected-skill-list">
                {demand.requiredSkills.map((item) => (
                  <span className="selected-skill-chip is-static" key={item.id}>
                    {item.skill.displayName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "SHORTLIST" ? (
          <ShortlistWorkbench
            accessToken={accessToken}
            demandId={demand.id}
            demandTitle={demand.title}
            requiredSkillNames={demand.requiredSkills.map((item) => item.skill.displayName)}
            shortlist={shortlist}
          />
        ) : null}

        {activeTab === "INTERVIEWS" ? (
          <div className="role-detail-list">
            {interviews.length === 0 ? (
              <p className="dashboard-empty-state">No interviews are attached to this role yet.</p>
            ) : (
              interviews.map((item) => (
                <article className="role-detail-list-item" key={item.id}>
                  <div>
                    <h4>{item.candidateName}</h4>
                    <p>{item.status} • {new Date(item.scheduledAt).toLocaleString()}</p>
                  </div>
                  <div className="dashboard-attention-meta">
                    <strong>{item.duration} min</strong>
                    <span>{item.demandTitle}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}

        {activeTab === "OFFERS" ? (
          <div className="role-detail-list">
            {offers.length === 0 ? (
              <p className="dashboard-empty-state">No offers are attached to this role yet.</p>
            ) : (
              offers.map((item) => (
                <article className="role-detail-list-item" key={item.id}>
                  <div>
                    <h4>{item.candidateName}</h4>
                    <p>{item.status} • starts {new Date(item.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="dashboard-attention-meta">
                    <strong>{item.hourlyRate} {demand.currency}/hr</strong>
                    <span>{item.demandTitle}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}