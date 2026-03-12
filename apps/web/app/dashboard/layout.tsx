import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { NavLink } from "./nav-link";
import { SignOutButton } from "./sign-out-button";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", match: "/dashboard" },
  { href: "/dashboard/roles/new", label: "Post Role", match: "/dashboard/roles/new" },
  { href: "/dashboard/roles", label: "My Roles", match: "/dashboard/roles" },
  { href: "/dashboard/search", label: "Talent Search", match: "/dashboard/search" },
  { href: "/dashboard/shortlists", label: "Shortlists", match: "/dashboard/shortlists" },
  { href: "/dashboard/interviews", label: "Interviews", match: "/dashboard/interviews" },
  { href: "/dashboard/offers", label: "Offers", match: "/dashboard/offers" },
  { href: "/dashboard/analytics", label: "Analytics", match: "/dashboard/analytics" }
] as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken || !session.user.isActive) {
    redirect("/login");
  }

  if (session.user.role !== "RECRUITER" && session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand-block">
          <a className="dashboard-brand" href="/dashboard">
            <span className="dashboard-brand-mark">ATM</span>
            <span>
              <strong>Recruiter Console</strong>
              <small>Session 9 dashboard shell</small>
            </span>
          </a>
          <p className="dashboard-sidebar-copy">
            A single surface for live roles, candidate movement, and recruiting follow-through.
          </p>
        </div>

        <nav className="dashboard-nav" aria-label="Recruiter navigation">
          {navigationItems.map((item) => (
            <NavLink href={item.href} key={item.href} label={item.label} match={item.match} />
          ))}
        </nav>

        <div className="dashboard-sidebar-footer">
          <span className="dashboard-status-pill">Authenticated via NextAuth + API JWT</span>
          <span className="dashboard-status-pill">Overall progress: 94%</span>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="eyebrow">Recruiter workspace</span>
            <h1 className="dashboard-topbar-title">Marketplace operations</h1>
          </div>
          <div className="dashboard-topbar-actions">
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