"use client";

import {
  FileSignature, ClipboardCheck, UserCheck, CheckCircle2,
  Clock, AlertCircle, ArrowRight, Building2, Calendar,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock data — represents the post-offer → onboarding pipeline        */
/* ------------------------------------------------------------------ */

const contractPipeline = [
  {
    id: "c1",
    talentName: "Amina Khaled",
    role: "Senior React Engineer",
    company: "TechVentures Inc.",
    offeredRate: "$85/hr",
    startDate: "Apr 15, 2026",
    stage: "CONTRACT_SENT" as const,
    updatedAt: "Mar 12, 2026",
  },
  {
    id: "c2",
    talentName: "Youssef El-Mansouri",
    role: "Cloud Architect",
    company: "DataFlow Corp",
    offeredRate: "$120/hr",
    startDate: "Apr 1, 2026",
    stage: "CONTRACT_SIGNED" as const,
    updatedAt: "Mar 10, 2026",
  },
  {
    id: "c3",
    talentName: "Layla Benali",
    role: "Product Designer",
    company: "TechVentures Inc.",
    offeredRate: "$75/hr",
    startDate: "May 1, 2026",
    stage: "ONBOARDING" as const,
    updatedAt: "Mar 8, 2026",
  },
  {
    id: "c4",
    talentName: "Omar Farouk",
    role: "Data Scientist",
    company: "NeuralEdge AI",
    offeredRate: "$110/hr",
    startDate: "Apr 20, 2026",
    stage: "COMPLETED" as const,
    updatedAt: "Mar 5, 2026",
  },
];

/* ------------------------------------------------------------------ */
/*  Pipeline stage definitions                                         */
/* ------------------------------------------------------------------ */

const stages = [
  { key: "OFFER_ACCEPTED", label: "Offer Accepted", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
  { key: "CONTRACT_SENT", label: "Contract Sent", icon: FileSignature, color: "text-blue-400", bg: "bg-blue-500/10" },
  { key: "CONTRACT_SIGNED", label: "Contract Signed", icon: ClipboardCheck, color: "text-[#EFFE5E]", bg: "bg-[rgba(239,254,94,0.1)]" },
  { key: "ONBOARDING", label: "Onboarding", icon: UserCheck, color: "text-purple-400", bg: "bg-purple-500/10" },
  { key: "COMPLETED", label: "Active", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
] as const;

type Stage = (typeof stages)[number]["key"];

function stageMeta(stage: Stage) {
  return stages.find((s) => s.key === stage) ?? stages[0];
}

function stageIndex(stage: Stage) {
  return stages.findIndex((s) => s.key === stage);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ContractsPage() {
  const summary = {
    pending: contractPipeline.filter((c) => c.stage === "CONTRACT_SENT").length,
    signed: contractPipeline.filter((c) => c.stage === "CONTRACT_SIGNED").length,
    onboarding: contractPipeline.filter((c) => c.stage === "ONBOARDING").length,
    active: contractPipeline.filter((c) => c.stage === "COMPLETED").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold">Contracts &amp; Onboarding</h1>
        <p className="text-text-secondary text-sm mt-1">
          Track the hiring→contract→onboarding pipeline for accepted offers.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Contracts Pending", value: summary.pending, icon: Clock, accent: "text-blue-400" },
          { label: "Contracts Signed", value: summary.signed, icon: FileSignature, accent: "text-[#EFFE5E]" },
          { label: "In Onboarding", value: summary.onboarding, icon: UserCheck, accent: "text-purple-400" },
          { label: "Active Placements", value: summary.active, icon: CheckCircle2, accent: "text-emerald-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#0A0A0A] border border-[#27272A] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`h-4 w-4 ${kpi.accent}`} />
              <span className="text-xs text-[#A1A1AA] uppercase tracking-wider">{kpi.label}</span>
            </div>
            <div className="text-2xl font-extrabold text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Pipeline Stages Visualization */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider mb-4">Hiring Pipeline</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {stages.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className={`text-xs font-medium whitespace-nowrap ${s.color}`}>{s.label}</span>
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="h-4 w-4 text-[#3f3f46] mx-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contract Table */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#27272A]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Talent</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Company</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Rate</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Start Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Stage</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody>
              {contractPipeline.map((c) => {
                const meta = stageMeta(c.stage);
                const progress = ((stageIndex(c.stage) + 1) / stages.length) * 100;
                return (
                  <tr key={c.id} className="border-b border-[#27272A] hover:bg-[#0A0A0A]/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-white">{c.talentName}</td>
                    <td className="px-5 py-4 text-[#A1A1AA]">{c.role}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-[#71717A]" />
                        <span className="text-[#A1A1AA]">{c.company}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white font-medium">{c.offeredRate}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-[#71717A]" />
                        <span className="text-[#A1A1AA]">{c.startDate}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}>
                          <meta.icon className="h-3 w-3" />
                          {meta.label}
                        </span>
                        <div className="w-24 h-1 bg-[#27272A] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#EFFE5E]/60 to-[#EFFE5E] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#71717A] text-xs">{c.updatedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboarding Checklist Section */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider mb-4">Onboarding Checklist Template</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: "Digital Contract Generation", desc: "Auto-generate contracts from offer terms", done: true },
            { label: "E-Signature Collection", desc: "DocuSign integration for remote signing", done: false, phase2: true },
            { label: "Compliance Documentation", desc: "NDA, tax forms, identity verification", done: true },
            { label: "System Access Provisioning", desc: "Grant platform access and permissions", done: true },
            { label: "Welcome Package Delivery", desc: "Send onboarding materials and guides", done: true },
            { label: "First Week Schedule", desc: "Auto-create orientation calendar", done: false, phase2: true },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg border border-[#27272A] bg-[#000000]">
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-[#71717A] flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {item.label}
                  {item.phase2 && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#27272A] text-[#71717A] uppercase">Phase 2</span>
                  )}
                </p>
                <p className="text-xs text-[#71717A] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
