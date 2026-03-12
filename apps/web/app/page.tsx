const surfaces = [
  {
    title: "Recruiter Web",
    copy: "Next.js 14 App Router scaffolded for recruiter and admin route groups."
  },
  {
    title: "GraphQL API",
    copy: "Apollo Server will power all CRUD, matching, notifications, and RBAC flows."
  },
  {
    title: "AI Engine",
    copy: "FastAPI service is wired in for resume parsing, embeddings, and matching."
  },
  {
    title: "Talent Mobile",
    copy: "Expo Router app is ready for the talent registration and job feed flows."
  }
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="panel">
        <span className="eyebrow">Session 1 scaffold complete</span>
        <h1>AI Talent Marketplace Platform</h1>
        <p>
          The monorepo is now structured for web, mobile, API, shared packages, database,
          and the internal AI engine.
        </p>
        <div className="grid">
          {surfaces.map((surface) => (
            <article className="tile" key={surface.title}>
              <strong>{surface.title}</strong>
              <span>{surface.copy}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
