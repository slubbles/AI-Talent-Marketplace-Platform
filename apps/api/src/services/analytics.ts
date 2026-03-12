import type { AuthUser } from "@atm/shared";
import { prisma } from "../lib/prisma.js";

type RecruiterAnalyticsPayload = {
  hiringVelocity: Array<{ label: string; averageDays: number; hires: number }>;
  openRolesByStatus: Array<{ status: string; count: number }>;
  topRequestedSkills: Array<{ skill: string; count: number }>;
  pipelineConversion: Array<{ stage: string; count: number }>;
  averageCostPerHire: number;
};

type AdminAnalyticsPayload = {
  talentPoolGrowth: Array<{ label: string; totalProfiles: number; verifiedProfiles: number; pendingProfiles: number; newProfiles: number }>;
  skillDistribution: Array<{ skill: string; count: number }>;
  supplyDemandGap: Array<{ skill: string; demandCount: number; supplyCount: number; gap: number }>;
  hiringTimelines: Array<{ company: string; averageDays: number; hires: number }>;
  demandMonitoring: Array<{ company: string; activeDemands: number; pendingApprovals: number; hardToFill: number; placements: number }>;
  resourceUtilization: {
    placedTalent: number;
    availableTalent: number;
    utilizationRate: number;
  };
  revenueMetrics: Array<{ label: string; placementFees: number; acceptedOffers: number }>;
  talentPricingTrends: Array<{ skill: string; averageRate: number }>;
  demandForecast: Array<{ skill: string; currentDemand: number; currentSupply: number; projectedDemand: number; projectedGap: number }>;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const daysBetween = (left: Date, right: Date) => Math.max(0, Math.round((right.getTime() - left.getTime()) / MS_PER_DAY));

const monthKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (value: Date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit"
  }).format(value);

const buildRecentMonths = (count: number) => {
  const now = new Date();
  const months: Array<{ key: string; label: string; start: Date; end: Date }> = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    months.push({
      key: monthKey(start),
      label: monthLabel(start),
      start,
      end
    });
  }

  return months;
};

const buildRecruiterScope = (currentUser: AuthUser) =>
  currentUser.role === "ADMIN"
    ? {}
    : {
        recruiterId: currentUser.id
      };

const feeFromRate = (hourlyRate: number) => hourlyRate * 160 * 0.15;

export const getRecruiterAnalytics = async (currentUser: AuthUser): Promise<RecruiterAnalyticsPayload> => {
  const recruiterScope = buildRecruiterScope(currentUser);
  const months = buildRecentMonths(6);

  const [demands, acceptedOffers, shortlists, interviews] = await Promise.all([
    prisma.demand.findMany({
      where: recruiterScope,
      include: {
        requiredSkills: {
          include: {
            skill: true
          }
        },
        shortlists: {
          include: {
            interviews: {
              include: {
                offer: true
              }
            }
          }
        }
      }
    }),
    prisma.offer.findMany({
      where: {
        status: "ACCEPTED",
        demand: recruiterScope
      },
      include: {
        demand: true
      }
    }),
    prisma.shortlist.findMany({
      where: {
        demand: recruiterScope
      }
    }),
    prisma.interview.findMany({
      where: {
        shortlist: {
          demand: recruiterScope
        }
      }
    })
  ]);

  const hiringVelocity = months.map((month) => {
    const monthOffers = acceptedOffers.filter((offer) => offer.updatedAt >= month.start && offer.updatedAt < month.end);
    const averageDays =
      monthOffers.length > 0
        ? Number(
            (
              monthOffers.reduce((sum, offer) => sum + daysBetween(offer.demand.createdAt, offer.updatedAt), 0) / monthOffers.length
            ).toFixed(1)
          )
        : 0;

    return {
      label: month.label,
      averageDays,
      hires: monthOffers.length
    };
  });

  const openRolesByStatus = ["DRAFT", "ACTIVE", "PAUSED", "FILLED", "CANCELLED"].map((status) => ({
    status,
    count: demands.filter((demand) => demand.status === status).length
  }));

  const requestedSkillCounts = new Map<string, number>();
  for (const demand of demands) {
    for (const skill of demand.requiredSkills) {
      requestedSkillCounts.set(skill.skill.displayName, (requestedSkillCounts.get(skill.skill.displayName) ?? 0) + 1);
    }
  }

  const topRequestedSkills = [...requestedSkillCounts.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);

  const pipelineConversion = [
    { stage: "Matches", count: shortlists.length },
    { stage: "Shortlisted", count: shortlists.filter((item) => item.status === "SHORTLISTED").length },
    { stage: "Interviewed", count: interviews.length },
    { stage: "Hired", count: acceptedOffers.length }
  ];

  const averageCostPerHire =
    acceptedOffers.length > 0
      ? Number(
          (
            acceptedOffers.reduce((sum, offer) => sum + Number(offer.hourlyRate) * 160, 0) / acceptedOffers.length
          ).toFixed(2)
        )
      : 0;

  return {
    hiringVelocity,
    openRolesByStatus,
    topRequestedSkills,
    pipelineConversion,
    averageCostPerHire
  };
};

