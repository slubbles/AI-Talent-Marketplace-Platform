"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { createApolloClient } from "../../../../lib/apollo-client";
import { EmptyStateCard } from "../../../dashboard/empty-state-card";

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
    <div className="dashboard-grid admin-dashboard-grid">
      <section className="dashboard-panel-card admin-page-stack">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Company management</span>
            <h3>Add or edit portfolio companies</h3>
          </div>
        </div>

        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {recruiters.length === 0 ? (
          <EmptyStateCard
            accent="admin"
            actions={[{ href: "/admin/users", label: "Add recruiter users" }]}
            description="At least one recruiter user needs to exist before a company can be assigned an owner."
            eyebrow="Recruiter owners"
            title="No recruiter users available"
          />
        ) : null}

        <div className="admin-form-grid">
          <label>
            Recruiter owner
            <select value={newCompany.recruiterId} onChange={(event) => setNewCompany((current) => ({ ...current, recruiterId: event.target.value }))}>
              {recruiters.map((recruiter) => (
                <option key={recruiter.id} value={recruiter.id}>
                  {recruiter.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Company name
            <input onChange={(event) => setNewCompany((current) => ({ ...current, name: event.target.value }))} value={newCompany.name} />
          </label>
          <label>
            Industry
            <input onChange={(event) => setNewCompany((current) => ({ ...current, industry: event.target.value }))} value={newCompany.industry} />
          </label>
          <label>
            Size
            <select value={newCompany.size} onChange={(event) => setNewCompany((current) => ({ ...current, size: event.target.value as CompanyRecord["size"] }))}>
              {companySizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <label>
            Website
            <input onChange={(event) => setNewCompany((current) => ({ ...current, website: event.target.value }))} value={newCompany.website} />
          </label>
          <label>
            Logo URL
            <input onChange={(event) => setNewCompany((current) => ({ ...current, logoUrl: event.target.value }))} value={newCompany.logoUrl} />
          </label>
        </div>

        <div className="admin-inline-actions">
          <button className="primary-link" onClick={createCompany} type="button">
            Add company
          </button>
        </div>
      </section>

      <section className="dashboard-panel-card admin-page-stack">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Company roster</span>
            <h3>Demand and placement metrics by company</h3>
          </div>
        </div>

        <div className="admin-card-grid">
          {companies.length === 0 ? (
            <EmptyStateCard
              accent="admin"
              description="Company records and their demand metrics will appear here once the first portfolio company is created."
              eyebrow="Company roster"
              title="No companies have been added yet"
            />
          ) : (
            companies.map((company) => {
              const metric = metrics.find((item) => item.id === company.id);

              return (
                <article className="role-list-card admin-company-card" key={company.id}>
                  <div className="admin-form-grid compact">
                    <label>
                      Name
                      <input onChange={(event) => updateCompanyLocal(company.id, { name: event.target.value })} value={company.name} />
                    </label>
                    <label>
                      Industry
                      <input onChange={(event) => updateCompanyLocal(company.id, { industry: event.target.value })} value={company.industry} />
                    </label>
                    <label>
                      Size
                      <select value={company.size} onChange={(event) => updateCompanyLocal(company.id, { size: event.target.value as CompanyRecord["size"] })}>
                        {companySizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Website
                      <input onChange={(event) => updateCompanyLocal(company.id, { website: event.target.value })} value={company.website ?? ""} />
                    </label>
                  </div>

                  <div className="role-list-meta-grid">
                    <div>
                      <span>Active demands</span>
                      <strong>{metric?.activeDemandCount ?? 0}</strong>
                    </div>
                    <div>
                      <span>Pending approvals</span>
                      <strong>{metric?.pendingApprovalsCount ?? 0}</strong>
                    </div>
                    <div>
                      <span>Hard-to-fill</span>
                      <strong>{metric?.hardToFillCount ?? 0}</strong>
                    </div>
                    <div>
                      <span>Placements</span>
                      <strong>{metric?.placementsCount ?? 0}</strong>
                    </div>
                  </div>

                  <div className="admin-inline-actions">
                    <button className="primary-link" disabled={savingId === company.id} onClick={() => saveCompany(company)} type="button">
                      {savingId === company.id ? "Saving..." : "Save company"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}