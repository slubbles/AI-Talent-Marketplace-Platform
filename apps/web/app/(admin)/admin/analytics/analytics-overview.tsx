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
    <div className="dashboard-grid analytics-page-grid">
      <section className="dashboard-hero dashboard-panel-card admin-hero-card">
        <span className="eyebrow">Admin analytics</span>
        <h2>Platform growth, supply-demand pressure, and revenue visibility</h2>
        <p>
          Admin analytics now surfaces talent pool growth, company hiring timelines, pricing patterns, and a lightweight demand forecast for skills with constrained supply.
        </p>
      </section>

      <section className="dashboard-metrics analytics-metrics-grid">
        <article className="dashboard-metric-card admin-metric-card">
          <span>Utilization rate</span>
          <strong>{data.resourceUtilization.utilizationRate}%</strong>
          <p>
            {data.resourceUtilization.placedTalent} placed talent • {data.resourceUtilization.availableTalent} immediately searchable.
          </p>
        </article>
        <article className="dashboard-metric-card admin-metric-card">
          <span>Placement fees</span>
          <strong>{formatCurrency(totalFees)}</strong>
          <p>Estimated fees across the six-month admin reporting window.</p>
        </article>
        <article className="dashboard-metric-card admin-metric-card">
          <span>Largest supply gap</span>
          <strong>{largestGap ? largestGap.skill : "N/A"}</strong>
          <p>{largestGap ? `${largestGap.gap} more open requests than visible supply.` : "No forecast data yet."}</p>
        </article>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Talent pool growth</span>
            <h3>Verified and pending profile expansion</h3>
          </div>
        </div>
        <div className="analytics-chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.talentPoolGrowth}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area dataKey="verifiedProfiles" stackId="1" stroke="#34d399" fill="#34d399" fillOpacity={0.3} />
              <Area dataKey="pendingProfiles" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
              <Line dataKey="newProfiles" stroke="#38bdf8" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Supply-demand gap</span>
            <h3>Skills with the widest pressure</h3>
          </div>
        </div>
        <div className="analytics-chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.supplyDemandGap}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
              <XAxis dataKey="skill" stroke="#94a3b8" angle={-20} textAnchor="end" height={70} interval={0} />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="demandCount" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="supplyCount" fill="#34d399" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Revenue</span>
            <h3>Placement fees and accepted offers</h3>
          </div>
        </div>
        <div className="analytics-chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.revenueMetrics}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis yAxisId="left" stroke="#94a3b8" />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="acceptedOffers" fill="#38bdf8" radius={[8, 8, 0, 0]} yAxisId="left" />
              <Line dataKey="placementFees" stroke="#22c55e" strokeWidth={3} yAxisId="right" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Skill distribution</span>
            <h3>Most common capabilities in the verified pool</h3>
          </div>
        </div>
        <div className="analytics-chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.skillDistribution} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="skill" type="category" stroke="#94a3b8" width={140} />
              <Tooltip />
              <Bar dataKey="count" fill="#38bdf8" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Hiring timelines</span>
            <h3>Average days to hire by company</h3>
          </div>
        </div>
        <div className="analytics-chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.hiringTimelines}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
              <XAxis dataKey="company" stroke="#94a3b8" angle={-20} textAnchor="end" height={90} interval={0} />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="averageDays" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Demand monitoring</span>
            <h3>Company operations watchlist</h3>
          </div>
        </div>
        <div className="analytics-table-grid">
          {data.demandMonitoring.map((company) => (
            <article className="dashboard-activity-item" key={company.company}>
              <div>
                <span className="dashboard-activity-type">{company.company}</span>
                <h4>{company.activeDemands} active demands</h4>
                <p>
                  {company.pendingApprovals} pending approvals • {company.hardToFill} hard-to-fill • {company.placements} placements
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Pricing trends</span>
            <h3>Average rates by skill cluster</h3>
          </div>
        </div>
        <div className="analytics-chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.talentPricingTrends} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="skill" type="category" stroke="#94a3b8" width={120} />
              <Tooltip />
              <Bar dataKey="averageRate" fill="#a78bfa" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Forecast</span>
            <h3>Projected skill demand gap</h3>
          </div>
        </div>
        <div className="analytics-chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.demandForecast}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
              <XAxis dataKey="skill" stroke="#94a3b8" angle={-20} textAnchor="end" height={70} interval={0} />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="currentDemand" fill="#f97316" radius={[8, 8, 0, 0]} />
              <Bar dataKey="projectedGap" fill="#fb7185" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}