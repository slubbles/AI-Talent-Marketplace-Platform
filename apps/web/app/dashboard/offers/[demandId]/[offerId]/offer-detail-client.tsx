"use client";

import { gql } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
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

type OfferDetail = {
  id: string;
  interviewId: string;
  demandId: string;
  talentProfileId: string;
  hourlyRate: number;
  startDate: string;
  endDate: string | null;
  terms: string;
  status: string;
  candidate: CandidateProfile;
};

type OfferDetailClientProps = {
  accessToken: string;
  demand: DemandSummary;
  offer: OfferDetail;
};

type StoredDocumentResult = {
  storeGeneratedDocument: {
    key: string;
    url: string;
    contentType: string;
  };
};

const updateOfferMutation = gql`
  mutation UpdateOffer($input: UpdateOfferInput!) {
    updateOffer(input: $input) {
      id
      status
      hourlyRate
      startDate
      endDate
      terms
    }
  }
`;

const storeGeneratedDocumentMutation = gql`
  mutation StoreGeneratedDocument($input: StoreGeneratedDocumentInput!) {
    storeGeneratedDocument(input: $input) {
      key
      url
      contentType
    }
  }
`;

const escapePdfText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const buildPdfBase64 = (lines: string[]) => {
  let y = 760;
  const textCommands = lines.map((line) => {
    const command = `1 0 0 1 50 ${y} Tm (${escapePdfText(line)}) Tj`;
    y -= 18;
    return command;
  }).join("\n");

  const stream = `BT\n/F1 12 Tf\n${textCommands}\nET`;
  const pdfParts = [
    "%PDF-1.4\n",
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
  ];

  let offset = 0;
  const offsets = [0];
  const body = pdfParts.map((part) => {
    offsets.push(offset);
    offset += part.length;
    return part;
  }).join("");

  const xrefStart = body.length;
  const xref = [
    "xref\n0 6\n",
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((entry) => `${String(entry).padStart(10, "0")} 00000 n \n`),
    "trailer\n<< /Size 6 /Root 1 0 R >>\n",
    `startxref\n${xrefStart}\n%%EOF`
  ].join("");

  return window.btoa(body + xref);
};

const checklistLabels = [
  "Welcome email sent",
  "Access provisioning requested",
  "Orientation scheduled",
  "Contract archived"
] as const;

