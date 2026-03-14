import { Prisma } from "@prisma/client";
import {
  companyFiltersSchema,
  companySizes,
  createExternalCandidateSubmissionInputSchema,
  createHeadhunterAssignmentInputSchema,
  createCompanyInputSchema,
  createDemandInputSchema,
  createOfferInputSchema,
  createTalentProfileInputSchema,
  demandFiltersSchema,
  generateShortlistInputSchema,
  markNotificationReadInputSchema,
  notificationTypes,
  notificationsQueryInputSchema,
  paginationInputSchema,
  rejectTalentInputSchema,
  respondToInterviewInputSchema,
  respondToMatchInputSchema,
  scheduleInterviewInputSchema,
  shortlistActionInputSchema,
  skillCategories,
  smartTalentSearchFiltersSchema,
  submitInterviewFeedbackInputSchema,
  talentProfileFiltersSchema,
  updateAvailabilityInputSchema,
  updateCompanyInputSchema,
  updateDemandApprovalInputSchema,
  updateDemandInputSchema,
  updateExternalCandidateSubmissionStatusInputSchema,
  updateInterviewInputSchema,
  updateOfferInputSchema,
  updatePricingInputSchema,
  updateTalentProfileInputSchema,
  updateUserAdminInputSchema,
  uploadAssetInputSchema,
  uploadResumeInputSchema,
  userRoles,
  usersFiltersSchema,
  type AuthUser,
  type DemandStatus,
  type ExternalCandidateSubmissionStatus
} from "@atm/shared";
import { GraphQLError } from "graphql";
import {
  generateShortlistMatches,
  parseResumeFromUpload,
  parseResumeFromUrl,
  semanticSearchProfiles,
  type ParsedResumeResponse
} from "./ai-engine.js";
import { sendAvailabilityUpdateEmail, sendInterviewScheduledEmail, sendMatchAlertEmail, sendOfferReceivedEmail } from "./email.js";
import { createNotification, createNotifications } from "./notifications.js";
import { uploadBase64Asset } from "./storage.js";
import { prisma } from "../lib/prisma.js";

type PaginationArgs = {
  first?: number;
  after?: string | null;
};

type Connection<T> = {
  edges: Array<{ cursor: string; node: T }>;
  pageInfo: {
    endCursor: string | null;
    hasNextPage: boolean;
  };
};

type TalentProfileRecord = Prisma.TalentProfileGetPayload<{
  include: typeof profileInclude;
}>;

type SearchResultNode = {
  id: string;
  relevanceScore: number;
  headline: string | null;
  summary: string | null;
  talentProfile: TalentProfileRecord;
};

type UploadedFilePayload = {
  key: string;
  url: string;
  contentType: string;
  assetType: "RESUME" | "AVATAR";
};

const unauthorized = () => new GraphQLError("Authentication required.", { extensions: { code: "UNAUTHENTICATED" } });
const forbidden = () => new GraphQLError("You do not have access to this resource.", { extensions: { code: "FORBIDDEN" } });
const badInput = (message: string) => new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });

const toDate = (value: string | null | undefined) => (value ? new Date(value) : null);
const toDecimal = (value: number | null | undefined) => (value == null ? undefined : new Prisma.Decimal(value.toFixed(2)));
const parseJson = (value: string | undefined): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = JSON.parse(value) as Prisma.JsonValue;
  return parsed === null ? Prisma.JsonNull : (parsed as Prisma.InputJsonValue);
};

const normalizeSkillName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const displayNameFromNormalized = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const splitFullName = (value: string | null | undefined) => {
  if (!value) {
    return { firstName: undefined, lastName: undefined };
  }

  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: undefined, lastName: undefined };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: undefined };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ")
  };
};

const requireUser = (currentUser: AuthUser | null) => {
  if (!currentUser) {
    throw unauthorized();
  }

  return currentUser;
};

const requireRole = (currentUser: AuthUser | null, allowedRoles: AuthUser["role"][]) => {
  const user = requireUser(currentUser);
  if (!allowedRoles.includes(user.role)) {
    throw forbidden();
  }

  return user;
};

const buildConnection = <T extends { id: string }>(items: T[], first: number): Connection<T> => {
  const hasNextPage = items.length > first;
  const pageItems = hasNextPage ? items.slice(0, first) : items;
  const lastItem = pageItems[pageItems.length - 1];

  return {
    edges: pageItems.map((item) => ({ cursor: item.id, node: item })),
    pageInfo: {
      endCursor: lastItem?.id ?? null,
      hasNextPage
    }
  };
};

const parsePagination = (pagination: PaginationArgs | null | undefined) => paginationInputSchema.parse(pagination ?? {});

const profileInclude = {
  skills: { include: { skill: true } },
  experiences: true,
  certifications: true,
  educationEntries: true
} satisfies Prisma.TalentProfileInclude;

const demandInclude = {
  company: true,
  requiredSkills: { include: { skill: true } }
} satisfies Prisma.DemandInclude;

const shortlistInclude = {
  demand: { include: demandInclude },
  talentProfile: { include: profileInclude },
  interviews: {
    include: {
      offer: true
    }
  }
} satisfies Prisma.ShortlistInclude;

const profileWithUserInclude = {
  ...profileInclude,
  user: true
} satisfies Prisma.TalentProfileInclude;

const notificationInclude = {
  user: true
} satisfies Prisma.NotificationInclude;

const headhunterAssignmentInclude = {
  demand: { include: demandInclude },
  headhunterUser: true,
  assignedByAdmin: true
} satisfies Prisma.HeadhunterAssignmentInclude;

const externalCandidateSubmissionInclude = {
  demand: { include: demandInclude },
  headhunterUser: true
} satisfies Prisma.ExternalCandidateSubmissionInclude;

const assertDemandAccess = async (demandId: string, currentUser: AuthUser) => {
  const demand = await prisma.demand.findUnique({ where: { id: demandId } });
  if (!demand) {
    throw badInput("Demand not found.");
  }

  if (currentUser.role === "ADMIN") {
    return demand;
  }

  if (currentUser.role === "RECRUITER" && demand.recruiterId === currentUser.id) {
    return demand;
  }

  throw forbidden();
};

const getCurrentTalentProfile = async (currentUser: AuthUser) => {
  const profile = await prisma.talentProfile.findUnique({
    where: { userId: currentUser.id },
    include: profileInclude
  });

  if (!profile) {
    throw badInput("Talent profile not found for current user.");
  }

  return profile;
};

const getCurrentTalentProfileWithUser = async (currentUser: AuthUser) => {
  const profile = await prisma.talentProfile.findUnique({
    where: { userId: currentUser.id },
    include: profileWithUserInclude
  });

  if (!profile) {
    throw badInput("Talent profile not found for current user.");
  }

  return profile;
};

const ensureCompanyWritable = async (companyId: string, currentUser: AuthUser) => {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw badInput("Company not found.");
  }

  if (currentUser.role === "ADMIN" || company.recruiterId === currentUser.id) {
    return company;
  }

  throw forbidden();
};

