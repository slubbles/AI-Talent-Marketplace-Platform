"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { createApolloClient } from "../../../../lib/apollo-client";
import Link from "next/link";

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
    <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Talent verification queue</p>
        <h3 className="text-lg font-semibold text-white mt-1">Approve or reject pending profiles</h3>
      </div>

      {message ? <p className="text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2 text-sm">{message}</p> : null}
      {error ? <p className="text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2 text-sm">{error}</p> : null}

      <div className="grid gap-4">
        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Talent verification</p>
            <h4 className="text-lg font-semibold text-white mt-2">All pending profiles have been reviewed</h4>
            <p className="text-sm text-[#52525B] mt-1">There are no pending talent profiles waiting for approval or rejection right now.</p>
            <Link className="text-sm text-[#A1A1AA] hover:text-white mt-3 inline-block" href="/admin">Back to admin overview</Link>
          </div>
        ) : (
          profiles.map((profile) => (
            <article className="bg-[#111111] border border-[#27272A] rounded-lg p-5 space-y-4" key={profile.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950 text-amber-400">{profile.verificationStatus}</span>
                  <h4 className="text-sm font-medium text-white">{profile.firstName} {profile.lastName}</h4>
                </div>
                <span className="text-sm text-[#A1A1AA]">{profile.user.email}</span>
              </div>

              <p className="text-sm text-white">{profile.headline}</p>
              <p className="text-sm text-[#A1A1AA]">{profile.summary}</p>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-[#52525B] text-xs">Industries</span>
                  <p className="text-white font-medium">{profile.industries.join(", ") || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-[#52525B] text-xs">Location preferences</span>
                  <p className="text-white font-medium">{profile.locationPreferences.join(", ") || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-[#52525B] text-xs">Visa eligibility</span>
                  <p className="text-white font-medium">{profile.workVisaEligibility.join(", ") || "Not provided"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 8).map((skill) => (
                  <span className="px-2 py-0.5 bg-[#1A1A1A] border border-[#27272A] rounded text-xs text-[#A1A1AA]" key={skill.id}>
                    {skill.skill.displayName} • {skill.yearsOfExperience}y
                  </span>
                ))}
              </div>

              <div className="mt-2">
                <p className="text-sm font-medium text-white mb-2">Identity documents</p>
                <div className="space-y-2">
                  {profile.identityDocumentUrls.length === 0 ? (
                    <div className="bg-amber-950/20 border border-amber-900/40 rounded-md p-3">
                      <p className="text-xs text-amber-400">No identity documents uploaded — approval should wait until the record is complete.</p>
                    </div>
                  ) : (
                    profile.identityDocumentUrls.map((url) => (
                      <div className="flex items-center justify-between py-2 border-b border-[#27272A] last:border-b-0" key={url}>
                        <div>
                          <p className="text-sm font-medium text-white">Identity document</p>
                          <p className="text-xs text-[#A1A1AA]">Uploaded for verification review</p>
                        </div>
                        <a className="text-sm text-[#EFFE5E] hover:underline" href={url} rel="noreferrer" target="_blank">Open file</a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-2">
                <p className="text-sm font-medium text-white mb-2">Certifications</p>
                <div className="space-y-2">
                  {profile.certifications.length === 0 ? (
                    <p className="text-xs text-[#52525B]">No certification records attached. Review the resume and identity evidence instead.</p>
                  ) : (
                    profile.certifications.map((certification) => (
                      <div className="flex items-center justify-between py-2 border-b border-[#27272A] last:border-b-0" key={certification.id}>
                        <div>
                          <p className="text-sm font-medium text-white">{certification.name}</p>
                          <p className="text-xs text-[#A1A1AA]">{certification.issuer}</p>
                        </div>
                        {certification.credentialUrl ? <a className="text-sm text-[#EFFE5E] hover:underline" href={certification.credentialUrl} rel="noreferrer" target="_blank">Credential</a> : null}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <label className="block text-sm text-[#A1A1AA]">
                Review notes or rejection reason
                <textarea
                  className="mt-1 w-full bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-2 text-sm placeholder:text-[#52525B]"
                  onChange={(event) => updateNotes(profile.id, event.target.value)}
                  placeholder="Record verification notes, missing document details, or a rejection reason."
                  rows={3}
                  value={notesByProfile[profile.id] ?? ""}
                />
              </label>

              <div className="flex gap-3">
                {profile.resumeUrl ? (
                  <a className="px-4 py-2 rounded-md text-sm font-medium border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors" href={profile.resumeUrl} rel="noreferrer" target="_blank">
                    Open resume
                  </a>
                ) : null}
                <button className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] disabled:opacity-50 transition-colors" disabled={pendingProfileId === profile.id} onClick={() => resolveProfile(profile.id, "verify")} type="button">
                  {pendingProfileId === profile.id ? "Processing..." : "Approve"}
                </button>
                <button className="px-4 py-2 rounded-md text-sm font-medium border border-[#27272A] text-[#A1A1AA] hover:text-white disabled:opacity-50 transition-colors" disabled={pendingProfileId === profile.id} onClick={() => resolveProfile(profile.id, "reject")} type="button">
                  Request changes / reject
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}