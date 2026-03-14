import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { Prisma } from "@prisma/client";
import cors from "cors";
import type { CorsOptions } from "cors";
import dotenv from "dotenv";
import express from "express";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  availabilityWindows,
  companySizes,
  demandApprovalStatuses,
  demandStatuses,
  externalCandidateSubmissionStatuses,
  interviewResponseStatuses,
  interviewStatuses,
  forgotPasswordInputSchema,
  generateRoleDescriptionInputSchema,
  loginInputSchema,
  notificationTypes,
  offerStatuses,
  remotePolicies,
  refreshTokenInputSchema,
  registerInputSchema,
  resetPasswordInputSchema,
  seniorityLevels,
  shortlistStatuses,
  storeGeneratedDocumentInputSchema,
  skillCategories,
  skillProficiencies,
  smartSearchSkillModes,
  talentInterestStatuses,
  uploadAssetTypes,
  type AuthUser,
  type ExternalCandidateSubmissionStatus,
  type UserRole
} from "@atm/shared";
import { GraphQLError } from "graphql";
import { verifyAccessToken, signAuthTokens, signResetToken, verifyRefreshToken, verifyResetToken } from "./auth/jwt.js";
import { hashPassword, verifyPassword } from "./auth/password.js";
import { enforceRateLimit } from "./auth/rate-limit.js";
import { prisma } from "./lib/prisma.js";
import { sendWelcomeEmail } from "./services/email.js";
import { getAdminAnalytics, getRecruiterAnalytics } from "./services/analytics.js";
import { getAdminDashboard, getRecruiterDashboard } from "./services/dashboard.js";
import {
  acceptOffer,
  cancelInterview,
  canViewProfilePricing,
  createExternalCandidateSubmission,
  createHeadhunterAssignment,
  createCompany,
  createDemand,
  createOffer,
  createTalentProfile,
  declineOffer,
  deleteCompany,
  generateShortlist,
  getCompany,
  getDemand,
  getMyMatches,
  getMyProfile,
  listNotifications,
  markNotificationRead,
  getShortlistForDemand,
  getSkillCategories,
  getSkills,
  getTalentProfile,
  listExternalCandidateSubmissions,
  listHeadhunterAssignments,
  listCompanies,
  listDemands,
  listMyDemands,
  listTalentProfiles,
  listUsers,
  rejectCandidate,
  rejectTalent,
  respondToInterview,
  respondToMatch,
  reviewCandidate,
  scheduleInterview,
  shortlistCandidate,
  smartTalentSearch,
  submitInterviewFeedback,
  unreadCount,
  updateAvailability,
  updateCompany,
  updateDemandApproval,
  updateDemand,
  updateDemandStatus,
  updateExternalCandidateSubmissionStatus,
  updateInterview,
  updateOffer,
  updatePricing,
  updateTalentProfile,
  updateUserAdmin,
  uploadAsset,
  uploadResume,
  verifyTalent
} from "./services/marketplace.js";
import { generateRoleDescription } from "./services/ai-engine.js";
import { createNotification } from "./services/notifications.js";
import { storeGeneratedDocument } from "./services/storage.js";

const currentFileDir = dirname(fileURLToPath(import.meta.url));
const envFileCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
  resolve(currentFileDir, "../.env"),
  resolve(currentFileDir, "../../../.env")
];

for (const envFilePath of envFileCandidates) {
  if (existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath });
  }
}

type ApiContext = {
  currentUser: AuthUser | null;
  ipAddress: string;
};

type AuthArgs<T> = {
  input: T;
};

type PaginationArgs = {
  first?: number;
  after?: string | null;
};

const buildAuthUser = (user: {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
}): AuthUser => ({
  id: user.id,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
  isActive: user.isActive
});

const getBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const getIpAddress = (forwardedForHeader: string | string[] | undefined) => {
  if (Array.isArray(forwardedForHeader)) {
    return forwardedForHeader[0] ?? "unknown";
  }

  return forwardedForHeader?.split(",")[0]?.trim() ?? "unknown";
};

const requireAuth = (context: ApiContext) => {
  if (!context.currentUser) {
    throw new GraphQLError("Authentication required.", {
      extensions: { code: "UNAUTHENTICATED" }
    });
  }

  return context.currentUser;
};

const requireRole = (context: ApiContext, allowedRoles: UserRole[]) => {
  const user = requireAuth(context);

  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError("You do not have access to this resource.", {
      extensions: { code: "FORBIDDEN" }
    });
  }

  return user;
};

const graphqlEnum = (name: string, values: readonly string[]) => `enum ${name} {\n${values.map((value) => `    ${value}`).join("\n")}\n  }`;