const applyPricingFilter = (
  profile: { hourlyRateMin: Prisma.Decimal | null; hourlyRateMax: Prisma.Decimal | null },
  filters: ReturnType<typeof smartTalentSearchFiltersSchema.parse>
) => {
  const rateMin = profile.hourlyRateMin ? Number(profile.hourlyRateMin) : null;
  const rateMax = profile.hourlyRateMax ? Number(profile.hourlyRateMax) : null;

  if (filters.minHourlyRate !== undefined && rateMax !== null && rateMax < filters.minHourlyRate) {
    return false;
  }

  if (filters.maxHourlyRate !== undefined && rateMin !== null && rateMin > filters.maxHourlyRate) {
    return false;
  }

  return true;
};

const matchesIndustryFilter = (
  profile: { industries: string[] },
  filters: ReturnType<typeof smartTalentSearchFiltersSchema.parse>
) => {
  if (!filters.industry) {
    return true;
  }

  return profile.industries.some((industry) => industry.toLowerCase().includes(filters.industry!.toLowerCase()));
};

const matchesSkillFilter = (
  profile: { skills: Array<{ skill: { name: string; displayName: string } }> },
  filters: ReturnType<typeof smartTalentSearchFiltersSchema.parse>
) => {
  if (filters.skills.length === 0) {
    return true;
  }

  const profileSkills = new Set(
    profile.skills.flatMap((skill) => [skill.skill.name.toLowerCase(), skill.skill.displayName.toLowerCase()])
  );
  const requested = filters.skills.map((skill) => skill.toLowerCase());
  if (filters.skillMode === "OR") {
    return requested.some((skill) => profileSkills.has(skill));
  }

  return requested.every((skill) => profileSkills.has(skill));
};

const buildSearchConnection = (items: SearchResultNode[], first: number): Connection<SearchResultNode> =>
  buildConnection(items, first);

const listRecruiterIdsForTalent = async (talentProfileId: string) => {
  const shortlists = await prisma.shortlist.findMany({
    where: { talentProfileId },
    include: { demand: true }
  });

  return [...new Set(shortlists.map((shortlist) => shortlist.demand.recruiterId))];
};

const syncParsedResumeToProfile = async (
  profile: { id: string; firstName: string; lastName: string; headline: string; summary: string; industries: string[]; careerTrajectory: string | null },
  resumeUrl: string,
  parsedResume: ParsedResumeResponse
) => {
  const resolvedSkillIds: string[] = [];
  const resolvedName = splitFullName(parsedResume.full_name);

  for (const skill of parsedResume.skills) {
    const normalizedName = normalizeSkillName(skill.name || skill.display_name);
    const existingSkill = await prisma.skill.upsert({
      where: { name: normalizedName },
      update: { displayName: skill.display_name || displayNameFromNormalized(normalizedName) },
      create: {
        name: normalizedName,
        displayName: skill.display_name || displayNameFromNormalized(normalizedName),
        category: "TECHNICAL"
      }
    });
    resolvedSkillIds.push(existingSkill.id);
  }

  await prisma.talentProfile.update({
    where: { id: profile.id },
    data: {
      firstName: resolvedName.firstName ?? profile.firstName,
      lastName: resolvedName.lastName ?? profile.lastName,
      resumeUrl,
      resumeParsedData: parsedResume as unknown as Prisma.JsonObject,
      headline: parsedResume.headline ?? profile.headline,
      summary: parsedResume.summary ?? profile.summary,
      industries: parsedResume.industries.length > 0 ? parsedResume.industries : profile.industries,
      seniorityLevel: parsedResume.seniority_level,
      careerTrajectory: parsedResume.career_trajectory ?? profile.careerTrajectory
    }
  });

  await prisma.talentSkill.deleteMany({ where: { talentProfileId: profile.id } });
  if (parsedResume.skills.length > 0) {
    await prisma.talentSkill.createMany({
      data: parsedResume.skills.map((skill, index) => ({
        talentProfileId: profile.id,
        skillId: resolvedSkillIds[index],
        proficiency: skill.proficiency,
        yearsOfExperience: 3
      }))
    });
  }

  await prisma.experience.deleteMany({ where: { talentProfileId: profile.id } });
  if (parsedResume.experience.length > 0) {
    await prisma.experience.createMany({
      data: parsedResume.experience.map((experience) => ({
        talentProfileId: profile.id,
        title: experience.role,
        companyName: experience.company ?? "Unknown company",
        location: null,
        startDate: toDate(experience.start_date) ?? new Date(),
        endDate: experience.end_date && !/present|current/i.test(experience.end_date) ? toDate(experience.end_date) : null,
        isCurrent: Boolean(experience.end_date && /present|current/i.test(experience.end_date)),
        description: experience.description ?? experience.role
      }))
    });
  }

  await prisma.certification.deleteMany({ where: { talentProfileId: profile.id } });
  if (parsedResume.certifications.length > 0) {
    await prisma.certification.createMany({
      data: parsedResume.certifications.map((certification) => ({
        talentProfileId: profile.id,
        name: certification.name,
        issuer: certification.issuer ?? "Unknown issuer",
        issueDate: toDate(certification.issue_date) ?? undefined
      }))
    });
  }

  await prisma.education.deleteMany({ where: { talentProfileId: profile.id } });
  if (parsedResume.education.length > 0) {
    await prisma.education.createMany({
      data: parsedResume.education.map((education) => ({
        talentProfileId: profile.id,
        institution: education.institution,
        degree: education.degree ?? "Degree not specified",
        fieldOfStudy: education.field_of_study ?? undefined,
        startDate: toDate(education.start_date) ?? undefined,
        endDate: toDate(education.end_date) ?? undefined
      }))
    });
  }

  return prisma.talentProfile.findUnique({ where: { id: profile.id }, include: profileInclude });
};

const syncTalentProfileRelations = async (
  talentProfileId: string,
  input: ReturnType<typeof updateTalentProfileInputSchema.parse>
) => {
  if (input.skills) {
    await prisma.talentSkill.deleteMany({ where: { talentProfileId } });
    if (input.skills.length > 0) {
      await prisma.talentSkill.createMany({
        data: input.skills.map((skill) => ({
          talentProfileId,
          skillId: skill.skillId,
          proficiency: skill.proficiency,
          yearsOfExperience: skill.yearsOfExperience
        }))
      });
    }
  }

  if (input.experiences) {
    await prisma.experience.deleteMany({ where: { talentProfileId } });
    if (input.experiences.length > 0) {
      await prisma.experience.createMany({
        data: input.experiences.map((experience) => ({
          talentProfileId,
          title: experience.title,
          companyName: experience.companyName,
          location: experience.location,
          startDate: new Date(experience.startDate),
          endDate: toDate(experience.endDate) ?? undefined,
          isCurrent: experience.isCurrent,
          description: experience.description
        }))
      });
    }
  }

  if (input.certifications) {
    await prisma.certification.deleteMany({ where: { talentProfileId } });
    if (input.certifications.length > 0) {
      await prisma.certification.createMany({
        data: input.certifications.map((certification) => ({
          talentProfileId,
          name: certification.name,
          issuer: certification.issuer,
          issueDate: toDate(certification.issueDate) ?? undefined,
          expirationDate: toDate(certification.expirationDate) ?? undefined,
          credentialId: certification.credentialId,
          credentialUrl: certification.credentialUrl
        }))
      });
    }
  }

  if (input.educationEntries) {
    await prisma.education.deleteMany({ where: { talentProfileId } });
    if (input.educationEntries.length > 0) {
      await prisma.education.createMany({
        data: input.educationEntries.map((education) => ({
          talentProfileId,
          institution: education.institution,
          degree: education.degree,
          fieldOfStudy: education.fieldOfStudy,
          startDate: toDate(education.startDate) ?? undefined,
          endDate: toDate(education.endDate) ?? undefined,
          description: education.description
        }))
      });
    }
  }
};

