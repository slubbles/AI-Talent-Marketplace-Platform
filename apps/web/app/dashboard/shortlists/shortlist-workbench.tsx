"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { CandidateProfileModal } from "../candidate-profile-modal";
import { createApolloClient } from "../../../lib/apollo-client";
import type { CandidateProfile, ShortlistEntry, ShortlistInterview } from "./types";

type ShortlistWorkbenchProps = {
  accessToken: string;
  demandId: string;
  demandTitle: string;
  requiredSkillNames: string[];
  shortlist: ShortlistEntry[];
};

type MatchBreakdown = {
  skill_match: number;
  experience_fit: number;
  availability_fit: number;
  pricing_fit: number;
  location_fit: number;
  cultural_fit: number;
  feedback_score: number;
};

type MutationShortlistStatusResult = {
  id: string;
  status: string;
};

type GenerateShortlistMutationResult = {
  generateShortlist: ShortlistEntry[];
};

type ShortlistMutationResult = {
  shortlistCandidate: MutationShortlistStatusResult;
};

type ReviewMutationResult = {
  reviewCandidate: MutationShortlistStatusResult;
};

type RejectMutationResult = {
  rejectCandidate: MutationShortlistStatusResult;
};

type ScheduleInterviewMutationResult = {
  scheduleInterview: ShortlistInterview;
};

const shortlistCandidateMutation = gql`
  mutation ShortlistCandidate($input: ShortlistActionInput!) {
    shortlistCandidate(input: $input) {
      id
      status
    }
  }
`;

const reviewCandidateMutation = gql`
  mutation ReviewCandidate($input: ShortlistActionInput!) {
    reviewCandidate(input: $input) {
      id
      status
    }
  }
`;

const rejectCandidateMutation = gql`
  mutation RejectCandidate($input: ShortlistActionInput!) {
    rejectCandidate(input: $input) {
      id
      status
    }
  }
`;

const generateShortlistMutation = gql`
  mutation RegenerateShortlist($input: GenerateShortlistInput!) {
    generateShortlist(input: $input) {
      id
      demandId
      talentProfileId
      matchScore
      scoreBreakdown
      aiExplanation
      status
      talentStatus
      talentProfile {
        id
        firstName
        lastName
        headline
        summary
        careerTrajectory
        availability
        availableFrom
        hourlyRateMin
        hourlyRateMax
        currency
        locationPreferences
        workVisaEligibility
        portfolioUrls
        verificationStatus
        skills {
          id
          proficiency
          yearsOfExperience
          skill {
            id
            name
            displayName
            category
          }
        }
        experiences {
          id
          title
          companyName
          location
          startDate
          endDate
          isCurrent
          description
        }
        certifications {
          id
          name
          issuer
          issueDate
          expirationDate
          credentialUrl
        }
        educationEntries {
          id
          institution
          degree
          fieldOfStudy
          startDate
          endDate
          description
        }
      }
      interviews {
        id
        shortlistId
        scheduledAt
        duration
        status
        meetingUrl
        offer {
          id
          hourlyRate
          startDate
          status
          talentProfile {
            firstName
            lastName
          }
        }
      }
    }
  }
`;

const scheduleInterviewMutation = gql`
  mutation ScheduleInterview($input: ScheduleInterviewInput!) {
    scheduleInterview(input: $input) {
      id
      shortlistId
      scheduledAt
      duration
      status
      meetingUrl
    }
  }
`;

const breakdownLabels: Array<{ key: keyof MatchBreakdown; label: string }> = [
  { key: "skill_match", label: "Skill" },
  { key: "experience_fit", label: "Experience" },
  { key: "availability_fit", label: "Availability" },
  { key: "pricing_fit", label: "Pricing" },
  { key: "location_fit", label: "Location" },
  { key: "cultural_fit", label: "Culture" },
  { key: "feedback_score", label: "Feedback" }
];

const availabilityRank: Record<string, number> = {
  IMMEDIATE: 0,
  TWO_WEEKS: 1,
  ONE_MONTH: 2,
  THREE_MONTHS: 3,
  NOT_AVAILABLE: 4
};

const availabilityOptions = ["ALL", "IMMEDIATE", "TWO_WEEKS", "ONE_MONTH", "THREE_MONTHS", "NOT_AVAILABLE"] as const;