const typeDefs = `#graphql
  ${graphqlEnum("UserRole", ["TALENT", "RECRUITER", "ADMIN", "HEADHUNTER"])}
  ${graphqlEnum("SeniorityLevel", seniorityLevels)}
  ${graphqlEnum("AvailabilityWindow", availabilityWindows)}
  ${graphqlEnum("VerificationStatus", ["PENDING", "VERIFIED", "REJECTED"])}
  ${graphqlEnum("SkillCategory", skillCategories)}
  ${graphqlEnum("SkillProficiency", skillProficiencies)}
  ${graphqlEnum("RemotePolicy", remotePolicies)}
  ${graphqlEnum("DemandStatus", demandStatuses)}
  ${graphqlEnum("DemandApprovalStatus", demandApprovalStatuses)}
  ${graphqlEnum("ShortlistStatus", shortlistStatuses)}
  ${graphqlEnum("TalentInterestStatus", talentInterestStatuses)}
  ${graphqlEnum("InterviewStatus", interviewStatuses)}
  ${graphqlEnum("InterviewResponseStatus", interviewResponseStatuses)}
  ${graphqlEnum("OfferStatus", offerStatuses)}
  ${graphqlEnum("CompanySize", companySizes)}
  ${graphqlEnum("NotificationType", notificationTypes)}
  ${graphqlEnum("SmartSearchSkillMode", smartSearchSkillModes)}
  ${graphqlEnum("UploadAssetType", uploadAssetTypes)}
  ${graphqlEnum("ExternalCandidateSubmissionStatus", externalCandidateSubmissionStatuses)}

  type Healthcheck {
    status: String!
    service: String!
  }

  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
  }

  type User {
    id: ID!
    email: String!
    role: UserRole!
    emailVerified: Boolean!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Skill {
    id: ID!
    name: String!
    displayName: String!
    category: SkillCategory!
    createdAt: String!
    updatedAt: String!
  }

  type SkillEdge {
    cursor: String!
    node: Skill!
  }

  type SkillConnection {
    edges: [SkillEdge!]!
    pageInfo: PageInfo!
  }

  type TalentSkill {
    id: ID!
    proficiency: SkillProficiency!
    yearsOfExperience: Int!
    skill: Skill!
  }

  type Experience {
    id: ID!
    title: String!
    companyName: String!
    location: String
    startDate: String!
    endDate: String
    isCurrent: Boolean!
    description: String!
  }

  type Certification {
    id: ID!
    name: String!
    issuer: String!
    issueDate: String
    expirationDate: String
    credentialId: String
    credentialUrl: String
  }

  type Education {
    id: ID!
    institution: String!
    degree: String!
    fieldOfStudy: String
    startDate: String
    endDate: String
    description: String
  }

  type TalentProfile {
    id: ID!
    userId: ID!
    user: User!
    firstName: String!
    lastName: String!
    headline: String!
    summary: String!
    avatarUrl: String
    resumeUrl: String
    resumeParsedData: String
    industries: [String!]!
    seniorityLevel: SeniorityLevel!
    careerTrajectory: String
    availability: AvailabilityWindow!
    availableFrom: String
    hourlyRateMin: Float
    hourlyRateMax: Float
    currency: String!
    locationPreferences: [String!]!
    workVisaEligibility: [String!]!
    identityDocumentUrls: [String!]!
    portfolioUrls: [String!]!
    culturalValues: String
    verificationStatus: VerificationStatus!
    verificationNotes: String
    verifiedAt: String
    profileCompleteness: Int!
    skills: [TalentSkill!]!
    experiences: [Experience!]!
    certifications: [Certification!]!
    educationEntries: [Education!]!
    createdAt: String!
    updatedAt: String!
  }

  type TalentProfileEdge {
    cursor: String!
    node: TalentProfile!
  }

  type TalentProfileConnection {
    edges: [TalentProfileEdge!]!
    pageInfo: PageInfo!
  }

  type Company {
    id: ID!
    recruiterId: ID!
    name: String!
    industry: String!
    size: CompanySize!
    logoUrl: String
    website: String
    createdAt: String!
    updatedAt: String!
  }

  type CompanyEdge {
    cursor: String!
    node: Company!
  }

  type CompanyConnection {
    edges: [CompanyEdge!]!
    pageInfo: PageInfo!
  }

  type DemandSkill {
    id: ID!
    isRequired: Boolean!
    minimumYears: Int
    skill: Skill!
  }

  type Demand {
    id: ID!
    recruiterId: ID!
    companyId: ID!
    title: String!
    description: String!
    aiGeneratedDescription: String
    experienceLevel: SeniorityLevel!
    location: String!
    remotePolicy: RemotePolicy!
    startDate: String
    contractDuration: String
    budgetMin: Float
    budgetMax: Float
    currency: String!
    projectRequirements: String
    status: DemandStatus!
    approvalStatus: DemandApprovalStatus!
    approvalNotes: String
    approvedAt: String
    hardToFill: Boolean!
    company: Company!
    requiredSkills: [DemandSkill!]!
    createdAt: String!
    updatedAt: String!
  }

  type DemandEdge {
    cursor: String!
    node: Demand!
  }

  type DemandConnection {
    edges: [DemandEdge!]!
    pageInfo: PageInfo!
  }

  type Offer {
    id: ID!
    interviewId: ID!
    demandId: ID!
    talentProfileId: ID!
    hourlyRate: Float!
    startDate: String!
    endDate: String
    terms: String!
    status: OfferStatus!
    interview: Interview!
    demand: Demand!
    talentProfile: TalentProfile!
    createdAt: String!
    updatedAt: String!
  }

  type Interview {
    id: ID!
    shortlistId: ID!
    scheduledAt: String!
    duration: Int!
    meetingUrl: String
    status: InterviewStatus!
    talentResponseStatus: InterviewResponseStatus!
    feedback: String
    rating: Int
    shortlist: Shortlist!
    offer: Offer
    createdAt: String!
    updatedAt: String!
  }

  type Shortlist {
    id: ID!
    demandId: ID!
    talentProfileId: ID!
    matchScore: Float!
    scoreBreakdown: String!
    aiExplanation: String!
    status: ShortlistStatus!
    talentStatus: TalentInterestStatus!
    demand: Demand!
    talentProfile: TalentProfile!
    interviews: [Interview!]!
    createdAt: String!
  }

  type UserEdge {
    cursor: String!
    node: User!
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
  }

  type Notification {
    id: ID!
    userId: ID!
    type: NotificationType!
    title: String!
    body: String!
    read: Boolean!
    metadata: String
    createdAt: String!
    updatedAt: String!
  }

  type NotificationEdge {
    cursor: String!
    node: Notification!
  }

  type NotificationConnection {
    edges: [NotificationEdge!]!
    pageInfo: PageInfo!
  }

  type DashboardActivity {
    id: ID!
    type: String!
    title: String!
    description: String!
    occurredAt: String!
    href: String
  }

  type RoleNeedingAttention {
    id: ID!
    reason: String!
    shortlistCount: Int!
    daysOpen: Int!
    demand: Demand!
  }

  type RecruiterDashboard {
    activeRolesCount: Int!
    totalCandidatesInPool: Int!
    interviewsThisWeek: Int!
    averageTimeToShortlistDays: Float!
    recentActivity: [DashboardActivity!]!
    rolesNeedingAttention: [RoleNeedingAttention!]!
  }

  type AdminUserRoleCount {
    role: UserRole!
    count: Int!
  }

  type AdminPendingVerificationProfile {
    id: ID!
    firstName: String!
    lastName: String!
    headline: String!
    createdAt: String!
    user: User!
  }

  type AdminCompanyMetric {
    id: ID!
    name: String!
    industry: String!
    activeDemandCount: Int!
    pendingApprovalsCount: Int!
    hardToFillCount: Int!
    placementsCount: Int!
  }

  type AdminDashboard {
    totalUsers: Int!
    usersByRole: [AdminUserRoleCount!]!
    totalTalentInPool: Int!
    verifiedTalentCount: Int!
    pendingTalentCount: Int!
    activeDemandsCount: Int!
    pendingDemandApprovalsCount: Int!
    placementsThisMonth: Int!
    placementFeesThisMonth: Float!
    hardToFillDemandCount: Int!
    pendingVerificationProfiles: [AdminPendingVerificationProfile!]!
    companyMetrics: [AdminCompanyMetric!]!
  }

  type HiringVelocityPoint {
    label: String!
    averageDays: Float!
    hires: Int!
  }

  type StatusCount {
    status: String!
    count: Int!
  }

  type SkillCount {
    skill: String!
    count: Int!
  }

  type PipelineStageCount {
    stage: String!
    count: Int!
  }

  type RecruiterAnalytics {
    hiringVelocity: [HiringVelocityPoint!]!
    openRolesByStatus: [StatusCount!]!
    topRequestedSkills: [SkillCount!]!
    pipelineConversion: [PipelineStageCount!]!
    averageCostPerHire: Float!
  }

  type TalentPoolGrowthPoint {
    label: String!
    totalProfiles: Int!
    verifiedProfiles: Int!
    pendingProfiles: Int!
    newProfiles: Int!
  }

  type SupplyDemandGapPoint {
    skill: String!
    demandCount: Int!
    supplyCount: Int!
    gap: Int!
  }

  type HiringTimelinePoint {
    company: String!
    averageDays: Float!
    hires: Int!
  }

  type DemandMonitoringPoint {
    company: String!
    activeDemands: Int!
    pendingApprovals: Int!
    hardToFill: Int!
    placements: Int!
  }

  type ResourceUtilization {
    placedTalent: Int!
    availableTalent: Int!
    utilizationRate: Float!
  }

  type RevenueMetricPoint {
    label: String!
    placementFees: Float!
    acceptedOffers: Int!
  }

  type TalentPricingTrendPoint {
    skill: String!
    averageRate: Float!
  }

  type DemandForecastPoint {
    skill: String!
    currentDemand: Int!
    currentSupply: Int!
    projectedDemand: Int!
    projectedGap: Int!
  }

  type AdminAnalytics {
    talentPoolGrowth: [TalentPoolGrowthPoint!]!
    skillDistribution: [SkillCount!]!
    supplyDemandGap: [SupplyDemandGapPoint!]!
    hiringTimelines: [HiringTimelinePoint!]!
    demandMonitoring: [DemandMonitoringPoint!]!
    resourceUtilization: ResourceUtilization!
    revenueMetrics: [RevenueMetricPoint!]!
    talentPricingTrends: [TalentPricingTrendPoint!]!
    demandForecast: [DemandForecastPoint!]!
  }

  type HeadhunterAssignment {
    id: ID!
    demand: Demand!
    headhunterUser: User!
    assignedByAdmin: User!
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  type ExternalCandidateSubmission {
    id: ID!
    demand: Demand!
    headhunterUser: User!
    firstName: String!
    lastName: String!
    email: String!
    headline: String!
    summary: String!
    location: String!
    availability: AvailabilityWindow!
    hourlyRate: Float
    notes: String
    resumeUrl: String
    status: ExternalCandidateSubmissionStatus!
    reviewNotes: String
    reviewedAt: String
    createdAt: String!
    updatedAt: String!
  }

  type TalentSearchResult {
    id: ID!
    relevanceScore: Float!
    headline: String
    summary: String
    talentProfile: TalentProfile!
  }

  type TalentSearchResultEdge {
    cursor: String!
    node: TalentSearchResult!
  }

  type TalentSearchConnection {
    edges: [TalentSearchResultEdge!]!
    pageInfo: PageInfo!
  }

  type UploadedFile {
    key: String!
    url: String!
    contentType: String!
    assetType: UploadAssetType!
  }

  type UploadAssetPayload {
    file: UploadedFile!
    profile: TalentProfile!
  }

  type AuthTokens {
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
  }

  type AuthPayload {
    user: User!
    tokens: AuthTokens!
  }

  type ForgotPasswordResponse {
    message: String!
    developmentResetToken: String
  }

  type SalaryBandSuggestion {
    min: Int!
    max: Int!
    currency: String!
    rationale: String!
  }

  type RoleDescriptionSuggestion {
    title: String!
    summary: String!
    responsibilities: [String!]!
    requirements: [String!]!
    niceToHaves: [String!]!
    recommendedSkills: [String!]!
    salaryBand: SalaryBandSuggestion!
    experienceLevel: SeniorityLevel!
    enhancedDescription: String!
    generationMode: String!
  }

  type LinkedInAuthProvider {
    enabled: Boolean!
    clientId: String!
    callbackUrl: String!
    status: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    role: UserRole!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RefreshTokenInput {
    refreshToken: String!
  }

  input ForgotPasswordInput {
    email: String!
  }

  input ResetPasswordInput {
    token: String!
    password: String!
  }

  input GenerateRoleDescriptionInput {
    rawDescription: String!
    skills: [String!] = []
    location: String
    companyName: String
    companyIndustry: String
  }

  input PaginationInput {
    first: Int = 10
    after: String
  }

  input TalentSkillInput {
    skillId: ID!
    proficiency: SkillProficiency!
    yearsOfExperience: Int!
  }

  input ExperienceInput {
    title: String!
    companyName: String!
    location: String
    startDate: String!
    endDate: String
    isCurrent: Boolean = false
    description: String!
  }

  input CertificationInput {
    name: String!
    issuer: String!
    issueDate: String
    expirationDate: String
    credentialId: String
    credentialUrl: String
  }

  input EducationInput {
    institution: String!
    degree: String!
    fieldOfStudy: String
    startDate: String
    endDate: String
    description: String
  }

  input CreateTalentProfileInput {
    firstName: String!
    lastName: String!
    headline: String!
    summary: String!
    avatarUrl: String
    resumeUrl: String
    resumeParsedDataJson: String
    industries: [String!]!
    seniorityLevel: SeniorityLevel!
    careerTrajectory: String
    availability: AvailabilityWindow!
    availableFrom: String
    hourlyRateMin: Float
    hourlyRateMax: Float
    currency: String = "USD"
    locationPreferences: [String!]!
    workVisaEligibility: [String!]!
    identityDocumentUrls: [String!]!
    portfolioUrls: [String!]!
    culturalValuesJson: String
    profileCompleteness: Int = 0
    skills: [TalentSkillInput!]!
    experiences: [ExperienceInput!]!
    certifications: [CertificationInput!]!
    educationEntries: [EducationInput!]!
  }

  input UpdateTalentProfileInput {
    firstName: String
    lastName: String
    headline: String
    summary: String
    avatarUrl: String
    resumeUrl: String
    resumeParsedDataJson: String
    industries: [String!]
    seniorityLevel: SeniorityLevel
    careerTrajectory: String
    availability: AvailabilityWindow
    availableFrom: String
    hourlyRateMin: Float
    hourlyRateMax: Float
    currency: String
    locationPreferences: [String!]
    workVisaEligibility: [String!]
    identityDocumentUrls: [String!]
    portfolioUrls: [String!]
    culturalValuesJson: String
    profileCompleteness: Int
    skills: [TalentSkillInput!]
    experiences: [ExperienceInput!]
    certifications: [CertificationInput!]
    educationEntries: [EducationInput!]
  }

  input UploadResumeInput {
    resumeUrl: String!
  }

  input UpdateAvailabilityInput {
    availability: AvailabilityWindow!
    availableFrom: String
  }

  input UpdatePricingInput {
    hourlyRateMin: Float!
    hourlyRateMax: Float!
    currency: String = "USD"
  }

  input TalentProfileFiltersInput {
    search: String
    seniorityLevel: SeniorityLevel
    availability: AvailabilityWindow
    verificationStatus: VerificationStatus
    skillIds: [ID!]
    location: String
  }

  input DemandSkillInput {
    skillId: ID!
    isRequired: Boolean = true
    minimumYears: Int
  }

  input CreateDemandInput {
    companyId: ID!
    title: String!
    description: String!
    aiGeneratedDescription: String
    experienceLevel: SeniorityLevel!
    location: String!
    remotePolicy: RemotePolicy!
    startDate: String
    contractDuration: String
    budgetMin: Float
    budgetMax: Float
    currency: String = "USD"
    projectRequirements: String
    status: DemandStatus = DRAFT
    requiredSkills: [DemandSkillInput!]!
  }

  input UpdateDemandInput {
    companyId: ID
    title: String
    description: String
    aiGeneratedDescription: String
    experienceLevel: SeniorityLevel
    location: String
    remotePolicy: RemotePolicy
    startDate: String
    contractDuration: String
    budgetMin: Float
    budgetMax: Float
    currency: String
    projectRequirements: String
    status: DemandStatus
    requiredSkills: [DemandSkillInput!]
  }

  input DemandFiltersInput {
    search: String
    experienceLevel: SeniorityLevel
    remotePolicy: RemotePolicy
    status: DemandStatus
    approvalStatus: DemandApprovalStatus
    hardToFill: Boolean
    companyId: ID
    recruiterId: ID
  }

  input GenerateShortlistInput {
    demandId: ID!
    limit: Int = 10
  }

  input ShortlistActionInput {
    shortlistId: ID!
  }

  input ScheduleInterviewInput {
    shortlistId: ID!
    scheduledAt: String!
    duration: Int!
    meetingUrl: String
  }

  input UpdateInterviewInput {
    interviewId: ID!
    scheduledAt: String
    duration: Int
    meetingUrl: String
    status: InterviewStatus
  }

  input SubmitInterviewFeedbackInput {
    interviewId: ID!
    feedback: String!
    rating: Int!
  }

  input RespondToMatchInput {
    shortlistId: ID!
    talentStatus: TalentInterestStatus!
  }

  input RespondToInterviewInput {
    interviewId: ID!
    talentResponseStatus: InterviewResponseStatus!
  }

  input CreateOfferInput {
    interviewId: ID!
    demandId: ID!
    talentProfileId: ID!
    hourlyRate: Float!
    startDate: String!
    endDate: String
    terms: String!
    status: OfferStatus = DRAFT
  }

  input UpdateOfferInput {
    offerId: ID!
    interviewId: ID
    demandId: ID
    talentProfileId: ID
    hourlyRate: Float
    startDate: String
    endDate: String
    terms: String
    status: OfferStatus
  }

  input CreateCompanyInput {
    recruiterId: ID
    name: String!
    industry: String!
    size: CompanySize!
    logoUrl: String
    website: String
  }

  input UpdateCompanyInput {
    name: String
    industry: String
    size: CompanySize
    logoUrl: String
    website: String
  }

  input CompanyFiltersInput {
    search: String
    recruiterId: ID
  }

  input UsersFiltersInput {
    search: String
    role: UserRole
    emailVerified: Boolean
    isActive: Boolean
  }

  input UpdateUserAdminInput {
    userId: ID!
    role: UserRole
    emailVerified: Boolean
    isActive: Boolean
  }

  input RejectTalentInput {
    profileId: ID!
    reason: String!
  }

  input UpdateDemandApprovalInput {
    demandId: ID!
    approvalStatus: DemandApprovalStatus!
    approvalNotes: String
    status: DemandStatus
    hardToFill: Boolean
  }

  input CreateHeadhunterAssignmentInput {
    demandId: ID!
    headhunterUserId: ID!
    notes: String
  }

  input CreateExternalCandidateSubmissionInput {
    demandId: ID!
    headhunterUserId: ID!
    firstName: String!
    lastName: String!
    email: String!
    headline: String!
    summary: String!
    location: String!
    availability: AvailabilityWindow!
    hourlyRate: Float
    notes: String
    resumeUrl: String
  }

  input UpdateExternalCandidateSubmissionStatusInput {
    submissionId: ID!
    status: ExternalCandidateSubmissionStatus!
    reviewNotes: String
  }

  input SmartTalentSearchFiltersInput {
    skills: [String!] = []
    skillMode: SmartSearchSkillMode = AND
    industry: String
    seniorityLevel: SeniorityLevel
    availability: AvailabilityWindow
    location: String
    minHourlyRate: Float
    maxHourlyRate: Float
  }

  input UploadAssetInput {
    fileName: String!
    mimeType: String!
    contentBase64: String!
    assetType: UploadAssetType!
  }

  input StoreGeneratedDocumentInput {
    fileName: String!
    mimeType: String!
    contentBase64: String!
    folder: String = "generated-documents"
  }

  input MarkNotificationReadInput {
    notificationId: ID!
  }

  type Query {
    healthcheck: Healthcheck!
    me: User
    linkedInAuthProvider: LinkedInAuthProvider!
    recruiterDashboardAccess: Boolean!
    recruiterDashboard: RecruiterDashboard!
    recruiterAnalytics: RecruiterAnalytics!
    adminDashboard: AdminDashboard!
    adminAnalytics: AdminAnalytics!
    talentProfile(id: ID!): TalentProfile
    talentProfiles(filters: TalentProfileFiltersInput, pagination: PaginationInput): TalentProfileConnection!
    myProfile: TalentProfile
    demand(id: ID!): Demand
    demands(filters: DemandFiltersInput, pagination: PaginationInput): DemandConnection!
    myDemands(pagination: PaginationInput): DemandConnection!
    shortlist(demandId: ID!): [Shortlist!]!
    myMatches: [Shortlist!]!
    skills(search: String, pagination: PaginationInput): SkillConnection!
    skillCategories: [SkillCategory!]!
    smartTalentSearch(query: String!, filters: SmartTalentSearchFiltersInput, pagination: PaginationInput): TalentSearchConnection!
    notifications(userId: ID, unreadOnly: Boolean = false, pagination: PaginationInput): NotificationConnection!
    unreadCount(userId: ID): Int!
    company(id: ID!): Company
    companies(filters: CompanyFiltersInput, pagination: PaginationInput): CompanyConnection!
    users(filters: UsersFiltersInput, pagination: PaginationInput): UserConnection!
    headhunterAssignments(demandId: ID, headhunterUserId: ID): [HeadhunterAssignment!]!
    externalCandidateSubmissions(demandId: ID, status: ExternalCandidateSubmissionStatus): [ExternalCandidateSubmission!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(input: RefreshTokenInput!): AuthPayload!
    forgotPassword(input: ForgotPasswordInput!): ForgotPasswordResponse!
    resetPassword(input: ResetPasswordInput!): AuthPayload!
    generateRoleDescription(input: GenerateRoleDescriptionInput!): RoleDescriptionSuggestion!
    createTalentProfile(input: CreateTalentProfileInput!): TalentProfile!
    updateTalentProfile(input: UpdateTalentProfileInput!): TalentProfile!
    uploadResume(input: UploadResumeInput!): TalentProfile!
    uploadAsset(input: UploadAssetInput!): UploadAssetPayload!
    storeGeneratedDocument(input: StoreGeneratedDocumentInput!): UploadedFile!
    updateAvailability(input: UpdateAvailabilityInput!): TalentProfile!
    updatePricing(input: UpdatePricingInput!): TalentProfile!
    createDemand(input: CreateDemandInput!): Demand!
    updateDemand(id: ID!, input: UpdateDemandInput!): Demand!
    pauseDemand(id: ID!): Demand!
    cancelDemand(id: ID!): Demand!
    fillDemand(id: ID!): Demand!
    generateShortlist(input: GenerateShortlistInput!): [Shortlist!]!
    shortlistCandidate(input: ShortlistActionInput!): Shortlist!
    reviewCandidate(input: ShortlistActionInput!): Shortlist!
    rejectCandidate(input: ShortlistActionInput!): Shortlist!
    respondToMatch(input: RespondToMatchInput!): Shortlist!
    scheduleInterview(input: ScheduleInterviewInput!): Interview!
    updateInterview(input: UpdateInterviewInput!): Interview!
    cancelInterview(id: ID!): Interview!
    submitFeedback(input: SubmitInterviewFeedbackInput!): Interview!
    respondToInterview(input: RespondToInterviewInput!): Interview!
    createOffer(input: CreateOfferInput!): Offer!
    updateOffer(input: UpdateOfferInput!): Offer!
    acceptOffer(id: ID!): Offer!
    declineOffer(id: ID!): Offer!
    markNotificationRead(input: MarkNotificationReadInput!): Notification!
    createCompany(input: CreateCompanyInput!): Company!
    updateCompany(id: ID!, input: UpdateCompanyInput!): Company!
    deleteCompany(id: ID!): Company!
    updateUserAdmin(input: UpdateUserAdminInput!): User!
    verifyTalent(profileId: ID!, notes: String): TalentProfile!
    rejectTalent(input: RejectTalentInput!): TalentProfile!
    updateDemandApproval(input: UpdateDemandApprovalInput!): Demand!
    createHeadhunterAssignment(input: CreateHeadhunterAssignmentInput!): HeadhunterAssignment!
    createExternalCandidateSubmission(input: CreateExternalCandidateSubmissionInput!): ExternalCandidateSubmission!
    updateExternalCandidateSubmissionStatus(input: UpdateExternalCandidateSubmissionStatusInput!): ExternalCandidateSubmission!
  }
`;