export const canViewProfilePricing = (currentUser: AuthUser | null, profile: { userId: string }) => {
  if (!currentUser) {
    return false;
  }

  if (currentUser.role === "ADMIN" || currentUser.role === "RECRUITER") {
    return true;
  }

  return currentUser.id === profile.userId;
};

export const getTalentProfile = async (id: string, currentUser: AuthUser | null) => {
  const user = requireUser(currentUser);
  const profile = await prisma.talentProfile.findUnique({ where: { id }, include: profileInclude });
  if (!profile) {
    return null;
  }

  if (user.role === "ADMIN" || user.role === "RECRUITER" || profile.userId === user.id) {
    return profile;
  }

  throw forbidden();
};

export const listTalentProfiles = async (
  filtersInput: unknown,
  paginationInput: PaginationArgs | null | undefined,
  currentUser: AuthUser | null
) => {
  requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const filters = talentProfileFiltersSchema.parse(filtersInput ?? {});
  const pagination = parsePagination(paginationInput);

  const where: Prisma.TalentProfileWhereInput = {
    seniorityLevel: filters.seniorityLevel,
    availability: filters.availability,
    verificationStatus: filters.verificationStatus,
    locationPreferences: filters.location ? { has: filters.location } : undefined,
    skills: filters.skillIds && filters.skillIds.length > 0 ? { some: { skillId: { in: filters.skillIds } } } : undefined,
    OR: filters.search
      ? [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName: { contains: filters.search, mode: "insensitive" } },
          { headline: { contains: filters.search, mode: "insensitive" } },
          { summary: { contains: filters.search, mode: "insensitive" } }
        ]
      : undefined
  };

  const records = await prisma.talentProfile.findMany({
    where,
    include: profileInclude,
    orderBy: { id: "asc" },
    cursor: pagination.after ? { id: pagination.after } : undefined,
    skip: pagination.after ? 1 : 0,
    take: pagination.first + 1
  });

  return buildConnection(records, pagination.first);
};

export const getMyProfile = async (currentUser: AuthUser | null) => {
  const user = requireUser(currentUser);
  return prisma.talentProfile.findUnique({ where: { userId: user.id }, include: profileInclude });
};

export const createTalentProfile = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["TALENT"]);
  const input = createTalentProfileInputSchema.parse(inputValue);

  const existing = await prisma.talentProfile.findUnique({ where: { userId: user.id } });
  if (existing) {
    throw badInput("Current user already has a talent profile.");
  }

  const profile = await prisma.talentProfile.create({
    data: {
      userId: user.id,
      firstName: input.firstName,
      lastName: input.lastName,
      headline: input.headline,
      summary: input.summary,
      avatarUrl: input.avatarUrl,
      resumeUrl: input.resumeUrl,
      resumeParsedData: parseJson(input.resumeParsedDataJson),
      industries: input.industries,
      seniorityLevel: input.seniorityLevel,
      careerTrajectory: input.careerTrajectory,
      availability: input.availability,
      availableFrom: toDate(input.availableFrom) ?? undefined,
      hourlyRateMin: toDecimal(input.hourlyRateMin),
      hourlyRateMax: toDecimal(input.hourlyRateMax),
      currency: input.currency,
      locationPreferences: input.locationPreferences,
      workVisaEligibility: input.workVisaEligibility,
      identityDocumentUrls: input.identityDocumentUrls,
      portfolioUrls: input.portfolioUrls,
      culturalValues: parseJson(input.culturalValuesJson),
      profileCompleteness: input.profileCompleteness
    },
    include: profileInclude
  });

  await syncTalentProfileRelations(profile.id, input);
  return prisma.talentProfile.findUnique({ where: { id: profile.id }, include: profileInclude });
};

export const updateTalentProfile = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["TALENT"]);
  const input = updateTalentProfileInputSchema.parse(inputValue);
  const profile = await getCurrentTalentProfile(user);

  await prisma.talentProfile.update({
    where: { id: profile.id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      headline: input.headline,
      summary: input.summary,
      avatarUrl: input.avatarUrl,
      resumeUrl: input.resumeUrl,
      resumeParsedData: input.resumeParsedDataJson ? parseJson(input.resumeParsedDataJson) : undefined,
      industries: input.industries,
      seniorityLevel: input.seniorityLevel,
      careerTrajectory: input.careerTrajectory,
      availability: input.availability,
      availableFrom: input.availableFrom === undefined ? undefined : toDate(input.availableFrom),
      hourlyRateMin: input.hourlyRateMin === undefined ? undefined : toDecimal(input.hourlyRateMin),
      hourlyRateMax: input.hourlyRateMax === undefined ? undefined : toDecimal(input.hourlyRateMax),
      currency: input.currency,
      locationPreferences: input.locationPreferences,
      workVisaEligibility: input.workVisaEligibility,
      identityDocumentUrls: input.identityDocumentUrls,
      portfolioUrls: input.portfolioUrls,
      culturalValues: input.culturalValuesJson ? parseJson(input.culturalValuesJson) : undefined,
      profileCompleteness: input.profileCompleteness
    }
  });

  await syncTalentProfileRelations(profile.id, input);
  return prisma.talentProfile.findUnique({ where: { id: profile.id }, include: profileInclude });
};

export const uploadResume = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["TALENT"]);
  const input = uploadResumeInputSchema.parse(inputValue);
  const profile = await getCurrentTalentProfile(user);
  const parsedResume = await parseResumeFromUrl(input.resumeUrl);

  return syncParsedResumeToProfile(profile, input.resumeUrl, parsedResume);
};

