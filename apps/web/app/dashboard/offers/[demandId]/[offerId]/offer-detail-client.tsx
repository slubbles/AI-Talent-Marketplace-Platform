"use client";

import { gql } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import { CandidateProfileModal } from "../../../candidate-profile-modal";
import { createApolloClient } from "../../../../../lib/apollo-client";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import { ArrowLeft } from "lucide-react";
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

  const statusStyles: Record<string, string> = {
    DRAFT: "bg-[#27272A] text-[#A1A1AA]",
    SENT: "bg-blue-950 text-blue-400",
    ACCEPTED: "bg-green-950 text-green-400",
    DECLINED: "bg-red-950 text-red-400",
    WITHDRAWN: "bg-[#27272A] text-[#52525B]",
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/offers" className="inline-flex items-center gap-1 text-sm text-[#A1A1AA] hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Offers
      </Link>

      {/* Hero */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-[14px] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Offer detail</p>
            <h2 className="text-xl font-bold text-white mt-1">{offer.candidate.firstName} {offer.candidate.lastName}</h2>
            <p className="text-sm text-[#A1A1AA] mt-1">
              {demand.title} &middot; {demand.company.name} &middot; {status}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] ?? "bg-[#27272A] text-[#A1A1AA]"}`}>{status}</span>
            <Button variant="outline" size="sm" onClick={() => setShowCandidate(true)}>View candidate</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6 text-sm">
          <div>
            <span className="text-[#52525B]">Rate</span>
            <p className="text-white font-medium mt-0.5">{hourlyRate} {demand.currency}/hr</p>
          </div>
          <div>
            <span className="text-[#52525B]">Start date</span>
            <p className="text-white font-medium mt-0.5">{startDate}</p>
          </div>
          <div>
            <span className="text-[#52525B]">End date</span>
            <p className="text-white font-medium mt-0.5">{endDate || "Open-ended"}</p>
          </div>
          <div>
            <span className="text-[#52525B]">Remote policy</span>
            <p className="text-white font-medium mt-0.5">{demand.remotePolicy}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Offer form + Contract */}
        <div className="flex-[2] space-y-4">
          {/* Offer draft */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-[14px] p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Offer draft</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[#A1A1AA]">Hourly rate</Label>
                <Input type="number" value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value)} className="mt-1 bg-[#1A1A1A] border-[#27272A] text-white" />
              </div>
              <div>
                <Label className="text-[#A1A1AA]">Start date</Label>
                <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 bg-[#1A1A1A] border-[#27272A] text-white" />
              </div>
              <div>
                <Label className="text-[#A1A1AA]">End date</Label>
                <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 bg-[#1A1A1A] border-[#27272A] text-white" />
              </div>
              <div className="col-span-3">
                <Label className="text-[#A1A1AA]">Terms</Label>
                <Textarea value={terms} onChange={(event) => setTerms(event.target.value)} rows={6} className="mt-1 bg-[#1A1A1A] border-[#27272A] text-white resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button className="bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906]" onClick={() => void saveOffer()}>Save draft</Button>
              <Button variant="outline" className="border-[#27272A] text-[#A1A1AA] hover:bg-[#222222]" onClick={() => void saveOffer("SENT")}>Send offer</Button>
              <Button variant="outline" className="border-[#27272A] text-[#EF4444] hover:bg-[#222222]" onClick={() => void saveOffer("WITHDRAWN")}>Withdraw</Button>
            </div>
          </div>

          {/* Contract and onboarding */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-[14px] p-6">
            <h3 className="text-sm font-semibold text-white mb-2">Contract and onboarding</h3>
            <p className="text-xs text-[#52525B] mb-4">Accepted offers can generate a recruiter-ready contract PDF and launch a lightweight onboarding checklist.</p>
            <div className="flex gap-3 mb-4">
              <Button className="bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906]" disabled={status !== "ACCEPTED"} onClick={() => void generateContract()}>Generate contract PDF</Button>
              {storedContractUrl ? (
                <a href={storedContractUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 border border-[#27272A] text-[#A1A1AA] rounded-md text-sm hover:bg-[#222222]">
                  Open stored contract
                </a>
              ) : null}
            </div>

            {status === "ACCEPTED" ? (
              <div className="space-y-3 border-t border-[#27272A] pt-4">
                {checklistLabels.map((label) => (
                  <label className="flex items-center gap-3 cursor-pointer" key={label}>
                    <input
                      type="checkbox"
                      checked={Boolean(checklist[label])}
                      onChange={(event) => setChecklist((current) => ({ ...current, [label]: event.target.checked }))}
                      className="h-4 w-4 rounded border-[#27272A] bg-[#1A1A1A] accent-[#EFFE5E]"
                    />
                    <span className="text-sm text-white">{label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#52525B]">Send and accept the offer to unlock contract generation and onboarding tracking.</p>
            )}
          </div>
        </div>
      </div>

      {error ? <p className="text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2 text-sm">{error}</p> : null}
      {message ? <p className="text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2 text-sm">{message}</p> : null}

      {showCandidate ? <CandidateProfileModal candidate={offer.candidate} onClose={() => setShowCandidate(false)} /> : null}
    </div>
  );
}