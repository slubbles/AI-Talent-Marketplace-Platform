import type {
  AvailabilityWindow,
  SkillProficiency,
  TalentProfileFilters,
  UploadAssetType
} from "@atm/shared";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { graphQLRequest } from "../lib/graphql";
import { useAuth } from "./auth-provider";

type SkillDraft = {
  id: string;
  skillId: string;
  displayName: string;
  proficiency: SkillProficiency;
  yearsOfExperience: number;
};

type ExperienceDraft = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
};

type CertificationDraft = {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate: string;
  credentialId: string;
  credentialUrl: string;
};

type EducationDraft = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
};

type TalentProfileRecord = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  avatarUrl: string | null;
  resumeUrl: string | null;
  resumeParsedData: string | null;
  industries: string[];
  seniorityLevel: "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
  careerTrajectory: string | null;
  availability: AvailabilityWindow;
  availableFrom: string | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  currency: string;
  locationPreferences: string[];
  workVisaEligibility: string[];
  identityDocumentUrls: string[];
  portfolioUrls: string[];
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationNotes: string | null;
  profileCompleteness: number;
  skills: Array<{
    id: string;
    proficiency: SkillProficiency;
    yearsOfExperience: number;
    skill: {
      id: string;
      displayName: string;
    };
  }>;
  experiences: Array<{
    id: string;
    title: string;
    companyName: string;
    location: string | null;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate: string | null;
    expirationDate: string | null;
    credentialId: string | null;
    credentialUrl: string | null;
  }>;
  educationEntries: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }>;
};

export type TalentProfileDraft = {
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  industries: string[];
  seniorityLevel: "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
  careerTrajectory: string;
  availability: AvailabilityWindow;
  availableFrom: string;
  hourlyRateMin: string;
  hourlyRateMax: string;
  currency: string;
  locationPreferences: string[];
  workVisaEligibility: string[];
  identityDocumentUrls: string[];
  portfolioUrls: string[];
  skills: SkillDraft[];
  experiences: ExperienceDraft[];
  certifications: CertificationDraft[];
  educationEntries: EducationDraft[];
  resumeUrl: string;
  avatarUrl: string;
};

type SupportingDocumentKind = "IDENTITY" | "CERTIFICATION";

type TalentProfileContextValue = {
  draft: TalentProfileDraft;
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isUploadingResume: boolean;
  profile: TalentProfileRecord | null;
  refreshProfile: () => Promise<void>;
  saveProfile: () => Promise<TalentProfileRecord>;
  searchSkills: (search: string) => Promise<Array<{ id: string; displayName: string }>>;
  setDraft: React.Dispatch<React.SetStateAction<TalentProfileDraft>>;
  uploadResumeAsset: (fileName: string, mimeType: string, contentBase64: string) => Promise<TalentProfileRecord>;
  uploadSupportingDocument: (fileName: string, mimeType: string, contentBase64: string, kind: SupportingDocumentKind) => Promise<string>;
};

const TalentProfileContext = createContext<TalentProfileContextValue | null>(null);

const profileSelection = `
  id
  userId
  firstName
  lastName
  headline
  summary
  avatarUrl
  resumeUrl
  resumeParsedData
  industries
  seniorityLevel
  careerTrajectory
  availability
  availableFrom
  hourlyRateMin
  hourlyRateMax
  currency
  locationPreferences
  workVisaEligibility
  identityDocumentUrls
  portfolioUrls
  verificationStatus
  verificationNotes
  profileCompleteness
  skills {
    id
    proficiency
    yearsOfExperience
    skill {
      id
      displayName
    }
  }
  experiences {
    id
    title
    companyName
    location
    startDate
    endDate
    isCurrent
    description
  }
  certifications {
    id
    name
    issuer
    issueDate
    expirationDate
    credentialId
    credentialUrl
  }
  educationEntries {
    id
    institution
    degree
    fieldOfStudy
    startDate
    endDate
    description
  }
`;

const myProfileQuery = `#graphql
  query MobileMyProfile {
    myProfile {
      ${profileSelection}
    }
  }
`;

const createTalentProfileMutation = `#graphql
  mutation MobileCreateTalentProfile($input: CreateTalentProfileInput!) {
    createTalentProfile(input: $input) {
      ${profileSelection}
    }
  }
`;

const updateTalentProfileMutation = `#graphql
  mutation MobileUpdateTalentProfile($input: UpdateTalentProfileInput!) {
    updateTalentProfile(input: $input) {
      ${profileSelection}
    }
  }
`;

