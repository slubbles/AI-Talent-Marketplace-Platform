import Link from "next/link";
import type { Route } from "next";

const surfaces = [
  {
    title: "Recruiter Web",
    copy: "The recruiter web now supports role creation, shortlisting, semantic search, interview operations, offer drafting, accepted-offer onboarding, and live analytics for hiring performance."
  },
  {
    title: "Admin Console",
    copy: "Admin routes now handle user activation, talent verification, company oversight, role approvals, concierge/headhunter sourcing workflows, and platform analytics."
  },
  {
    title: "GraphQL API",
    copy: "Apollo now exposes recruiter dashboard data, admin governance queries, analytics aggregations, approval workflows, concierge/headhunter submissions, and generated document storage for contract artifacts."
  },
  {
    title: "AI Engine",
    copy: "FastAPI service is wired in for resume parsing, embeddings, and matching."
  },
  {
    title: "Talent Mobile",
    copy: "Expo Router app is ready for the talent registration and job feed flows."
  }
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="panel">
        <span className="eyebrow">Session 15 analytics platform complete</span>
        <h1>AI Talent Marketplace Platform</h1>
        <p>
          The platform now covers recruiter operations from demand creation through offer management, adds a dedicated admin console for governance and concierge sourcing, and ships recruiter plus admin analytics dashboards for reporting and demand forecasting.
        </p>
        <div className="dashboard-actions">
          <Link className="primary-link" href={"/dashboard" as Route}>
            Open recruiter dashboard
          </Link>
          <Link className="secondary-link" href={"/admin" as Route}>
            Open admin console
          </Link>
          <Link className="secondary-link" href={"/register" as Route}>
            Create recruiter account
          </Link>
        </div>
        <div className="grid">
          {surfaces.map((surface) => (
            <article className="tile" key={surface.title}>
              <strong>{surface.title}</strong>
              <span>{surface.copy}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
