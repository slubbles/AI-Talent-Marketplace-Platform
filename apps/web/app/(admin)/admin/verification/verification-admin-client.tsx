"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { createApolloClient } from "../../../../lib/apollo-client";
import { EmptyStateCard } from "../../../dashboard/empty-state-card";

type VerificationProfile = {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  resumeUrl: string | null;
  locationPreferences: string[];
  workVisaEligibility: string[];
  identityDocumentUrls: string[];
  industries: string[];
  verificationStatus: string;
  user: { email: string };
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    credentialUrl: string | null;
  }>;
  skills: Array<{
    id: string;
    yearsOfExperience: number;
    skill: { displayName: string };
  }>;
};

type VerificationAdminClientProps = {
  accessToken: string;
  initialProfiles: VerificationProfile[];
};

const verifyTalentMutation = gql`
  mutation VerifyTalent($profileId: ID!, $notes: String) {
    verifyTalent(profileId: $profileId, notes: $notes) {
      id
      verificationStatus
      verificationNotes
    }
  }
`;

const rejectTalentMutation = gql`
  mutation RejectTalent($input: RejectTalentInput!) {
    rejectTalent(input: $input) {
      id
      verificationStatus
      verificationNotes
    }
  }
`;

export function VerificationAdminClient({ accessToken, initialProfiles }: VerificationAdminClientProps) {
  const client = useMemo(() => createApolloClient(accessToken), [accessToken]);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [notesByProfile, setNotesByProfile] = useState<Record<string, string>>({});
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateNotes = (profileId: string, value: string) => {
    setNotesByProfile((current) => ({ ...current, [profileId]: value }));
  };

  const resolveProfile = async (profileId: string, mode: "verify" | "reject") => {
    setError(null);
    setMessage(null);
    setPendingProfileId(profileId);

    try {
      if (mode === "verify") {
        await client.mutate({
          mutation: verifyTalentMutation,
          variables: {
            profileId,
            notes: notesByProfile[profileId] ?? undefined
          }
        });
      } else {
        await client.mutate({
          mutation: rejectTalentMutation,
          variables: {
            input: {
              profileId,
              reason: notesByProfile[profileId] || "Profile details require clarification before approval."
            }
          }
        });
      }

      setProfiles((current) => current.filter((profile) => profile.id !== profileId));
      setMessage(mode === "verify" ? "Talent profile approved." : "Talent profile rejected with reason.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not complete this verification action.");
    } finally {
      setPendingProfileId(null);
    }
  };

  return (
    <section className="dashboard-panel-card admin-page-stack">
      <div className="dashboard-section-heading">
        <div>
          <span className="eyebrow">Talent verification queue</span>
          <h3>Approve or reject pending profiles</h3>
        </div>
      </div>

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="admin-card-grid">
        {profiles.length === 0 ? (
          <EmptyStateCard
            accent="admin"
            actions={[{ href: "/admin", label: "Back to admin overview", tone: "secondary" }]}
            description="There are no pending talent profiles waiting for approval or rejection right now."
            eyebrow="Talent verification"
            title="All pending profiles have been reviewed"
          />
        ) : (
          profiles.map((profile) => (
            <article className="role-list-card admin-verification-card" key={profile.id}>
              <div className="role-list-card-header">
                <div>
                  <span className="role-status-badge">{profile.verificationStatus}</span>
                  <h4>
                    {profile.firstName} {profile.lastName}
                  </h4>
                </div>
                <strong>{profile.user.email}</strong>
              </div>

              <p>{profile.headline}</p>
              <p>{profile.summary}</p>

              <div className="role-list-meta-grid">
                <div>
                  <span>Industries</span>
                  <strong>{profile.industries.join(", ") || "Not provided"}</strong>
                </div>
                <div>
                  <span>Location preferences</span>
                  <strong>{profile.locationPreferences.join(", ") || "Not provided"}</strong>
                </div>
                <div>
                  <span>Visa eligibility</span>
                  <strong>{profile.workVisaEligibility.join(", ") || "Not provided"}</strong>
                </div>
              </div>

              <div className="selected-skill-list">
                {profile.skills.slice(0, 8).map((skill) => (
                  <span className="selected-skill-chip is-static" key={skill.id}>
                    {skill.skill.displayName} • {skill.yearsOfExperience}y
                  </span>
                ))}
              </div>

              <div className="admin-subsection">
                <strong>Identity documents</strong>
                <div className="admin-list-grid compact">
                  {profile.identityDocumentUrls.length === 0 ? (
                    <EmptyStateCard
                      accent="warning"
                      description="This profile has not uploaded an identity document yet, so approval should wait until the record is complete."
                      eyebrow="Identity review"
                      title="No identity documents uploaded"
                    />
                  ) : (
                    profile.identityDocumentUrls.map((url) => (
                      <div className="dashboard-activity-item" key={url}>
                        <div>
                          <h4>Identity document</h4>
                          <p>Uploaded for verification review</p>
                        </div>
                        <a href={url}>Open file</a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="admin-subsection">
                <strong>Certifications</strong>
                <div className="admin-list-grid compact">
                  {profile.certifications.length === 0 ? (
                    <EmptyStateCard
                      accent="admin"
                      description="No certification records are attached to this profile yet. Review the resume and identity evidence instead."
                      eyebrow="Certification review"
                      title="No certifications uploaded"
                    />
                  ) : (
                    profile.certifications.map((certification) => (
                      <div className="dashboard-activity-item" key={certification.id}>
                        <div>
                          <h4>{certification.name}</h4>
                          <p>{certification.issuer}</p>
                        </div>
                        {certification.credentialUrl ? <a href={certification.credentialUrl}>Credential</a> : null}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <label>
                Review notes or rejection reason
                <textarea
                  onChange={(event) => updateNotes(profile.id, event.target.value)}
                  placeholder="Record verification notes, missing document details, or a rejection reason."
                  rows={3}
                  value={notesByProfile[profile.id] ?? ""}
                />
              </label>

              <div className="admin-inline-actions">
                {profile.resumeUrl ? (
                  <a className="secondary-link" href={profile.resumeUrl} rel="noreferrer" target="_blank">
                    Open resume
                  </a>
                ) : null}
                <button className="primary-link" disabled={pendingProfileId === profile.id} onClick={() => resolveProfile(profile.id, "verify")} type="button">
                  {pendingProfileId === profile.id ? "Processing..." : "Approve"}
                </button>
                <button className="secondary-button" disabled={pendingProfileId === profile.id} onClick={() => resolveProfile(profile.id, "reject")} type="button">
                  Request changes / reject
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}