const emptyBreakdown: MatchBreakdown = {
  skill_match: 0,
  experience_fit: 0,
  availability_fit: 0,
  pricing_fit: 0,
  location_fit: 0,
  cultural_fit: 0,
  feedback_score: 0
};

const normalizeSkill = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

const formatDateTimeLocal = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const createDefaultInterviewDraft = () => {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(13, 0, 0, 0);

  return {
    scheduledAt: formatDateTimeLocal(date),
    duration: "45",
    meetingUrl: ""
  };
};

const parseBreakdown = (value: string): MatchBreakdown => {
  try {
    const parsed = JSON.parse(value) as Partial<MatchBreakdown>;
    return {
      skill_match: parsed.skill_match ?? 0,
      experience_fit: parsed.experience_fit ?? 0,
      availability_fit: parsed.availability_fit ?? 0,
      pricing_fit: parsed.pricing_fit ?? 0,
      location_fit: parsed.location_fit ?? 0,
      cultural_fit: parsed.cultural_fit ?? 0,
      feedback_score: parsed.feedback_score ?? 0
    };
  } catch {
    return emptyBreakdown;
  }
};

const scoreTone = (score: number) => {
  if (score >= 80) {
    return "is-strong";
  }

  if (score >= 60) {
    return "is-medium";
  }

  return "is-weak";
};

const formatRate = (profile: CandidateProfile) => {
  if (profile.hourlyRateMin == null || profile.hourlyRateMax == null) {
    return "Not shared";
  }

  return `${profile.currency} ${profile.hourlyRateMin} - ${profile.hourlyRateMax}/hr`;
};

const getTopMatchingSkills = (profile: CandidateProfile, requiredSkillNames: string[]) => {
  const required = new Set(requiredSkillNames.map((skill) => normalizeSkill(skill)));

  return profile.skills
    .filter((skill) => required.has(normalizeSkill(skill.skill.displayName)))
    .sort((left, right) => right.yearsOfExperience - left.yearsOfExperience)
    .slice(0, 4)
    .map((skill) => skill.skill.displayName);
};

