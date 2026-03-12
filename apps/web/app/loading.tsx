export default function RootLoading() {
  return (
    <main className="route-state-shell">
      <section className="route-state-card route-state-card-muted">
        <span className="route-state-kicker">Loading</span>
        <div className="route-state-spinner" aria-hidden="true" />
        <h1>Preparing the platform workspace</h1>
        <p>Loading the recruiter, admin, and marketplace context for this route.</p>
      </section>
    </main>
  );
}