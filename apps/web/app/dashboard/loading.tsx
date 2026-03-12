export default function DashboardLoading() {
  return (
    <section className="dashboard-panel-card route-state-panel">
      <span className="route-state-kicker">Recruiter workspace</span>
      <div className="route-state-spinner" aria-hidden="true" />
      <h2>Loading recruiter operations</h2>
      <p>Pulling roles, shortlists, interviews, offers, and analytics into the dashboard.</p>
    </section>
  );
}