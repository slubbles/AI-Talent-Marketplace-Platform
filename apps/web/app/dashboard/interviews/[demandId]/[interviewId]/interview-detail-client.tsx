"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { CandidateProfileModal } from "../../../candidate-profile-modal";
import { createApolloClient } from "../../../../../lib/apollo-client";
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

  return (
    <div className="dashboard-grid">
      <section className="dashboard-panel-card pipeline-detail-hero">
        <div className="role-detail-hero-top">
          <div>
            <span className="eyebrow">Interview detail</span>
            <h2>{interview.candidate.firstName} {interview.candidate.lastName}</h2>
            <p>
              {demand.title} • {demand.company.name} • {new Date(interview.scheduledAt).toLocaleString()}
            </p>
          </div>
          <div className="role-detail-actions">
            <span className="role-status-badge">{status}</span>
            <button className="secondary-button" onClick={() => setShowCandidate(true)} type="button">
              View candidate
            </button>
          </div>
        </div>

        <div className="shortlist-meta-grid">
          <div>
            <span>Headline</span>
            <strong>{interview.candidate.headline}</strong>
          </div>
          <div>
            <span>Role</span>
            <strong>{demand.title}</strong>
          </div>
          <div>
            <span>Remote policy</span>
            <strong>{demand.remotePolicy}</strong>
          </div>
          <div>
            <span>Offer</span>
            <strong>{offerId ? "Drafted" : "Not created"}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-panel-card pipeline-detail-grid">
        <div className="pipeline-form-card">
          <h3>Schedule controls</h3>
          <div className="pipeline-form-grid">
            <label>
              <span>Date and time</span>
              <input onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" value={scheduledAt} />
            </label>
            <label>
              <span>Duration</span>
              <input max="180" min="15" onChange={(event) => setDuration(event.target.value)} type="number" value={duration} />
            </label>
            <label className="demand-form-field-wide">
              <span>Meeting URL</span>
              <input onChange={(event) => setMeetingUrl(event.target.value)} type="url" value={meetingUrl} />
            </label>
          </div>
          <div className="dashboard-actions">
            <button onClick={() => void updateInterview()} type="button">Save changes</button>
            <button className="secondary-button" onClick={() => void cancelInterview()} type="button">Cancel interview</button>
          </div>
        </div>

        <div className="pipeline-form-card">
          <h3>Feedback</h3>
          <div className="pipeline-form-grid">
            <label>
              <span>Rating</span>
              <input max="5" min="1" onChange={(event) => setRating(event.target.value)} type="number" value={rating} />
            </label>
            <label className="demand-form-field-wide">
              <span>Feedback notes</span>
              <textarea onChange={(event) => setFeedback(event.target.value)} rows={5} value={feedback} />
            </label>
          </div>
          <div className="dashboard-actions">
            <button onClick={() => void completeInterview()} type="button">Complete interview</button>
            {offerId ? (
              <a className="secondary-link" href={`/dashboard/offers/${demand.id}/${offerId}`}>Open offer</a>
            ) : (
              <button className="secondary-button" onClick={() => void createOffer()} type="button">Create offer draft</button>
            )}
          </div>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      {showCandidate ? <CandidateProfileModal candidate={interview.candidate} onClose={() => setShowCandidate(false)} /> : null}
    </div>
  );
}