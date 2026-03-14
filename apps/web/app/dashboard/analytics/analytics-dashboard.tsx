"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
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

const darkTooltipStyle = {
  contentStyle: { backgroundColor: "#0A0A0A", border: "1px solid #27272A", borderRadius: 8, color: "#fff", fontSize: 12 },
  itemStyle: { color: "#A1A1AA" },
  labelStyle: { color: "#fff", fontWeight: 600 },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const totalHires = data.hiringVelocity.reduce((sum, item) => sum + item.hires, 0);
  const fastestMonth = [...data.hiringVelocity].sort((left, right) => left.averageDays - right.averageDays).find((item) => item.hires > 0);

  return (
    <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeIn}>
        <h1 className="text-2xl font-bold text-white">Recruiter Analytics</h1>
        <p className="text-sm text-[#A1A1AA] mt-1">Hiring velocity, funnel health, and role demand trends</p>
      </motion.div>

      {/* KPI Row */}
      <motion.div className="grid grid-cols-3 gap-4" variants={fadeIn}>
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5 hover:border-[#3a3a3a] transition-colors">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Average cost per hire</span>
          <p className="text-2xl font-bold text-[#EFFE5E] mt-1">{formatCurrency(data.averageCostPerHire)}</p>
          <p className="text-xs text-[#52525B] mt-1">Estimated from accepted offer rates across your recruiting pipeline.</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5 hover:border-[#3a3a3a] transition-colors">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Total hires</span>
          <p className="text-2xl font-bold text-[#EFFE5E] mt-1">{totalHires}</p>
          <p className="text-xs text-[#52525B] mt-1">Accepted offers over the visible six-month reporting window.</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-5 hover:border-[#3a3a3a] transition-colors">
          <span className="text-xs uppercase tracking-wider text-[#A1A1AA]">Fastest month</span>
          <p className="text-2xl font-bold text-[#EFFE5E] mt-1">{fastestMonth ? `${fastestMonth.averageDays}d` : "N/A"}</p>
          <p className="text-xs text-[#52525B] mt-1">{fastestMonth ? `${fastestMonth.label} delivered the quickest time-to-hire.` : "No completed hires yet."}</p>
        </div>
      </motion.div>

      {/* Charts 2x2 */}
      <motion.div className="grid grid-cols-2 gap-6" variants={fadeIn}>
        {/* Hiring velocity */}
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Hiring velocity</p>
          <h3 className="text-lg font-semibold text-white mt-1 mb-4">Time from role creation to hire</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.hiringVelocity}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#52525B", fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: "#52525B", fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#52525B", fontSize: 12 }} />
                <Tooltip {...darkTooltipStyle} />
                <Bar dataKey="hires" fill="#EFFE5E" radius={[4, 4, 0, 0]} yAxisId="left" />
                <Line dataKey="averageDays" stroke="#F59E0B" strokeWidth={2} type="monotone" yAxisId="right" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Open roles by status */}
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Open roles by status</p>
          <h3 className="text-lg font-semibold text-white mt-1 mb-4">Demand mix across the pipeline</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.openRolesByStatus} dataKey="count" nameKey="status" innerRadius={70} outerRadius={110} paddingAngle={3}>
                  {data.openRolesByStatus.map((entry, index) => (
                    <Cell fill={chartColors[index % chartColors.length]} key={entry.status} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => <span style={{ color: "#A1A1AA", fontSize: 11 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top requested skills */}
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Top requested skills</p>
          <h3 className="text-lg font-semibold text-white mt-1 mb-4">Skills driving active recruiter demand</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topRequestedSkills} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#52525B", fontSize: 12 }} />
                <YAxis dataKey="skill" type="category" tick={{ fill: "#A1A1AA", fontSize: 11 }} width={110} />
                <Tooltip {...darkTooltipStyle} />
                <Bar dataKey="count" fill="#EFFE5E" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline conversion */}
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Pipeline conversion</p>
          <h3 className="text-lg font-semibold text-white mt-1 mb-4">Matches through hires</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pipelineConversion}>
                <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" tick={{ fill: "#52525B", fontSize: 12 }} />
                <YAxis tick={{ fill: "#52525B", fontSize: 12 }} />
                <Tooltip {...darkTooltipStyle} />
                <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}