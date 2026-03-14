"use client";

import {
  Globe, Plane, MapPin, ShieldCheck, Home, FileText,
  CheckCircle2, Clock, AlertTriangle, Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock data — talent mobility tracking                               */
/* ------------------------------------------------------------------ */

const mobilityRecords = [
  {
    id: "m1",
    talentName: "Amina Khaled",
    nationality: "Morocco",
    currentLocation: "Casablanca, MA",
    targetLocation: "Dubai, UAE",
    visaType: "Employment Visa",
    visaStatus: "APPROVED" as const,
    relocationStatus: "IN_PROGRESS" as const,
    startDate: "Apr 15, 2026",
    company: "TechVentures Inc.",
    role: "Senior React Engineer",
  },
  {
    id: "m2",
    talentName: "Youssef El-Mansouri",
    nationality: "Tunisia",
    currentLocation: "Tunis, TN",
    targetLocation: "Riyadh, SA",
    visaType: "Work Permit",
    visaStatus: "PENDING" as const,
    relocationStatus: "NOT_STARTED" as const,
    startDate: "Apr 1, 2026",
    company: "DataFlow Corp",
    role: "Cloud Architect",
  },
  {
    id: "m3",
    talentName: "Priya Sharma",
    nationality: "India",
    currentLocation: "Bangalore, IN",
    targetLocation: "Amsterdam, NL",
    visaType: "EU Blue Card",
    visaStatus: "IN_REVIEW" as const,
    relocationStatus: "NOT_STARTED" as const,
    startDate: "May 1, 2026",
    company: "NeuralEdge AI",
    role: "ML Engineer",
  },
  {
    id: "m4",
    talentName: "Omar Farouk",
    nationality: "Egypt",
    currentLocation: "Cairo, EG",
    targetLocation: "London, UK",
    visaType: "Skilled Worker Visa",
    visaStatus: "APPROVED" as const,
    relocationStatus: "COMPLETED" as const,
    startDate: "Mar 1, 2026",
    company: "TechVentures Inc.",
    role: "Data Scientist",
  },
];

const visaStatusMeta = {
  APPROVED: { label: "Approved", color: "text-green-400", bg: "bg-green-500/10", icon: CheckCircle2 },
  PENDING: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Clock },
  IN_REVIEW: { label: "In Review", color: "text-blue-400", bg: "bg-blue-500/10", icon: FileText },
  REJECTED: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/10", icon: AlertTriangle },
} as const;

const relocationStatusMeta = {
  NOT_STARTED: { label: "Not Started", color: "text-[#71717A]", bg: "bg-[#27272A]" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-400", bg: "bg-blue-500/10" },
  COMPLETED: { label: "Completed", color: "text-green-400", bg: "bg-green-500/10" },
} as const;

const services = [
  { icon: ShieldCheck, label: "Visa Assistance", desc: "Work permit processing, embassy coordination, document preparation", active: true },
  { icon: Home, label: "Accommodation Support", desc: "Temporary housing, relocation allowance management", active: true },
  { icon: Plane, label: "Relocation Logistics", desc: "Travel booking, shipping coordination, settling-in support", active: true },
  { icon: Users, label: "Onboarding Assistance", desc: "Local orientation, cultural integration, team introductions", active: true },
  { icon: FileText, label: "Compliance Documentation", desc: "Tax registration, labor law compliance, insurance enrollment", active: true },
  { icon: Globe, label: "Immigration Consulting", desc: "Long-term residency planning, family visa sponsorship", active: false },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MobilityPage() {
  const summary = {
    activeRelocations: mobilityRecords.filter((r) => r.relocationStatus === "IN_PROGRESS").length,
    pendingVisas: mobilityRecords.filter((r) => r.visaStatus === "PENDING" || r.visaStatus === "IN_REVIEW").length,
    completedMoves: mobilityRecords.filter((r) => r.relocationStatus === "COMPLETED").length,
    countries: new Set(mobilityRecords.map((r) => r.targetLocation.split(", ")[1])).size,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold">Talent Mobility</h1>
        <p className="text-text-secondary text-sm mt-1">
          Track visa processing, relocation support, and onboarding for cross-border placements.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Relocations", value: summary.activeRelocations, icon: Plane, accent: "text-blue-400" },
          { label: "Pending Visas", value: summary.pendingVisas, icon: Clock, accent: "text-yellow-400" },
          { label: "Completed Moves", value: summary.completedMoves, icon: CheckCircle2, accent: "text-green-400" },
          { label: "Target Countries", value: summary.countries, icon: Globe, accent: "text-[#EFFE5E]" },
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

      {/* Mobility Table */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#27272A]">
          <h2 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider">Mobility Tracker</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#27272A]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Talent</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Route</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Visa Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Visa Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Relocation</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Company / Role</th>
              </tr>
            </thead>
            <tbody>
              {mobilityRecords.map((r) => {
                const visa = visaStatusMeta[r.visaStatus];
                const reloc = relocationStatusMeta[r.relocationStatus];
                return (
                  <tr key={r.id} className="border-b border-[#27272A] hover:bg-[#0A0A0A]/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{r.talentName}</p>
                      <p className="text-xs text-[#71717A]">{r.nationality}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#71717A]" />
                        <span className="text-[#A1A1AA]">{r.currentLocation}</span>
                        <span className="text-[#3f3f46]">→</span>
                        <MapPin className="h-3.5 w-3.5 text-[#EFFE5E]" />
                        <span className="text-white font-medium">{r.targetLocation}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#A1A1AA]">{r.visaType}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${visa.bg} ${visa.color}`}>
                        <visa.icon className="h-3 w-3" />
                        {visa.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${reloc.bg} ${reloc.color}`}>
                        {reloc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[#A1A1AA]">{r.company}</p>
                      <p className="text-xs text-[#71717A]">{r.role}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobility Services */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider mb-4">Mobility Services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.label} className="flex items-start gap-3 p-4 rounded-lg border border-[#27272A] bg-[#000000]">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.active ? "bg-[rgba(239,254,94,0.1)]" : "bg-[#27272A]"}`}>
                <s.icon className={`h-4 w-4 ${s.active ? "text-[#EFFE5E]" : "text-[#71717A]"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {s.label}
                  {!s.active && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#27272A] text-[#71717A] uppercase">Phase 2</span>
                  )}
                </p>
                <p className="text-xs text-[#71717A] mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