export const uploadAsset = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["TALENT"]);
  const input = uploadAssetInputSchema.parse(inputValue);
  const profile = await getCurrentTalentProfile(user);
  const uploadedFile = await uploadBase64Asset({
    fileName: input.fileName,
    mimeType: input.mimeType,
    contentBase64: input.contentBase64,
    folder: input.assetType === "RESUME" ? `resumes/${profile.id}` : `avatars/${profile.id}`
  });

  if (input.assetType === "RESUME") {
    const parsedResume = await parseResumeFromUpload(input.fileName, input.mimeType, input.contentBase64);
    const updatedProfile = await syncParsedResumeToProfile(profile, uploadedFile.url, parsedResume);
    return {
      file: {
        ...uploadedFile,
        assetType: input.assetType
      } satisfies UploadedFilePayload,
      profile: updatedProfile
    };
  }

  const updatedProfile = await prisma.talentProfile.update({
    where: { id: profile.id },
    data: {
      avatarUrl: uploadedFile.url
    },
    include: profileInclude
  });

  return {
    file: {
      ...uploadedFile,
      assetType: input.assetType
    } satisfies UploadedFilePayload,
    profile: updatedProfile
  };
};

export const updateAvailability = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["TALENT"]);
  const input = updateAvailabilityInputSchema.parse(inputValue);
  const profile = await getCurrentTalentProfileWithUser(user);

  const updatedProfile = await prisma.talentProfile.update({
    where: { id: profile.id },
    data: {
      availability: input.availability,
      availableFrom: toDate(input.availableFrom) ?? undefined
    },
    include: profileInclude
  });

  const recruiterIds = await listRecruiterIdsForTalent(profile.id);
  if (recruiterIds.length > 0) {
    await createNotifications(
      recruiterIds.map((recruiterId) => ({
        userId: recruiterId,
        type: "SYSTEM",
        title: `${profile.firstName} ${profile.lastName} updated availability`,
        body: `${profile.firstName} ${profile.lastName} is now marked as ${input.availability}.`,
        metadata: {
          talentProfileId: profile.id,
          availability: input.availability
        }
      }))
    );

    const recruiters = await prisma.user.findMany({
      where: { id: { in: recruiterIds } },
      select: { email: true }
    });
    const talentName = `${profile.firstName} ${profile.lastName}`;
    for (const recruiter of recruiters) {
      await sendAvailabilityUpdateEmail(recruiter.email, talentName, input.availability);
    }
  }

  return updatedProfile;
};

export const updatePricing = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["TALENT"]);
  const input = updatePricingInputSchema.parse(inputValue);
  const profile = await getCurrentTalentProfile(user);

  return prisma.talentProfile.update({
    where: { id: profile.id },
    data: {
      hourlyRateMin: toDecimal(input.hourlyRateMin),
      hourlyRateMax: toDecimal(input.hourlyRateMax),
      currency: input.currency
    },
    include: profileInclude
  });
};

export const getDemand = async (id: string, currentUser: AuthUser | null) => {
  const user = requireUser(currentUser);
  if (user.role === "TALENT") {
    const profile = await getCurrentTalentProfile(user);
    const shortlist = await prisma.shortlist.findFirst({ where: { demandId: id, talentProfileId: profile.id } });
    if (!shortlist) {
      throw forbidden();
    }
  }

  if (user.role === "RECRUITER") {
    await assertDemandAccess(id, user);
  }

  if (user.role === "HEADHUNTER") {
    const assignment = await prisma.headhunterAssignment.findFirst({ where: { demandId: id, headhunterUserId: user.id } });
    if (!assignment) {
      throw forbidden();
    }
  }

  return prisma.demand.findUnique({ where: { id }, include: demandInclude });
};

export const listDemands = async (filtersInput: unknown, paginationInput: PaginationArgs | null | undefined, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const filters = demandFiltersSchema.parse(filtersInput ?? {});
  const pagination = parsePagination(paginationInput);

  const where: Prisma.DemandWhereInput = {
    experienceLevel: filters.experienceLevel,
    remotePolicy: filters.remotePolicy,
    status: filters.status,
    companyId: filters.companyId,
    recruiterId: user.role === "RECRUITER" ? user.id : filters.recruiterId,
    OR: filters.search
      ? [
          { title: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { aiGeneratedDescription: { contains: filters.search, mode: "insensitive" } }
        ]
      : undefined
  };

  const records = await prisma.demand.findMany({
    where,
    include: demandInclude,
    orderBy: { id: "asc" },
    cursor: pagination.after ? { id: pagination.after } : undefined,
    skip: pagination.after ? 1 : 0,
    take: pagination.first + 1
  });

  return buildConnection(records, pagination.first);
};

export const listMyDemands = async (paginationInput: PaginationArgs | null | undefined, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER"]);
  return listDemands({ recruiterId: user.id }, paginationInput, user);
};

export const createDemand = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = createDemandInputSchema.parse(inputValue);
  await ensureCompanyWritable(input.companyId, user);
  const recruiterId = user.role === "ADMIN" ? (await prisma.company.findUniqueOrThrow({ where: { id: input.companyId } })).recruiterId : user.id;
  const approvalStatus = user.role === "ADMIN" ? "APPROVED" : "PENDING";
  const normalizedStatus = user.role === "ADMIN" ? input.status : input.status === "ACTIVE" ? "DRAFT" : input.status;

  const demand = await prisma.demand.create({
    data: {
      recruiterId,
      companyId: input.companyId,
      title: input.title,
      description: input.description,
      aiGeneratedDescription: input.aiGeneratedDescription,
      experienceLevel: input.experienceLevel,
      location: input.location,
      remotePolicy: input.remotePolicy,
      startDate: toDate(input.startDate) ?? undefined,
      contractDuration: input.contractDuration,
      budgetMin: toDecimal(input.budgetMin),
      budgetMax: toDecimal(input.budgetMax),
      currency: input.currency,
      projectRequirements: input.projectRequirements,
      status: normalizedStatus,
      approvalStatus,
      approvedAt: approvalStatus === "APPROVED" ? new Date() : null
    },
    include: demandInclude
  });

  if (input.requiredSkills.length > 0) {
    await prisma.demandSkill.createMany({
      data: input.requiredSkills.map((skill) => ({
        demandId: demand.id,
        skillId: skill.skillId,
        isRequired: skill.isRequired,
        minimumYears: skill.minimumYears
      }))
    });
  }

  return prisma.demand.findUnique({ where: { id: demand.id }, include: demandInclude });
};

