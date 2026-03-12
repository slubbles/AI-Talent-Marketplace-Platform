"use client";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="route-state-shell">
      <section className="route-state-card route-state-card-danger">
        <span className="route-state-kicker">Application error</span>
        <h1>Something broke while rendering this surface</h1>
        <p>{error.message || "An unexpected rendering error occurred."}</p>
        <div className="route-state-actions">
          <button className="primary-link route-state-button" onClick={() => reset()} type="button">
            Try again
          </button>
          <a className="secondary-link" href="/">
            Return home
          </a>
        </div>
      </section>
    </main>
  );
}