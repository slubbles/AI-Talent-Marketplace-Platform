type EmptyStateAction = {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
};

type EmptyStateCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  accent?: "default" | "admin" | "warning";
};

export function EmptyStateCard({ eyebrow, title, description, actions = [], accent = "default" }: EmptyStateCardProps) {
  return (
    <div className={`dashboard-empty-card${accent === "admin" ? " is-admin" : ""}${accent === "warning" ? " is-warning" : ""}`}>
      <div className="dashboard-empty-card-mark" aria-hidden="true">
        <span />
      </div>
      <div className="dashboard-empty-card-copy">
        <span className="dashboard-empty-card-eyebrow">{eyebrow}</span>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      {actions.length > 0 ? (
        <div className="dashboard-empty-card-actions">
          {actions.map((action) => (
            <a className={action.tone === "secondary" ? "secondary-link" : "primary-link"} href={action.href} key={`${action.href}-${action.label}`}>
              {action.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}