import { graphQLRequest } from "../../../lib/graphql";
import Link from "next/link";
import { PageTransition, FadeIn } from "@/components/page-transition";

import { getSession } from "../../../lib/session";
type AdminDashboardQuery = {
  adminDashboard: {
    totalUsers: number;
    usersByRole: Array<{ role: string; count: number }>;
    totalTalentInPool: number;
    verifiedTalentCount: number;
    pendingTalentCount: number;
    activeDemandsCount: number;
    pendingDemandApprovalsCount: number;
    placementsThisMonth: number;
    placementFeesThisMonth: number;
    hardToFillDemandCount: number;
    pendingVerificationProfiles: Array<{
      id: string;
      firstName: string;
      lastName: string;
      headline: string;
      createdAt: string;
      user: { email: string };
    }>;
    companyMetrics: Array<{
      id: string;
      name: string;
      industry: string;
      activeDemandCount: number;
      pendingApprovalsCount: number;
      hardToFillCount: number;
      placementsCount: number;
    }>;
  };
};

const adminDashboardQuery = `#graphql
  query AdminDashboard {
    adminDashboard {
      totalUsers
      usersByRole {
        role
        count
      }
      totalTalentInPool
      verifiedTalentCount
      pendingTalentCount
      activeDemandsCount
      pendingDemandApprovalsCount
      placementsThisMonth
      placementFeesThisMonth
      hardToFillDemandCount
      pendingVerificationProfiles {
        id
        firstName
        lastName
        headline
        createdAt
        user {
          email
        }
      }
      companyMetrics {
        id
        name
        industry
        activeDemandCount
        pendingApprovalsCount
        hardToFillCount
        placementsCount
      }
    }
  }
`;

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));

export default async function AdminDashboardPage() {
  const session = await getSession();
  const data = await graphQLRequest<AdminDashboardQuery>(adminDashboardQuery, undefined, session?.accessToken);
  const dashboard = data.adminDashboard;

  const metrics = [
    { label: "Total users", value: dashboard.totalUsers, detail: dashboard.usersByRole.map((item) => `${item.role}: ${item.count}`).join(" • ") },
    { label: "Talent pool", value: dashboard.totalTalentInPool, detail: `${dashboard.verifiedTalentCount} verified • ${dashboard.pendingTalentCount} pending` },
    { label: "Active demands", value: dashboard.activeDemandsCount, detail: `${dashboard.pendingDemandApprovalsCount} waiting on approval` },
    { label: "Placements this month", value: dashboard.placementsThisMonth, detail: `${formatMoney(dashboard.placementFeesThisMonth)} estimated fees` }
  ];

  return (
    <PageTransition>
      <FadeIn>
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
        <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Admin dashboard</p>
        <h2 className="text-xl font-bold text-white mt-1">Platform health and governance</h2>
        <p className="text-sm text-[#A1A1AA] mt-2">
          This surface tracks the full marketplace: user activation, pending verification work, approval bottlenecks, hard-to-fill roles,
          and portfolio-company throughput.
        </p>
        <div className="flex gap-3 mt-4">
          <Link className="text-sm text-[#EFFE5E] hover:underline" href="/admin/verification">Review verification queue</Link>
          <Link className="text-sm text-[#A1A1AA] hover:text-white" href="/admin/approvals">Open role approvals</Link>
        </div>
      </div>
      </FadeIn>

      <FadeIn>
      <div className="grid grid-cols-4 gap-4 mt-6">
        {metrics.map((metric) => (
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5 hover:border-[#3a3a3a] transition-colors" key={metric.label}>
            <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">{metric.label}</span>
            <p className="text-2xl font-bold text-[#EFFE5E] mt-1">{metric.value}</p>
            <p className="text-xs text-[#52525B] mt-1">{metric.detail}</p>
          </div>
        ))}
      </div>
      </FadeIn>

      {/* Verification queue */}
      <FadeIn>
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Verification queue</p>
            <h3 className="text-lg font-semibold text-white mt-1">Pending talent reviews</h3>
          </div>
          <Link className="text-sm text-[#EFFE5E] hover:underline" href="/admin/verification">Open queue</Link>
        </div>
        {dashboard.pendingVerificationProfiles.length === 0 ? (
          <p className="text-sm text-[#52525B]">No newly pending talent profiles waiting on admin review right now.</p>
        ) : (
          <div className="space-y-3">
            {dashboard.pendingVerificationProfiles.map((profile) => (
              <div className="flex items-center justify-between border-b border-[#27272A] pb-3 last:border-b-0 last:pb-0" key={profile.id}>
                <div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950 text-amber-400">PENDING</span>
                  <p className="text-sm font-medium text-white mt-1">{profile.firstName} {profile.lastName}</p>
                  <p className="text-xs text-[#A1A1AA]">{profile.headline}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-white">{profile.user.email}</p>
                  <p className="text-[#52525B]">Queued {formatDate(profile.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </FadeIn>

      {/* Company watchlist */}
      <FadeIn>
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Company watchlist</p>
            <h3 className="text-lg font-semibold text-white mt-1">Portfolio company demand pressure</h3>
          </div>
          <Link className="text-sm text-[#EFFE5E] hover:underline" href="/admin/companies">Manage companies</Link>
        </div>
        {dashboard.companyMetrics.length === 0 ? (
          <p className="text-sm text-[#52525B]">Company oversight cards appear once recruiters are attached to organizations with live demand history.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {dashboard.companyMetrics.map((company) => (
              <div className="bg-[#111111] border border-[#27272A] rounded-lg p-4 hover:border-[#3a3a3a] transition-colors" key={company.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-950 text-blue-400">{company.industry}</span>
                  <h4 className="text-sm font-medium text-white">{company.name}</h4>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div><span className="text-[#52525B] text-xs">Active demands</span><p className="text-white font-medium">{company.activeDemandCount}</p></div>
                  <div><span className="text-[#52525B] text-xs">Pending approvals</span><p className="text-white font-medium">{company.pendingApprovalsCount}</p></div>
                  <div><span className="text-[#52525B] text-xs">Hard-to-fill</span><p className="text-white font-medium">{company.hardToFillCount}</p></div>
                  <div><span className="text-[#52525B] text-xs">Placements</span><p className="text-white font-medium">{company.placementsCount}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </FadeIn>

      {/* Concierge signal */}
      <FadeIn>
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 mt-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Concierge signal</p>
            <h3 className="text-lg font-semibold text-white mt-1">Hard-to-fill demand coverage</h3>
          </div>
          <Link className="text-sm text-[#EFFE5E] hover:underline" href="/admin/concierge">Open concierge desk</Link>
        </div>
        <p className="text-sm text-[#52525B]">
          {dashboard.hardToFillDemandCount} active demand{dashboard.hardToFillDemandCount === 1 ? "" : "s"} are currently flagged for concierge sourcing.
        </p>
      </div>
      </FadeIn>
    </PageTransition>
  );
}