export default function AdminNotFound() {
  return (
    <section className="dashboard-panel-card route-state-panel admin-hero-card">
      <span className="route-state-kicker">Admin route missing</span>
      <h2>That admin page was not found</h2>
      <p>The requested governance route does not exist in the current admin console.</p>
      <div className="route-state-actions">
        <a className="primary-link" href="/admin">
          Admin overview
        </a>
        <a className="secondary-link" href="/admin/verification">
          Verification queue
        </a>
      </div>
    </section>
  );
}