export function OfferDetailClient({ accessToken, demand, offer }: OfferDetailClientProps) {
  const client = useMemo(() => createApolloClient(accessToken), [accessToken]);
  const [hourlyRate, setHourlyRate] = useState(String(offer.hourlyRate));
  const [startDate, setStartDate] = useState(offer.startDate.slice(0, 10));
  const [endDate, setEndDate] = useState(offer.endDate?.slice(0, 10) ?? "");
  const [terms, setTerms] = useState(offer.terms);
  const [status, setStatus] = useState(offer.status);
  const [storedContractUrl, setStoredContractUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCandidate, setShowCandidate] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const key = `onboarding:${offer.id}`;
    const rawValue = window.localStorage.getItem(key);

    if (rawValue) {
      setChecklist(JSON.parse(rawValue) as Record<string, boolean>);
      return;
    }

    const initialChecklist = Object.fromEntries(checklistLabels.map((label) => [label, false]));
    setChecklist(initialChecklist);
  }, [offer.id]);

  useEffect(() => {
    if (Object.keys(checklist).length === 0) {
      return;
    }

    window.localStorage.setItem(`onboarding:${offer.id}`, JSON.stringify(checklist));
  }, [checklist, offer.id]);

  const saveOffer = async (nextStatus?: string) => {
    setError(null);
    setMessage(null);

    try {
      const result = await client.mutate<{ updateOffer: { status: string } }>({
        mutation: updateOfferMutation,
        variables: {
          input: {
            offerId: offer.id,
            hourlyRate: Number(hourlyRate),
            startDate,
            endDate: endDate || null,
            terms,
            status: nextStatus ?? status
          }
        }
      });

      setStatus(result.data?.updateOffer.status ?? (nextStatus ?? status));
      setMessage("Offer updated.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not update offer.");
    }
  };

  const generateContract = async () => {
    setError(null);
    setMessage(null);

    try {
      const lines = [
        `${demand.company.name} Contract Summary`,
        `Role: ${demand.title}`,
        `Candidate: ${offer.candidate.firstName} ${offer.candidate.lastName}`,
        `Rate: ${hourlyRate} ${demand.currency}/hr`,
        `Start date: ${startDate}`,
        `End date: ${endDate || "Open-ended"}`,
        `Remote policy: ${demand.remotePolicy}`,
        `Location: ${demand.location}`,
        "Terms:",
        ...terms.split(/\r?\n/).flatMap((line) => line.match(/.{1,80}/g) ?? [line])
      ];
      const contentBase64 = buildPdfBase64(lines);

      const result = await client.mutate<StoredDocumentResult>({
        mutation: storeGeneratedDocumentMutation,
        variables: {
          input: {
            fileName: `${offer.candidate.firstName}-${offer.candidate.lastName}-${demand.title}-contract.pdf`,
            mimeType: "application/pdf",
            contentBase64,
            folder: `contracts/${offer.id}`
          }
        }
      });

      const nextUrl = result.data?.storeGeneratedDocument.url;
      if (!nextUrl) {
        throw new Error("Could not store generated contract.");
      }

      setStoredContractUrl(nextUrl);
      setChecklist((current) => ({ ...current, "Contract archived": true }));
      setMessage("Contract PDF generated and stored.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not generate contract PDF.");
    }
  };

  return (
    <div className="dashboard-grid">
      <section className="dashboard-panel-card pipeline-detail-hero">
        <div className="role-detail-hero-top">
          <div>
            <span className="eyebrow">Offer detail</span>
            <h2>{offer.candidate.firstName} {offer.candidate.lastName}</h2>
            <p>
              {demand.title} • {demand.company.name} • {status}
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
            <span>Rate</span>
            <strong>{hourlyRate} {demand.currency}/hr</strong>
          </div>
          <div>
            <span>Start date</span>
            <strong>{startDate}</strong>
          </div>
          <div>
            <span>End date</span>
            <strong>{endDate || "Open-ended"}</strong>
          </div>
          <div>
            <span>Remote policy</span>
            <strong>{demand.remotePolicy}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-panel-card pipeline-detail-grid">
        <div className="pipeline-form-card">
          <h3>Offer draft</h3>
          <div className="pipeline-form-grid">
            <label>
              <span>Hourly rate</span>
              <input onChange={(event) => setHourlyRate(event.target.value)} type="number" value={hourlyRate} />
            </label>
            <label>
              <span>Start date</span>
              <input onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
            </label>
            <label>
              <span>End date</span>
              <input onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
            </label>
            <label className="demand-form-field-wide">
              <span>Terms</span>
              <textarea onChange={(event) => setTerms(event.target.value)} rows={6} value={terms} />
            </label>
          </div>
          <div className="dashboard-actions">
            <button onClick={() => void saveOffer()} type="button">Save draft</button>
            <button className="secondary-button" onClick={() => void saveOffer("SENT")} type="button">Send offer</button>
            <button className="secondary-button" onClick={() => void saveOffer("WITHDRAWN")} type="button">Withdraw</button>
          </div>
        </div>

        <div className="pipeline-form-card">
          <h3>Contract and onboarding</h3>
          <p className="dashboard-empty-state">
            Accepted offers can generate a recruiter-ready contract PDF and launch a lightweight onboarding checklist.
          </p>
          <div className="dashboard-actions">
            <button disabled={status !== "ACCEPTED"} onClick={() => void generateContract()} type="button">Generate contract PDF</button>
            {storedContractUrl ? <a className="secondary-link" href={storedContractUrl} target="_blank">Open stored contract</a> : null}
          </div>

          {status === "ACCEPTED" ? (
            <div className="checklist-list">
              {checklistLabels.map((label) => (
                <label className="checklist-item" key={label}>
                  <input
                    checked={Boolean(checklist[label])}
                    onChange={(event) => setChecklist((current) => ({ ...current, [label]: event.target.checked }))}
                    type="checkbox"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty-state">Send and accept the offer to unlock contract generation and onboarding tracking.</p>
          )}
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      {showCandidate ? <CandidateProfileModal candidate={offer.candidate} onClose={() => setShowCandidate(false)} /> : null}
    </div>
  );
}