import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1),
  AI_ENGINE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_GRAPHQL_API_URL: z.string().url().optional(),
  EXPO_PUBLIC_GRAPHQL_API_URL: z.string().url().optional(),
  LINKEDIN_CLIENT_ID: z.string().min(1).optional(),
  LINKEDIN_CLIENT_SECRET: z.string().min(1).optional()
});

export type EnvSchema = z.infer<typeof envSchema>;

export const userRoles = ["TALENT", "RECRUITER", "ADMIN", "HEADHUNTER"] as const;
export type UserRole = (typeof userRoles)[number];

export const seniorityLevels = ["JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"] as const;
export const availabilityWindows = ["IMMEDIATE", "TWO_WEEKS", "ONE_MONTH", "THREE_MONTHS", "NOT_AVAILABLE"] as const;
export const verificationStatuses = ["PENDING", "VERIFIED", "REJECTED"] as const;
export const skillCategories = ["TECHNICAL", "SOFT", "DOMAIN", "TOOL"] as const;
export const skillProficiencies = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
export const remotePolicies = ["ONSITE", "HYBRID", "REMOTE"] as const;
export const demandStatuses = ["DRAFT", "ACTIVE", "PAUSED", "FILLED", "CANCELLED"] as const;
export const demandApprovalStatuses = ["PENDING", "APPROVED", "CHANGES_REQUESTED"] as const;
export const shortlistStatuses = ["AI_SUGGESTED", "RECRUITER_REVIEWED", "SHORTLISTED", "REJECTED"] as const;
export const talentInterestStatuses = ["PENDING", "INTERESTED", "DECLINED"] as const;
export const interviewStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
export const offerStatuses = ["DRAFT", "SENT", "ACCEPTED", "DECLINED", "WITHDRAWN"] as const;
export const companySizes = ["STARTUP", "SMB", "ENTERPRISE"] as const;
export const notificationTypes = ["MATCH_READY", "INTERVIEW_UPDATE", "OFFER_UPDATE", "SYSTEM"] as const;
export const smartSearchSkillModes = ["AND", "OR"] as const;
export const uploadAssetTypes = ["RESUME", "AVATAR"] as const;
export const externalCandidateSubmissionStatuses = ["SUBMITTED", "REVIEWED", "SHORTLISTED", "REJECTED"] as const;

const dateStringSchema = z.string().min(1);
const optionalDateStringSchema = z.string().min(1).nullish();
const uuidSchema = z.string().uuid();
const jsonStringSchema = z.string().min(2).optional();

export const paginationInputSchema = z.object({
  first: z.number().int().min(1).max(50).default(10),
  after: z.string().min(1).optional()
});

export const talentSkillInputSchema = z.object({
  skillId: uuidSchema,
  proficiency: z.enum(skillProficiencies),
  yearsOfExperience: z.number().int().min(0).max(50)
});

export const experienceInputSchema = z.object({
  title: z.string().min(1),
  companyName: z.string().min(1),
  location: z.string().optional(),
  startDate: dateStringSchema,
  endDate: optionalDateStringSchema,
  isCurrent: z.boolean().default(false),
  description: z.string().min(1)
});

export const certificationInputSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  issueDate: optionalDateStringSchema,
  expirationDate: optionalDateStringSchema,
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional()
});

export const educationInputSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().optional(),
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
  description: z.string().optional()
});

export const createTalentProfileInputSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  avatarUrl: z.string().url().optional(),
  resumeUrl: z.string().url().optional(),
  resumeParsedDataJson: jsonStringSchema,
  industries: z.array(z.string().min(1)).default([]),
  seniorityLevel: z.enum(seniorityLevels),
  careerTrajectory: z.string().optional(),
  availability: z.enum(availabilityWindows),
  availableFrom: optionalDateStringSchema,
  hourlyRateMin: z.number().nonnegative().optional(),
  hourlyRateMax: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(3).default("USD"),
  locationPreferences: z.array(z.string().min(1)).default([]),
  workVisaEligibility: z.array(z.string().min(1)).default([]),
  portfolioUrls: z.array(z.string().url()).default([]),
  culturalValuesJson: jsonStringSchema,
  profileCompleteness: z.number().int().min(0).max(100).default(0),
  skills: z.array(talentSkillInputSchema).default([]),
  experiences: z.array(experienceInputSchema).default([]),
  certifications: z.array(certificationInputSchema).default([]),
  educationEntries: z.array(educationInputSchema).default([])
});

export const updateTalentProfileInputSchema = createTalentProfileInputSchema.partial();

export const uploadResumeInputSchema = z.object({
  resumeUrl: z.string().url()
});

export const updateAvailabilityInputSchema = z.object({
  availability: z.enum(availabilityWindows),
  availableFrom: optionalDateStringSchema
});

export const updatePricingInputSchema = z.object({
  hourlyRateMin: z.number().nonnegative(),
  hourlyRateMax: z.number().nonnegative(),
  currency: z.string().min(3).max(3).default("USD")
});

export const demandSkillInputSchema = z.object({
  skillId: uuidSchema,
  isRequired: z.boolean().default(true),
  minimumYears: z.number().int().min(0).max(50).optional()
});