export function ShortlistWorkbench({ accessToken, demandId, demandTitle, requiredSkillNames, shortlist }: ShortlistWorkbenchProps) {
  const client = useMemo(() => createApolloClient(accessToken), [accessToken]);
  const [items, setItems] = useState(shortlist);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [minimumScore, setMinimumScore] = useState("0");
  const [availabilityFilter, setAvailabilityFilter] = useState<(typeof availabilityOptions)[number]>("ALL");
  const [maximumRate, setMaximumRate] = useState("");
  const [sortBy, setSortBy] = useState<"SCORE" | "AVAILABILITY" | "RATE">("SCORE");
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [interviewDraft, setInterviewDraft] = useState(createDefaultInterviewDraft());
  const [feedback, setFeedback] = useState<{ error: string | null; success: string | null }>({ error: null, success: null });
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const activeCandidate = items.find((item) => item.id === activeCandidateId) ?? null;

  const visibleItems = useMemo(() => {
    const scoreFloor = Number(minimumScore || 0);
    const rateCeiling = maximumRate ? Number(maximumRate) : null;

    return [...items]
      .filter((item) => item.matchScore >= scoreFloor)
      .filter((item) => availabilityFilter === "ALL" || item.talentProfile.availability === availabilityFilter)
      .filter((item) => {
        if (rateCeiling == null || Number.isNaN(rateCeiling)) {
          return true;
        }

        return item.talentProfile.hourlyRateMin == null || item.talentProfile.hourlyRateMin <= rateCeiling;
      })
      .sort((left, right) => {
        if (sortBy === "AVAILABILITY") {
          return (availabilityRank[left.talentProfile.availability] ?? 99) - (availabilityRank[right.talentProfile.availability] ?? 99);
        }

        if (sortBy === "RATE") {
          return (left.talentProfile.hourlyRateMin ?? Number.MAX_SAFE_INTEGER) - (right.talentProfile.hourlyRateMin ?? Number.MAX_SAFE_INTEGER);
        }

        return right.matchScore - left.matchScore;
      });
  }, [availabilityFilter, items, maximumRate, minimumScore, sortBy]);

  const selectedVisibleCount = visibleItems.filter((item) => selectedIds.includes(item.id)).length;

  const upsertStatus = (id: string, status: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const runMutationForStatus = async (shortlistId: string, action: "shortlist" | "save" | "reject") => {
    if (action === "shortlist") {
      const result = await client.mutate<ShortlistMutationResult>({
        mutation: shortlistCandidateMutation,
        variables: { input: { shortlistId } }
      });

      if (!result.data?.shortlistCandidate) {
        throw new Error("Could not shortlist candidate.");
      }

      return result.data.shortlistCandidate;
    }

    if (action === "save") {
      const result = await client.mutate<ReviewMutationResult>({
        mutation: reviewCandidateMutation,
        variables: { input: { shortlistId } }
      });

      if (!result.data?.reviewCandidate) {
        throw new Error("Could not save candidate for later review.");
      }

      return result.data.reviewCandidate;
    }

    const result = await client.mutate<RejectMutationResult>({
      mutation: rejectCandidateMutation,
      variables: { input: { shortlistId } }
    });

    if (!result.data?.rejectCandidate) {
      throw new Error("Could not reject candidate.");
    }

    return result.data.rejectCandidate;
  };

  const runBulkAction = async (action: "shortlist" | "reject") => {
    if (selectedIds.length === 0) {
      setFeedback({ error: "Select at least one candidate first.", success: null });
      return;
    }

    setPendingAction(`bulk-${action}`);
    setFeedback({ error: null, success: null });

    try {
      const results = await Promise.all(selectedIds.map((shortlistId) => runMutationForStatus(shortlistId, action)));
      for (const result of results) {
        upsertStatus(result.id, result.status);
      }
      setSelectedIds([]);
      setFeedback({ error: null, success: `${results.length} candidate${results.length === 1 ? "" : "s"} updated.` });
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Bulk action failed.", success: null });
    } finally {
      setPendingAction(null);
    }
  };

  const runSingleAction = async (shortlistId: string, action: "shortlist" | "save" | "reject") => {
    setPendingAction(`${action}-${shortlistId}`);
    setFeedback({ error: null, success: null });

    try {
      const result = await runMutationForStatus(shortlistId, action);
      upsertStatus(result.id, result.status);
      setFeedback({ error: null, success: `Candidate moved to ${formatEnumLabel(result.status)}.` });
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Could not update candidate.", success: null });
    } finally {
      setPendingAction(null);
    }
  };

  const regenerateShortlist = async () => {
    setPendingAction("regenerate");
    setFeedback({ error: null, success: null });

    try {
      const result = await client.mutate<GenerateShortlistMutationResult>({
        mutation: generateShortlistMutation,
        variables: { input: { demandId, limit: Math.max(items.length, 10) } }
      });

      if (!result.data?.generateShortlist) {
        throw new Error("Could not regenerate shortlist.");
      }

      setItems(result.data.generateShortlist);
      setSelectedIds([]);
      setFeedback({ error: null, success: `AI regenerated ${result.data.generateShortlist.length} ranked candidates for ${demandTitle}.` });
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Could not regenerate shortlist.", success: null });
    } finally {
      setPendingAction(null);
    }
  };

  const scheduleInterview = async () => {
    if (!activeCandidate) {
      return;
    }

    setPendingAction(`interview-${activeCandidate.id}`);
    setFeedback({ error: null, success: null });

    try {
      const result = await client.mutate<ScheduleInterviewMutationResult>({
        mutation: scheduleInterviewMutation,
        variables: {
          input: {
            shortlistId: activeCandidate.id,
            scheduledAt: new Date(interviewDraft.scheduledAt).toISOString(),
            duration: Number(interviewDraft.duration),
            meetingUrl: interviewDraft.meetingUrl.trim() || undefined
          }
        }
      });

      if (!result.data?.scheduleInterview) {
        throw new Error("Could not request interview.");
      }

      const scheduledInterview = result.data.scheduleInterview;

      setItems((current) =>
        current.map((item) =>
          item.id === activeCandidate.id
            ? {
                ...item,
                interviews: [...item.interviews, { ...scheduledInterview, offer: null }]
              }
            : item
        )
      );
      setFeedback({ error: null, success: `Interview requested for ${activeCandidate.talentProfile.firstName} ${activeCandidate.talentProfile.lastName}.` });
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Could not request interview.", success: null });
    } finally {
      setPendingAction(null);
    }
  };

  const toggleVisibleSelection = () => {
    const visibleIds = visibleItems.map((item) => item.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const openCandidate = (shortlistId: string) => {
    setActiveCandidateId(shortlistId);
    setInterviewDraft(createDefaultInterviewDraft());
  };

  return (
    <div className="shortlist-workbench">
      <div className="shortlist-toolbar">
        <div className="shortlist-toolbar-copy">
          <span className="eyebrow">Shortlist</span>
          <h3>AI-ranked candidates for {demandTitle}</h3>
          <p>Filter, compare, and move candidates into recruiter review, shortlisted, or rejected states.</p>
        </div>
        <div className="dashboard-actions">
          <button className="secondary-button" onClick={toggleVisibleSelection} type="button">
            {selectedVisibleCount === visibleItems.length && visibleItems.length > 0 ? "Clear visible selection" : "Select visible"}
          </button>
          <button className="secondary-button" disabled={pendingAction === "bulk-reject"} onClick={() => void runBulkAction("reject")} type="button">
            Reject selected
          </button>
          <button className="secondary-button" disabled={pendingAction === "bulk-shortlist"} onClick={() => void runBulkAction("shortlist")} type="button">
            Shortlist selected
          </button>
          <button disabled={pendingAction === "regenerate"} onClick={() => void regenerateShortlist()} type="button">
            Regenerate shortlist
          </button>
        </div>
      </div>

      <div className="shortlist-filter-grid">
        <label>
          <span>Minimum score</span>
          <input max="100" min="0" onChange={(event) => setMinimumScore(event.target.value)} type="number" value={minimumScore} />
        </label>
        <label>
          <span>Availability</span>
          <select onChange={(event) => setAvailabilityFilter(event.target.value as (typeof availabilityOptions)[number])} value={availabilityFilter}>
            {availabilityOptions.map((value) => (
              <option key={value} value={value}>
                {value === "ALL" ? "All windows" : formatEnumLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Max hourly rate</span>
          <input min="0" onChange={(event) => setMaximumRate(event.target.value)} placeholder="No cap" type="number" value={maximumRate} />
        </label>
        <label>
          <span>Sort by</span>
          <select onChange={(event) => setSortBy(event.target.value as "SCORE" | "AVAILABILITY" | "RATE")} value={sortBy}>
            <option value="SCORE">Match score</option>
            <option value="AVAILABILITY">Availability</option>
            <option value="RATE">Hourly rate</option>
          </select>
        </label>
      </div>

      <div className="shortlist-summary-row">
        <span className="dashboard-status-pill">Visible candidates: {visibleItems.length}</span>
        <span className="dashboard-status-pill">Selected: {selectedIds.length}</span>
        <span className="dashboard-status-pill">Shortlisted: {items.filter((item) => item.status === "SHORTLISTED").length}</span>
      </div>

      {feedback.error ? <p className="form-error">{feedback.error}</p> : null}
      {feedback.success ? <p className="form-success">{feedback.success}</p> : null}

      <div className="shortlist-card-grid">
        {visibleItems.length === 0 ? (
          <p className="dashboard-empty-state">No candidates match the current shortlist filters.</p>
        ) : (
          visibleItems.map((item) => {
            const topMatchingSkills = getTopMatchingSkills(item.talentProfile, requiredSkillNames);
            const breakdown = parseBreakdown(item.scoreBreakdown);
            const isSelected = selectedIds.includes(item.id);

            return (
              <article className="shortlist-card" key={item.id}>
                <div className="shortlist-card-top">
                  <label className="shortlist-select-toggle">
                    <input
                      checked={isSelected}
                      onChange={() =>
                        setSelectedIds((current) =>
                          current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
                        )
                      }
                      type="checkbox"
                    />
                    <span>Select</span>
                  </label>
                  <div className={`shortlist-score-pill ${scoreTone(item.matchScore)}`}>{item.matchScore.toFixed(0)}</div>
                </div>

                <div className="shortlist-card-header">
                  <div>
                    <h4>
                      {item.talentProfile.firstName} {item.talentProfile.lastName}
                    </h4>
                    <p>{item.talentProfile.headline}</p>
                  </div>
                  <span className="role-status-badge">{formatEnumLabel(item.status)}</span>
                </div>

                <div className="shortlist-meta-grid">
                  <div>
                    <span>Availability</span>
                    <strong>{formatEnumLabel(item.talentProfile.availability)}</strong>
                  </div>
                  <div>
                    <span>Available from</span>
                    <strong>{item.talentProfile.availableFrom ? formatDate(item.talentProfile.availableFrom) : "Flexible"}</strong>
                  </div>
                  <div>
                    <span>Rate</span>
                    <strong>{formatRate(item.talentProfile)}</strong>
                  </div>
                  <div>
                    <span>Interviews</span>
                    <strong>{item.interviews.length}</strong>
                  </div>
                </div>

                <div className="selected-skill-list">
                  {topMatchingSkills.length === 0 ? (
                    <span className="selected-skill-chip is-static">Needs manual skill review</span>
                  ) : (
                    topMatchingSkills.map((skill) => (
                      <span className="selected-skill-chip is-static" key={`${item.id}-${skill}`}>
                        {skill}
                      </span>
                    ))
                  )}
                </div>

                <details className="shortlist-explanation">
                  <summary>Why this match</summary>
                  <p>{item.aiExplanation}</p>
                </details>

                <div className="shortlist-breakdown-list">
                  {breakdownLabels.map((entry) => (
                    <div className="shortlist-breakdown-item" key={`${item.id}-${entry.key}`}>
                      <div>
                        <span>{entry.label}</span>
                        <strong>{Math.round(breakdown[entry.key])}</strong>
                      </div>
                      <div className="shortlist-breakdown-track">
                        <span style={{ width: `${Math.max(0, Math.min(100, breakdown[entry.key]))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="dashboard-actions">
                  <button className="secondary-button" onClick={() => openCandidate(item.id)} type="button">
                    View profile
                  </button>
                  <button className="secondary-button" disabled={pendingAction === `save-${item.id}`} onClick={() => void runSingleAction(item.id, "save")} type="button">
                    Save for later
                  </button>
                  <button className="secondary-button" disabled={pendingAction === `reject-${item.id}`} onClick={() => void runSingleAction(item.id, "reject")} type="button">
                    Reject
                  </button>
                  <button disabled={pendingAction === `shortlist-${item.id}`} onClick={() => void runSingleAction(item.id, "shortlist")} type="button">
                    Shortlist
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {activeCandidate ? (
        <CandidateProfileModal
          candidate={activeCandidate.talentProfile}
          footer={(
            <>
              <h4>Request interview</h4>
              <div className="shortlist-filter-grid">
                <label>
                  <span>Date and time</span>
                  <input
                    onChange={(event) => setInterviewDraft((current) => ({ ...current, scheduledAt: event.target.value }))}
                    type="datetime-local"
                    value={interviewDraft.scheduledAt}
                  />
                </label>
                <label>
                  <span>Duration (minutes)</span>
                  <input
                    max="180"
                    min="15"
                    onChange={(event) => setInterviewDraft((current) => ({ ...current, duration: event.target.value }))}
                    type="number"
                    value={interviewDraft.duration}
                  />
                </label>
                <label className="demand-form-field-wide">
                  <span>Meeting URL</span>
                  <input
                    onChange={(event) => setInterviewDraft((current) => ({ ...current, meetingUrl: event.target.value }))}
                    placeholder="https://meet.example.com/session"
                    type="url"
                    value={interviewDraft.meetingUrl}
                  />
                </label>
              </div>
              <div className="dashboard-actions">
                <button className="secondary-button" disabled={pendingAction === `save-${activeCandidate.id}`} onClick={() => void runSingleAction(activeCandidate.id, "save")} type="button">
                  Save for later
                </button>
                <button className="secondary-button" disabled={pendingAction === `reject-${activeCandidate.id}`} onClick={() => void runSingleAction(activeCandidate.id, "reject")} type="button">
                  Reject
                </button>
                <button className="secondary-button" disabled={pendingAction === `shortlist-${activeCandidate.id}`} onClick={() => void runSingleAction(activeCandidate.id, "shortlist")} type="button">
                  Shortlist
                </button>
                <button disabled={pendingAction === `interview-${activeCandidate.id}`} onClick={() => void scheduleInterview()} type="button">
                  Request interview
                </button>
              </div>
            </>
          )}
          onClose={() => setActiveCandidateId(null)}
        />
      ) : null}
    </div>
  );
}