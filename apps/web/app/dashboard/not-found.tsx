export default function DashboardNotFound() {
  return (
    <section className="dashboard-panel-card route-state-panel">
      <span className="route-state-kicker">Recruiter route missing</span>
      <h2>That recruiter page was not found</h2>
      <p>The requested dashboard route is missing or no longer matches the active workflow paths.</p>
      <div className="route-state-actions">
        <a className="primary-link" href="/dashboard">
          Dashboard overview
        </a>
        <a className="secondary-link" href="/dashboard/roles">
          View roles
        </a>
      </div>
    </section>
  );
}