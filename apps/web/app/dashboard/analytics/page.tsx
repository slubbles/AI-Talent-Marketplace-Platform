import { graphQLRequest } from "../../../lib/graphql";
import { AnalyticsDashboard } from "./analytics-dashboard";

import { getSession } from "../../../lib/session";
type RecruiterAnalyticsQuery = {
  recruiterAnalytics: {
    hiringVelocity: Array<{ label: string; averageDays: number; hires: number }>;
    openRolesByStatus: Array<{ status: string; count: number }>;
    topRequestedSkills: Array<{ skill: string; count: number }>;
    pipelineConversion: Array<{ stage: string; count: number }>;
    averageCostPerHire: number;
  };
};

const recruiterAnalyticsQuery = `#graphql
  query RecruiterAnalytics {
    recruiterAnalytics {
      hiringVelocity {
        label
        averageDays
        hires
      }
      openRolesByStatus {
        status
        count
      }
      topRequestedSkills {
        skill
        count
      }
      pipelineConversion {
        stage
        count
      }
      averageCostPerHire
    }
  }
`;

export default async function AnalyticsPage() {
  const session = await getSession();
  const data = await graphQLRequest<RecruiterAnalyticsQuery>(recruiterAnalyticsQuery, undefined, session?.accessToken);

  return <AnalyticsDashboard data={data.recruiterAnalytics} />;
}