"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { CandidateProfileModal } from "../../../candidate-profile-modal";
import { createApolloClient } from "../../../../../lib/apollo-client";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import type { CandidateProfile } from "../../../shortlists/types";

type DemandSummary = {
  id: string;
  title: string;
  status: string;
  location: string;
  remotePolicy: string;
  currency: string;
  company: {
    id: string;
    name: string;
    industry: string;
    size: string;
  };
};

type InterviewDetail = {
  id: string;
  shortlistId: string;
  scheduledAt: string;
  duration: number;
  status: string;
  meetingUrl: string | null;
  feedback?: string | null;
  rating?: number | null;
  createdAt?: string;
  updatedAt?: string;
  candidate: CandidateProfile;
  offer?: {
    id: string;
    status: string;
  } | null;
};

type InterviewDetailClientProps = {
  accessToken: string;
  demand: DemandSummary;
  interview: InterviewDetail;
};

type CreateOfferMutationResult = {
  createOffer: {
    id: string;
  };
};

const updateInterviewMutation = gql`
  mutation UpdateInterview($input: UpdateInterviewInput!) {
    updateInterview(input: $input) {
      id
      scheduledAt
      duration
      meetingUrl
      status
    }
  }
`;

const cancelInterviewMutation = gql`
  mutation CancelInterview($id: ID!) {
    cancelInterview(id: $id) {
      id
      status
    }
  }
`;

const submitFeedbackMutation = gql`
  mutation SubmitFeedback($input: SubmitInterviewFeedbackInput!) {
    submitFeedback(input: $input) {
      id
      status
      feedback
      rating
    }
  }
`;

const createOfferMutation = gql`
  mutation CreateOffer($input: CreateOfferInput!) {
    createOffer(input: $input) {
      id
    }
  }
`;

