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
    copy: "Expo Router now covers secure onboarding plus a live talent workflow with match feed, role review, interview management, offer response, notifications, and profile controls."
  }
];

const proofPoints = [
  {
    label: "Marketplace loop",
    value: "End-to-end",
    copy: "Recruiter demand, admin governance, talent onboarding, matching, interview, and offer handling already exist in one system."
  },
  {
    label: "Validation",
    value: "Smoke-backed",
    copy: "Local health, CORS, RBAC, recruiter demand creation, talent profile creation, and deep workflow verification are scripted."
  },
  {
    label: "Deployment path",
    value: "Vercel + Render + Expo",
    copy: "The repo is already structured for web, API, AI engine, and mobile deployment instead of stopping at local-only development."
  }
];

const milestones = [
  "Recruiter dashboard, role authoring, shortlists, interviews, offers, and analytics are live.",
  "Admin governance now covers verification, approvals, companies, concierge workflows, and platform analytics.",
  "Talent mobile now spans onboarding, resume parsing, profile review, match response, interview response, and offers."
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="panel landing-panel">
        <div className="landing-hero">
          <div className="landing-hero-copy">
            <span className="eyebrow">Current progress snapshot</span>
            <h1>AI Talent Marketplace Platform</h1>
            <p className="landing-lead">
              A multi-surface recruiting system that combines recruiter execution, admin governance, talent mobile workflows,
              GraphQL orchestration, and AI-assisted parsing and matching in one operating model.
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
          </div>

          <aside className="landing-proof-card">
            <span className="landing-proof-label">Current delivery</span>
            <strong>94% overall</strong>
            <p>Sessions 1 through 17 are implemented. Session 18 is locally hardened, and Session 19 documentation plus polish are complete in the repo.</p>
            <div className="landing-proof-list">
              {milestones.map((milestone) => (
                <div className="landing-proof-item" key={milestone}>
                  <span className="landing-proof-dot" aria-hidden="true" />
                  <span>{milestone}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="landing-proof-grid">
          {proofPoints.map((point) => (
            <article className="landing-metric-card" key={point.label}>
              <span>{point.label}</span>
              <strong>{point.value}</strong>
              <p>{point.copy}</p>
            </article>
          ))}
        </section>

        <section className="landing-section">
          <div className="landing-section-heading">
            <h2>Product surfaces</h2>
            <p>Each surface is built against the same marketplace data model instead of behaving like a disconnected demo.</p>
          </div>
          <div className="grid">
            {surfaces.map((surface) => (
              <article className="tile landing-tile" key={surface.title}>
                <strong>{surface.title}</strong>
                <span>{surface.copy}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section-split">
          <div className="landing-section-heading">
            <h2>What is left</h2>
            <p>The main unresolved work is no longer feature coverage. It is external deployment completion and live verification.</p>
          </div>
          <div className="landing-next-card">
            <span>Remaining blockers</span>
            <strong>Hosted setup and live URLs</strong>
            <p>Vercel, Render, and Expo EAS scaffolding are already committed. The remaining gap is entering production environment values and validating the deployed flow.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
