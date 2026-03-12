"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { createApolloClient } from "../../../../lib/apollo-client";

type DemandOption = {
  id: string;
  title: string;
  approvalStatus: string;
  hardToFill: boolean;
  company: { name: string };
};

type HeadhunterOption = {
  id: string;
  email: string;
  role: string;
};

type AssignmentRecord = {
  id: string;
  notes: string | null;
  demand: { id: string; title: string };
  headhunterUser: { id: string; email: string };
};

type SubmissionRecord = {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  status: "SUBMITTED" | "REVIEWED" | "SHORTLISTED" | "REJECTED";
  reviewNotes: string | null;
  demand: { id: string; title: string };
  headhunterUser: { id: string; email: string };
};

type ConciergeAdminClientProps = {
  accessToken: string;
  demands: DemandOption[];
  headhunters: HeadhunterOption[];
  initialAssignments: AssignmentRecord[];
  initialSubmissions: SubmissionRecord[];
};

const createHeadhunterAssignmentMutation = gql`
  mutation CreateHeadhunterAssignment($input: CreateHeadhunterAssignmentInput!) {
    createHeadhunterAssignment(input: $input) {
      id
      notes
      demand {
        id
        title
      }
      headhunterUser {
        id
        email
      }
    }
  }
`;

const createExternalCandidateSubmissionMutation = gql`
  mutation CreateExternalCandidateSubmission($input: CreateExternalCandidateSubmissionInput!) {
    createExternalCandidateSubmission(input: $input) {
      id
      firstName
      lastName
      headline
      status
      reviewNotes
      demand {
        id
        title
      }
      headhunterUser {
        id
        email
      }
    }
  }
`;

const updateSubmissionStatusMutation = gql`
  mutation UpdateExternalCandidateSubmissionStatus($input: UpdateExternalCandidateSubmissionStatusInput!) {
    updateExternalCandidateSubmissionStatus(input: $input) {
      id
      status
      reviewNotes
    }
  }
`;

const availabilityWindows = ["IMMEDIATE", "TWO_WEEKS", "ONE_MONTH", "THREE_MONTHS", "NOT_AVAILABLE"] as const;

