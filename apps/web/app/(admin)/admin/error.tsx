"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="dashboard-panel-card route-state-panel route-state-card-danger">
      <span className="route-state-kicker">Admin workspace error</span>
      <h2>Admin data could not be rendered</h2>
      <p>{error.message || "An admin workspace error occurred."}</p>
      <div className="route-state-actions">
        <button className="primary-link route-state-button" onClick={() => reset()} type="button">
          Retry admin page
        </button>
        <a className="secondary-link" href="/admin">
          Back to admin overview
        </a>
      </div>
    </section>
  );
}