export const updateDemand = async (id: string, inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = updateDemandInputSchema.parse(inputValue);
  const existingDemand = await assertDemandAccess(id, user);

  if (input.companyId) {
    await ensureCompanyWritable(input.companyId, user);
  }

  await prisma.demand.update({
    where: { id },
    data: {
      companyId: input.companyId,
      title: input.title,
      description: input.description,
      aiGeneratedDescription: input.aiGeneratedDescription,
      experienceLevel: input.experienceLevel,
      location: input.location,
      remotePolicy: input.remotePolicy,
      startDate: input.startDate === undefined ? undefined : toDate(input.startDate),
      contractDuration: input.contractDuration,
      budgetMin: input.budgetMin === undefined ? undefined : toDecimal(input.budgetMin),
      budgetMax: input.budgetMax === undefined ? undefined : toDecimal(input.budgetMax),
      currency: input.currency,
      projectRequirements: input.projectRequirements,
      status: user.role === "ADMIN" ? input.status : input.status === "ACTIVE" ? "DRAFT" : input.status,
      approvalStatus:
        user.role === "ADMIN"
          ? undefined
          : input.status !== undefined ||
              input.title !== undefined ||
              input.description !== undefined ||
              input.aiGeneratedDescription !== undefined ||
              input.experienceLevel !== undefined ||
              input.location !== undefined ||
              input.remotePolicy !== undefined ||
              input.startDate !== undefined ||
              input.contractDuration !== undefined ||
              input.budgetMin !== undefined ||
              input.budgetMax !== undefined ||
              input.projectRequirements !== undefined ||
              input.requiredSkills !== undefined ||
              input.companyId !== undefined
            ? "PENDING"
            : undefined,
      approvalNotes: user.role === "ADMIN" ? undefined : undefined,
      approvedAt:
        user.role === "ADMIN"
          ? undefined
          : input.status !== undefined ||
              input.title !== undefined ||
              input.description !== undefined ||
              input.aiGeneratedDescription !== undefined ||
              input.experienceLevel !== undefined ||
              input.location !== undefined ||
              input.remotePolicy !== undefined ||
              input.startDate !== undefined ||
              input.contractDuration !== undefined ||
              input.budgetMin !== undefined ||
              input.budgetMax !== undefined ||
              input.projectRequirements !== undefined ||
              input.requiredSkills !== undefined ||
              input.companyId !== undefined
            ? null
            : undefined
    }
  });

  if (input.requiredSkills) {
    await prisma.demandSkill.deleteMany({ where: { demandId: id } });
    if (input.requiredSkills.length > 0) {
      await prisma.demandSkill.createMany({
        data: input.requiredSkills.map((skill) => ({
          demandId: id,
          skillId: skill.skillId,
          isRequired: skill.isRequired,
          minimumYears: skill.minimumYears
        }))
      });
    }
  }

  return prisma.demand.findUnique({ where: { id }, include: demandInclude });
};

export const updateDemandStatus = async (id: string, status: DemandStatus, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const demand = await assertDemandAccess(id, user);
  if (user.role !== "ADMIN" && demand.approvalStatus !== "APPROVED" && status === "ACTIVE") {
    throw badInput("This demand must be approved by an admin before it can go live.");
  }
  return prisma.demand.update({ where: { id }, data: { status }, include: demandInclude });
};

export const getShortlistForDemand = async (demandId: string, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  await assertDemandAccess(demandId, user);
  return prisma.shortlist.findMany({ where: { demandId }, include: shortlistInclude, orderBy: { createdAt: "desc" } });
};

export const getMyMatches = async (currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["TALENT"]);
  const profile = await getCurrentTalentProfile(user);
  return prisma.shortlist.findMany({ where: { talentProfileId: profile.id }, include: shortlistInclude, orderBy: { createdAt: "desc" } });
};

export const generateShortlist = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = generateShortlistInputSchema.parse(inputValue);
  const demand = await assertDemandAccess(input.demandId, user);
  if (demand.approvalStatus !== "APPROVED") {
    throw badInput("Demand approval is required before generating a shortlist.");
  }
  const aiMatches = await generateShortlistMatches(input.demandId, input.limit);
  const matchedTalentProfiles = await prisma.talentProfile.findMany({
    where: {
      id: {
        in: aiMatches.matches.map((match) => match.talent_profile_id)
      }
    },
    include: { user: true }
  });
  const talentById = new Map(matchedTalentProfiles.map((profile) => [profile.id, profile]));

  for (const match of aiMatches.matches) {
    await prisma.shortlist.upsert({
      where: {
        demandId_talentProfileId: {
          demandId: input.demandId,
          talentProfileId: match.talent_profile_id
        }
      },
      update: {
        matchScore: new Prisma.Decimal(match.match_score.toFixed(2)),
        scoreBreakdown: match.breakdown,
        aiExplanation: match.explanation,
        status: "AI_SUGGESTED"
      },
      create: {
        demandId: input.demandId,
        talentProfileId: match.talent_profile_id,
        matchScore: new Prisma.Decimal(match.match_score.toFixed(2)),
        scoreBreakdown: match.breakdown,
        aiExplanation: match.explanation,
        status: "AI_SUGGESTED",
        talentStatus: "PENDING"
      }
    });

    const talent = talentById.get(match.talent_profile_id);
    if (talent) {
      await createNotification({
        userId: talent.userId,
        type: "MATCH_READY",
        title: `New match for ${demand.title}`,
        body: `A recruiter has a role match for ${demand.title}.`,
        metadata: {
          demandId: demand.id,
          talentProfileId: talent.id,
          matchScore: match.match_score
        }
      });
      await sendMatchAlertEmail(talent.user.email, demand.title);
    }
  }

  return prisma.shortlist.findMany({ where: { demandId: input.demandId }, include: shortlistInclude, orderBy: { matchScore: "desc" } });
};

export const smartTalentSearch = async (
  query: string,
  filtersInput: unknown,
  paginationInput: PaginationArgs | null | undefined,
  currentUser: AuthUser | null
) => {
  requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  if (!query.trim()) {
    throw badInput("Search query cannot be empty.");
  }

  const filters = smartTalentSearchFiltersSchema.parse(filtersInput ?? {});
  const pagination = parsePagination(paginationInput);
  const aiFilters: Record<string, unknown> = {
    seniorityLevel: filters.seniorityLevel,
    availability: filters.availability,
    location: filters.location
  };

  if (filters.skills.length > 0 && filters.skillMode !== "OR") {
    aiFilters.skills = filters.skills;
  }

  const semanticResults = await semanticSearchProfiles(query, aiFilters, Math.max(pagination.first * 4, 20));
  const profileIds = semanticResults.results.map((result) => result.talent_profile_id);
  const profiles = await prisma.talentProfile.findMany({
    where: { id: { in: profileIds } },
    include: profileInclude
  });
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  const filteredResults = semanticResults.results
    .map((result) => {
      const profile = profileById.get(result.talent_profile_id);
      if (!profile) {
        return null;
      }

      if (!matchesIndustryFilter(profile, filters) || !applyPricingFilter(profile, filters) || !matchesSkillFilter(profile, filters)) {
        return null;
      }

      return {
        id: result.talent_profile_id,
        relevanceScore: result.relevance_score,
        headline: result.headline,
        summary: result.summary,
        talentProfile: profile
      } satisfies SearchResultNode;
    })
    .filter((result): result is SearchResultNode => result !== null);

  const startIndex = pagination.after
    ? Math.max(0, filteredResults.findIndex((result) => result.id === pagination.after) + 1)
    : 0;
  return buildSearchConnection(filteredResults.slice(startIndex), pagination.first);
};

