"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { createApolloClient } from "../../../../lib/apollo-client";
import Link from "next/link";

type CompanyRecord = {
  id: string;
  recruiterId: string;
  name: string;
  industry: string;
  size: "STARTUP" | "SMB" | "ENTERPRISE";
  logoUrl: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
};

type RecruiterOption = {
  id: string;
  email: string;
};

type CompanyMetric = {
  id: string;
  name: string;
  industry: string;
  activeDemandCount: number;
  pendingApprovalsCount: number;
  hardToFillCount: number;
  placementsCount: number;
};

type CompaniesAdminClientProps = {
  accessToken: string;
  initialCompanies: CompanyRecord[];
  recruiters: RecruiterOption[];
  metrics: CompanyMetric[];
};

const createCompanyMutation = gql`
  mutation CreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
      id
      recruiterId
      name
      industry
      size
      logoUrl
      website
      createdAt
      updatedAt
    }
  }
`;

const updateCompanyMutation = gql`
  mutation UpdateCompany($id: ID!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) {
      id
      recruiterId
      name
      industry
      size
      logoUrl
      website
      createdAt
      updatedAt
    }
  }
`;

const companySizes = ["STARTUP", "SMB", "ENTERPRISE"] as const;

export function CompaniesAdminClient({ accessToken, initialCompanies, recruiters, metrics }: CompaniesAdminClientProps) {
  const client = useMemo(() => createApolloClient(accessToken), [accessToken]);
  const [companies, setCompanies] = useState(initialCompanies);
  const [newCompany, setNewCompany] = useState({
    recruiterId: recruiters[0]?.id ?? "",
    name: "",
    industry: "",
    size: "STARTUP" as CompanyRecord["size"],
    logoUrl: "",
    website: ""
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateCompanyLocal = (companyId: string, patch: Partial<CompanyRecord>) => {
    setCompanies((current) => current.map((company) => (company.id === companyId ? { ...company, ...patch } : company)));
  };

  const createCompany = async () => {
    setError(null);
    setMessage(null);

    try {
      const result = await client.mutate<{ createCompany: CompanyRecord }>({
        mutation: createCompanyMutation,
        variables: {
          input: {
            recruiterId: newCompany.recruiterId,
            name: newCompany.name,
            industry: newCompany.industry,
            size: newCompany.size,
            logoUrl: newCompany.logoUrl || undefined,
            website: newCompany.website || undefined
          }
        }
      });

      if (!result.data?.createCompany) {
        throw new Error("Could not create the company.");
      }

      const createdCompany = result.data.createCompany;
      setCompanies((current) => [createdCompany, ...current]);
      setNewCompany({ recruiterId: recruiters[0]?.id ?? "", name: "", industry: "", size: "STARTUP", logoUrl: "", website: "" });
      setMessage("Company created.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not create the company.");
    }
  };

  const saveCompany = async (company: CompanyRecord) => {
    setError(null);
    setMessage(null);
    setSavingId(company.id);

    try {
      const result = await client.mutate<{ updateCompany: CompanyRecord }>({
        mutation: updateCompanyMutation,
        variables: {
          id: company.id,
          input: {
            name: company.name,
            industry: company.industry,
            size: company.size,
            logoUrl: company.logoUrl || undefined,
            website: company.website || undefined
          }
        }
      });

      if (!result.data?.updateCompany) {
        throw new Error("Could not update the company.");
      }

      updateCompanyLocal(company.id, result.data.updateCompany);
      setMessage(`Saved ${company.name}.`);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not update the company.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Company management</p>
          <h3 className="text-lg font-semibold text-white mt-1">Add or edit portfolio companies</h3>
        </div>

        {message ? <p className="text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2 text-sm">{message}</p> : null}
        {error ? <p className="text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2 text-sm">{error}</p> : null}

        {recruiters.length === 0 ? (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-md p-4">
            <p className="text-sm text-amber-400">No recruiter users available. At least one recruiter user needs to exist before a company can be assigned an owner.</p>
            <Link className="text-sm text-[#EFFE5E] hover:underline mt-2 inline-block" href="/admin/users">Add recruiter users</Link>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Recruiter owner
            <select className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" value={newCompany.recruiterId} onChange={(event) => setNewCompany((current) => ({ ...current, recruiterId: event.target.value }))}>
              {recruiters.map((recruiter) => (
                <option key={recruiter.id} value={recruiter.id}>{recruiter.email}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Company name
            <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => setNewCompany((current) => ({ ...current, name: event.target.value }))} value={newCompany.name} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Industry
            <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => setNewCompany((current) => ({ ...current, industry: event.target.value }))} value={newCompany.industry} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Size
            <select className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" value={newCompany.size} onChange={(event) => setNewCompany((current) => ({ ...current, size: event.target.value as CompanyRecord["size"] }))}>
              {companySizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Website
            <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => setNewCompany((current) => ({ ...current, website: event.target.value }))} value={newCompany.website} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
            Logo URL
            <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => setNewCompany((current) => ({ ...current, logoUrl: event.target.value }))} value={newCompany.logoUrl} />
          </label>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] transition-colors" onClick={createCompany} type="button">
            Add company
          </button>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Company roster</p>
          <h3 className="text-lg font-semibold text-white mt-1">Demand and placement metrics by company</h3>
        </div>

        <div className="grid gap-4">
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Company roster</p>
              <h4 className="text-lg font-semibold text-white mt-2">No companies have been added yet</h4>
              <p className="text-sm text-[#52525B] mt-1">Company records and their demand metrics will appear here once the first portfolio company is created.</p>
            </div>
          ) : (
            companies.map((company) => {
              const metric = metrics.find((item) => item.id === company.id);

              return (
                <article className="bg-[#111111] border border-[#27272A] rounded-lg p-5 space-y-4" key={company.id}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <label className="flex flex-col gap-1 text-[#A1A1AA]">
                      Name
                      <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => updateCompanyLocal(company.id, { name: event.target.value })} value={company.name} />
                    </label>
                    <label className="flex flex-col gap-1 text-[#A1A1AA]">
                      Industry
                      <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => updateCompanyLocal(company.id, { industry: event.target.value })} value={company.industry} />
                    </label>
                    <label className="flex flex-col gap-1 text-[#A1A1AA]">
                      Size
                      <select className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" value={company.size} onChange={(event) => updateCompanyLocal(company.id, { size: event.target.value as CompanyRecord["size"] })}>
                        {companySizes.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-[#A1A1AA]">
                      Website
                      <input className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" onChange={(event) => updateCompanyLocal(company.id, { website: event.target.value })} value={company.website ?? ""} />
                    </label>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-[#52525B] text-xs">Active demands</span>
                      <p className="text-white font-medium">{metric?.activeDemandCount ?? 0}</p>
                    </div>
                    <div>
                      <span className="text-[#52525B] text-xs">Pending approvals</span>
                      <p className="text-white font-medium">{metric?.pendingApprovalsCount ?? 0}</p>
                    </div>
                    <div>
                      <span className="text-[#52525B] text-xs">Hard-to-fill</span>
                      <p className="text-white font-medium">{metric?.hardToFillCount ?? 0}</p>
                    </div>
                    <div>
                      <span className="text-[#52525B] text-xs">Placements</span>
                      <p className="text-white font-medium">{metric?.placementsCount ?? 0}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] disabled:opacity-50 transition-colors" disabled={savingId === company.id} onClick={() => saveCompany(company)} type="button">
                      {savingId === company.id ? "Saving..." : "Save company"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}