export function ConciergeAdminClient({ accessToken, demands, headhunters, initialAssignments, initialSubmissions }: ConciergeAdminClientProps) {
  const client = useMemo(() => createApolloClient(accessToken), [accessToken]);
  const approvedDemands = demands.filter((demand) => demand.approvalStatus === "APPROVED");
  const [assignments, setAssignments] = useState(initialAssignments);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [assignmentForm, setAssignmentForm] = useState({
    demandId: approvedDemands[0]?.id ?? "",
    headhunterUserId: headhunters[0]?.id ?? "",
    notes: ""
  });
  const [submissionForm, setSubmissionForm] = useState({
    demandId: approvedDemands[0]?.id ?? "",
    headhunterUserId: headhunters[0]?.id ?? "",
    firstName: "",
    lastName: "",
    email: "",
    headline: "",
    summary: "",
    location: "Remote",
    availability: "IMMEDIATE" as (typeof availabilityWindows)[number],
    hourlyRate: "",
    notes: "",
    resumeUrl: ""
  });
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createAssignment = async () => {
    setError(null);
    setMessage(null);

    try {
      const result = await client.mutate<{ createHeadhunterAssignment: AssignmentRecord }>({
        mutation: createHeadhunterAssignmentMutation,
        variables: { input: assignmentForm }
      });

      if (!result.data?.createHeadhunterAssignment) {
        throw new Error("Could not create assignment.");
      }

      const createdAssignment = result.data.createHeadhunterAssignment;
      setAssignments((current) => [createdAssignment, ...current.filter((item) => item.id !== createdAssignment.id)]);
      setMessage("Headhunter assignment created.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not create assignment.");
    }
  };

  const submitCandidate = async () => {
    setError(null);
    setMessage(null);

    try {
      const result = await client.mutate<{ createExternalCandidateSubmission: SubmissionRecord }>({
        mutation: createExternalCandidateSubmissionMutation,
        variables: {
          input: {
            ...submissionForm,
            hourlyRate: submissionForm.hourlyRate ? Number(submissionForm.hourlyRate) : undefined,
            notes: submissionForm.notes || undefined,
            resumeUrl: submissionForm.resumeUrl || undefined
          }
        }
      });

      if (!result.data?.createExternalCandidateSubmission) {
        throw new Error("Could not submit external candidate.");
      }

      const createdSubmission = result.data.createExternalCandidateSubmission;
      setSubmissions((current) => [createdSubmission, ...current]);
      setMessage("External candidate submitted.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not submit candidate.");
    }
  };

  const updateSubmissionStatus = async (submissionId: string, status: SubmissionRecord["status"]) => {
    setError(null);
    setMessage(null);

    try {
      await client.mutate({
        mutation: updateSubmissionStatusMutation,
        variables: {
          input: {
            submissionId,
            status,
            reviewNotes: reviewNotes[submissionId] || undefined
          }
        }
      });

      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === submissionId ? { ...submission, status, reviewNotes: reviewNotes[submissionId] ?? submission.reviewNotes } : submission
        )
      );
      setMessage("Submission status updated.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not update submission.");
    }
  };

  return (
    <div className="dashboard-grid admin-dashboard-grid">
      <section className="dashboard-panel-card admin-page-stack">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Headhunter assignments</span>
            <h3>Assign hard-to-fill roles</h3>
          </div>
        </div>

        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        {headhunters.length === 0 ? (
          <p className="dashboard-empty-state">No active headhunter users exist yet. Promote a user to HEADHUNTER from the Users page first.</p>
        ) : null}

        <div className="admin-form-grid">
          <label>
            Demand
            <select value={assignmentForm.demandId} onChange={(event) => setAssignmentForm((current) => ({ ...current, demandId: event.target.value }))}>
              {approvedDemands.map((demand) => (
                <option key={demand.id} value={demand.id}>
                  {demand.title} • {demand.company.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Headhunter
            <select value={assignmentForm.headhunterUserId} onChange={(event) => setAssignmentForm((current) => ({ ...current, headhunterUserId: event.target.value }))}>
              {headhunters.map((headhunter) => (
                <option key={headhunter.id} value={headhunter.id}>
                  {headhunter.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <textarea onChange={(event) => setAssignmentForm((current) => ({ ...current, notes: event.target.value }))} rows={3} value={assignmentForm.notes} />
          </label>
        </div>

        <div className="admin-inline-actions">
          <button className="primary-link" disabled={headhunters.length === 0 || approvedDemands.length === 0} onClick={createAssignment} type="button">
            Assign role
          </button>
        </div>

        <div className="admin-list-grid">
          {assignments.map((assignment) => (
            <article className="dashboard-activity-item" key={assignment.id}>
              <div>
                <span className="dashboard-activity-type">ASSIGNED</span>
                <h4>{assignment.demand.title}</h4>
                <p>{assignment.headhunterUser.email}</p>
              </div>
              <div className="dashboard-activity-meta">
                <span>{assignment.notes ?? "No notes"}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-panel-card admin-page-stack">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">External candidate submission</span>
            <h3>Submit concierge candidates into the review pipeline</h3>
          </div>
        </div>

        <div className="admin-form-grid">
          <label>
            Demand
            <select value={submissionForm.demandId} onChange={(event) => setSubmissionForm((current) => ({ ...current, demandId: event.target.value }))}>
              {approvedDemands.map((demand) => (
                <option key={demand.id} value={demand.id}>
                  {demand.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Headhunter
            <select value={submissionForm.headhunterUserId} onChange={(event) => setSubmissionForm((current) => ({ ...current, headhunterUserId: event.target.value }))}>
              {headhunters.map((headhunter) => (
                <option key={headhunter.id} value={headhunter.id}>
                  {headhunter.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            First name
            <input onChange={(event) => setSubmissionForm((current) => ({ ...current, firstName: event.target.value }))} value={submissionForm.firstName} />
          </label>
          <label>
            Last name
            <input onChange={(event) => setSubmissionForm((current) => ({ ...current, lastName: event.target.value }))} value={submissionForm.lastName} />
          </label>
          <label>
            Email
            <input onChange={(event) => setSubmissionForm((current) => ({ ...current, email: event.target.value }))} value={submissionForm.email} />
          </label>
          <label>
            Headline
            <input onChange={(event) => setSubmissionForm((current) => ({ ...current, headline: event.target.value }))} value={submissionForm.headline} />
          </label>
          <label>
            Location
            <input onChange={(event) => setSubmissionForm((current) => ({ ...current, location: event.target.value }))} value={submissionForm.location} />
          </label>
          <label>
            Availability
            <select value={submissionForm.availability} onChange={(event) => setSubmissionForm((current) => ({ ...current, availability: event.target.value as (typeof availabilityWindows)[number] }))}>
              {availabilityWindows.map((window) => (
                <option key={window} value={window}>
                  {window}
                </option>
              ))}
            </select>
          </label>
          <label>
            Hourly rate
            <input onChange={(event) => setSubmissionForm((current) => ({ ...current, hourlyRate: event.target.value }))} value={submissionForm.hourlyRate} />
          </label>
          <label className="admin-form-grid-span">
            Summary
            <textarea onChange={(event) => setSubmissionForm((current) => ({ ...current, summary: event.target.value }))} rows={4} value={submissionForm.summary} />
          </label>
        </div>

        <div className="admin-inline-actions">
          <button className="primary-link" disabled={headhunters.length === 0 || approvedDemands.length === 0} onClick={submitCandidate} type="button">
            Submit candidate
          </button>
        </div>
      </section>

      <section className="dashboard-panel-card admin-page-stack">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Submission tracking</span>
            <h3>Submitted, reviewed, shortlisted, or rejected</h3>
          </div>
        </div>

        <div className="admin-card-grid">
          {submissions.map((submission) => (
            <article className="role-list-card" key={submission.id}>
              <div className="role-list-card-header">
                <div>
                  <span className="role-status-badge">{submission.status}</span>
                  <h4>
                    {submission.firstName} {submission.lastName}
                  </h4>
                </div>
                <strong>{submission.demand.title}</strong>
              </div>

              <p>{submission.headline}</p>
              <p>{submission.headhunterUser.email}</p>

              <label>
                Review notes
                <textarea
                  onChange={(event) => setReviewNotes((current) => ({ ...current, [submission.id]: event.target.value }))}
                  rows={3}
                  value={reviewNotes[submission.id] ?? submission.reviewNotes ?? ""}
                />
              </label>

              <div className="admin-inline-actions">
                <button className="secondary-button" onClick={() => updateSubmissionStatus(submission.id, "REVIEWED")} type="button">
                  Mark reviewed
                </button>
                <button className="primary-link" onClick={() => updateSubmissionStatus(submission.id, "SHORTLISTED")} type="button">
                  Shortlist
                </button>
                <button className="secondary-button" onClick={() => updateSubmissionStatus(submission.id, "REJECTED")} type="button">
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}