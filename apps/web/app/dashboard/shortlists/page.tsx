import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { graphQLRequest } from "../../../lib/graphql";
import { ShortlistWorkbench } from "./shortlist-workbench";
import type { ShortlistDemandSummary, ShortlistEntry } from "./types";

const shortlistOverviewQuery = `#graphql
  query ShortlistsOverview {
    myDemands(pagination: { first: 12 }) {
      edges {
        node {
          id
          title
          status
          location
          remotePolicy
          company {
            id
            name
            industry
            size
          }
          requiredSkills {
            id
            isRequired
            minimumYears
            skill {
              id
              name
              displayName
              category
            }
          }
        }
      }
    }
  }
`;

const shortlistDetailQuery = `#graphql
  query ShortlistDetail($demandId: ID!) {
    shortlist(demandId: $demandId) {
      id
      demandId
      talentProfileId
      matchScore
      scoreBreakdown
      aiExplanation
      status
      talentStatus
      talentProfile {
        id
        firstName
        lastName
        headline
        summary
        careerTrajectory
        availability
        availableFrom
        hourlyRateMin
        hourlyRateMax
        currency
        locationPreferences
        workVisaEligibility
        portfolioUrls
        verificationStatus
        skills {
          id
          proficiency
          yearsOfExperience
          skill {
            id
            name
            displayName
            category
          }
        }
        experiences {
          id
          title
          companyName
          location
          startDate
          endDate
          isCurrent
          description
        }
        certifications {
          id
          name
          issuer
          issueDate
          expirationDate
          credentialUrl
        }
        educationEntries {
          id
          institution
          degree
          fieldOfStudy
          startDate
          endDate
          description
        }
      }
      interviews {
        id
        shortlistId
        scheduledAt
        duration
        status
        meetingUrl
        offer {
          id
          hourlyRate
          startDate
          status
          talentProfile {
            firstName
            lastName
          }
        }
      }
    }
  }
`;

type ShortlistsPageProps = {
  searchParams?: {
    demandId?: string;
  };
};

export default async function ShortlistsPage({ searchParams }: ShortlistsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    redirect("/login");
  }

  const roleData = await graphQLRequest<{
    myDemands: {
      edges: Array<{ node: ShortlistDemandSummary }>;
    };
  }>(shortlistOverviewQuery, undefined, session.accessToken);

  const roles = roleData.myDemands.edges.map((edge) => edge.node);

  if (roles.length === 0) {
    return (
      <section className="dashboard-panel-card section-placeholder">
        <span className="eyebrow">Shortlists</span>
        <h2>No role shortlists yet</h2>
        <p>Create a role and trigger AI matching to populate this review queue.</p>
      </section>
    );
  }

  const shortlistResults = await Promise.all(
    roles.map((role) => graphQLRequest<{ shortlist: ShortlistEntry[] }>(shortlistDetailQuery, { demandId: role.id }, session.accessToken))
  );

  const roleQueues = roles.map((role, index) => ({
    ...role,
    shortlist: shortlistResults[index]?.shortlist ?? []
  }));

  const activeQueue = roleQueues.find((role) => role.id === searchParams?.demandId) ?? roleQueues[0];
  const totalCandidates = roleQueues.reduce((sum, role) => sum + role.shortlist.length, 0);
  const totalShortlisted = roleQueues.reduce((sum, role) => sum + role.shortlist.filter((item) => item.status === "SHORTLISTED").length, 0);

  return (
    <div className="dashboard-grid">
      <section className="dashboard-panel-card shortlist-overview-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Shortlists</span>
            <h3>Recruiter candidate review queue</h3>
          </div>
          <a className="primary-link" href={`/dashboard/roles/${activeQueue.id}`}>
            Open role detail
          </a>
        </div>

        <div className="dashboard-metrics shortlist-overview-metrics">
          <div className="dashboard-metric-card">
            <span>Roles with AI matches</span>
            <strong>{roleQueues.length}</strong>
            <p>Demand pipelines available for recruiter review.</p>
          </div>
          <div className="dashboard-metric-card">
            <span>Visible candidates</span>
            <strong>{totalCandidates}</strong>
            <p>Total AI-ranked profiles across active recruiter roles.</p>
          </div>
          <div className="dashboard-metric-card">
            <span>Shortlisted</span>
            <strong>{totalShortlisted}</strong>
            <p>Candidates already promoted to the live shortlist stage.</p>
          </div>
        </div>

        <div className="roles-filter-row">
          {roleQueues.map((role) => {
            const isActive = role.id === activeQueue.id;
            return (
              <a className={`roles-filter-chip${isActive ? " is-active" : ""}`} href={`/dashboard/shortlists?demandId=${role.id}`} key={role.id}>
                {role.title} ({role.shortlist.length})
              </a>
            );
          })}
        </div>
      </section>

      <section className="dashboard-panel-card shortlist-role-summary">
        <div className="role-list-card-header">
          <div>
            <span className="role-status-badge">{activeQueue.status}</span>
            <h4>{activeQueue.title}</h4>
          </div>
          <div className="dashboard-attention-meta">
            <strong>{activeQueue.company.name}</strong>
            <span>
              {activeQueue.location} • {activeQueue.remotePolicy}
            </span>
          </div>
        </div>

        <div className="selected-skill-list">
          {activeQueue.requiredSkills.map((skill) => (
            <span className="selected-skill-chip is-static" key={skill.id}>
              {skill.skill.displayName}
            </span>
          ))}
        </div>
      </section>

      <section className="dashboard-panel-card">
        <ShortlistWorkbench
          accessToken={session.accessToken}
          demandId={activeQueue.id}
          demandTitle={activeQueue.title}
          requiredSkillNames={activeQueue.requiredSkills.map((skill) => skill.skill.displayName)}
          shortlist={activeQueue.shortlist}
        />
      </section>
    </div>
  );
}