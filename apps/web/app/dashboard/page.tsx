import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { graphQLRequest } from "../../lib/graphql";

type RecruiterDashboardQuery = {
  recruiterDashboard: {
    activeRolesCount: number;
    totalCandidatesInPool: number;
    interviewsThisWeek: number;
    averageTimeToShortlistDays: number;
    recentActivity: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      occurredAt: string;
      href: string | null;
    }>;
    rolesNeedingAttention: Array<{
      id: string;
      reason: string;
      shortlistCount: number;
      daysOpen: number;
      demand: {
        id: string;
        title: string;
        location: string;
        remotePolicy: string;
        company: {
          name: string;
        };
      };
    }>;
  };
};

const recruiterDashboardQuery = `#graphql
  query RecruiterDashboard {
    recruiterDashboard {
      activeRolesCount
      totalCandidatesInPool
      interviewsThisWeek
      averageTimeToShortlistDays
      recentActivity {
        id
        type
        title
        description
        occurredAt
        href
      }
      rolesNeedingAttention {
        id
        reason
        shortlistCount
        daysOpen
        demand {
          id
          title
          location
          remotePolicy
          company {
            name
          }
        }
      }
    }
  }
`;

const formatActivityDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await graphQLRequest<RecruiterDashboardQuery>(recruiterDashboardQuery, undefined, session?.accessToken);
  const dashboard = data.recruiterDashboard;
  const metrics = [
    {
      label: "Active roles",
      value: dashboard.activeRolesCount,
      detail: "Live demands currently assigned to your recruiting pipeline."
    },
    {
      label: "Candidate pool",
      value: dashboard.totalCandidatesInPool,
      detail: "Verified talent profiles currently searchable in the marketplace."
    },
    {
      label: "Interviews this week",
      value: dashboard.interviewsThisWeek,
      detail: "Scheduled conversations inside the current recruiting week."
    },
    {
      label: "Avg. time to shortlist",
      value: `${dashboard.averageTimeToShortlistDays}d`,
      detail: "Mean number of days between demand creation and first shortlist."
    }
  ];

  return (
    <div className="dashboard-grid">
      <section className="dashboard-hero dashboard-panel-card">
        <span className="eyebrow">Live recruiter overview</span>
        <h2>Welcome back, {session?.user.email}</h2>
        <p>
          This home view is now backed by recruiter-specific GraphQL data instead of a static auth placeholder.
        </p>
        <div className="dashboard-hero-actions">
          <a className="primary-link" href="/dashboard/roles/new">
            Post a new role
          </a>
          <a className="secondary-link" href="/dashboard/search">
            Open talent search
          </a>
        </div>
      </section>

      <section className="dashboard-metrics">
        {metrics.map((metric) => (
          <article className="dashboard-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-panel-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Recent activity</span>
            <h3>Last 10 recruiter events</h3>
          </div>
        </div>
        <div className="dashboard-activity-list">
          {dashboard.recentActivity.length === 0 ? (
            <p className="dashboard-empty-state">No activity yet. Post a role or generate a shortlist to populate this feed.</p>
          ) : (
            dashboard.recentActivity.map((activity) => (
              <article className="dashboard-activity-item" key={activity.id}>
                <div>
                  <span className="dashboard-activity-type">{activity.type}</span>
                  <h4>{activity.title}</h4>
                  <p>{activity.description}</p>
                </div>
                <div className="dashboard-activity-meta">
                  <time dateTime={activity.occurredAt}>{formatActivityDate(activity.occurredAt)}</time>
                  {activity.href ? <a href={activity.href}>Open</a> : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="dashboard-panel-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Attention queue</span>
            <h3>Roles needing follow-through</h3>
          </div>
        </div>
        <div className="dashboard-attention-list">
          {dashboard.rolesNeedingAttention.length === 0 ? (
            <p className="dashboard-empty-state">No active roles are currently blocked or stale.</p>
          ) : (
            dashboard.rolesNeedingAttention.map((item) => (
              <article className="dashboard-attention-item" key={item.id}>
                <div>
                  <h4>{item.demand.title}</h4>
                  <p>
                    {item.demand.company.name} • {item.demand.location} • {item.demand.remotePolicy}
                  </p>
                </div>
                <div className="dashboard-attention-meta">
                  <strong>{item.reason}</strong>
                  <span>
                    {item.shortlistCount} shortlist{item.shortlistCount === 1 ? "" : "s"} • open {item.daysOpen} days
                  </span>
                  <a href={`/dashboard/shortlists?demandId=${item.demand.id}`}>Review role</a>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}