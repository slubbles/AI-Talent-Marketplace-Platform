import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { NavLink } from "../../dashboard/nav-link";
import { SignOutButton } from "../../dashboard/sign-out-button";

const navigationItems = [
  { href: "/admin", label: "Overview", match: "/admin" },
  { href: "/admin/analytics", label: "Analytics", match: "/admin/analytics" },
  { href: "/admin/users", label: "Users", match: "/admin/users" },
  { href: "/admin/verification", label: "Verification", match: "/admin/verification" },
  { href: "/admin/companies", label: "Companies", match: "/admin/companies" },
  { href: "/admin/approvals", label: "Role Approvals", match: "/admin/approvals" },
  { href: "/admin/concierge", label: "Concierge", match: "/admin/concierge" }
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken || !session.user.isActive) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="dashboard-shell admin-shell">
      <aside className="dashboard-sidebar admin-sidebar">
        <div className="dashboard-brand-block">
          <a className="dashboard-brand" href="/admin">
            <span className="dashboard-brand-mark admin-brand-mark">ATM</span>
            <span>
              <strong>Admin Console</strong>
              <small>Session 14 governance surface</small>
            </span>
          </a>
          <p className="dashboard-sidebar-copy">
            Verification, approvals, portfolio company oversight, and concierge operations in one admin-only route group.
          </p>
        </div>

        <nav className="dashboard-nav" aria-label="Admin navigation">
          {navigationItems.map((item) => (
            <NavLink href={item.href} key={item.href} label={item.label} match={item.match} />
          ))}
        </nav>

        <div className="dashboard-sidebar-footer">
          <span className="dashboard-status-pill">Admin RBAC enforced</span>
          <span className="dashboard-status-pill">Approval + verification workflows live</span>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="eyebrow">Platform administration</span>
            <h1 className="dashboard-topbar-title">Governance and operations</h1>
          </div>
          <div className="dashboard-topbar-actions">
            <a className="secondary-link" href="/dashboard">
              Recruiter console
            </a>
            <div className="dashboard-user-chip">
              <strong>{session.user.email}</strong>
              <small>{session.user.role}</small>
            </div>
            <SignOutButton />
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}