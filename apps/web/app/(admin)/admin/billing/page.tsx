"use client";

import { CreditCard, Clock, ArrowUpRight } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Billing &amp; Payments</h1>
        <p className="text-text-secondary text-sm mt-1">
          Manage subscription plans, invoices, and payment methods.
        </p>
      </div>

      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[rgba(239,254,94,0.1)] border border-[#27272A] flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-[#EFFE5E]" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Coming in Phase 2</h2>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">
              Stripe-powered billing with subscription tiers, usage-based pricing,
              automated invoicing, and payment method management will be available
              in the next release.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4">
              <Clock className="h-4 w-4 text-[#EFFE5E] mb-2" />
              <p className="text-xs font-medium text-white">Subscription Management</p>
              <p className="text-xs text-[#71717A] mt-1">Free, Pro, Enterprise tiers</p>
            </div>
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4">
              <ArrowUpRight className="h-4 w-4 text-[#EFFE5E] mb-2" />
              <p className="text-xs font-medium text-white">Usage Tracking</p>
              <p className="text-xs text-[#71717A] mt-1">Per-match &amp; per-seat billing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
