"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { createApolloClient } from "../../../../lib/apollo-client";
import Link from "next/link";

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

  const statusStyles: Record<string, string> = {
    SUBMITTED: "bg-blue-950 text-blue-400",
    REVIEWED: "bg-amber-950 text-amber-400",
    SHORTLISTED: "bg-green-950 text-green-400",
    REJECTED: "bg-red-950 text-red-400"
  };

  return (
    <div className="space-y-6">
      {/* Headhunter assignments */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Headhunter assignments</p>
          <h3 className="text-lg font-semibold text-white mt-1">Assign hard-to-fill roles</h3>
        </div>

        {message ? <p className="text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2 text-sm">{message}</p> : null}
        {error ? <p className="text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2 text-sm">{error}</p> : null}

        {headhunters.length === 0 ? (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-md p-4">
            <p className="text-sm text-amber-400">No active headhunter users exist yet. Promote at least one user to HEADHUNTER role first.</p>
            <Link className="text-sm text-[#EFFE5E] hover:underline mt-2 inline-block" href="/admin/users">Manage users</Link>
          </div>
        ) : null}
        {approvedDemands.length === 0 ? (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-md p-4">
            <p className="text-sm text-amber-400">No approved demands available. Concierge assignments need at least one approved demand.</p>
            <Link className="text-sm text-[#A1A1AA] hover:text-white mt-2 inline-block" href="/admin/approvals">Review role approvals</Link>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Demand
            <select className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" value={assignmentForm.demandId} onChange={(event) => setAssignmentForm((current) => ({ ...current, demandId: event.target.value }))}>
              {approvedDemands.map((demand) => (
                <option key={demand.id} value={demand.id}>{demand.title} • {demand.company.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Headhunter
            <select className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" value={assignmentForm.headhunterUserId} onChange={(event) => setAssignmentForm((current) => ({ ...current, headhunterUserId: event.target.value }))}>
              {headhunters.map((headhunter) => (
                <option key={headhunter.id} value={headhunter.id}>{headhunter.email}</option>
              ))}
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Notes
            <textarea className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-2 text-sm placeholder:text-[#52525B]" onChange={(event) => setAssignmentForm((current) => ({ ...current, notes: event.target.value }))} rows={3} value={assignmentForm.notes} />
          </label>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] disabled:opacity-50 transition-colors" disabled={headhunters.length === 0 || approvedDemands.length === 0} onClick={createAssignment} type="button">
            Assign role
          </button>
        </div>

        <div className="space-y-2">
          {assignments.length === 0 ? (
            <p className="text-sm text-[#52525B] py-4">No headhunter assignments yet. Create the first assignment above.</p>
          ) : (
            assignments.map((assignment) => (
              <div className="flex items-center justify-between py-3 border-b border-[#27272A] last:border-b-0" key={assignment.id}>
                <div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-950 text-blue-400">ASSIGNED</span>
                  <p className="text-sm font-medium text-white mt-1">{assignment.demand.title}</p>
                  <p className="text-xs text-[#A1A1AA]">{assignment.headhunterUser.email}</p>
                </div>
                <span className="text-xs text-[#52525B]">{assignment.notes ?? "No notes"}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* External candidate submission */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">External candidate submission</p>
          <h3 className="text-lg font-semibold text-white mt-1">Submit concierge candidates into the review pipeline</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Demand
            <select className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" value={submissionForm.demandId} onChange={(event) => setSubmissionForm((current) => ({ ...current, demandId: event.target.value }))}>
              {approvedDemands.map((demand) => (
                <option key={demand.id} value={demand.id}>{demand.title}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Headhunter
            <select className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" value={submissionForm.headhunterUserId} onChange={(event) => setSubmissionForm((current) => ({ ...current, headhunterUserId: event.target.value }))}>
              {headhunters.map((headhunter) => (
                <option key={headhunter.id} value={headhunter.id}>{headhunter.email}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            First name
            <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => setSubmissionForm((current) => ({ ...current, firstName: event.target.value }))} value={submissionForm.firstName} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Last name
            <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => setSubmissionForm((current) => ({ ...current, lastName: event.target.value }))} value={submissionForm.lastName} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Email
            <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => setSubmissionForm((current) => ({ ...current, email: event.target.value }))} value={submissionForm.email} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Headline
            <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => setSubmissionForm((current) => ({ ...current, headline: event.target.value }))} value={submissionForm.headline} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Location
            <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => setSubmissionForm((current) => ({ ...current, location: event.target.value }))} value={submissionForm.location} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Availability
            <select className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" value={submissionForm.availability} onChange={(event) => setSubmissionForm((current) => ({ ...current, availability: event.target.value as (typeof availabilityWindows)[number] }))}>
              {availabilityWindows.map((window) => (
                <option key={window} value={window}>{window}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Hourly rate
            <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => setSubmissionForm((current) => ({ ...current, hourlyRate: event.target.value }))} value={submissionForm.hourlyRate} />
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Summary
            <textarea className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-2 text-sm placeholder:text-[#52525B]" onChange={(event) => setSubmissionForm((current) => ({ ...current, summary: event.target.value }))} rows={4} value={submissionForm.summary} />
          </label>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] disabled:opacity-50 transition-colors" disabled={headhunters.length === 0 || approvedDemands.length === 0} onClick={submitCandidate} type="button">
            Submit candidate
          </button>
        </div>
      </div>

      {/* Submission tracking */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Submission tracking</p>
          <h3 className="text-lg font-semibold text-white mt-1">Submitted, reviewed, shortlisted, or rejected</h3>
        </div>

        <div className="grid gap-4">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Submission tracking</p>
              <h4 className="text-lg font-semibold text-white mt-2">No external submissions yet</h4>
              <p className="text-sm text-[#52525B] mt-1">Submitted external candidates will appear here once concierge sourcing starts contributing into the pipeline.</p>
            </div>
          ) : (
            submissions.map((submission) => (
              <article className="bg-[#111111] border border-[#27272A] rounded-lg p-5 space-y-3" key={submission.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[submission.status] ?? "bg-zinc-800 text-zinc-400"}`}>{submission.status}</span>
                    <h4 className="text-sm font-medium text-white">{submission.firstName} {submission.lastName}</h4>
                  </div>
                  <span className="text-sm font-medium text-[#A1A1AA]">{submission.demand.title}</span>
                </div>

                <p className="text-sm text-[#A1A1AA]">{submission.headline}</p>
                <p className="text-xs text-[#52525B]">{submission.headhunterUser.email}</p>

                <label className="block text-sm text-[#A1A1AA]">
                  Review notes
                  <textarea
                    className="mt-1 w-full bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-2 text-sm placeholder:text-[#52525B]"
                    onChange={(event) => setReviewNotes((current) => ({ ...current, [submission.id]: event.target.value }))}
                    rows={3}
                    value={reviewNotes[submission.id] ?? submission.reviewNotes ?? ""}
                  />
                </label>

                <div className="flex gap-3">
                  <button className="px-4 py-2 rounded-md text-sm font-medium border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors" onClick={() => updateSubmissionStatus(submission.id, "REVIEWED")} type="button">
                    Mark reviewed
                  </button>
                  <button className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] transition-colors" onClick={() => updateSubmissionStatus(submission.id, "SHORTLISTED")} type="button">
                    Shortlist
                  </button>
                  <button className="px-4 py-2 rounded-md text-sm font-medium border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors" onClick={() => updateSubmissionStatus(submission.id, "REJECTED")} type="button">
                    Reject
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}