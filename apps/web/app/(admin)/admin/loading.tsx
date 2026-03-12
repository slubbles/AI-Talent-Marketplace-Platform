export default function AdminLoading() {
  return (
    <section className="dashboard-panel-card route-state-panel admin-hero-card">
      <span className="route-state-kicker">Admin workspace</span>
      <div className="route-state-spinner" aria-hidden="true" />
      <h2>Loading governance workflows</h2>
      <p>Preparing approvals, verification queues, company oversight, concierge operations, and platform analytics.</p>
    </section>
  );
}