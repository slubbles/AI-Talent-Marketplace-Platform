"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type AdminAnalyticsData = {
  talentPoolGrowth: Array<{ label: string; totalProfiles: number; verifiedProfiles: number; pendingProfiles: number; newProfiles: number }>;
  skillDistribution: Array<{ skill: string; count: number }>;
  supplyDemandGap: Array<{ skill: string; demandCount: number; supplyCount: number; gap: number }>;
  hiringTimelines: Array<{ company: string; averageDays: number; hires: number }>;
  demandMonitoring: Array<{ company: string; activeDemands: number; pendingApprovals: number; hardToFill: number; placements: number }>;
  resourceUtilization: { placedTalent: number; availableTalent: number; utilizationRate: number };
  revenueMetrics: Array<{ label: string; placementFees: number; acceptedOffers: number }>;
  talentPricingTrends: Array<{ skill: string; averageRate: number }>;
  demandForecast: Array<{ skill: string; currentDemand: number; currentSupply: number; projectedDemand: number; projectedGap: number }>;
};

type AnalyticsOverviewProps = {
  data: AdminAnalyticsData;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function AnalyticsOverview({ data }: AnalyticsOverviewProps) {
  const totalFees = data.revenueMetrics.reduce((sum, item) => sum + item.placementFees, 0);
  const largestGap = [...data.supplyDemandGap].sort((left, right) => right.gap - left.gap)[0];

  return (
    <div className="space-y-6">
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
        <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Admin analytics</p>
        <h2 className="text-xl font-bold text-white mt-1">Platform growth, supply-demand pressure, and revenue visibility</h2>
        <p className="text-sm text-[#A1A1AA] mt-2">
          Admin analytics now surfaces talent pool growth, company hiring timelines, pricing patterns, and a lightweight demand forecast for skills with constrained supply.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Utilization rate</span>
          <p className="text-2xl font-bold text-[#EFFE5E] mt-1">{data.resourceUtilization.utilizationRate}%</p>
          <p className="text-xs text-[#52525B] mt-1">
            {data.resourceUtilization.placedTalent} placed talent • {data.resourceUtilization.availableTalent} immediately searchable.
          </p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Placement fees</span>
          <p className="text-2xl font-bold text-[#EFFE5E] mt-1">{formatCurrency(totalFees)}</p>
          <p className="text-xs text-[#52525B] mt-1">Estimated fees across the six-month admin reporting window.</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Largest supply gap</span>
          <p className="text-2xl font-bold text-[#EFFE5E] mt-1">{largestGap ? largestGap.skill : "N/A"}</p>
          <p className="text-xs text-[#52525B] mt-1">{largestGap ? `${largestGap.gap} more open requests than visible supply.` : "No forecast data yet."}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Talent pool growth</p>
          <h3 className="text-base font-semibold text-white mt-1 mb-4">Verified and pending profile expansion</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.talentPoolGrowth}>
                <CartesianGrid stroke="#27272A" vertical={false} />
                <XAxis dataKey="label" stroke="#A1A1AA" />
                <YAxis stroke="#A1A1AA" />
                <Tooltip />
                <Area dataKey="verifiedProfiles" stackId="1" stroke="#34d399" fill="#34d399" fillOpacity={0.3} />
                <Area dataKey="pendingProfiles" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                <Line dataKey="newProfiles" stroke="#38bdf8" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Supply-demand gap</p>
          <h3 className="text-base font-semibold text-white mt-1 mb-4">Skills with the widest pressure</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.supplyDemandGap}>
                <CartesianGrid stroke="#27272A" vertical={false} />
                <XAxis dataKey="skill" stroke="#A1A1AA" angle={-20} textAnchor="end" height={70} interval={0} />
                <YAxis stroke="#A1A1AA" />
                <Tooltip />
                <Bar dataKey="demandCount" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                <Bar dataKey="supplyCount" fill="#34d399" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Revenue</p>
          <h3 className="text-base font-semibold text-white mt-1 mb-4">Placement fees and accepted offers</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.revenueMetrics}>
                <CartesianGrid stroke="#27272A" vertical={false} />
                <XAxis dataKey="label" stroke="#A1A1AA" />
                <YAxis yAxisId="left" stroke="#A1A1AA" />
                <YAxis yAxisId="right" orientation="right" stroke="#A1A1AA" />
                <Tooltip />
                <Bar dataKey="acceptedOffers" fill="#38bdf8" radius={[8, 8, 0, 0]} yAxisId="left" />
                <Line dataKey="placementFees" stroke="#22c55e" strokeWidth={3} yAxisId="right" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Skill distribution</p>
          <h3 className="text-base font-semibold text-white mt-1 mb-4">Most common capabilities in the verified pool</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.skillDistribution} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid stroke="#27272A" horizontal={false} />
                <XAxis type="number" stroke="#A1A1AA" />
                <YAxis dataKey="skill" type="category" stroke="#A1A1AA" width={140} />
                <Tooltip />
                <Bar dataKey="count" fill="#38bdf8" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Hiring timelines</p>
          <h3 className="text-base font-semibold text-white mt-1 mb-4">Average days to hire by company</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hiringTimelines}>
                <CartesianGrid stroke="#27272A" vertical={false} />
                <XAxis dataKey="company" stroke="#A1A1AA" angle={-20} textAnchor="end" height={90} interval={0} />
                <YAxis stroke="#A1A1AA" />
                <Tooltip />
                <Bar dataKey="averageDays" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Demand monitoring</p>
          <h3 className="text-base font-semibold text-white mt-1 mb-4">Company operations watchlist</h3>
          <div className="space-y-3">
            {data.demandMonitoring.map((company) => (
              <div className="flex items-start justify-between py-3 border-b border-[#27272A] last:border-b-0" key={company.company}>
                <div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-950 text-blue-400">{company.company}</span>
                  <p className="text-sm font-medium text-white mt-1">{company.activeDemands} active demands</p>
                  <p className="text-xs text-[#A1A1AA]">
                    {company.pendingApprovals} pending approvals • {company.hardToFill} hard-to-fill • {company.placements} placements
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Pricing trends</p>
          <h3 className="text-base font-semibold text-white mt-1 mb-4">Average rates by skill cluster</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.talentPricingTrends} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid stroke="#27272A" horizontal={false} />
                <XAxis type="number" stroke="#A1A1AA" />
                <YAxis dataKey="skill" type="category" stroke="#A1A1AA" width={120} />
                <Tooltip />
                <Bar dataKey="averageRate" fill="#a78bfa" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Forecast</p>
          <h3 className="text-base font-semibold text-white mt-1 mb-4">Projected skill demand gap</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.demandForecast}>
                <CartesianGrid stroke="#27272A" vertical={false} />
                <XAxis dataKey="skill" stroke="#A1A1AA" angle={-20} textAnchor="end" height={70} interval={0} />
                <YAxis stroke="#A1A1AA" />
                <Tooltip />
                <Bar dataKey="currentDemand" fill="#f97316" radius={[8, 8, 0, 0]} />
                <Bar dataKey="projectedGap" fill="#fb7185" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}