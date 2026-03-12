import type { AuthUser } from "@atm/shared";
import { prisma } from "../lib/prisma.js";

type DashboardActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  occurredAt: string;
  href: string | null;
};

type RoleNeedingAttention = {
  id: string;
  reason: string;
  shortlistCount: number;
  daysOpen: number;
  demand: unknown;
};

type RecruiterDashboardPayload = {
  activeRolesCount: number;
  totalCandidatesInPool: number;
  interviewsThisWeek: number;
  averageTimeToShortlistDays: number;
  recentActivity: DashboardActivityItem[];
  rolesNeedingAttention: RoleNeedingAttention[];
};

type AdminDashboardPayload = {
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
    user: {
      email: string;
    };
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

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const startOfWeek = (value: Date) => {
  const next = new Date(value);
  const day = next.getDay();
  const distance = day === 0 ? 6 : day - 1;
  next.setDate(next.getDate() - distance);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfWeek = (value: Date) => {
  const next = startOfWeek(value);
  next.setDate(next.getDate() + 7);
  return next;
};

const daysBetween = (left: Date, right: Date) => Math.max(0, Math.round((right.getTime() - left.getTime()) / MS_PER_DAY));

const buildRecruiterScope = (currentUser: AuthUser) =>
  currentUser.role === "ADMIN"
    ? {}
    : {
        recruiterId: currentUser.id
      };

export const getRecruiterDashboard = async (currentUser: AuthUser): Promise<RecruiterDashboardPayload> => {
  const recruiterScope = buildRecruiterScope(currentUser);
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const [activeRolesCount, totalCandidatesInPool, interviewsThisWeek, demands, shortlists, interviews, offers, notifications] =
    await Promise.all([
      prisma.demand.count({
        where: {
          ...recruiterScope,
          status: "ACTIVE"
        }
      }),
      prisma.talentProfile.count({
        where: {
          verificationStatus: "VERIFIED"
        }
      }),
      prisma.interview.count({
        where: {
          scheduledAt: {
            gte: weekStart,
            lt: weekEnd
          },
          shortlist: {
            demand: recruiterScope
          }
        }
      }),
      prisma.demand.findMany({
        where: recruiterScope,
        include: {
          company: true,
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
            },
            orderBy: {
              createdAt: "asc"
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.shortlist.findMany({
        where: {
          demand: recruiterScope
        },
        include: {
          demand: true,
          talentProfile: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 6
      }),
      prisma.interview.findMany({
        where: {
          shortlist: {
            demand: recruiterScope
          }
        },
        include: {
          shortlist: {
            include: {
              demand: true,
              talentProfile: true
            }
          }
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 6
      }),
      prisma.offer.findMany({
        where: {
          demand: recruiterScope
        },
        include: {
          demand: true,
          talentProfile: true
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 6
      }),
      prisma.notification.findMany({
        where: currentUser.role === "ADMIN" ? undefined : { userId: currentUser.id },
        orderBy: {
          createdAt: "desc"
        },
        take: 6
      })
    ]);

  const shortlistDurations = demands
    .filter((demand) => demand.shortlists.length > 0)
    .map((demand) => daysBetween(demand.createdAt, demand.shortlists[0].createdAt));

  const averageTimeToShortlistDays =
    shortlistDurations.length > 0
      ? Number((shortlistDurations.reduce((sum, value) => sum + value, 0) / shortlistDurations.length).toFixed(1))
      : 0;

  const rolesNeedingAttention = demands
    .filter((demand) => demand.status === "ACTIVE")
    .reduce<RoleNeedingAttention[]>((items, demand) => {
      const daysOpen = daysBetween(demand.createdAt, now);
      const shortlistCount = demand.shortlists.length;
      const interviewCount = demand.shortlists.reduce((sum, shortlist) => sum + shortlist.interviews.length, 0);
      const reviewedCount = demand.shortlists.filter((shortlist) => shortlist.status !== "AI_SUGGESTED").length;

      let reason: string | null = null;
      if (shortlistCount === 0) {
        reason = "No shortlist generated yet";
      } else if (reviewedCount === 0) {
        reason = "Candidates are waiting for recruiter review";
      } else if (interviewCount === 0 && daysOpen >= 7) {
        reason = `Open for ${daysOpen} days without interview activity`;
      }

      if (reason) {
        items.push({
          id: demand.id,
          reason,
          shortlistCount,
          daysOpen,
          demand
        });
      }

      return items;
    }, [])
    .slice(0, 4);

  const recentActivity = [
    ...shortlists.map((shortlist) => ({
      id: `shortlist:${shortlist.id}`,
      type: "SHORTLIST",
      title: `${shortlist.talentProfile.firstName} ${shortlist.talentProfile.lastName} matched to ${shortlist.demand.title}`,
      description: `AI scored this match at ${Number(shortlist.matchScore).toFixed(0)} for ${shortlist.demand.title}.`,
      occurredAt: shortlist.createdAt.toISOString(),
      href: `/dashboard/shortlists?demandId=${shortlist.demandId}`
    })),
    ...interviews.map((interview) => ({
      id: `interview:${interview.id}`,
      type: "INTERVIEW",
      title: `Interview ${interview.status.toLowerCase()} for ${interview.shortlist.demand.title}`,
      description: `${interview.shortlist.talentProfile.firstName} ${interview.shortlist.talentProfile.lastName} is scheduled ${interview.status === "SCHEDULED" ? "this cycle" : "with an updated status"}.`,
      occurredAt: interview.updatedAt.toISOString(),
      href: "/dashboard/interviews"
    })),
    ...offers.map((offer) => ({
      id: `offer:${offer.id}`,
      type: "OFFER",
      title: `Offer ${offer.status.toLowerCase()} for ${offer.demand.title}`,
      description: `${offer.talentProfile.firstName} ${offer.talentProfile.lastName} is linked to an offer at ${Number(offer.hourlyRate).toFixed(0)} ${offer.demand.currency}/hr.`,
      occurredAt: offer.updatedAt.toISOString(),
      href: "/dashboard/offers"
    })),
    ...notifications.map((notification) => ({
      id: `notification:${notification.id}`,
      type: "NOTIFICATION",
      title: notification.title,
      description: notification.body,
      occurredAt: notification.createdAt.toISOString(),
      href: null
    }))
  ]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, 10);

  return {
    activeRolesCount,
    totalCandidatesInPool,
    interviewsThisWeek,
    averageTimeToShortlistDays,
    recentActivity,
    rolesNeedingAttention
  };
};

export const getAdminDashboard = async (): Promise<AdminDashboardPayload> => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    totalUsers,
    usersGrouped,
    totalTalentInPool,
    verifiedTalentCount,
    pendingTalentCount,
    activeDemandsCount,
    pendingDemandApprovalsCount,
    placementsThisMonth,
    acceptedOffers,
    hardToFillDemandCount,
    pendingVerificationProfiles,
    companies
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ["role"],
      _count: {
        _all: true
      }
    }),
    prisma.talentProfile.count(),
    prisma.talentProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.talentProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.demand.count({ where: { status: "ACTIVE" } }),
    prisma.demand.count({ where: { approvalStatus: "PENDING" } }),
    prisma.offer.count({
      where: {
        status: "ACCEPTED",
        updatedAt: {
          gte: monthStart,
          lt: nextMonth
        }
      }
    }),
    prisma.offer.findMany({
      where: {
        status: "ACCEPTED",
        updatedAt: {
          gte: monthStart,
          lt: nextMonth
        }
      },
      select: {
        hourlyRate: true
      }
    }),
    prisma.demand.count({ where: { hardToFill: true, status: { in: ["ACTIVE", "PAUSED"] } } }),
    prisma.talentProfile.findMany({
      where: { verificationStatus: "PENDING" },
      include: {
        user: true
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 6
    }),
    prisma.company.findMany({
      include: {
        demands: {
          include: {
            offers: true
          }
        }
      },
      orderBy: {
        name: "asc"
      },
      take: 8
    })
  ]);

  const placementFeesThisMonth = Number(
    acceptedOffers
      .reduce((sum, offer) => sum + Number(offer.hourlyRate) * 160 * 0.15, 0)
      .toFixed(2)
  );

  return {
    totalUsers,
    usersByRole: usersGrouped.map((entry) => ({ role: entry.role, count: entry._count._all })),
    totalTalentInPool,
    verifiedTalentCount,
    pendingTalentCount,
    activeDemandsCount,
    pendingDemandApprovalsCount,
    placementsThisMonth,
    placementFeesThisMonth,
    hardToFillDemandCount,
    pendingVerificationProfiles: pendingVerificationProfiles.map((profile) => ({
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      headline: profile.headline,
      createdAt: profile.createdAt.toISOString(),
      user: {
        email: profile.user.email
      }
    })),
    companyMetrics: companies.map((company) => ({
      id: company.id,
      name: company.name,
      industry: company.industry,
      activeDemandCount: company.demands.filter((demand) => demand.status === "ACTIVE").length,
      pendingApprovalsCount: company.demands.filter((demand) => demand.approvalStatus === "PENDING").length,
      hardToFillCount: company.demands.filter((demand) => demand.hardToFill).length,
      placementsCount: company.demands.reduce(
        (sum, demand) => sum + demand.offers.filter((offer) => offer.status === "ACCEPTED").length,
        0
      )
    }))
  };
};