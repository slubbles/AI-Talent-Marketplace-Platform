export type RoleSkillReference = {
  id: string;
  isRequired: boolean;
  minimumYears: number | null;
  skill: {
    id: string;
    name: string;
    displayName: string;
    category: string;
  };
};

export type ShortlistOffer = {
  id: string;
  interviewId?: string;
  demandId?: string;
  talentProfileId?: string;
  hourlyRate: number;
  startDate: string;
  endDate?: string | null;
  terms?: string;
  status: string;
  talentProfile: {
    id?: string;
    firstName: string;
    lastName: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type ShortlistInterview = {
  id: string;
  shortlistId?: string;
  scheduledAt: string;
  duration: number;
  status: string;
  meetingUrl: string | null;
  feedback?: string | null;
  rating?: number | null;
  offer?: ShortlistOffer | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TalentSkillProfile = {
  id: string;
  proficiency: string;
  yearsOfExperience: number;
  skill: {
    id: string;
    name: string;
    displayName: string;
    category: string;
  };
};

export type TalentExperience = {
  id: string;
  title: string;
  companyName: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
};

export type TalentCertification = {
  id: string;
  name: string;
  issuer: string;
  issueDate: string | null;
  expirationDate: string | null;
  credentialUrl: string | null;
};

export type TalentEducation = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
};

export type CandidateProfile = {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  seniorityLevel?: string;
  industries?: string[];
  careerTrajectory: string | null;
  availability: string;
  availableFrom: string | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  currency: string;
  locationPreferences: string[];
  workVisaEligibility: string[];
  portfolioUrls: string[];
  verificationStatus: string;
  skills: TalentSkillProfile[];
  experiences: TalentExperience[];
  certifications: TalentCertification[];
  educationEntries: TalentEducation[];
};

export type ShortlistEntry = {
  id: string;
  demandId: string;
  talentProfileId: string;
  matchScore: number;
  scoreBreakdown: string;
  aiExplanation: string;
  status: string;
  talentStatus: string;
  talentProfile: CandidateProfile;
  interviews: ShortlistInterview[];
};

export type TalentSearchResult = {
  id: string;
  relevanceScore: number;
  headline: string | null;
  summary: string | null;
  talentProfile: CandidateProfile;
};

export type ShortlistDemandSummary = {
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
  requiredSkills: RoleSkillReference[];
};