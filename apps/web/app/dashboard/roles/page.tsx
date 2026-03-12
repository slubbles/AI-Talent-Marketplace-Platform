import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { graphQLRequest } from "../../../lib/graphql";

const rolesQuery = `#graphql
  query RecruiterRoles($filters: DemandFiltersInput) {
    demands(filters: $filters, pagination: { first: 50 }) {
      edges {
        node {
          id
          title
          status
          location
          remotePolicy
          experienceLevel
          budgetMin
          budgetMax
          currency
          updatedAt
          company {
            id
            name
            industry
          }
          requiredSkills {
            id
            skill {
              id
              displayName
            }
          }
        }
      }
    }
  }
`;

type RolesPageProps = {
  searchParams?: {
    status?: string;
  };
};

const statusFilters = ["ALL", "DRAFT", "ACTIVE", "PAUSED", "FILLED", "CANCELLED"] as const;

const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const session = await getServerSession(authOptions);
  const activeStatus = searchParams?.status && statusFilters.includes(searchParams.status as (typeof statusFilters)[number])
    ? searchParams.status
    : "ALL";

  const data = await graphQLRequest<{
    demands: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          status: string;
          location: string;
          remotePolicy: string;
          experienceLevel: string;
          budgetMin: number | null;
          budgetMax: number | null;
          currency: string;
          updatedAt: string;
          company: {
            id: string;
            name: string;
            industry: string;
          };
          requiredSkills: Array<{
            id: string;
            skill: {
              id: string;
              displayName: string;
            };
          }>;
        };
      }>;
    };
  }>(
    rolesQuery,
    {
      filters: activeStatus === "ALL" ? undefined : { status: activeStatus }
    },
    session?.accessToken
  );

  const roles = data.demands.edges.map((edge) => edge.node);

  return (
    <section className="dashboard-panel-card roles-list-page">
      <div className="dashboard-section-heading">
        <div>
          <span className="eyebrow">My roles</span>
          <h3>Demand management queue</h3>
        </div>
        <a className="primary-link" href="/dashboard/roles/new">
          Post role
        </a>
      </div>

      <div className="roles-filter-row">
        {statusFilters.map((status) => {
          const isActive = activeStatus === status;
          const href = status === "ALL" ? "/dashboard/roles" : `/dashboard/roles?status=${status}`;
          return (
            <a className={`roles-filter-chip${isActive ? " is-active" : ""}`} href={href} key={status}>
              {status}
            </a>
          );
        })}
      </div>

      <div className="roles-list-grid">
        {roles.length === 0 ? (
          <p className="dashboard-empty-state">No roles match this filter yet.</p>
        ) : (
          roles.map((role) => (
            <article className="role-list-card" key={role.id}>
              <div className="role-list-card-header">
                <div>
                  <span className="role-status-badge">{role.status}</span>
                  <h4>{role.title}</h4>
                </div>
                <a href={`/dashboard/roles/${role.id}`}>Open role</a>
              </div>
              <p>
                {role.company.name} • {role.company.industry} • {role.location} • {role.remotePolicy}
              </p>
              <div className="role-list-meta-grid">
                <div>
                  <span>Experience</span>
                  <strong>{role.experienceLevel}</strong>
                </div>
                <div>
                  <span>Budget</span>
                  <strong>
                    {role.budgetMin && role.budgetMax
                      ? `${role.currency} ${role.budgetMin} - ${role.budgetMax}`
                      : "Not set"}
                  </strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{formatUpdatedAt(role.updatedAt)}</strong>
                </div>
              </div>
              <div className="selected-skill-list">
                {role.requiredSkills.slice(0, 5).map((skill) => (
                  <span className="selected-skill-chip is-static" key={skill.id}>
                    {skill.skill.displayName}
                  </span>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}