export const reviewCandidate = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = shortlistActionInputSchema.parse(inputValue);
  const shortlist = await prisma.shortlist.findUnique({ where: { id: input.shortlistId } });
  if (!shortlist) {
    throw badInput("Shortlist record not found.");
  }
  await assertDemandAccess(shortlist.demandId, user);
  return prisma.shortlist.update({ where: { id: input.shortlistId }, data: { status: "RECRUITER_REVIEWED" }, include: shortlistInclude });
};

export const shortlistCandidate = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = shortlistActionInputSchema.parse(inputValue);
  const shortlist = await prisma.shortlist.findUnique({ where: { id: input.shortlistId } });
  if (!shortlist) {
    throw badInput("Shortlist record not found.");
  }
  await assertDemandAccess(shortlist.demandId, user);
  return prisma.shortlist.update({ where: { id: input.shortlistId }, data: { status: "SHORTLISTED" }, include: shortlistInclude });
};

export const rejectCandidate = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = shortlistActionInputSchema.parse(inputValue);
  const shortlist = await prisma.shortlist.findUnique({ where: { id: input.shortlistId } });
  if (!shortlist) {
    throw badInput("Shortlist record not found.");
  }
  await assertDemandAccess(shortlist.demandId, user);
  return prisma.shortlist.update({ where: { id: input.shortlistId }, data: { status: "REJECTED" }, include: shortlistInclude });
};

export const respondToMatch = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["TALENT"]);
  const input = respondToMatchInputSchema.parse(inputValue);
  const shortlist = await prisma.shortlist.findUnique({
    where: { id: input.shortlistId },
    include: {
      demand: true,
      talentProfile: {
        include: {
          user: true
        }
      }
    }
  });

  if (!shortlist) {
    throw badInput("Shortlist record not found.");
  }

  if (shortlist.talentProfile.userId !== user.id) {
    throw forbidden();
  }

  const updatedShortlist = await prisma.shortlist.update({
    where: { id: input.shortlistId },
    data: { talentStatus: input.talentStatus },
    include: shortlistInclude
  });

  await createNotification({
    userId: shortlist.demand.recruiterId,
    type: "SYSTEM",
    title: `${shortlist.talentProfile.firstName} ${shortlist.talentProfile.lastName} responded to ${shortlist.demand.title}`,
    body:
      input.talentStatus === "INTERESTED"
        ? "The talent marked this opportunity as interested."
        : "The talent declined this opportunity.",
    metadata: {
      shortlistId: shortlist.id,
      demandId: shortlist.demandId,
      talentStatus: input.talentStatus
    }
  });

  return updatedShortlist;
};

const assertInterviewAccess = async (interviewId: string, currentUser: AuthUser) => {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      shortlist: {
        include: {
          demand: true,
          talentProfile: true
        }
      }
    }
  });

  if (!interview) {
    throw badInput("Interview not found.");
  }

  if (currentUser.role === "ADMIN") {
    return interview;
  }

  if (currentUser.role === "RECRUITER" && interview.shortlist.demand.recruiterId === currentUser.id) {
    return interview;
  }

  if (currentUser.role === "TALENT" && interview.shortlist.talentProfile.userId === currentUser.id) {
    return interview;
  }

  throw forbidden();
};

export const scheduleInterview = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = scheduleInterviewInputSchema.parse(inputValue);
  const shortlist = await prisma.shortlist.findUnique({
    where: { id: input.shortlistId },
    include: { demand: true }
  });
  if (!shortlist) {
    throw badInput("Shortlist record not found.");
  }
  if (user.role !== "ADMIN" && shortlist.demand.recruiterId !== user.id) {
    throw forbidden();
  }

  const interview = await prisma.interview.create({
    data: {
      shortlistId: input.shortlistId,
      scheduledAt: new Date(input.scheduledAt),
      duration: input.duration,
      meetingUrl: input.meetingUrl,
      status: "SCHEDULED"
    },
    include: {
      shortlist: { include: shortlistInclude },
      offer: true
    }
  });

  const talentUserId = interview.shortlist.talentProfile.userId;
  await createNotification({
    userId: talentUserId,
    type: "INTERVIEW_UPDATE",
    title: `Interview scheduled for ${interview.shortlist.demand.title}`,
    body: `Your interview is scheduled for ${interview.scheduledAt.toISOString()}.`,
    metadata: {
      interviewId: interview.id,
      demandId: interview.shortlist.demandId
    }
  });
  const talent = await prisma.talentProfile.findUniqueOrThrow({
    where: { id: interview.shortlist.talentProfileId },
    include: { user: true }
  });
  await sendInterviewScheduledEmail(talent.user.email, interview.shortlist.demand.title, interview.scheduledAt.toISOString());

  return interview;
};

export const updateInterview = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = updateInterviewInputSchema.parse(inputValue);
  await assertInterviewAccess(input.interviewId, user);
  return prisma.interview.update({
    where: { id: input.interviewId },
    data: {
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      duration: input.duration,
      meetingUrl: input.meetingUrl,
      status: input.status
    },
    include: {
      shortlist: { include: shortlistInclude },
      offer: true
    }
  });
};

export const cancelInterview = async (interviewId: string, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  await assertInterviewAccess(interviewId, user);
  return prisma.interview.update({
    where: { id: interviewId },
    data: { status: "CANCELLED" },
    include: { shortlist: { include: shortlistInclude }, offer: true }
  });
};

export const submitInterviewFeedback = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = submitInterviewFeedbackInputSchema.parse(inputValue);
  await assertInterviewAccess(input.interviewId, user);
  return prisma.interview.update({
    where: { id: input.interviewId },
    data: {
      feedback: input.feedback,
      rating: input.rating,
      status: "COMPLETED"
    },
    include: { shortlist: { include: shortlistInclude }, offer: true }
  });
};

export const respondToInterview = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["TALENT"]);
  const input = respondToInterviewInputSchema.parse(inputValue);
  const interview = await assertInterviewAccess(input.interviewId, user);

  const updatedInterview = await prisma.interview.update({
    where: { id: input.interviewId },
    data: {
      talentResponseStatus: input.talentResponseStatus,
      status: input.talentResponseStatus === "DECLINED" ? "CANCELLED" : undefined
    },
    include: { shortlist: { include: shortlistInclude }, offer: true }
  });

  await createNotification({
    userId: interview.shortlist.demand.recruiterId,
    type: "INTERVIEW_UPDATE",
    title: `Interview response for ${interview.shortlist.demand.title}`,
    body:
      input.talentResponseStatus === "ACCEPTED"
        ? "The talent accepted the interview request."
        : "The talent declined the interview request.",
    metadata: {
      interviewId: interview.id,
      shortlistId: interview.shortlistId,
      demandId: interview.shortlist.demandId,
      talentResponseStatus: input.talentResponseStatus
    }
  });

  return updatedInterview;
};

