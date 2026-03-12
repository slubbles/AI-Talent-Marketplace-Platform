export default function RootNotFound() {
  return (
    <main className="route-state-shell">
      <section className="route-state-card">
        <span className="route-state-kicker">Not found</span>
        <h1>This page does not exist</h1>
        <p>The route you requested is outside the current recruiter, admin, or public application surface.</p>
        <div className="route-state-actions">
          <a className="primary-link" href="/">
            Go to landing page
          </a>
          <a className="secondary-link" href="/dashboard">
            Open dashboard
          </a>
        </div>
      </section>
    </main>
  );
}