const uploadAssetMutation = `#graphql
  mutation MobileUploadAsset($input: UploadAssetInput!) {
    uploadAsset(input: $input) {
      file {
        key
        url
        contentType
        assetType
      }
      profile {
        ${profileSelection}
      }
    }
  }
`;

const storeDocumentMutation = `#graphql
  mutation MobileStoreDocument($input: StoreGeneratedDocumentInput!) {
    storeGeneratedDocument(input: $input) {
      key
      url
      contentType
    }
  }
`;

const searchSkillsQuery = `#graphql
  query MobileSkills($search: String) {
    skills(search: $search, pagination: { first: 8 }) {
      edges {
        node {
          id
          name
          displayName
        }
      }
    }
  }
`;

const createDraftId = () => `draft-${Math.random().toString(36).slice(2, 10)}`;

const splitEmailName = (email: string | undefined) => {
  const local = email?.split("@")[0] ?? "talent";
  const parts = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

  return {
    firstName: parts[0] ?? "Talent",
    lastName: parts.slice(1).join(" ") || "Member"
  };
};

const createEmptyDraft = (seed?: { firstName?: string; lastName?: string }) => ({
  firstName: seed?.firstName ?? "",
  lastName: seed?.lastName ?? "",
  headline: "",
  summary: "",
  industries: [],
  seniorityLevel: "MID" as const,
  careerTrajectory: "",
  availability: "ONE_MONTH" as const,
  availableFrom: "",
  hourlyRateMin: "",
  hourlyRateMax: "",
  currency: "USD",
  locationPreferences: [],
  workVisaEligibility: [],
  identityDocumentUrls: [],
  portfolioUrls: [],
  skills: [],
  experiences: [],
  certifications: [],
  educationEntries: [],
  resumeUrl: "",
  avatarUrl: ""
});

const parseCsv = (values: string[]) => values.map((value) => value.trim()).filter(Boolean);