const resolvers = {
  Query: {
    healthcheck: () => ({
      status: "ok",
      service: "api"
    }),
    me: (_parent: unknown, _args: Record<string, never>, context: ApiContext) => {
      const user = requireAuth(context);
      return user;
    },
    linkedInAuthProvider: () => ({
      enabled: false,
      clientId: process.env.LINKEDIN_CLIENT_ID ?? "stub-linkedin-client-id",
      callbackUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/callback/linkedin`,
      status: "stubbed-for-mvp"
    }),
    recruiterDashboardAccess: (_parent: unknown, _args: Record<string, never>, context: ApiContext) => {
      requireRole(context, ["RECRUITER", "ADMIN"]);
      return true;
    },
    recruiterDashboard: (_parent: unknown, _args: Record<string, never>, context: ApiContext) => {
      const user = requireRole(context, ["RECRUITER", "ADMIN"]);
      return getRecruiterDashboard(user);
    },
    recruiterAnalytics: (_parent: unknown, _args: Record<string, never>, context: ApiContext) => {
      const user = requireRole(context, ["RECRUITER", "ADMIN"]);
      return getRecruiterAnalytics(user);
    },
    adminDashboard: (_parent: unknown, _args: Record<string, never>, context: ApiContext) => {
      requireRole(context, ["ADMIN"]);
      return getAdminDashboard();
    },
    adminAnalytics: (_parent: unknown, _args: Record<string, never>, context: ApiContext) => {
      requireRole(context, ["ADMIN"]);
      return getAdminAnalytics();
    },
    talentProfile: (_parent: unknown, args: { id: string }, context: ApiContext) => getTalentProfile(args.id, context.currentUser),
    talentProfiles: (_parent: unknown, args: { filters?: unknown; pagination?: PaginationArgs }, context: ApiContext) =>
      listTalentProfiles(args.filters, args.pagination, context.currentUser),
    myProfile: (_parent: unknown, _args: Record<string, never>, context: ApiContext) => getMyProfile(context.currentUser),
    demand: (_parent: unknown, args: { id: string }, context: ApiContext) => getDemand(args.id, context.currentUser),
    demands: (_parent: unknown, args: { filters?: unknown; pagination?: PaginationArgs }, context: ApiContext) =>
      listDemands(args.filters, args.pagination, context.currentUser),
    myDemands: (_parent: unknown, args: { pagination?: PaginationArgs }, context: ApiContext) =>
      listMyDemands(args.pagination, context.currentUser),
    shortlist: (_parent: unknown, args: { demandId: string }, context: ApiContext) => getShortlistForDemand(args.demandId, context.currentUser),
    myMatches: (_parent: unknown, _args: Record<string, never>, context: ApiContext) => getMyMatches(context.currentUser),
    skills: (_parent: unknown, args: { search?: string; pagination?: PaginationArgs }, context: ApiContext) =>
      getSkills(args.search, args.pagination, context.currentUser),
    skillCategories: () => getSkillCategories(),
    smartTalentSearch: (_parent: unknown, args: { query: string; filters?: unknown; pagination?: PaginationArgs }, context: ApiContext) =>
      smartTalentSearch(args.query, args.filters, args.pagination, context.currentUser),
    notifications: (_parent: unknown, args: { userId?: string; unreadOnly?: boolean; pagination?: PaginationArgs }, context: ApiContext) =>
      listNotifications({ userId: args.userId, unreadOnly: args.unreadOnly }, args.pagination, context.currentUser),
    unreadCount: (_parent: unknown, args: { userId?: string }, context: ApiContext) => unreadCount(args.userId, context.currentUser),
    company: (_parent: unknown, args: { id: string }, context: ApiContext) => getCompany(args.id, context.currentUser),
    companies: (_parent: unknown, args: { filters?: unknown; pagination?: PaginationArgs }, context: ApiContext) =>
      listCompanies(args.filters, args.pagination, context.currentUser),
    users: (_parent: unknown, args: { filters?: unknown; pagination?: PaginationArgs }, context: ApiContext) =>
      listUsers(args.filters, args.pagination, context.currentUser),
    headhunterAssignments: (_parent: unknown, args: { demandId?: string; headhunterUserId?: string }, context: ApiContext) =>
      listHeadhunterAssignments(args.demandId, args.headhunterUserId, context.currentUser),
    externalCandidateSubmissions: (
      _parent: unknown,
      args: { demandId?: string; status?: ExternalCandidateSubmissionStatus },
      context: ApiContext
    ) =>
      listExternalCandidateSubmissions(args.demandId, args.status, context.currentUser)
  },
  Mutation: {
    register: async (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => {
      const input = registerInputSchema.parse(args.input);
      enforceRateLimit("register", `${context.ipAddress}:${input.email.toLowerCase()}`);

      const email = input.email.toLowerCase();
      const passwordHash = await hashPassword(input.password);

      try {
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            role: input.role,
            emailVerified: false
          }
        });

        const authUser = buildAuthUser(user);
        try {
          await createNotification({
            userId: user.id,
            type: "SYSTEM",
            title: "Welcome to AI Talent Marketplace",
            body: "Your account has been created successfully.",
            metadata: { role: user.role }
          });
          await sendWelcomeEmail(user.email, user.role);
        } catch {
          // Keep auth flow non-blocking if notification or email providers are unavailable.
        }
        return {
          user: authUser,
          tokens: signAuthTokens(authUser)
        };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new GraphQLError("An account with that email already exists.", {
            extensions: { code: "BAD_USER_INPUT" }
          });
        }

        throw error;
      }
    },
    login: async (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => {
      const input = loginInputSchema.parse(args.input);
      enforceRateLimit("login", `${context.ipAddress}:${input.email.toLowerCase()}`);

      const user = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() }
      });

      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new GraphQLError("Invalid email or password.", {
          extensions: { code: "BAD_USER_INPUT" }
        });
      }

      if (!user.isActive) {
        throw new GraphQLError("This account has been deactivated by an administrator.", {
          extensions: { code: "FORBIDDEN" }
        });
      }

      const authUser = buildAuthUser(user);
      return {
        user: authUser,
        tokens: signAuthTokens(authUser)
      };
    },
    refreshToken: async (_parent: unknown, args: AuthArgs<unknown>) => {
      const input = refreshTokenInputSchema.parse(args.input);
      const payload = verifyRefreshToken(input.refreshToken);

      if (payload.tokenType !== "refresh") {
        throw new GraphQLError("Invalid refresh token.", {
          extensions: { code: "UNAUTHENTICATED" }
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub }
      });

      if (!user) {
        throw new GraphQLError("User not found.", {
          extensions: { code: "UNAUTHENTICATED" }
        });
      }

      if (!user.isActive) {
        throw new GraphQLError("This account has been deactivated by an administrator.", {
          extensions: { code: "FORBIDDEN" }
        });
      }

      const authUser = buildAuthUser(user);
      return {
        user: authUser,
        tokens: signAuthTokens(authUser)
      };
    },
    forgotPassword: async (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => {
      const input = forgotPasswordInputSchema.parse(args.input);
      enforceRateLimit("forgotPassword", `${context.ipAddress}:${input.email.toLowerCase()}`);
      const user = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() }
      });

      if (!user) {
        return {
          message: "If an account exists for that email, a reset link has been prepared.",
          developmentResetToken: null
        };
      }

      const authUser = buildAuthUser(user);
      return {
        message: "If an account exists for that email, a reset link has been prepared.",
        developmentResetToken: process.env.NODE_ENV === "development" ? signResetToken(authUser) : null
      };
    },
    resetPassword: async (_parent: unknown, args: AuthArgs<unknown>) => {
      const input = resetPasswordInputSchema.parse(args.input);
      const payload = verifyResetToken(input.token);

      if (payload.tokenType !== "reset") {
        throw new GraphQLError("Invalid reset token.", {
          extensions: { code: "BAD_USER_INPUT" }
        });
      }

      const user = await prisma.user.update({
        where: { id: payload.sub },
        data: {
          passwordHash: await hashPassword(input.password)
        }
      });

      const authUser = buildAuthUser(user);
      return {
        user: authUser,
        tokens: signAuthTokens(authUser)
      };
    },
    generateRoleDescription: async (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => {
      requireRole(context, ["RECRUITER", "ADMIN"]);
      const input = generateRoleDescriptionInputSchema.parse(args.input);
      return generateRoleDescription(input);
    },
    createTalentProfile: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      createTalentProfile(args.input, context.currentUser),
    updateTalentProfile: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      updateTalentProfile(args.input, context.currentUser),
    uploadResume: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => uploadResume(args.input, context.currentUser),
    uploadAsset: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => uploadAsset(args.input, context.currentUser),
    storeGeneratedDocument: async (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => {
      requireAuth(context);
      const input = storeGeneratedDocumentInputSchema.parse(args.input);
      return storeGeneratedDocument(input);
    },
    updateAvailability: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      updateAvailability(args.input, context.currentUser),
    updatePricing: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => updatePricing(args.input, context.currentUser),
    createDemand: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => createDemand(args.input, context.currentUser),
    updateDemand: (_parent: unknown, args: { id: string; input: unknown }, context: ApiContext) =>
      updateDemand(args.id, args.input, context.currentUser),
    pauseDemand: (_parent: unknown, args: { id: string }, context: ApiContext) =>
      updateDemandStatus(args.id, "PAUSED", context.currentUser),
    cancelDemand: (_parent: unknown, args: { id: string }, context: ApiContext) =>
      updateDemandStatus(args.id, "CANCELLED", context.currentUser),
    fillDemand: (_parent: unknown, args: { id: string }, context: ApiContext) =>
      updateDemandStatus(args.id, "FILLED", context.currentUser),
    generateShortlist: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      generateShortlist(args.input, context.currentUser),
    shortlistCandidate: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      shortlistCandidate(args.input, context.currentUser),
    reviewCandidate: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      reviewCandidate(args.input, context.currentUser),
    rejectCandidate: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      rejectCandidate(args.input, context.currentUser),
    respondToMatch: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      respondToMatch(args.input, context.currentUser),
    scheduleInterview: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      scheduleInterview(args.input, context.currentUser),
    updateInterview: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      updateInterview(args.input, context.currentUser),
    cancelInterview: (_parent: unknown, args: { id: string }, context: ApiContext) => cancelInterview(args.id, context.currentUser),
    submitFeedback: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      submitInterviewFeedback(args.input, context.currentUser),
    respondToInterview: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      respondToInterview(args.input, context.currentUser),
    createOffer: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => createOffer(args.input, context.currentUser),
    updateOffer: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => updateOffer(args.input, context.currentUser),
    acceptOffer: (_parent: unknown, args: { id: string }, context: ApiContext) => acceptOffer(args.id, context.currentUser),
    declineOffer: (_parent: unknown, args: { id: string }, context: ApiContext) => declineOffer(args.id, context.currentUser),
    markNotificationRead: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => markNotificationRead(args.input, context.currentUser),
    createCompany: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => createCompany(args.input, context.currentUser),
    updateCompany: (_parent: unknown, args: { id: string; input: unknown }, context: ApiContext) =>
      updateCompany(args.id, args.input, context.currentUser),
    deleteCompany: (_parent: unknown, args: { id: string }, context: ApiContext) => deleteCompany(args.id, context.currentUser),
    updateUserAdmin: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => updateUserAdmin(args.input, context.currentUser),
    verifyTalent: (_parent: unknown, args: { profileId: string; notes?: string }, context: ApiContext) =>
      verifyTalent(args.profileId, args.notes, context.currentUser),
    rejectTalent: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) => rejectTalent(args.input, context.currentUser),
    updateDemandApproval: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      updateDemandApproval(args.input, context.currentUser),
    createHeadhunterAssignment: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      createHeadhunterAssignment(args.input, context.currentUser),
    createExternalCandidateSubmission: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      createExternalCandidateSubmission(args.input, context.currentUser),
    updateExternalCandidateSubmissionStatus: (_parent: unknown, args: AuthArgs<unknown>, context: ApiContext) =>
      updateExternalCandidateSubmissionStatus(args.input, context.currentUser)
  },
  User: {
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString()
  },
  TalentProfile: {
    user: (parent: { userId: string }) => prisma.user.findUniqueOrThrow({ where: { id: parent.userId } }),
    resumeParsedData: (parent: { resumeParsedData?: unknown | null }) =>
      parent.resumeParsedData ? JSON.stringify(parent.resumeParsedData) : null,
    culturalValues: (parent: { culturalValues?: unknown | null }) =>
      parent.culturalValues ? JSON.stringify(parent.culturalValues) : null,
    hourlyRateMin: (parent: { hourlyRateMin: Prisma.Decimal | null; userId: string }, _args: unknown, context: ApiContext) =>
      canViewProfilePricing(context.currentUser, parent) && parent.hourlyRateMin ? Number(parent.hourlyRateMin) : null,
    hourlyRateMax: (parent: { hourlyRateMax: Prisma.Decimal | null; userId: string }, _args: unknown, context: ApiContext) =>
      canViewProfilePricing(context.currentUser, parent) && parent.hourlyRateMax ? Number(parent.hourlyRateMax) : null,
    availableFrom: (parent: { availableFrom: Date | null }) => parent.availableFrom?.toISOString() ?? null,
    verifiedAt: (parent: { verifiedAt: Date | null }) => parent.verifiedAt?.toISOString() ?? null,
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString()
  },
  Experience: {
    startDate: (parent: { startDate: Date }) => parent.startDate.toISOString(),
    endDate: (parent: { endDate: Date | null }) => parent.endDate?.toISOString() ?? null
  },
  Certification: {
    issueDate: (parent: { issueDate: Date | null }) => parent.issueDate?.toISOString() ?? null,
    expirationDate: (parent: { expirationDate: Date | null }) => parent.expirationDate?.toISOString() ?? null
  },
  Education: {
    startDate: (parent: { startDate: Date | null }) => parent.startDate?.toISOString() ?? null,
    endDate: (parent: { endDate: Date | null }) => parent.endDate?.toISOString() ?? null
  },
  Company: {
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString()
  },
  Skill: {
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString()
  },
  Demand: {
    budgetMin: (parent: { budgetMin: Prisma.Decimal | null }) => (parent.budgetMin ? Number(parent.budgetMin) : null),
    budgetMax: (parent: { budgetMax: Prisma.Decimal | null }) => (parent.budgetMax ? Number(parent.budgetMax) : null),
    startDate: (parent: { startDate: Date | null }) => parent.startDate?.toISOString() ?? null,
    approvedAt: (parent: { approvedAt: Date | null }) => parent.approvedAt?.toISOString() ?? null,
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString()
  },
  Shortlist: {
    matchScore: (parent: { matchScore: Prisma.Decimal }) => Number(parent.matchScore),
    scoreBreakdown: (parent: { scoreBreakdown: unknown }) => JSON.stringify(parent.scoreBreakdown),
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString()
  },
  Interview: {
    scheduledAt: (parent: { scheduledAt: Date }) => parent.scheduledAt.toISOString(),
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString()
  },
  Offer: {
    hourlyRate: (parent: { hourlyRate: Prisma.Decimal }) => Number(parent.hourlyRate),
    startDate: (parent: { startDate: Date }) => parent.startDate.toISOString(),
    endDate: (parent: { endDate: Date | null }) => parent.endDate?.toISOString() ?? null,
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString()
  },
  HeadhunterAssignment: {
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString()
  },
  ExternalCandidateSubmission: {
    hourlyRate: (parent: { hourlyRate: Prisma.Decimal | null }) => (parent.hourlyRate ? Number(parent.hourlyRate) : null),
    reviewedAt: (parent: { reviewedAt: Date | null }) => parent.reviewedAt?.toISOString() ?? null,
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString()
  },
  Notification: {
    metadata: (parent: { metadata: unknown | null }) => (parent.metadata ? JSON.stringify(parent.metadata) : null),
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString()
  },
  RoleDescriptionSuggestion: {
    niceToHaves: (parent: { nice_to_haves: string[] }) => parent.nice_to_haves,
    recommendedSkills: (parent: { recommended_skills: string[] }) => parent.recommended_skills,
    salaryBand: (parent: { salary_band: { min: number; max: number; currency: string; rationale: string } }) => parent.salary_band,
    experienceLevel: (parent: { experience_level: string }) => parent.experience_level,
    enhancedDescription: (parent: { enhanced_description: string }) => parent.enhanced_description,
    generationMode: (parent: { generation_mode: string }) => parent.generation_mode
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? [
  process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  "http://localhost:8081"
].join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed by CORS."));
  }
};

const corsErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (error instanceof Error && error.message === "Origin not allowed by CORS.") {
    res.status(403).json({
      error: "Origin not allowed by CORS."
    });
    return;
  }

  next(error);
};

const buildApiContext = async (headers: {
  authorization?: string;
  "x-forwarded-for"?: string | string[];
}) => {
  const bearerToken = getBearerToken(headers.authorization);
  const ipAddress = getIpAddress(headers["x-forwarded-for"]);

  if (!bearerToken) {
    return {
      currentUser: null,
      ipAddress
    } satisfies ApiContext;
  }

  try {
    const payload = verifyAccessToken(bearerToken);

    if (payload.tokenType !== "access") {
      return {
        currentUser: null,
        ipAddress
      } satisfies ApiContext;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (user && !user.isActive) {
      return {
        currentUser: null,
        ipAddress
      } satisfies ApiContext;
    }

    return {
      currentUser: user ? buildAuthUser(user) : null,
      ipAddress
    } satisfies ApiContext;
  } catch {
    return {
      currentUser: null,
      ipAddress
    } satisfies ApiContext;
  }
};

const validateRequiredEnv = () => {
  const required = ["DATABASE_URL", "JWT_SECRET"] as const;
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};

const bootstrap = async () => {
  validateRequiredEnv();
  await server.start();

  const app = express();

  app.use(
    cors(corsOptions)
  );
  app.use(corsErrorHandler);
  app.use(express.json({ limit: "10mb" }));

  app.get("/healthz", (_req, res) => {
    res.json({ status: "ok", service: "api" });
  });

  const graphqlMiddleware = expressMiddleware(server, {
    context: async ({ req }) => buildApiContext(req.headers)
  }) as unknown as RequestHandler;

  app.use("/graphql", graphqlMiddleware);

  const httpServer = app.listen(port, host);

  await new Promise<void>((resolve) => {
    httpServer.on("listening", () => resolve());
  });

  console.log(`GraphQL API ready at http://${host}:${port}/graphql`);
};

bootstrap().catch((error: unknown) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