const formatDateTimeLocal = (value: string) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function InterviewDetailClient({ accessToken, demand, interview }: InterviewDetailClientProps) {
  const client = useMemo(() => createApolloClient(accessToken), [accessToken]);
  const [scheduledAt, setScheduledAt] = useState(formatDateTimeLocal(interview.scheduledAt));
  const [duration, setDuration] = useState(String(interview.duration));
  const [meetingUrl, setMeetingUrl] = useState(interview.meetingUrl ?? "");
  const [feedback, setFeedback] = useState(interview.feedback ?? "");
  const [rating, setRating] = useState(String(interview.rating ?? 4));
  const [status, setStatus] = useState(interview.status);
  const [offerId, setOfferId] = useState(interview.offer?.id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCandidate, setShowCandidate] = useState(false);

  const createDefaultTerms = () =>
    `Engage ${interview.candidate.firstName} ${interview.candidate.lastName} on ${demand.title} for ${demand.company.name}. Weekly syncs, async collaboration, and recruiter check-ins included.`;

  const updateInterview = async () => {
    setError(null);
    setMessage(null);

    try {
      const result = await client.mutate<{ updateInterview: { status: string } }>({
        mutation: updateInterviewMutation,
        variables: {
          input: {
            interviewId: interview.id,
            scheduledAt: new Date(scheduledAt).toISOString(),
            duration: Number(duration),
            meetingUrl: meetingUrl.trim() || undefined,
            status: status === "CANCELLED" ? "SCHEDULED" : status
          }
        }
      });

      setStatus(result.data?.updateInterview.status ?? status);
      setMessage("Interview schedule updated.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not update interview.");
    }
  };

  const cancelInterview = async () => {
    setError(null);
    setMessage(null);

    try {
      const result = await client.mutate<{ cancelInterview: { status: string } }>({
        mutation: cancelInterviewMutation,
        variables: { id: interview.id }
      });

      setStatus(result.data?.cancelInterview.status ?? "CANCELLED");
      setMessage("Interview cancelled.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not cancel interview.");
    }
  };

  const completeInterview = async () => {
    setError(null);
    setMessage(null);

    try {
      const result = await client.mutate<{ submitFeedback: { status: string; feedback: string; rating: number } }>({
        mutation: submitFeedbackMutation,
        variables: {
          input: {
            interviewId: interview.id,
            feedback,
            rating: Number(rating)
          }
        }
      });

      setStatus(result.data?.submitFeedback.status ?? "COMPLETED");
      setMessage("Feedback submitted and interview marked completed.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not submit interview feedback.");
    }
  };

  const createOffer = async () => {
    setError(null);
    setMessage(null);

    try {
      const result = await client.mutate<CreateOfferMutationResult>({
        mutation: createOfferMutation,
        variables: {
          input: {
            interviewId: interview.id,
            demandId: demand.id,
            talentProfileId: interview.candidate.id,
            hourlyRate: interview.candidate.hourlyRateMin ?? 120,
            startDate: demand.location ? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            endDate: null,
            terms: createDefaultTerms(),
            status: "DRAFT"
          }
        }
      });

      const nextOfferId = result.data?.createOffer.id;
      if (!nextOfferId) {
        throw new Error("Offer draft was not created.");
      }

      setOfferId(nextOfferId);
      window.location.href = `/dashboard/offers/${demand.id}/${nextOfferId}`;
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not create offer.");
    }
  };

  const statusStyles: Record<string, string> = {
    SCHEDULED: "bg-blue-950 text-blue-400",
    COMPLETED: "bg-green-950 text-green-400",
    CANCELLED: "bg-[#27272A] text-[#52525B]",
    NO_SHOW: "bg-amber-950 text-amber-400",
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/interviews" className="inline-flex items-center gap-1 text-sm text-[#A1A1AA] hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Interviews
      </Link>

      {/* Hero */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-[14px] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Interview detail</p>
            <h2 className="text-xl font-bold text-white mt-1">{interview.candidate.firstName} {interview.candidate.lastName}</h2>
            <p className="text-sm text-[#A1A1AA] mt-1">
              {demand.title} &middot; {demand.company.name} &middot; {new Date(interview.scheduledAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] ?? "bg-[#27272A] text-[#A1A1AA]"}`}>{status}</span>
            <Button variant="outline" size="sm" onClick={() => setShowCandidate(true)}>View candidate</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6 text-sm">
          <div>
            <span className="text-[#52525B]">Headline</span>
            <p className="text-white font-medium mt-0.5">{interview.candidate.headline}</p>
          </div>
          <div>
            <span className="text-[#52525B]">Role</span>
            <p className="text-white font-medium mt-0.5">{demand.title}</p>
          </div>
          <div>
            <span className="text-[#52525B]">Remote policy</span>
            <p className="text-white font-medium mt-0.5">{demand.remotePolicy}</p>
          </div>
          <div>
            <span className="text-[#52525B]">Offer</span>
            <p className="text-white font-medium mt-0.5">{offerId ? "Drafted" : "Not created"}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Schedule + Feedback */}
        <div className="flex-[2] space-y-4">
          {/* Schedule controls */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-[14px] p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Schedule controls</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#A1A1AA]">Date and time</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-1 bg-[#1A1A1A] border-[#27272A] text-white" />
              </div>
              <div>
                <Label className="text-[#A1A1AA]">Duration (minutes)</Label>
                <Input type="number" min={15} max={180} value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-1 bg-[#1A1A1A] border-[#27272A] text-white" />
              </div>
              <div className="col-span-2">
                <Label className="text-[#A1A1AA]">Meeting URL</Label>
                <Input type="url" value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} className="mt-1 bg-[#1A1A1A] border-[#27272A] text-white" />
                {meetingUrl && (
                  <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#EFFE5E] hover:underline mt-1">
                    Open link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button className="bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906]" onClick={() => void updateInterview()}>Save changes</Button>
              <Button variant="outline" className="border-[#27272A] text-[#EF4444] hover:bg-[#222222]" onClick={() => void cancelInterview()}>Cancel interview</Button>
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-[14px] p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Feedback</h3>
            <div className="mb-4">
              <Label className="text-[#A1A1AA]">Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} onClick={() => setRating(String(v))} className="focus:outline-none" type="button">
                    <Star className={`h-6 w-6 ${v <= Number(rating) ? "fill-[#EFFE5E] text-[#EFFE5E]" : "text-[#27272A]"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <Label className="text-[#A1A1AA]">Feedback notes</Label>
              <Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={5} placeholder="How did the interview go? Rate technical skills, communication, and culture fit." className="mt-1 bg-[#1A1A1A] border-[#27272A] text-white placeholder:text-[#52525B] resize-none" />
            </div>
            <div className="flex gap-3">
              <Button className="bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906]" onClick={() => void completeInterview()}>Complete interview</Button>
              {offerId ? (
                <Link href={`/dashboard/offers/${demand.id}/${offerId}`} className="inline-flex items-center px-4 py-2 border border-[#27272A] text-[#A1A1AA] rounded-md text-sm hover:bg-[#222222]">
                  Open offer
                </Link>
              ) : (
                <Button variant="outline" className="border-[#27272A] text-[#A1A1AA] hover:bg-[#222222]" onClick={() => void createOffer()}>Create offer draft</Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions panel placeholder — could add timeline/activity here later */}
      </div>

      {error ? <p className="text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2 text-sm">{error}</p> : null}
      {message ? <p className="text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2 text-sm">{message}</p> : null}

      {showCandidate ? <CandidateProfileModal candidate={interview.candidate} onClose={() => setShowCandidate(false)} /> : null}
    </div>
  );
}