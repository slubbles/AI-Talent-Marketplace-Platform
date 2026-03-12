import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { graphQLRequest } from "../../../lib/graphql";

const demandQueueQuery = `#graphql
  query InterviewDemandQueue {
    myDemands(pagination: { first: 30 }) {
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
        }
      }
    }
  }
`;

const demandPipelineQuery = `#graphql
  query InterviewDemandPipeline($demandId: ID!) {
    shortlist(demandId: $demandId) {
      id
      talentProfile {
        id
        firstName
        lastName
        headline
      }
      interviews {
        id
        shortlistId
        scheduledAt
        duration
        status
        meetingUrl
        feedback
        rating
        createdAt
        updatedAt
        offer {
          id
          status
        }
      }
    }
  }
`;

type InterviewsPageProps = {
  searchParams?: {
    status?: string;
  };
};

const statusFilters = ["ALL", "SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export default async function InterviewsPage({ searchParams }: InterviewsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    redirect("/login");
  }

  const activeStatus = searchParams?.status && statusFilters.includes(searchParams.status as (typeof statusFilters)[number])
    ? searchParams.status
    : "ALL";

  const demandData = await graphQLRequest<{
    myDemands: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          status: string;
          location: string;
          remotePolicy: string;
          company: {
            id: string;
            name: string;
            industry: string;
            size: string;
          };
        };
      }>;
    };
  }>(demandQueueQuery, undefined, session.accessToken);

  const demands = demandData.myDemands.edges.map((edge) => edge.node);
  const pipelines = await Promise.all(
    demands.map((demand) => graphQLRequest<{ shortlist: Array<{ id: string; talentProfile: { id: string; firstName: string; lastName: string; headline: string }; interviews: Array<{ id: string; shortlistId?: string; scheduledAt: string; duration: number; status: string; meetingUrl: string | null; feedback: string | null; rating: number | null; createdAt: string; updatedAt: string; offer?: { id: string; status: string } | null }> }> }>(demandPipelineQuery, { demandId: demand.id }, session.accessToken))
  );

  const interviews = demands.flatMap((demand, demandIndex) =>
    (pipelines[demandIndex]?.shortlist ?? []).flatMap((entry) =>
      entry.interviews.map((interview) => ({
        ...interview,
        candidateName: `${entry.talentProfile.firstName} ${entry.talentProfile.lastName}`,
        candidateHeadline: entry.talentProfile.headline,
        demandId: demand.id,
        demandTitle: demand.title,
        companyName: demand.company.name,
        companyIndustry: demand.company.industry
      }))
    )
  );

  const visibleInterviews = interviews
    .filter((interview) => activeStatus === "ALL" || interview.status === activeStatus)
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime());

  return (
    <div className="dashboard-grid">
      <section className="dashboard-panel-card pipeline-overview-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Interviews</span>
            <h3>Recruiter interview operations</h3>
          </div>
        </div>

        <div className="dashboard-metrics shortlist-overview-metrics">
          <div className="dashboard-metric-card">
            <span>Scheduled</span>
            <strong>{interviews.filter((item) => item.status === "SCHEDULED").length}</strong>
            <p>Upcoming sessions waiting on recruiter or candidate action.</p>
          </div>
          <div className="dashboard-metric-card">
            <span>Completed</span>
            <strong>{interviews.filter((item) => item.status === "COMPLETED").length}</strong>
            <p>Sessions with feedback submitted or marked complete.</p>
          </div>
          <div className="dashboard-metric-card">
            <span>Offers linked</span>
            <strong>{interviews.filter((item) => item.offer).length}</strong>
            <p>Interviews that already advanced into the offer stage.</p>
          </div>
        </div>

        <div className="roles-filter-row">
          {statusFilters.map((status) => {
            const isActive = activeStatus === status;
            const href = status === "ALL" ? "/dashboard/interviews" : `/dashboard/interviews?status=${status}`;
            return (
              <a className={`roles-filter-chip${isActive ? " is-active" : ""}`} href={href} key={status}>
                {status}
              </a>
            );
          })}
        </div>
      </section>

      <section className="dashboard-panel-card">
        <div className="pipeline-list-grid">
          {visibleInterviews.length === 0 ? (
            <p className="dashboard-empty-state">No interviews match this status yet.</p>
          ) : (
            visibleInterviews.map((interview) => (
              <article className="pipeline-card" key={interview.id}>
                <div className="role-list-card-header">
                  <div>
                    <span className="role-status-badge">{interview.status}</span>
                    <h4>{interview.candidateName}</h4>
                  </div>
                  <a href={`/dashboard/interviews/${interview.demandId}/${interview.id}`}>Open interview</a>
                </div>
                <p>{interview.candidateHeadline}</p>
                <div className="shortlist-meta-grid">
                  <div>
                    <span>Role</span>
                    <strong>{interview.demandTitle}</strong>
                  </div>
                  <div>
                    <span>Company</span>
                    <strong>{interview.companyName}</strong>
                  </div>
                  <div>
                    <span>Scheduled</span>
                    <strong>{formatDateTime(interview.scheduledAt)}</strong>
                  </div>
                  <div>
                    <span>Duration</span>
                    <strong>{interview.duration} min</strong>
                  </div>
                </div>
                <p>
                  {interview.companyIndustry} • {interview.offer ? `Offer: ${interview.offer.status}` : "No offer drafted yet"}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}