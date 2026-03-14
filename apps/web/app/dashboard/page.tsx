import Link from "next/link";
import { graphQLRequest } from "../../lib/graphql";
import { TrendingUp, Plus, Search, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getSession } from "../../lib/session";
type RecruiterDashboardQuery = {
  recruiterDashboard: {
    activeRolesCount: number;
    totalCandidatesInPool: number;
    interviewsThisWeek: number;
    averageTimeToShortlistDays: number;
    recentActivity: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      occurredAt: string;
      href: string | null;
    }>;
    rolesNeedingAttention: Array<{
      id: string;
      reason: string;
      shortlistCount: number;
      daysOpen: number;
      demand: {
        id: string;
        title: string;
        location: string;
        remotePolicy: string;
        company: {
          name: string;
        };
      };
    }>;
  };
};

const recruiterDashboardQuery = `#graphql
  query RecruiterDashboard {
    recruiterDashboard {
      activeRolesCount
      totalCandidatesInPool
      interviewsThisWeek
      averageTimeToShortlistDays
      recentActivity {
        id
        type
        title
        description
        occurredAt
        href
      }
      rolesNeedingAttention {
        id
        reason
        shortlistCount
        daysOpen
        demand {
          id
          title
          location
          remotePolicy
          company {
            name
          }
        }
      }
    }
  }
`;

const formatActivityDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const activityColor: Record<string, string> = {
  SHORTLIST: "bg-[#22C55E]",
  INTERVIEW: "bg-[#3B82F6]",
  OFFER: "bg-[#F59E0B]",
  ROLE: "bg-[#22C55E]",
  DEFAULT: "bg-[#A1A1AA]",
};

export default async function DashboardPage() {
  const session = await getSession();
  const data = await graphQLRequest<RecruiterDashboardQuery>(
    recruiterDashboardQuery,
    undefined,
    session?.accessToken
  );
  const dashboard = data.recruiterDashboard;

  const kpis = [
    { label: "ACTIVE ROLES", value: String(dashboard.activeRolesCount), accent: true },
    { label: "CANDIDATE POOL", value: String(dashboard.totalCandidatesInPool), accent: false },
    { label: "INTERVIEWS THIS WEEK", value: String(dashboard.interviewsThisWeek), accent: false },
    { label: "AVG. TIME TO SHORTLIST", value: `${dashboard.averageTimeToShortlistDays}d`, accent: false },
  ];

  return (
    <div className="space-y-0">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold mb-1">Dashboard</h1>
        <p className="text-[#A1A1AA] text-sm">Overview of your recruiting pipeline.</p>
      </div>

      {/* KPI Row */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg flex flex-row w-full">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className={`flex-1 px-6 py-5 flex flex-col gap-1 ${i < kpis.length - 1 ? "border-r border-[#27272A]" : ""}`}
          >
            <span className="text-[11px] uppercase tracking-widest text-[#A1A1AA] font-medium">{kpi.label}</span>
            <span className={`text-2xl font-bold ${kpi.accent ? "text-[#EFFE5E]" : "text-white"}`}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Quick Action Bar */}
      <div className="flex gap-3 mt-6">
        <Button asChild>
          <Link href="/dashboard/roles/new"><Plus className="h-4 w-4" /> Create Role</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/dashboard/search"><Search className="h-4 w-4" /> Search Talent</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/dashboard/shortlists"><ListChecks className="h-4 w-4" /> Review Shortlists</Link>
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 mt-8">
        {/* Left — Roles Requiring Attention */}
        <div className="flex-[2] min-w-0">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Roles Requiring Attention</h2>
            <p className="text-sm text-[#A1A1AA]">Roles that are stalled or need your input.</p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg overflow-hidden">
            {dashboard.rolesNeedingAttention.length === 0 ? (
              <div className="p-8 text-center text-[#A1A1AA] text-sm">No blocked roles at the moment.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#27272A]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B] uppercase tracking-wide">Role Title</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B] uppercase tracking-wide">Company</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B] uppercase tracking-wide">Days Open</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#52525B] uppercase tracking-wide">Shortlist</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#52525B] uppercase tracking-wide">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.rolesNeedingAttention.map((item) => (
                    <tr key={item.id} className="h-14 border-b border-[#27272A] last:border-b-0 hover:bg-[#222222] transition-colors">
                      <td className="px-4 font-medium">{item.demand.title}</td>
                      <td className="px-4 text-[#A1A1AA]">{item.demand.company.name}</td>
                      <td className="px-4 text-[#A1A1AA]">{item.daysOpen} days</td>
                      <td className="px-4 text-[#A1A1AA]">{item.shortlistCount} candidates</td>
                      <td className="px-4 text-right">
                        <Link href={`/dashboard/shortlists?demandId=${item.demand.id}`} className="text-primary text-xs hover:underline">
                          {item.reason}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Link href="/dashboard/roles" className="inline-block mt-3 text-sm text-[#A1A1AA] hover:text-white transition-colors">
            View All Roles ?
          </Link>
        </div>

        {/* Right — Recent Activity */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {dashboard.recentActivity.length === 0 ? (
            <p className="text-sm text-[#A1A1AA]">No recruiter activity yet. Post a role to get started.</p>
          ) : (
            <div className="space-y-4">
              {dashboard.recentActivity.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activityColor[item.type] ?? activityColor.DEFAULT}`} />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{item.title}</p>
                    <span className="text-xs text-[#52525B]">{formatActivityDate(item.occurredAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
