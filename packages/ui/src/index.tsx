import type { ReactNode } from "react";

type SurfaceCardProps = {
  title: string;
  children: ReactNode;
};

export function SurfaceCard({ title, children }: SurfaceCardProps) {
  return (
    <section
      style={{
        borderRadius: 20,
        border: "1px solid rgba(148, 163, 184, 0.14)",
        background: "rgba(15, 23, 42, 0.82)",
        padding: 20
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
