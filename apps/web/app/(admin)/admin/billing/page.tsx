"use client";

import {
  CreditCard, Repeat, UserSearch, Percent, TrendingUp,
  Building2, CheckCircle2, DollarSign, BarChart3, Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock revenue data                                                  */
/* ------------------------------------------------------------------ */

const revenueSnapshot = {
  monthlyRecurring: "$24,500",
  placementFees: "$18,200",
  hardToFillFees: "$7,500",
  totalRevenue: "$50,200",
};

const subscriptionTiers = [
  {
    name: "Starter",
    price: "$499/mo",
    features: ["Up to 10 active roles", "Basic AI matching", "Email notifications", "Standard support"],
    companies: 3,
    highlight: false,
  },
  {
    name: "Professional",
    price: "$1,499/mo",
    features: ["Up to 50 active roles", "Advanced AI matching", "Priority shortlisting", "Analytics dashboard", "Dedicated support"],
    companies: 8,
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["Unlimited roles", "Full AI suite", "Demand forecasting", "Custom integrations", "SLA-backed support", "Governance dashboard"],
    companies: 2,
    highlight: false,
  },
];

const recentTransactions = [
  { id: "t1", company: "TechVentures Inc.", type: "Subscription", amount: "$1,499.00", date: "Mar 1, 2026", status: "PAID" as const },
  { id: "t2", company: "DataFlow Corp", type: "Placement Fee", amount: "$8,500.00", date: "Mar 5, 2026", status: "PAID" as const },
  { id: "t3", company: "NeuralEdge AI", type: "Hard-to-Fill Fee", amount: "$3,750.00", date: "Mar 8, 2026", status: "PENDING" as const },
  { id: "t4", company: "TechVentures Inc.", type: "Placement Fee", amount: "$9,700.00", date: "Mar 12, 2026", status: "PAID" as const },
  { id: "t5", company: "CloudFirst Solutions", type: "Subscription", amount: "$499.00", date: "Mar 15, 2026", status: "PENDING" as const },
];

const statusMeta = {
  PAID: { label: "Paid", color: "text-green-400", bg: "bg-green-500/10" },
  PENDING: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  OVERDUE: { label: "Overdue", color: "text-red-400", bg: "bg-red-500/10" },
} as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BillingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold">Billing &amp; Pricing</h1>
        <p className="text-text-secondary text-sm mt-1">
          Revenue models, subscription tiers, and transaction history.
        </p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Recurring", value: revenueSnapshot.monthlyRecurring, icon: Repeat, accent: "text-[#EFFE5E]" },
          { label: "Placement Fees", value: revenueSnapshot.placementFees, icon: Percent, accent: "text-green-400" },
          { label: "Hard-to-Fill Fees", value: revenueSnapshot.hardToFillFees, icon: UserSearch, accent: "text-blue-400" },
          { label: "Total Revenue (MTD)", value: revenueSnapshot.totalRevenue, icon: TrendingUp, accent: "text-emerald-400" },
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

      {/* Revenue Models — The 3 SOW Models */}
      <div>
        <h2 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider mb-4">Revenue Models</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(239,254,94,0.1)] flex items-center justify-center">
              <Repeat className="h-5 w-5 text-[#EFFE5E]" />
            </div>
            <h3 className="text-lg font-bold text-white">Platform Subscription</h3>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Portfolio companies pay a monthly platform fee for access to the talent marketplace,
              AI matching, analytics, and workforce management tools.
            </p>
            <div className="pt-2 border-t border-[#27272A]">
              <p className="text-xs text-[#71717A]">3 tier levels · Billed monthly or annually</p>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(239,254,94,0.1)] flex items-center justify-center">
              <UserSearch className="h-5 w-5 text-[#EFFE5E]" />
            </div>
            <h3 className="text-lg font-bold text-white">Hard-to-Fill Fee</h3>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Premium pricing for concierge talent searches on rare or executive roles.
              Headhunter network activated with dedicated sourcing support.
            </p>
            <div className="pt-2 border-t border-[#27272A]">
              <p className="text-xs text-[#71717A]">Per-search pricing · Concierge-level SLA</p>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(239,254,94,0.1)] flex items-center justify-center">
              <Percent className="h-5 w-5 text-[#EFFE5E]" />
            </div>
            <h3 className="text-lg font-bold text-white">Placement Commission</h3>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              ~10% commission on successful talent placements. Charged upon contract signing
              and first engagement milestone.
            </p>
            <div className="pt-2 border-t border-[#27272A]">
              <p className="text-xs text-[#71717A]">~10% per placement · Milestone-based</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Tiers */}
      <div>
        <h2 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider mb-4">Subscription Tiers</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {subscriptionTiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-[#0A0A0A] border rounded-xl p-6 space-y-4 ${
                tier.highlight ? "border-[#EFFE5E]/40 shadow-glow" : "border-[#27272A]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                {tier.highlight && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(239,254,94,0.15)] text-[#EFFE5E] uppercase font-semibold">Popular</span>
                )}
              </div>
              <div className="text-3xl font-extrabold text-white">{tier.price}</div>
              <ul className="space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-[#27272A]">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-[#71717A]" />
                  <span className="text-xs text-[#71717A]">{tier.companies} active {tier.companies === 1 ? "company" : "companies"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#27272A] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider">Recent Transactions</h2>
          <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
            <Zap className="h-3 w-3 text-[#EFFE5E]" />
            Stripe integration ready — activate with API key
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#27272A]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Company</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => {
                const meta = statusMeta[tx.status];
                return (
                  <tr key={tx.id} className="border-b border-[#27272A] hover:bg-[#0A0A0A]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-[#71717A]" />
                        <span className="text-white font-medium">{tx.company}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#A1A1AA]">{tx.type}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-[#71717A]" />
                        <span className="text-white font-medium">{tx.amount}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#A1A1AA]">{tx.date}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