const computeProfileCompleteness = (draft: TalentProfileDraft) => {
  const checks = [
    draft.firstName.trim(),
    draft.lastName.trim(),
    draft.headline.trim(),
    draft.summary.trim(),
    draft.skills.length > 0 ? "1" : "",
    draft.experiences.length > 0 ? "1" : "",
    draft.educationEntries.length > 0 ? "1" : "",
    draft.locationPreferences.length > 0 ? "1" : "",
    draft.identityDocumentUrls.length > 0 ? "1" : "",
    draft.resumeUrl.trim()
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const mapProfileToDraft = (profile: TalentProfileRecord): TalentProfileDraft => ({
  firstName: profile.firstName,
  lastName: profile.lastName,
  headline: profile.headline,
  summary: profile.summary,
  industries: profile.industries,
  seniorityLevel: profile.seniorityLevel,
  careerTrajectory: profile.careerTrajectory ?? "",
  availability: profile.availability,
  availableFrom: profile.availableFrom?.slice(0, 10) ?? "",
  hourlyRateMin: profile.hourlyRateMin?.toString() ?? "",
  hourlyRateMax: profile.hourlyRateMax?.toString() ?? "",
  currency: profile.currency,
  locationPreferences: profile.locationPreferences,
  workVisaEligibility: profile.workVisaEligibility,
  identityDocumentUrls: profile.identityDocumentUrls,
  portfolioUrls: profile.portfolioUrls,
  skills: profile.skills.map((skill) => ({
    id: skill.id,
    skillId: skill.skill.id,
    displayName: skill.skill.displayName,
    proficiency: skill.proficiency,
    yearsOfExperience: skill.yearsOfExperience
  })),
  experiences: profile.experiences.map((experience) => ({
    id: experience.id,
    title: experience.title,
    companyName: experience.companyName,
    location: experience.location ?? "",
    startDate: experience.startDate.slice(0, 10),
    endDate: experience.endDate?.slice(0, 10) ?? "",
    isCurrent: experience.isCurrent,
    description: experience.description
  })),
  certifications: profile.certifications.map((certification) => ({
    id: certification.id,
    name: certification.name,
    issuer: certification.issuer,
    issueDate: certification.issueDate?.slice(0, 10) ?? "",
    expirationDate: certification.expirationDate?.slice(0, 10) ?? "",
    credentialId: certification.credentialId ?? "",
    credentialUrl: certification.credentialUrl ?? ""
  })),
  educationEntries: profile.educationEntries.map((entry) => ({
    id: entry.id,
    institution: entry.institution,
    degree: entry.degree,
    fieldOfStudy: entry.fieldOfStudy ?? "",
    startDate: entry.startDate?.slice(0, 10) ?? "",
    endDate: entry.endDate?.slice(0, 10) ?? "",
    description: entry.description ?? ""
  })),
  resumeUrl: profile.resumeUrl ?? "",
  avatarUrl: profile.avatarUrl ?? ""
});

export function TalentProfileProvider({ children }: { children: React.ReactNode }) {
  const { clearPendingRegistration, pendingRegistration, session } = useAuth();
  const fallbackNames = useMemo(() => pendingRegistration ?? splitEmailName(session?.user.email), [pendingRegistration, session?.user.email]);
  const [profile, setProfile] = useState<TalentProfileRecord | null>(null);
  const [draft, setDraft] = useState<TalentProfileDraft>(createEmptyDraft(fallbackNames));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.tokens.accessToken) {
      setProfile(null);
      setDraft(createEmptyDraft(fallbackNames));
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await graphQLRequest<{ myProfile: TalentProfileRecord | null }>(myProfileQuery, undefined, session.tokens.accessToken);
        setProfile(response.myProfile);
        setDraft(response.myProfile ? mapProfileToDraft(response.myProfile) : createEmptyDraft(fallbackNames));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load profile.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [fallbackNames, session?.tokens.accessToken]);

  const refreshProfile = async () => {
    if (!session?.tokens.accessToken) {
      return;
    }

    const response = await graphQLRequest<{ myProfile: TalentProfileRecord | null }>(myProfileQuery, undefined, session.tokens.accessToken);
    setProfile(response.myProfile);
    setDraft(response.myProfile ? mapProfileToDraft(response.myProfile) : createEmptyDraft(fallbackNames));
  };

  const searchSkills = async (search: string) => {
    if (!session?.tokens.accessToken || search.trim().length < 2) {
      return [];
    }

    const response = await graphQLRequest<{
      skills: { edges: Array<{ node: { id: string; name: string; displayName: string } }> };
    }>(searchSkillsQuery, { search }, session.tokens.accessToken);

    return response.skills.edges.map((edge) => ({ id: edge.node.id, displayName: edge.node.displayName }));
  };

  const buildProfileInput = async (profileDraft: TalentProfileDraft) => {
    const resolvedSkills = profileDraft.skills
      .filter((skill) => skill.skillId)
      .map((skill) => ({
        skillId: skill.skillId,
        proficiency: skill.proficiency,
        yearsOfExperience: skill.yearsOfExperience
      }));

    return {
      firstName: profileDraft.firstName.trim(),
      lastName: profileDraft.lastName.trim(),
      headline: profileDraft.headline.trim() || `${profileDraft.firstName.trim()} ${profileDraft.lastName.trim()}`.trim(),
      summary: profileDraft.summary.trim() || "Talent profile created from the mobile onboarding flow.",
      avatarUrl: profileDraft.avatarUrl.trim() || undefined,
      resumeUrl: profileDraft.resumeUrl.trim() || undefined,
      industries: parseCsv(profileDraft.industries),
      seniorityLevel: profileDraft.seniorityLevel,
      careerTrajectory: profileDraft.careerTrajectory.trim() || undefined,
      availability: profileDraft.availability,
      availableFrom: profileDraft.availableFrom || undefined,
      hourlyRateMin: profileDraft.hourlyRateMin ? Number(profileDraft.hourlyRateMin) : undefined,
      hourlyRateMax: profileDraft.hourlyRateMax ? Number(profileDraft.hourlyRateMax) : undefined,
      currency: profileDraft.currency.trim().toUpperCase() || "USD",
      locationPreferences: parseCsv(profileDraft.locationPreferences),
      workVisaEligibility: parseCsv(profileDraft.workVisaEligibility),
      identityDocumentUrls: profileDraft.identityDocumentUrls,
      portfolioUrls: parseCsv(profileDraft.portfolioUrls),
      culturalValuesJson: undefined,
      profileCompleteness: computeProfileCompleteness(profileDraft),
      skills: resolvedSkills,
      experiences: profileDraft.experiences.map((experience) => ({
        title: experience.title.trim(),
        companyName: experience.companyName.trim(),
        location: experience.location.trim() || undefined,
        startDate: experience.startDate,
        endDate: experience.isCurrent ? null : experience.endDate || null,
        isCurrent: experience.isCurrent,
        description: experience.description.trim() || experience.title.trim()
      })),
      certifications: profileDraft.certifications.map((certification) => ({
        name: certification.name.trim(),
        issuer: certification.issuer.trim() || "Unknown issuer",
        issueDate: certification.issueDate || null,
        expirationDate: certification.expirationDate || null,
        credentialId: certification.credentialId.trim() || undefined,
        credentialUrl: certification.credentialUrl.trim() || undefined
      })),
      educationEntries: profileDraft.educationEntries.map((entry) => ({
        institution: entry.institution.trim(),
        degree: entry.degree.trim(),
        fieldOfStudy: entry.fieldOfStudy.trim() || undefined,
        startDate: entry.startDate || null,
        endDate: entry.endDate || null,
        description: entry.description.trim() || undefined
      }))
    };
  };

  const ensureProfileExists = async () => {
    if (profile || !session?.tokens.accessToken) {
      return profile;
    }

    const placeholderDraft = createEmptyDraft(fallbackNames);
    const input = await buildProfileInput(placeholderDraft);
    const response = await graphQLRequest<{ createTalentProfile: TalentProfileRecord }>(
      createTalentProfileMutation,
      { input },
      session.tokens.accessToken
    );
    setProfile(response.createTalentProfile);
    setDraft(mapProfileToDraft(response.createTalentProfile));
    return response.createTalentProfile;
  };

  const saveProfile = async () => {
    if (!session?.tokens.accessToken) {
      throw new Error("Sign in again to continue profile setup.");
    }

    setIsSaving(true);
    setError(null);

    try {
      const input = await buildProfileInput(draft);
      const response = await graphQLRequest<{
        createTalentProfile?: TalentProfileRecord;
        updateTalentProfile?: TalentProfileRecord;
      }>(
        profile ? updateTalentProfileMutation : createTalentProfileMutation,
        { input },
        session.tokens.accessToken
      );

      const nextProfile = response.updateTalentProfile ?? response.createTalentProfile;
      if (!nextProfile) {
        throw new Error("Profile save did not return updated data.");
      }

      setProfile(nextProfile);
      setDraft(mapProfileToDraft(nextProfile));
      await clearPendingRegistration();
      return nextProfile;
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not save your profile.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadResumeAsset = async (fileName: string, mimeType: string, contentBase64: string) => {
    if (!session?.tokens.accessToken) {
      throw new Error("Sign in again to continue profile setup.");
    }

    await ensureProfileExists();
    setIsUploadingResume(true);
    setError(null);

    try {
      const response = await graphQLRequest<{
        uploadAsset: {
          profile: TalentProfileRecord;
        };
      }>(
        uploadAssetMutation,
        { input: { fileName, mimeType, contentBase64, assetType: "RESUME" as UploadAssetType } },
        session.tokens.accessToken
      );

      setProfile(response.uploadAsset.profile);
      setDraft(mapProfileToDraft(response.uploadAsset.profile));
      return response.uploadAsset.profile;
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Could not upload resume.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const uploadSupportingDocument = async (fileName: string, mimeType: string, contentBase64: string, kind: SupportingDocumentKind) => {
    if (!session?.tokens.accessToken) {
      throw new Error("Sign in again to continue profile setup.");
    }

    const currentProfile = await ensureProfileExists();
    const response = await graphQLRequest<{
      storeGeneratedDocument: { key: string; url: string; contentType: string };
    }>(
      storeDocumentMutation,
      {
        input: {
          fileName,
          mimeType,
          contentBase64,
          folder: `talent-documents/${currentProfile?.id ?? "pending"}/${kind.toLowerCase()}`
        }
      },
      session.tokens.accessToken
    );

    const url = response.storeGeneratedDocument.url;
    setDraft((current) => {
      if (kind === "IDENTITY") {
        return {
          ...current,
          identityDocumentUrls: Array.from(new Set([...current.identityDocumentUrls, url]))
        };
      }

      return {
        ...current,
        certifications: [
          ...current.certifications,
          {
            id: createDraftId(),
            name: fileName.replace(/\.[^.]+$/, ""),
            issuer: "",
            issueDate: "",
            expirationDate: "",
            credentialId: "",
            credentialUrl: url
          }
        ]
      };
    });

    return url;
  };

  return (
    <TalentProfileContext.Provider
      value={{
        draft,
        error,
        isLoading,
        isSaving,
        isUploadingResume,
        profile,
        refreshProfile,
        saveProfile,
        searchSkills,
        setDraft,
        uploadResumeAsset,
        uploadSupportingDocument
      }}
    >
      {children}
    </TalentProfileContext.Provider>
  );
}

export function useTalentProfile() {
  const value = useContext(TalentProfileContext);

  if (!value) {
    throw new Error("useTalentProfile must be used within TalentProfileProvider.");
  }

  return value;
}