export const createDemandInputSchema = z.object({
  companyId: uuidSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  aiGeneratedDescription: z.string().optional(),
  experienceLevel: z.enum(seniorityLevels),
  location: z.string().min(1),
  remotePolicy: z.enum(remotePolicies),
  startDate: optionalDateStringSchema,
  contractDuration: z.string().optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(3).default("USD"),
  projectRequirements: z.string().optional(),
  status: z.enum(demandStatuses).default("DRAFT"),
  requiredSkills: z.array(demandSkillInputSchema).default([])
});

export const updateDemandInputSchema = createDemandInputSchema.partial();

export const createCompanyInputSchema = z.object({
  recruiterId: uuidSchema.optional(),
  name: z.string().min(1),
  industry: z.string().min(1),
  size: z.enum(companySizes),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional()
});

export const updateCompanyInputSchema = createCompanyInputSchema.omit({ recruiterId: true }).partial();

export const talentProfileFiltersSchema = z.object({
  search: z.string().optional(),
  seniorityLevel: z.enum(seniorityLevels).optional(),
  availability: z.enum(availabilityWindows).optional(),
  verificationStatus: z.enum(verificationStatuses).optional(),
  skillIds: z.array(uuidSchema).optional(),
  location: z.string().optional()
});

export const demandFiltersSchema = z.object({
  search: z.string().optional(),
  experienceLevel: z.enum(seniorityLevels).optional(),
  remotePolicy: z.enum(remotePolicies).optional(),
  status: z.enum(demandStatuses).optional(),
  approvalStatus: z.enum(demandApprovalStatuses).optional(),
  hardToFill: z.boolean().optional(),
  companyId: uuidSchema.optional(),
  recruiterId: uuidSchema.optional()
});

export const usersFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(userRoles).optional(),
  emailVerified: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const companyFiltersSchema = z.object({
  search: z.string().optional(),
  recruiterId: uuidSchema.optional()
});

export const adminDashboardInputSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional()
});

export const updateUserAdminInputSchema = z.object({
  userId: uuidSchema,
  role: z.enum(userRoles).optional(),
  emailVerified: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const rejectTalentInputSchema = z.object({
  profileId: uuidSchema,
  reason: z.string().min(1).max(500)
});

export const updateDemandApprovalInputSchema = z.object({
  demandId: uuidSchema,
  approvalStatus: z.enum(demandApprovalStatuses),
  approvalNotes: z.string().max(1000).optional(),
  status: z.enum(demandStatuses).optional(),
  hardToFill: z.boolean().optional()
});

export const createHeadhunterAssignmentInputSchema = z.object({
  demandId: uuidSchema,
  headhunterUserId: uuidSchema,
  notes: z.string().max(1000).optional()
});

export const createExternalCandidateSubmissionInputSchema = z.object({
  demandId: uuidSchema,
  headhunterUserId: uuidSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  headline: z.string().min(1),
  summary: z.string().min(1),
  location: z.string().min(1),
  availability: z.enum(availabilityWindows),
  hourlyRate: z.number().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
  resumeUrl: z.string().url().optional()
});

export const updateExternalCandidateSubmissionStatusInputSchema = z.object({
  submissionId: uuidSchema,
  status: z.enum(externalCandidateSubmissionStatuses),
  reviewNotes: z.string().max(1000).optional()
});

export const smartTalentSearchFiltersSchema = z.object({
  skills: z.array(z.string().min(1)).default([]),
  skillMode: z.enum(smartSearchSkillModes).default("AND"),
  industry: z.string().optional(),
  seniorityLevel: z.enum(seniorityLevels).optional(),
  availability: z.enum(availabilityWindows).optional(),
  location: z.string().optional(),
  minHourlyRate: z.number().nonnegative().optional(),
  maxHourlyRate: z.number().nonnegative().optional()
});

export const notificationsQueryInputSchema = z.object({
  userId: uuidSchema.optional(),
  unreadOnly: z.boolean().default(false)
});

export const markNotificationReadInputSchema = z.object({
  notificationId: uuidSchema
});

export const uploadAssetInputSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  contentBase64: z.string().min(1),
  assetType: z.enum(uploadAssetTypes)
});

export const storeGeneratedDocumentInputSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  contentBase64: z.string().min(1),
  folder: z.string().min(1).default("generated-documents")
});

export const generateShortlistInputSchema = z.object({
  demandId: uuidSchema,
  limit: z.number().int().min(1).max(25).default(10)
});

export const shortlistActionInputSchema = z.object({
  shortlistId: uuidSchema
});

export const scheduleInterviewInputSchema = z.object({
  shortlistId: uuidSchema,
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(15).max(480),
  meetingUrl: z.string().url().optional()
});

export const updateInterviewInputSchema = z.object({
  interviewId: uuidSchema,
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  meetingUrl: z.string().url().optional(),
  status: z.enum(interviewStatuses).optional()
});

export const submitInterviewFeedbackInputSchema = z.object({
  interviewId: uuidSchema,
  feedback: z.string().min(1),
  rating: z.number().int().min(1).max(5)
});

