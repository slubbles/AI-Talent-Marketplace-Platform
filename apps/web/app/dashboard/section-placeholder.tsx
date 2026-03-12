type SectionPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
};

export function SectionPlaceholder({ eyebrow, title, description, nextStep }: SectionPlaceholderProps) {
  return (
    <section className="dashboard-panel-card section-placeholder">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="section-placeholder-note">
        <strong>Next session</strong>
        <span>{nextStep}</span>
      </div>
    </section>
  );
}