"use client";

import type { ReactNode } from "react";
import { Button } from "../../components/ui/button";
import { X } from "lucide-react";
import type { CandidateProfile } from "./shortlists/types";

type CandidateProfileModalProps = {
  candidate: CandidateProfile;
  footer?: ReactNode;
  onClose: () => void;
};

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

const formatRate = (profile: CandidateProfile) => {
  if (profile.hourlyRateMin == null || profile.hourlyRateMax == null) {
    return "Not shared";
  }

  return `${profile.currency} ${profile.hourlyRateMin} - ${profile.hourlyRateMax}/hr`;
};

export function CandidateProfileModal({ candidate, footer, onClose }: CandidateProfileModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="presentation">
      <div aria-modal="true" className="bg-[#0A0A0A] border border-[#27272A] rounded-[14px] w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6" role="dialog">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Candidate profile</p>
            <h3 className="text-xl font-bold text-white mt-1">
              {candidate.firstName} {candidate.lastName}
            </h3>
            <p className="text-sm text-[#A1A1AA] mt-0.5">{candidate.headline}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="border-[#27272A]">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Summary */}
          <div className="col-span-2 bg-[#111111] border border-[#27272A] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Summary</h4>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">{candidate.summary}</p>
          </div>

          {/* Availability */}
          <div className="bg-[#111111] border border-[#27272A] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Availability and pricing</h4>
            <div className="space-y-1 text-sm text-[#A1A1AA]">
              <p>{formatEnumLabel(candidate.availability)}</p>
              <p>{candidate.availableFrom ? `Available ${formatDate(candidate.availableFrom)}` : "Availability date not set"}</p>
              <p>{formatRate(candidate)}</p>
              <p>Verification: {formatEnumLabel(candidate.verificationStatus)}</p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-[#111111] border border-[#27272A] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Location and visa</h4>
            <div className="space-y-1 text-sm text-[#A1A1AA]">
              <p>{candidate.locationPreferences.join(", ") || "Location preferences not set"}</p>
              <p>{candidate.workVisaEligibility.join(", ") || "No visa notes shared"}</p>
            </div>
          </div>

          {/* Skills */}
          <div className="col-span-2 bg-[#111111] border border-[#27272A] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <div className="bg-[#1A1A1A] border border-[#27272A] rounded px-2 py-1 text-xs" key={skill.id}>
                  <span className="text-white font-medium">{skill.skill.displayName}</span>
                  <span className="text-[#52525B] ml-1">{formatEnumLabel(skill.proficiency)} &middot; {skill.yearsOfExperience}y</span>
                </div>
              ))}
            </div>
          </div>

          {/* Career trajectory */}
          <div className="col-span-2 bg-[#111111] border border-[#27272A] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Career trajectory</h4>
            <p className="text-sm text-[#A1A1AA]">{candidate.careerTrajectory ?? "No trajectory summary yet."}</p>
          </div>

          {/* Experience */}
          <div className="col-span-2 bg-[#111111] border border-[#27272A] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Experience timeline</h4>
            <div className="space-y-4">
              {candidate.experiences.map((experience) => (
                <div className="flex items-start justify-between border-b border-[#27272A] pb-3 last:border-b-0 last:pb-0" key={experience.id}>
                  <div>
                    <p className="text-sm font-medium text-white">{experience.title}</p>
                    <p className="text-xs text-[#A1A1AA]">{experience.companyName}{experience.location ? ` \u00b7 ${experience.location}` : ""}</p>
                  </div>
                  <span className="text-xs text-[#52525B] shrink-0">
                    {formatDate(experience.startDate)} - {experience.isCurrent ? "Present" : experience.endDate ? formatDate(experience.endDate) : "Unknown"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-[#111111] border border-[#27272A] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Certifications</h4>
            <div className="space-y-1 text-sm text-[#A1A1AA]">
              {candidate.certifications.length === 0 ? (
                <p>No certifications listed.</p>
              ) : (
                candidate.certifications.map((certification) => (
                  <p key={certification.id}>{certification.name} &middot; {certification.issuer}</p>
                ))
              )}
            </div>
          </div>

          {/* Education */}
          <div className="bg-[#111111] border border-[#27272A] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Education</h4>
            <div className="space-y-1 text-sm text-[#A1A1AA]">
              {candidate.educationEntries.length === 0 ? (
                <p>No education entries listed.</p>
              ) : (
                candidate.educationEntries.map((entry) => (
                  <p key={entry.id}>{entry.degree} &middot; {entry.institution}</p>
                ))
              )}
            </div>
          </div>

          {/* Portfolio */}
          <div className="col-span-2 bg-[#111111] border border-[#27272A] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Portfolio</h4>
            <div className="space-y-1">
              {candidate.portfolioUrls.length === 0 ? (
                <p className="text-sm text-[#A1A1AA]">No portfolio links attached.</p>
              ) : (
                candidate.portfolioUrls.map((url) => (
                  <a href={url} key={url} rel="noreferrer" target="_blank" className="block text-sm text-[#EFFE5E] hover:underline">
                    {url}
                  </a>
                ))
              )}
            </div>
          </div>

          {footer ? <div className="col-span-2 bg-[#111111] border border-[#27272A] rounded-lg p-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}