export const createOfferInputSchema = z.object({
  interviewId: uuidSchema,
  demandId: uuidSchema,
  talentProfileId: uuidSchema,
  hourlyRate: z.number().nonnegative(),
  startDate: dateStringSchema,
  endDate: optionalDateStringSchema,
  terms: z.string().min(1),
  status: z.enum(offerStatuses).default("DRAFT")
});

export const updateOfferInputSchema = createOfferInputSchema.partial().extend({
  offerId: uuidSchema
});

export const generateRoleDescriptionInputSchema = z.object({
  rawDescription: z.string().min(1),
  skills: z.array(z.string().min(1)).default([]),
  location: z.string().optional(),
  companyName: z.string().optional(),
  companyIndustry: z.string().optional()
});

export type SeniorityLevel = (typeof seniorityLevels)[number];
export type AvailabilityWindow = (typeof availabilityWindows)[number];
export type VerificationStatus = (typeof verificationStatuses)[number];
export type SkillCategory = (typeof skillCategories)[number];
export type SkillProficiency = (typeof skillProficiencies)[number];
export type RemotePolicy = (typeof remotePolicies)[number];
export type DemandStatus = (typeof demandStatuses)[number];
export type DemandApprovalStatus = (typeof demandApprovalStatuses)[number];
export type ShortlistStatus = (typeof shortlistStatuses)[number];
export type TalentInterestStatus = (typeof talentInterestStatuses)[number];
export type InterviewStatus = (typeof interviewStatuses)[number];
export type OfferStatus = (typeof offerStatuses)[number];
export type CompanySize = (typeof companySizes)[number];
export type NotificationType = (typeof notificationTypes)[number];
export type SmartSearchSkillMode = (typeof smartSearchSkillModes)[number];
export type UploadAssetType = (typeof uploadAssetTypes)[number];
export type ExternalCandidateSubmissionStatus = (typeof externalCandidateSubmissionStatuses)[number];

export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["TALENT", "RECRUITER"])
});

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

export const refreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1)
});

export const forgotPasswordInputSchema = z.object({
  email: z.string().email()
});

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72)
});

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(userRoles),
  emailVerified: z.boolean(),
  isActive: z.boolean().default(true)
});

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive()
});

export const authPayloadSchema = z.object({
  user: authUserSchema,
  tokens: authTokensSchema
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenInputSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type AuthPayload = z.infer<typeof authPayloadSchema>;
export type PaginationInput = z.infer<typeof paginationInputSchema>;
export type CreateTalentProfileInput = z.infer<typeof createTalentProfileInputSchema>;
export type UpdateTalentProfileInput = z.infer<typeof updateTalentProfileInputSchema>;
export type UploadResumeInput = z.infer<typeof uploadResumeInputSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilityInputSchema>;
export type UpdatePricingInput = z.infer<typeof updatePricingInputSchema>;
export type CreateDemandInput = z.infer<typeof createDemandInputSchema>;
export type UpdateDemandInput = z.infer<typeof updateDemandInputSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanyInputSchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanyInputSchema>;
export type TalentProfileFilters = z.infer<typeof talentProfileFiltersSchema>;
export type DemandFilters = z.infer<typeof demandFiltersSchema>;
export type UsersFilters = z.infer<typeof usersFiltersSchema>;
export type CompanyFilters = z.infer<typeof companyFiltersSchema>;
export type SmartTalentSearchFilters = z.infer<typeof smartTalentSearchFiltersSchema>;
export type NotificationsQueryInput = z.infer<typeof notificationsQueryInputSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadInputSchema>;
export type UploadAssetInput = z.infer<typeof uploadAssetInputSchema>;
export type AdminDashboardInput = z.infer<typeof adminDashboardInputSchema>;
export type UpdateUserAdminInput = z.infer<typeof updateUserAdminInputSchema>;
export type RejectTalentInput = z.infer<typeof rejectTalentInputSchema>;
export type UpdateDemandApprovalInput = z.infer<typeof updateDemandApprovalInputSchema>;
export type CreateHeadhunterAssignmentInput = z.infer<typeof createHeadhunterAssignmentInputSchema>;
export type CreateExternalCandidateSubmissionInput = z.infer<typeof createExternalCandidateSubmissionInputSchema>;
export type UpdateExternalCandidateSubmissionStatusInput = z.infer<typeof updateExternalCandidateSubmissionStatusInputSchema>;
export type GenerateShortlistInput = z.infer<typeof generateShortlistInputSchema>;
export type ShortlistActionInput = z.infer<typeof shortlistActionInputSchema>;
export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewInputSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewInputSchema>;
export type SubmitInterviewFeedbackInput = z.infer<typeof submitInterviewFeedbackInputSchema>;
export type CreateOfferInput = z.infer<typeof createOfferInputSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferInputSchema>;
export type StoreGeneratedDocumentInput = z.infer<typeof storeGeneratedDocumentInputSchema>;
export type GenerateRoleDescriptionInput = z.infer<typeof generateRoleDescriptionInputSchema>;
