"use client";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="dashboard-panel-card route-state-panel route-state-card-danger">
      <span className="route-state-kicker">Recruiter workspace error</span>
      <h2>Dashboard data could not be loaded</h2>
      <p>{error.message || "A recruiter workspace error occurred."}</p>
      <div className="route-state-actions">
        <button className="primary-link route-state-button" onClick={() => reset()} type="button">
          Retry dashboard
        </button>
        <a className="secondary-link" href="/dashboard">
          Back to dashboard home
        </a>
      </div>
    </section>
  );
}