export const getAdminAnalytics = async (): Promise<AdminAnalyticsPayload> => {
  const months = buildRecentMonths(6);

  const [profiles, demands, acceptedOffers, talentSkills] = await Promise.all([
    prisma.talentProfile.findMany({
      include: {
        skills: {
          include: {
            skill: true
          }
        }
      }
    }),
    prisma.demand.findMany({
      include: {
        company: true,
        requiredSkills: {
          include: {
            skill: true
          }
        },
        offers: true
      }
    }),
    prisma.offer.findMany({
      where: {
        status: "ACCEPTED"
      },
      include: {
        demand: {
          include: {
            company: true
          }
        }
      }
    }),
    prisma.talentSkill.findMany({
      include: {
        skill: true,
        talentProfile: true
      }
    })
  ]);

  const talentPoolGrowth = months.map((month) => {
    const profilesToDate = profiles.filter((profile) => profile.createdAt < month.end);
    const newProfiles = profiles.filter((profile) => profile.createdAt >= month.start && profile.createdAt < month.end);

    return {
      label: month.label,
      totalProfiles: profilesToDate.length,
      verifiedProfiles: profilesToDate.filter((profile) => profile.verificationStatus === "VERIFIED").length,
      pendingProfiles: profilesToDate.filter((profile) => profile.verificationStatus === "PENDING").length,
      newProfiles: newProfiles.length
    };
  });

  const skillDistributionMap = new Map<string, number>();
  for (const skill of talentSkills) {
    skillDistributionMap.set(skill.skill.displayName, (skillDistributionMap.get(skill.skill.displayName) ?? 0) + 1);
  }

  const skillDistribution = [...skillDistributionMap.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10);

  const demandSkillMap = new Map<string, number>();
  for (const demand of demands.filter((item) => item.status === "ACTIVE" || item.status === "PAUSED")) {
    for (const skill of demand.requiredSkills) {
      demandSkillMap.set(skill.skill.displayName, (demandSkillMap.get(skill.skill.displayName) ?? 0) + 1);
    }
  }

  const supplyDemandGap = [...demandSkillMap.entries()]
    .map(([skill, demandCount]) => {
      const supplyCount = skillDistributionMap.get(skill) ?? 0;
      return {
        skill,
        demandCount,
        supplyCount,
        gap: demandCount - supplyCount
      };
    })
    .sort((left, right) => right.gap - left.gap)
    .slice(0, 8);

  const companyTimelineMap = new Map<string, { totalDays: number; hires: number }>();
  for (const offer of acceptedOffers) {
    const companyName = offer.demand.company.name;
    const current = companyTimelineMap.get(companyName) ?? { totalDays: 0, hires: 0 };
    current.totalDays += daysBetween(offer.demand.createdAt, offer.updatedAt);
    current.hires += 1;
    companyTimelineMap.set(companyName, current);
  }

  const hiringTimelines = [...companyTimelineMap.entries()]
    .map(([company, totals]) => ({
      company,
      hires: totals.hires,
      averageDays: Number((totals.totalDays / totals.hires).toFixed(1))
    }))
    .sort((left, right) => right.hires - left.hires)
    .slice(0, 8);

  const demandMonitoring = demands
    .reduce<Array<{ company: string; activeDemands: number; pendingApprovals: number; hardToFill: number; placements: number }>>((items, demand) => {
      const existing = items.find((item) => item.company === demand.company.name);
      const placements = demand.offers.filter((offer) => offer.status === "ACCEPTED").length;

      if (existing) {
        existing.activeDemands += demand.status === "ACTIVE" ? 1 : 0;
        existing.pendingApprovals += demand.approvalStatus === "PENDING" ? 1 : 0;
        existing.hardToFill += demand.hardToFill ? 1 : 0;
        existing.placements += placements;
        return items;
      }

      items.push({
        company: demand.company.name,
        activeDemands: demand.status === "ACTIVE" ? 1 : 0,
        pendingApprovals: demand.approvalStatus === "PENDING" ? 1 : 0,
        hardToFill: demand.hardToFill ? 1 : 0,
        placements
      });

      return items;
    }, [])
    .sort((left, right) => right.activeDemands - left.activeDemands)
    .slice(0, 8);

  const placedTalentIds = new Set(acceptedOffers.map((offer) => offer.talentProfileId));
  const availableTalent = profiles.filter(
    (profile) => profile.verificationStatus === "VERIFIED" && profile.availability !== "NOT_AVAILABLE" && !placedTalentIds.has(profile.id)
  ).length;
  const placedTalent = placedTalentIds.size;
  const utilizationRate = profiles.length > 0 ? Number(((placedTalent / profiles.length) * 100).toFixed(1)) : 0;

  const revenueMetrics = months.map((month) => {
    const monthOffers = acceptedOffers.filter((offer) => offer.updatedAt >= month.start && offer.updatedAt < month.end);
    return {
      label: month.label,
      acceptedOffers: monthOffers.length,
      placementFees: Number(monthOffers.reduce((sum, offer) => sum + feeFromRate(Number(offer.hourlyRate)), 0).toFixed(2))
    };
  });

  const pricingAccumulator = new Map<string, { total: number; count: number }>();
  for (const skill of talentSkills) {
    const profile = skill.talentProfile;
    if (profile.hourlyRateMin == null && profile.hourlyRateMax == null) {
      continue;
    }

    const averageRate =
      profile.hourlyRateMin != null && profile.hourlyRateMax != null
        ? (Number(profile.hourlyRateMin) + Number(profile.hourlyRateMax)) / 2
        : Number(profile.hourlyRateMin ?? profile.hourlyRateMax ?? 0);

    const current = pricingAccumulator.get(skill.skill.displayName) ?? { total: 0, count: 0 };
    current.total += averageRate;
    current.count += 1;
    pricingAccumulator.set(skill.skill.displayName, current);
  }

  const talentPricingTrends = [...pricingAccumulator.entries()]
    .map(([skill, values]) => ({
      skill,
      averageRate: Number((values.total / values.count).toFixed(1))
    }))
    .sort((left, right) => right.averageRate - left.averageRate)
    .slice(0, 8);

  const demandForecast = supplyDemandGap.map((item) => {
    const projectedDemand = Math.max(item.demandCount, Math.round(item.demandCount * 1.2 + 1));
    return {
      skill: item.skill,
      currentDemand: item.demandCount,
      currentSupply: item.supplyCount,
      projectedDemand,
      projectedGap: projectedDemand - item.supplyCount
    };
  });

  return {
    talentPoolGrowth,
    skillDistribution,
    supplyDemandGap,
    hiringTimelines,
    demandMonitoring,
    resourceUtilization: {
      placedTalent,
      availableTalent,
      utilizationRate
    },
    revenueMetrics,
    talentPricingTrends,
    demandForecast
  };
};