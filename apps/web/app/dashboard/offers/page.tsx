import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { graphQLRequest } from "../../../lib/graphql";

const demandQueueQuery = `#graphql
  query OfferDemandQueue {
    myDemands(pagination: { first: 30 }) {
      edges {
        node {
          id
          title
          status
          location
          remotePolicy
          currency
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
  query OfferDemandPipeline($demandId: ID!) {
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
        offer {
          id
          interviewId
          demandId
          talentProfileId
          hourlyRate
          startDate
          endDate
          terms
          status
          createdAt
          updatedAt
          talentProfile {
            id
            firstName
            lastName
          }
        }
      }
    }
  }
`;

type OffersPageProps = {
  searchParams?: {
    status?: string;
  };
};

const statusFilters = ["ALL", "DRAFT", "SENT", "ACCEPTED", "DECLINED", "WITHDRAWN"] as const;

export default async function OffersPage({ searchParams }: OffersPageProps) {
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
          currency: string;
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
    demands.map((demand) => graphQLRequest<{ shortlist: Array<{ id: string; talentProfile: { id: string; firstName: string; lastName: string; headline: string }; interviews: Array<{ id: string; offer?: { id: string; interviewId: string; demandId: string; talentProfileId: string; hourlyRate: number; startDate: string; endDate: string | null; terms: string; status: string; createdAt: string; updatedAt: string; talentProfile: { id: string; firstName: string; lastName: string } } | null }> }> }>(demandPipelineQuery, { demandId: demand.id }, session.accessToken))
  );

  const offers = demands.flatMap((demand, demandIndex) =>
    (pipelines[demandIndex]?.shortlist ?? []).flatMap((entry) =>
      entry.interviews.flatMap((interview) =>
        interview.offer
          ? [{
              ...interview.offer,
              candidateName: `${entry.talentProfile.firstName} ${entry.talentProfile.lastName}`,
              candidateHeadline: entry.talentProfile.headline,
              demandTitle: demand.title,
              demandId: demand.id,
              companyName: demand.company.name,
              currency: demand.currency
            }]
          : []
      )
    )
  );

  const visibleOffers = offers.filter((offer) => activeStatus === "ALL" || offer.status === activeStatus);

  return (
    <div className="dashboard-grid">
      <section className="dashboard-panel-card pipeline-overview-card">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Offers</span>
            <h3>Recruiter offer pipeline</h3>
          </div>
        </div>

        <div className="dashboard-metrics shortlist-overview-metrics">
          <div className="dashboard-metric-card">
            <span>Drafts</span>
            <strong>{offers.filter((item) => item.status === "DRAFT").length}</strong>
            <p>Offers that still need recruiter review before sending.</p>
          </div>
          <div className="dashboard-metric-card">
            <span>Sent</span>
            <strong>{offers.filter((item) => item.status === "SENT").length}</strong>
            <p>Offers visible to talent and waiting on a decision.</p>
          </div>
          <div className="dashboard-metric-card">
            <span>Accepted</span>
            <strong>{offers.filter((item) => item.status === "ACCEPTED").length}</strong>
            <p>Offers ready for contract generation and onboarding.</p>
          </div>
        </div>

        <div className="roles-filter-row">
          {statusFilters.map((status) => {
            const isActive = activeStatus === status;
            const href = status === "ALL" ? "/dashboard/offers" : `/dashboard/offers?status=${status}`;
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
          {visibleOffers.length === 0 ? (
            <p className="dashboard-empty-state">No offers match this status yet.</p>
          ) : (
            visibleOffers.map((offer) => (
              <article className="pipeline-card" key={offer.id}>
                <div className="role-list-card-header">
                  <div>
                    <span className="role-status-badge">{offer.status}</span>
                    <h4>{offer.candidateName}</h4>
                  </div>
                  <a href={`/dashboard/offers/${offer.demandId}/${offer.id}`}>Open offer</a>
                </div>
                <p>{offer.candidateHeadline}</p>
                <div className="shortlist-meta-grid">
                  <div>
                    <span>Role</span>
                    <strong>{offer.demandTitle}</strong>
                  </div>
                  <div>
                    <span>Company</span>
                    <strong>{offer.companyName}</strong>
                  </div>
                  <div>
                    <span>Rate</span>
                    <strong>{offer.hourlyRate} {offer.currency}/hr</strong>
                  </div>
                  <div>
                    <span>Start</span>
                    <strong>{new Date(offer.startDate).toLocaleDateString()}</strong>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}