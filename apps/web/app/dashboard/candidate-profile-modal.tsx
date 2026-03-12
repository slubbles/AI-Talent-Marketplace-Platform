"use client";

import type { ReactNode } from "react";
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
    <div className="candidate-modal-backdrop" role="presentation">
      <div aria-modal="true" className="candidate-modal" role="dialog">
        <div className="candidate-modal-header">
          <div>
            <span className="eyebrow">Candidate profile</span>
            <h3>
              {candidate.firstName} {candidate.lastName}
            </h3>
            <p>{candidate.headline}</p>
          </div>
          <button className="secondary-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="candidate-profile-grid">
          <section className="candidate-profile-card candidate-profile-wide">
            <h4>Summary</h4>
            <p>{candidate.summary}</p>
          </section>

          <section className="candidate-profile-card">
            <h4>Availability and pricing</h4>
            <div className="candidate-fact-list">
              <span>{formatEnumLabel(candidate.availability)}</span>
              <span>{candidate.availableFrom ? `Available ${formatDate(candidate.availableFrom)}` : "Availability date not set"}</span>
              <span>{formatRate(candidate)}</span>
              <span>Verification: {formatEnumLabel(candidate.verificationStatus)}</span>
            </div>
          </section>

          <section className="candidate-profile-card">
            <h4>Location and visa</h4>
            <div className="candidate-fact-list">
              <span>{candidate.locationPreferences.join(", ") || "Location preferences not set"}</span>
              <span>{candidate.workVisaEligibility.join(", ") || "No visa notes shared"}</span>
            </div>
          </section>

          <section className="candidate-profile-card candidate-profile-wide">
            <h4>Skills</h4>
            <div className="candidate-skill-grid">
              {candidate.skills.map((skill) => (
                <div className="candidate-skill-card" key={skill.id}>
                  <strong>{skill.skill.displayName}</strong>
                  <span>{formatEnumLabel(skill.proficiency)}</span>
                  <span>{skill.yearsOfExperience} years</span>
                </div>
              ))}
            </div>
          </section>

          <section className="candidate-profile-card candidate-profile-wide">
            <h4>Career trajectory</h4>
            <p>{candidate.careerTrajectory ?? "No trajectory summary yet."}</p>
          </section>

          <section className="candidate-profile-card candidate-profile-wide">
            <h4>Experience timeline</h4>
            <div className="candidate-timeline">
              {candidate.experiences.map((experience) => (
                <article className="candidate-timeline-item" key={experience.id}>
                  <div>
                    <strong>{experience.title}</strong>
                    <p>{experience.companyName}{experience.location ? ` • ${experience.location}` : ""}</p>
                  </div>
                  <span>
                    {formatDate(experience.startDate)} - {experience.isCurrent ? "Present" : experience.endDate ? formatDate(experience.endDate) : "Unknown"}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section className="candidate-profile-card">
            <h4>Certifications</h4>
            <div className="candidate-fact-list">
              {candidate.certifications.length === 0 ? (
                <span>No certifications listed.</span>
              ) : (
                candidate.certifications.map((certification) => (
                  <span key={certification.id}>{certification.name} • {certification.issuer}</span>
                ))
              )}
            </div>
          </section>

          <section className="candidate-profile-card">
            <h4>Education</h4>
            <div className="candidate-fact-list">
              {candidate.educationEntries.length === 0 ? (
                <span>No education entries listed.</span>
              ) : (
                candidate.educationEntries.map((entry) => (
                  <span key={entry.id}>{entry.degree} • {entry.institution}</span>
                ))
              )}
            </div>
          </section>

          <section className="candidate-profile-card candidate-profile-wide">
            <h4>Portfolio</h4>
            <div className="candidate-link-list">
              {candidate.portfolioUrls.length === 0 ? (
                <span>No portfolio links attached.</span>
              ) : (
                candidate.portfolioUrls.map((url) => (
                  <a href={url} key={url} rel="noreferrer" target="_blank">
                    {url}
                  </a>
                ))
              )}
            </div>
          </section>

          {footer ? <section className="candidate-profile-card candidate-profile-wide">{footer}</section> : null}
        </div>
      </div>
    </div>
  );
}