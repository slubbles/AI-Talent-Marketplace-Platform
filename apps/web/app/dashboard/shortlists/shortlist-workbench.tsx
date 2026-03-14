"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { CandidateProfileModal } from "../candidate-profile-modal";
import { createApolloClient } from "../../../lib/apollo-client";
import type { CandidateProfile, ShortlistEntry, ShortlistInterview } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sparkles, RefreshCw } from "lucide-react";

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
  if (score >= 80) return "text-primary bg-[#1a1c00]";
  if (score >= 60) return "text-amber-400 bg-amber-950";
  return "text-red-400 bg-red-950";
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
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">AI-ranked candidates for {demandTitle}</h3>
          <p className="text-sm text-[#A1A1AA]">Filter, compare, and move candidates into review states.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={toggleVisibleSelection}>
            {selectedVisibleCount === visibleItems.length && visibleItems.length > 0 ? "Clear Selection" : "Select Visible"}
          </Button>
          <Button variant="ghost" size="sm" disabled={pendingAction === "bulk-reject"} onClick={() => void runBulkAction("reject")}>Reject Selected</Button>
          <Button variant="ghost" size="sm" disabled={pendingAction === "bulk-shortlist"} onClick={() => void runBulkAction("shortlist")}>Shortlist Selected</Button>
          <Button size="sm" disabled={pendingAction === "regenerate"} onClick={() => void regenerateShortlist()}>
            <RefreshCw className="h-4 w-4" /> Regenerate
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <Label className="text-xs text-[#52525B]">Min score</Label>
          <Input type="number" min={0} max={100} value={minimumScore} onChange={(e) => setMinimumScore(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-[#52525B]">Availability</Label>
          <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v as typeof availabilityFilter)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {availabilityOptions.map((v) => <SelectItem key={v} value={v}>{v === "ALL" ? "All windows" : formatEnumLabel(v)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-[#52525B]">Max hourly rate</Label>
          <Input type="number" min={0} placeholder="No cap" value={maximumRate} onChange={(e) => setMaximumRate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-[#52525B]">Sort by</Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SCORE">Match score</SelectItem>
              <SelectItem value="AVAILABILITY">Availability</SelectItem>
              <SelectItem value="RATE">Hourly rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 mb-3">
        <span className="text-xs px-2 py-1 bg-[#1A1A1A] border border-[#27272A] rounded">Visible: {visibleItems.length}</span>
        <span className="text-xs px-2 py-1 bg-[#1A1A1A] border border-[#27272A] rounded">Selected: {selectedIds.length}</span>
        <span className="text-xs px-2 py-1 bg-[#1a1c00] border border-primary/20 rounded text-primary">Shortlisted: {items.filter((item) => item.status === "SHORTLISTED").length}</span>
      </div>

      {/* Feedback */}
      {feedback.error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2 mb-3">{feedback.error}</p>}
      {feedback.success && <p className="text-sm text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2 mb-3">{feedback.success}</p>}

      {/* Candidate cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleItems.length === 0 ? (
          <p className="text-[#A1A1AA] text-sm col-span-2 py-8 text-center">No candidates match the current filters.</p>
        ) : (
          visibleItems.map((item) => {
            const topMatchingSkills = getTopMatchingSkills(item.talentProfile, requiredSkillNames);
            const breakdown = parseBreakdown(item.scoreBreakdown);
            const isSelected = selectedIds.includes(item.id);

            return (
              <article key={item.id} className={`bg-[#0A0A0A] border rounded-lg p-4 space-y-3 ${isSelected ? "border-primary" : "border-[#27272A]"}`}>
                {/* Top row: checkbox + score */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => setSelectedIds((c) => c.includes(item.id) ? c.filter((id) => id !== item.id) : [...c, item.id])}
                      className="accent-[#EFFE5E]"
                    />
                    Select
                  </label>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${scoreTone(item.matchScore)}`}>{item.matchScore.toFixed(0)}</span>
                </div>

                {/* Name + status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{item.talentProfile.firstName} {item.talentProfile.lastName}</h4>
                    <p className="text-xs text-[#A1A1AA]">{item.talentProfile.headline}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#27272A] text-[#A1A1AA]">{formatEnumLabel(item.status)}</span>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-[#52525B]">Availability</span><p className="font-medium">{formatEnumLabel(item.talentProfile.availability)}</p></div>
                  <div><span className="text-[#52525B]">Available from</span><p className="font-medium">{item.talentProfile.availableFrom ? formatDate(item.talentProfile.availableFrom) : "Flexible"}</p></div>
                  <div><span className="text-[#52525B]">Rate</span><p className="font-medium">{formatRate(item.talentProfile)}</p></div>
                  <div><span className="text-[#52525B]">Interviews</span><p className="font-medium">{item.interviews.length}</p></div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1">
                  {(topMatchingSkills.length === 0 ? ["Needs review"] : topMatchingSkills).map((skill) => (
                    <span key={`${item.id}-${skill}`} className="px-2 py-0.5 bg-[#1A1A1A] border border-[#27272A] rounded text-xs text-[#A1A1AA]">{skill}</span>
                  ))}
                </div>

                {/* AI explanation */}
                <details className="text-xs">
                  <summary className="text-[#52525B] cursor-pointer hover:text-white transition-colors">Why this match</summary>
                  <p className="text-[#A1A1AA] mt-1 leading-relaxed">{item.aiExplanation}</p>
                </details>

                {/* Score breakdown */}
                <div className="space-y-1.5">
                  {breakdownLabels.map((entry) => (
                    <div key={`${item.id}-${entry.key}`} className="flex items-center gap-2 text-xs">
                      <span className="text-[#52525B] w-20">{entry.label}</span>
                      <div className="flex-1 h-1.5 bg-[#222222] rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(0, Math.min(100, breakdown[entry.key]))}%` }} />
                      </div>
                      <span className="text-[#A1A1AA] w-6 text-right">{Math.round(breakdown[entry.key])}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-[#27272A]">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => openCandidate(item.id)}>View Profile</Button>
                  <Button variant="ghost" size="sm" className="text-xs" disabled={pendingAction === `save-${item.id}`} onClick={() => void runSingleAction(item.id, "save")}>Save</Button>
                  <Button variant="ghost" size="sm" className="text-xs text-red-400" disabled={pendingAction === `reject-${item.id}`} onClick={() => void runSingleAction(item.id, "reject")}>Reject</Button>
                  <Button size="sm" className="text-xs ml-auto" disabled={pendingAction === `shortlist-${item.id}`} onClick={() => void runSingleAction(item.id, "shortlist")}>Shortlist</Button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Candidate profile modal with interview form */}
      {activeCandidate ? (
        <CandidateProfileModal
          candidate={activeCandidate.talentProfile}
          footer={(
            <>
              <h4 className="font-semibold mb-3">Request Interview</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#52525B]">Date and time</Label>
                  <Input type="datetime-local" value={interviewDraft.scheduledAt} onChange={(e) => setInterviewDraft((c) => ({ ...c, scheduledAt: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-[#52525B]">Duration (min)</Label>
                  <Input type="number" min={15} max={180} value={interviewDraft.duration} onChange={(e) => setInterviewDraft((c) => ({ ...c, duration: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-[#52525B]">Meeting URL</Label>
                  <Input type="url" placeholder="https://meet.example.com/session" value={interviewDraft.meetingUrl} onChange={(e) => setInterviewDraft((c) => ({ ...c, meetingUrl: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" size="sm" disabled={pendingAction === `save-${activeCandidate.id}`} onClick={() => void runSingleAction(activeCandidate.id, "save")}>Save</Button>
                <Button variant="ghost" size="sm" className="text-red-400" disabled={pendingAction === `reject-${activeCandidate.id}`} onClick={() => void runSingleAction(activeCandidate.id, "reject")}>Reject</Button>
                <Button variant="ghost" size="sm" disabled={pendingAction === `shortlist-${activeCandidate.id}`} onClick={() => void runSingleAction(activeCandidate.id, "shortlist")}>Shortlist</Button>
                <Button size="sm" className="ml-auto" disabled={pendingAction === `interview-${activeCandidate.id}`} onClick={() => void scheduleInterview()}>Request Interview</Button>
              </div>
            </>
          )}
          onClose={() => setActiveCandidateId(null)}
        />
      ) : null}
    </div>
  );
}