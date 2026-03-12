import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { graphQLRequest } from "../../../lib/graphql";

type AdminDashboardQuery = {
  adminDashboard: {
    totalUsers: number;
    usersByRole: Array<{ role: string; count: number }>;
    totalTalentInPool: number;
    verifiedTalentCount: number;
    pendingTalentCount: number;
    activeDemandsCount: number;
    pendingDemandApprovalsCount: number;
    placementsThisMonth: number;
    placementFeesThisMonth: number;
    hardToFillDemandCount: number;
    pendingVerificationProfiles: Array<{
      id: string;
      firstName: string;
      lastName: string;
      headline: string;
      createdAt: string;
      user: { email: string };
    }>;
    companyMetrics: Array<{
      id: string;
      name: string;
      industry: string;
      activeDemandCount: number;
      pendingApprovalsCount: number;
      hardToFillCount: number;
      placementsCount: number;
    }>;
  };
};

const adminDashboardQuery = `#graphql
  query AdminDashboard {
    adminDashboard {
      totalUsers
      usersByRole {
        role
        count
      }
      totalTalentInPool
      verifiedTalentCount
      pendingTalentCount
      activeDemandsCount
      pendingDemandApprovalsCount
      placementsThisMonth
      placementFeesThisMonth
      hardToFillDemandCount
      pendingVerificationProfiles {
        id
        firstName
        lastName
        headline
        createdAt
        user {
          email
        }
      }
      companyMetrics {
        id
        name
        industry
        activeDemandCount
        pendingApprovalsCount
        hardToFillCount
        placementsCount
      }
    }
  }
`;

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await graphQLRequest<AdminDashboardQuery>(adminDashboardQuery, undefined, session?.accessToken);
  const dashboard = data.adminDashboard;

  const metrics = [
    { label: "Total users", value: dashboard.totalUsers, detail: dashboard.usersByRole.map((item) => `${item.role}: ${item.count}`).join(" • ") },
    { label: "Talent pool", value: dashboard.totalTalentInPool, detail: `${dashboard.verifiedTalentCount} verified • ${dashboard.pendingTalentCount} pending` },
    { label: "Active demands", value: dashboard.activeDemandsCount, detail: `${dashboard.pendingDemandApprovalsCount} waiting on approval` },
    { label: "Placements this month", value: dashboard.placementsThisMonth, detail: `${formatMoney(dashboard.placementFeesThisMonth)} estimated fees` }
  ];

  return (
    <div className="dashboard-grid admin-dashboard-grid">
      <section className="dashboard-hero dashboard-panel-card admin-hero-card">
        <span className="eyebrow">Admin dashboard</span>
        <h2>Platform health and governance</h2>
        <p>
          This surface tracks the full marketplace: user activation, pending verification work, approval bottlenecks, hard-to-fill roles,
          and portfolio-company throughput.
        </p>
        <div className="dashboard-hero-actions">
          <a className="primary-link" href="/admin/verification">
            Review verification queue
          </a>
          <a className="secondary-link" href="/admin/approvals">
            Open role approvals
          </a>
        </div>
      </section>

      <section className="dashboard-metrics">
        {metrics.map((metric) => (
          <article className="dashboard-metric-card admin-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-panel-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Verification queue</span>
            <h3>Pending talent reviews</h3>
          </div>
          <a href="/admin/verification">Open queue</a>
        </div>
        <div className="dashboard-activity-list admin-list-grid">
          {dashboard.pendingVerificationProfiles.length === 0 ? (
            <p className="dashboard-empty-state">No pending talent profiles need review right now.</p>
          ) : (
            dashboard.pendingVerificationProfiles.map((profile) => (
              <article className="dashboard-activity-item" key={profile.id}>
                <div>
                  <span className="dashboard-activity-type">PENDING</span>
                  <h4>
                    {profile.firstName} {profile.lastName}
                  </h4>
                  <p>{profile.headline}</p>
                </div>
                <div className="dashboard-activity-meta">
                  <strong>{profile.user.email}</strong>
                  <time dateTime={profile.createdAt}>Queued {formatDate(profile.createdAt)}</time>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="dashboard-panel-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Company watchlist</span>
            <h3>Portfolio company demand pressure</h3>
          </div>
          <a href="/admin/companies">Manage companies</a>
        </div>
        <div className="admin-company-metrics-grid">
          {dashboard.companyMetrics.map((company) => (
            <article className="role-list-card admin-company-metric-card" key={company.id}>
              <div className="role-list-card-header">
                <div>
                  <span className="role-status-badge">{company.industry}</span>
                  <h4>{company.name}</h4>
                </div>
              </div>
              <div className="role-list-meta-grid">
                <div>
                  <span>Active demands</span>
                  <strong>{company.activeDemandCount}</strong>
                </div>
                <div>
                  <span>Pending approvals</span>
                  <strong>{company.pendingApprovalsCount}</strong>
                </div>
                <div>
                  <span>Hard-to-fill</span>
                  <strong>{company.hardToFillCount}</strong>
                </div>
                <div>
                  <span>Placements</span>
                  <strong>{company.placementsCount}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-panel-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Concierge signal</span>
            <h3>Hard-to-fill demand coverage</h3>
          </div>
          <a href="/admin/concierge">Open concierge desk</a>
        </div>
        <p className="dashboard-empty-state admin-inline-note">
          {dashboard.hardToFillDemandCount} active demand{dashboard.hardToFillDemandCount === 1 ? "" : "s"} are currently flagged for concierge sourcing.
        </p>
      </section>
    </div>
  );
}