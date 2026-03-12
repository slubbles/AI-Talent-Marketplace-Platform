"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type RecruiterAnalyticsData = {
  hiringVelocity: Array<{ label: string; averageDays: number; hires: number }>;
  openRolesByStatus: Array<{ status: string; count: number }>;
  topRequestedSkills: Array<{ skill: string; count: number }>;
  pipelineConversion: Array<{ stage: string; count: number }>;
  averageCostPerHire: number;
};

type AnalyticsDashboardProps = {
  data: RecruiterAnalyticsData;
};

const chartColors = ["#38bdf8", "#f59e0b", "#34d399", "#a78bfa", "#fb7185", "#f97316"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const totalHires = data.hiringVelocity.reduce((sum, item) => sum + item.hires, 0);
  const fastestMonth = [...data.hiringVelocity].sort((left, right) => left.averageDays - right.averageDays).find((item) => item.hires > 0);

  return (
    <div className="dashboard-grid analytics-page-grid">
      <section className="dashboard-hero dashboard-panel-card analytics-hero-card">
        <span className="eyebrow">Recruiter analytics</span>
        <h2>Hiring velocity, funnel health, and role demand trends</h2>
        <p>
          This reporting surface tracks how quickly roles convert into hires, which skills dominate current demand, and where the funnel is leaking.
        </p>
      </section>

      <section className="dashboard-metrics analytics-metrics-grid">
        <article className="dashboard-metric-card">
          <span>Average cost per hire</span>
          <strong>{formatCurrency(data.averageCostPerHire)}</strong>
          <p>Estimated from accepted offer rates across your recruiting pipeline.</p>
        </article>
        <article className="dashboard-metric-card">
          <span>Total hires</span>
          <strong>{totalHires}</strong>
          <p>Accepted offers over the visible six-month reporting window.</p>
        </article>
        <article className="dashboard-metric-card">
          <span>Fastest month</span>
          <strong>{fastestMonth ? `${fastestMonth.averageDays}d` : "N/A"}</strong>
          <p>{fastestMonth ? `${fastestMonth.label} delivered the quickest time-to-hire.` : "No completed hires yet."}</p>
        </article>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Hiring velocity</span>
            <h3>Time from role creation to hire</h3>
          </div>
        </div>
        <div className="analytics-chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.hiringVelocity}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis yAxisId="left" stroke="#94a3b8" />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="hires" fill="#38bdf8" radius={[8, 8, 0, 0]} yAxisId="left" />
              <Line dataKey="averageDays" stroke="#f59e0b" strokeWidth={3} type="monotone" yAxisId="right" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Open roles by status</span>
            <h3>Demand mix across the pipeline</h3>
          </div>
        </div>
        <div className="analytics-chart-shell analytics-chart-shell-pie">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.openRolesByStatus} dataKey="count" nameKey="status" innerRadius={70} outerRadius={110} paddingAngle={3}>
                {data.openRolesByStatus.map((entry, index) => (
                  <Cell fill={chartColors[index % chartColors.length]} key={entry.status} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Top requested skills</span>
            <h3>Skills driving active recruiter demand</h3>
          </div>
        </div>
        <div className="analytics-chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topRequestedSkills} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="skill" type="category" stroke="#94a3b8" width={110} />
              <Tooltip />
              <Bar dataKey="count" fill="#34d399" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-panel-card analytics-chart-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Pipeline conversion</span>
            <h3>Matches through hires</h3>
          </div>
        </div>
        <div className="analytics-chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pipelineConversion}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
              <XAxis dataKey="stage" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="count" fill="#a78bfa" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}