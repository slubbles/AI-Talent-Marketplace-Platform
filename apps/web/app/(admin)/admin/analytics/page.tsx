import { graphQLRequest } from "../../../../lib/graphql";
import { AnalyticsOverview } from "./analytics-overview";

import { getSession } from "../../../../lib/session";
type AdminAnalyticsQuery = {
  adminAnalytics: {
    talentPoolGrowth: Array<{ label: string; totalProfiles: number; verifiedProfiles: number; pendingProfiles: number; newProfiles: number }>;
    skillDistribution: Array<{ skill: string; count: number }>;
    supplyDemandGap: Array<{ skill: string; demandCount: number; supplyCount: number; gap: number }>;
    hiringTimelines: Array<{ company: string; averageDays: number; hires: number }>;
    demandMonitoring: Array<{ company: string; activeDemands: number; pendingApprovals: number; hardToFill: number; placements: number }>;
    resourceUtilization: { placedTalent: number; availableTalent: number; utilizationRate: number };
    revenueMetrics: Array<{ label: string; placementFees: number; acceptedOffers: number }>;
    talentPricingTrends: Array<{ skill: string; averageRate: number }>;
    demandForecast: Array<{ skill: string; currentDemand: number; currentSupply: number; projectedDemand: number; projectedGap: number }>;
  };
};

const adminAnalyticsQuery = `#graphql
  query AdminAnalytics {
    adminAnalytics {
      talentPoolGrowth {
        label
        totalProfiles
        verifiedProfiles
        pendingProfiles
        newProfiles
      }
      skillDistribution {
        skill
        count
      }
      supplyDemandGap {
        skill
        demandCount
        supplyCount
        gap
      }
      hiringTimelines {
        company
        averageDays
        hires
      }
      demandMonitoring {
        company
        activeDemands
        pendingApprovals
        hardToFill
        placements
      }
      resourceUtilization {
        placedTalent
        availableTalent
        utilizationRate
      }
      revenueMetrics {
        label
        placementFees
        acceptedOffers
      }
      talentPricingTrends {
        skill
        averageRate
      }
      demandForecast {
        skill
        currentDemand
        currentSupply
        projectedDemand
        projectedGap
      }
    }
  }
`;

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  const data = await graphQLRequest<AdminAnalyticsQuery>(adminAnalyticsQuery, undefined, session?.accessToken);

  return <AnalyticsOverview data={data.adminAnalytics} />;
}