const assertOfferAccess = async (offerId: string, currentUser: AuthUser) => {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      demand: true,
      talentProfile: true,
      interview: true
    }
  });
  if (!offer) {
    throw badInput("Offer not found.");
  }

  if (currentUser.role === "ADMIN") {
    return offer;
  }

  if (currentUser.role === "RECRUITER" && offer.demand.recruiterId === currentUser.id) {
    return offer;
  }

  if (currentUser.role === "TALENT" && offer.talentProfile.userId === currentUser.id) {
    return offer;
  }

  throw forbidden();
};

export const createOffer = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = createOfferInputSchema.parse(inputValue);
  await assertDemandAccess(input.demandId, user);
  const offer = await prisma.offer.create({
    data: {
      interviewId: input.interviewId,
      demandId: input.demandId,
      talentProfileId: input.talentProfileId,
      hourlyRate: new Prisma.Decimal(input.hourlyRate.toFixed(2)),
      startDate: new Date(input.startDate),
      endDate: toDate(input.endDate) ?? undefined,
      terms: input.terms,
      status: input.status
    },
    include: {
      demand: { include: demandInclude },
      talentProfile: { include: profileInclude },
      interview: true
    }
  });

  const talent = await prisma.talentProfile.findUniqueOrThrow({ where: { id: offer.talentProfileId }, include: { user: true } });
  await createNotification({
    userId: talent.userId,
    type: "OFFER_UPDATE",
    title: `Offer received for ${offer.demand.title}`,
    body: `A recruiter has sent you an offer for ${offer.demand.title}.`,
    metadata: {
      offerId: offer.id,
      demandId: offer.demandId
    }
  });
  await sendOfferReceivedEmail(talent.user.email, offer.demand.title);

  return offer;
};

export const updateOffer = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = updateOfferInputSchema.parse(inputValue);
  await assertOfferAccess(input.offerId, user);
  return prisma.offer.update({
    where: { id: input.offerId },
    data: {
      interviewId: input.interviewId,
      demandId: input.demandId,
      talentProfileId: input.talentProfileId,
      hourlyRate: input.hourlyRate === undefined ? undefined : new Prisma.Decimal(input.hourlyRate.toFixed(2)),
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate === undefined ? undefined : toDate(input.endDate),
      terms: input.terms,
      status: input.status
    },
    include: {
      demand: { include: demandInclude },
      talentProfile: { include: profileInclude },
      interview: true
    }
  });
};

export const acceptOffer = async (offerId: string, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["TALENT"]);
  await assertOfferAccess(offerId, user);
  return prisma.offer.update({
    where: { id: offerId },
    data: { status: "ACCEPTED" },
    include: { demand: { include: demandInclude }, talentProfile: { include: profileInclude }, interview: true }
  });
};

export const declineOffer = async (offerId: string, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["TALENT"]);
  await assertOfferAccess(offerId, user);
  return prisma.offer.update({
    where: { id: offerId },
    data: { status: "DECLINED" },
    include: { demand: { include: demandInclude }, talentProfile: { include: profileInclude }, interview: true }
  });
};

export const getSkills = async (search: string | null | undefined, paginationInput: PaginationArgs | null | undefined, currentUser: AuthUser | null) => {
  requireUser(currentUser);
  const pagination = parsePagination(paginationInput);
  const records = await prisma.skill.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } }
          ]
        }
      : undefined,
    orderBy: { id: "asc" },
    cursor: pagination.after ? { id: pagination.after } : undefined,
    skip: pagination.after ? 1 : 0,
    take: pagination.first + 1
  });
  return buildConnection(records, pagination.first);
};

export const getSkillCategories = async () => [...skillCategories];

export const listNotifications = async (
  inputValue: unknown,
  paginationInput: PaginationArgs | null | undefined,
  currentUser: AuthUser | null
) => {
  const user = requireUser(currentUser);
  const input = notificationsQueryInputSchema.parse(inputValue ?? {});
  const pagination = parsePagination(paginationInput);
  const targetUserId = input.userId ?? user.id;

  if (user.role !== "ADMIN" && targetUserId !== user.id) {
    throw forbidden();
  }

  const records = await prisma.notification.findMany({
    where: {
      userId: targetUserId,
      read: input.unreadOnly ? false : undefined
    },
    include: notificationInclude,
    orderBy: { createdAt: "desc" },
    cursor: pagination.after ? { id: pagination.after } : undefined,
    skip: pagination.after ? 1 : 0,
    take: pagination.first + 1
  });

  return buildConnection(records, pagination.first);
};

export const unreadCount = async (userId: string | null | undefined, currentUser: AuthUser | null) => {
  const user = requireUser(currentUser);
  const targetUserId = userId ?? user.id;
  if (user.role !== "ADMIN" && targetUserId !== user.id) {
    throw forbidden();
  }
  return prisma.notification.count({ where: { userId: targetUserId, read: false } });
};

export const markNotificationRead = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireUser(currentUser);
  const input = markNotificationReadInputSchema.parse(inputValue);
  const notification = await prisma.notification.findUnique({ where: { id: input.notificationId } });
  if (!notification) {
    throw badInput("Notification not found.");
  }
  if (user.role !== "ADMIN" && notification.userId !== user.id) {
    throw forbidden();
  }
  return prisma.notification.update({ where: { id: input.notificationId }, data: { read: true }, include: notificationInclude });
};

export const getCompany = async (id: string, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return null;
  }
  if (user.role !== "ADMIN" && company.recruiterId !== user.id) {
    throw forbidden();
  }
  return company;
};

export const listCompanies = async (
  filtersInput: unknown,
  paginationInput: PaginationArgs | null | undefined,
  currentUser: AuthUser | null
) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const filters = companyFiltersSchema.parse(filtersInput ?? {});
  const pagination = parsePagination(paginationInput);
  const records = await prisma.company.findMany({
    where: {
      recruiterId: user.role === "RECRUITER" ? user.id : filters.recruiterId,
      OR: filters.search
        ? [
            { name: { contains: filters.search, mode: "insensitive" } },
            { industry: { contains: filters.search, mode: "insensitive" } }
          ]
        : undefined
    },
    orderBy: { id: "asc" },
    cursor: pagination.after ? { id: pagination.after } : undefined,
    skip: pagination.after ? 1 : 0,
    take: pagination.first + 1
  });
  return buildConnection(records, pagination.first);
};

export const createCompany = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = createCompanyInputSchema.parse(inputValue);
  const recruiterId = user.role === "ADMIN" ? input.recruiterId : user.id;
  if (!recruiterId) {
    throw badInput("Recruiter ID is required when an admin creates a company.");
  }
  return prisma.company.create({
    data: {
      recruiterId,
      name: input.name,
      industry: input.industry,
      size: input.size,
      logoUrl: input.logoUrl,
      website: input.website
    }
  });
};

export const updateCompany = async (id: string, inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const input = updateCompanyInputSchema.parse(inputValue);
  await ensureCompanyWritable(id, user);
  return prisma.company.update({
    where: { id },
    data: {
      name: input.name,
      industry: input.industry,
      size: input.size,
      logoUrl: input.logoUrl,
      website: input.website
    }
  });
};

export const deleteCompany = async (id: string, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["RECRUITER", "ADMIN"]);
  const company = await ensureCompanyWritable(id, user);
  const demandsCount = await prisma.demand.count({ where: { companyId: company.id } });
  if (demandsCount > 0) {
    throw badInput("Cannot delete a company that still has demands.");
  }
  return prisma.company.delete({ where: { id } });
};

export const listUsers = async (filtersInput: unknown, paginationInput: PaginationArgs | null | undefined, currentUser: AuthUser | null) => {
  requireRole(currentUser, ["ADMIN"]);
  const filters = usersFiltersSchema.parse(filtersInput ?? {});
  const pagination = parsePagination(paginationInput);
  const records = await prisma.user.findMany({
    where: {
      role: filters.role,
      emailVerified: filters.emailVerified,
      isActive: filters.isActive,
      email: filters.search ? { contains: filters.search, mode: "insensitive" } : undefined
    },
    orderBy: { id: "asc" },
    cursor: pagination.after ? { id: pagination.after } : undefined,
    skip: pagination.after ? 1 : 0,
    take: pagination.first + 1
  });
  return buildConnection(records, pagination.first);
};

export const updateUserAdmin = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const admin = requireRole(currentUser, ["ADMIN"]);
  const input = updateUserAdminInputSchema.parse(inputValue);

  if (input.userId === admin.id && input.isActive === false) {
    throw badInput("Admins cannot deactivate their own account.");
  }

  return prisma.user.update({
    where: { id: input.userId },
    data: {
      role: input.role,
      emailVerified: input.emailVerified,
      isActive: input.isActive
    }
  });
};

export const verifyTalent = async (profileId: string, notes: string | undefined, currentUser: AuthUser | null) => {
  requireRole(currentUser, ["ADMIN"]);
  return prisma.talentProfile.update({
    where: { id: profileId },
    data: {
      verificationStatus: "VERIFIED",
      verificationNotes: notes,
      verifiedAt: new Date()
    },
    include: profileInclude
  });
};

export const rejectTalent = async (inputValue: unknown, currentUser: AuthUser | null) => {
  requireRole(currentUser, ["ADMIN"]);
  const input = rejectTalentInputSchema.parse(inputValue);
  return prisma.talentProfile.update({
    where: { id: input.profileId },
    data: {
      verificationStatus: "REJECTED",
      verificationNotes: input.reason,
      verifiedAt: new Date()
    },
    include: profileInclude
  });
};

export const updateDemandApproval = async (inputValue: unknown, currentUser: AuthUser | null) => {
  requireRole(currentUser, ["ADMIN"]);
  const input = updateDemandApprovalInputSchema.parse(inputValue);
  const demand = await prisma.demand.findUnique({ where: { id: input.demandId } });

  if (!demand) {
    throw badInput("Demand not found.");
  }

  const nextStatus =
    input.status ??
    (input.approvalStatus === "APPROVED" ? (demand.status === "DRAFT" ? "ACTIVE" : demand.status) : demand.status);

  return prisma.demand.update({
    where: { id: input.demandId },
    data: {
      approvalStatus: input.approvalStatus,
      approvalNotes: input.approvalNotes,
      hardToFill: input.hardToFill,
      status: input.approvalStatus === "CHANGES_REQUESTED" && input.status === undefined ? "DRAFT" : nextStatus,
      approvedAt: input.approvalStatus === "APPROVED" ? new Date() : null
    },
    include: demandInclude
  });
};

export const listHeadhunterAssignments = async (
  demandId: string | undefined,
  headhunterUserId: string | undefined,
  currentUser: AuthUser | null
) => {
  const user = requireRole(currentUser, ["ADMIN", "HEADHUNTER"]);
  return prisma.headhunterAssignment.findMany({
    where: {
      demandId,
      headhunterUserId: user.role === "HEADHUNTER" ? user.id : headhunterUserId
    },
    include: headhunterAssignmentInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const createHeadhunterAssignment = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const admin = requireRole(currentUser, ["ADMIN"]);
  const input = createHeadhunterAssignmentInputSchema.parse(inputValue);
  const headhunter = await prisma.user.findUnique({ where: { id: input.headhunterUserId } });

  if (!headhunter || headhunter.role !== "HEADHUNTER") {
    throw badInput("Selected user must have the HEADHUNTER role.");
  }

  return prisma.headhunterAssignment.upsert({
    where: {
      demandId_headhunterUserId: {
        demandId: input.demandId,
        headhunterUserId: input.headhunterUserId
      }
    },
    update: {
      notes: input.notes,
      assignedByAdminId: admin.id
    },
    create: {
      demandId: input.demandId,
      headhunterUserId: input.headhunterUserId,
      assignedByAdminId: admin.id,
      notes: input.notes
    },
    include: headhunterAssignmentInclude
  });
};

export const listExternalCandidateSubmissions = async (
  demandId: string | undefined,
  status: ExternalCandidateSubmissionStatus | undefined,
  currentUser: AuthUser | null
) => {
  const user = requireRole(currentUser, ["ADMIN", "HEADHUNTER"]);
  return prisma.externalCandidateSubmission.findMany({
    where: {
      demandId,
      status,
      headhunterUserId: user.role === "HEADHUNTER" ? user.id : undefined
    },
    include: externalCandidateSubmissionInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const createExternalCandidateSubmission = async (inputValue: unknown, currentUser: AuthUser | null) => {
  const user = requireRole(currentUser, ["ADMIN", "HEADHUNTER"]);
  const input = createExternalCandidateSubmissionInputSchema.parse(inputValue);

  if (user.role === "HEADHUNTER" && user.id !== input.headhunterUserId) {
    throw forbidden();
  }

  const assignment = await prisma.headhunterAssignment.findUnique({
    where: {
      demandId_headhunterUserId: {
        demandId: input.demandId,
        headhunterUserId: input.headhunterUserId
      }
    }
  });

  if (!assignment) {
    throw badInput("The selected headhunter is not assigned to this demand.");
  }

  return prisma.externalCandidateSubmission.create({
    data: {
      demandId: input.demandId,
      headhunterUserId: input.headhunterUserId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      headline: input.headline,
      summary: input.summary,
      location: input.location,
      availability: input.availability,
      hourlyRate: toDecimal(input.hourlyRate),
      notes: input.notes,
      resumeUrl: input.resumeUrl
    },
    include: externalCandidateSubmissionInclude
  });
};

export const updateExternalCandidateSubmissionStatus = async (inputValue: unknown, currentUser: AuthUser | null) => {
  requireRole(currentUser, ["ADMIN"]);
  const input = updateExternalCandidateSubmissionStatusInputSchema.parse(inputValue);
  return prisma.externalCandidateSubmission.update({
    where: { id: input.submissionId },
    data: {
      status: input.status,
      reviewNotes: input.reviewNotes,
      reviewedAt: new Date()
    },
    include: externalCandidateSubmissionInclude
  });
};

export const constants = {
  userRoles,
  companySizes,
  notificationTypes
};