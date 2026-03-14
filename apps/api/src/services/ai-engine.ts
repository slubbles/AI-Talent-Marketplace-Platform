export type ParsedResumeResponse = {
  full_name: string | null;
  headline: string | null;
  summary: string | null;
  skills: Array<{
    name: string;
    display_name: string;
    proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  }>;
  experience: Array<{
    role: string;
    company: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
  }>;
  certifications: Array<{
    name: string;
    issuer: string | null;
    issue_date: string | null;
  }>;
  education: Array<{
    institution: string;
    degree: string | null;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
  }>;
  industries: string[];
  seniority_level: "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
  career_trajectory: string | null;
};

type MatchCandidateResponse = {
  talent_profile_id: string;
  match_score: number;
  breakdown: Record<string, number>;
  explanation: string;
};

type MatchCandidatesResponse = {
  demand_id: string;
  matches: MatchCandidateResponse[];
};

type SemanticSearchResponse = {
  query: string;
  results: Array<{
    talent_profile_id: string;
    relevance_score: number;
    headline: string | null;
    summary: string | null;
  }>;
};

export type RoleDescriptionResponse = {
  title: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  nice_to_haves: string[];
  recommended_skills: string[];
  salary_band: {
    min: number;
    max: number;
    currency: string;
    rationale: string;
  };
  experience_level: "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
  enhanced_description: string;
  generation_mode: "heuristic" | "llm";
};

const normalizeLocalAiUrl = (url: string) => url.replace("http://localhost:", "http://127.0.0.1:");

const aiEngineBaseUrl = () => normalizeLocalAiUrl(process.env.AI_ENGINE_URL ?? "http://127.0.0.1:8000");
const aiEngineRequestTimeoutMs = 15_000;

const internalHeaders = (): Record<string, string> => {
  const key = process.env.INTERNAL_API_KEY;
  return key ? { "X-Internal-Api-Key": key } : {};
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `AI engine request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

const aiEngineFetch = (path: string, init: RequestInit) => fetch(`${aiEngineBaseUrl()}${path}`, {
  ...init,
  signal: AbortSignal.timeout(aiEngineRequestTimeoutMs)
});

export const parseResumeFromUrl = async (resumeUrl: string): Promise<ParsedResumeResponse> => {
  const response = await aiEngineFetch("/parse-resume", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...internalHeaders()
    },
    body: JSON.stringify({ resumeUrl })
  });

  return parseJsonResponse<ParsedResumeResponse>(response);
};

export const parseResumeFromUpload = async (
  fileName: string,
  mimeType: string,
  contentBase64: string
): Promise<ParsedResumeResponse> => {
  const formData = new FormData();
  const buffer = Buffer.from(contentBase64, "base64");
  const file = new Blob([buffer], { type: mimeType });

  formData.append("file", file, fileName);

  const response = await aiEngineFetch("/parse-resume", {
    method: "POST",
    headers: internalHeaders(),
    body: formData
  });

  return parseJsonResponse<ParsedResumeResponse>(response);
};

export const generateShortlistMatches = async (demandId: string, limit: number): Promise<MatchCandidatesResponse> => {
  const response = await aiEngineFetch("/match-candidates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...internalHeaders()
    },
    body: JSON.stringify({ demand_id: demandId, limit })
  });

  return parseJsonResponse<MatchCandidatesResponse>(response);
};

export const semanticSearchProfiles = async (
  query: string,
  filters: Record<string, unknown>,
  limit: number
): Promise<SemanticSearchResponse> => {
  const response = await aiEngineFetch("/semantic-search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...internalHeaders()
    },
    body: JSON.stringify({ query, filters, limit })
  });

  return parseJsonResponse<SemanticSearchResponse>(response);
};

export const generateRoleDescription = async (input: {
  rawDescription: string;
  skills: string[];
  location?: string;
  companyName?: string;
  companyIndustry?: string;
}): Promise<RoleDescriptionResponse> => {
  const response = await aiEngineFetch("/generate-role-description", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...internalHeaders()
    },
    body: JSON.stringify({
      raw_description: input.rawDescription,
      skills: input.skills,
      location: input.location,
      company_name: input.companyName,
      company_industry: input.companyIndustry
    })
  });

  return parseJsonResponse<RoleDescriptionResponse>(response);
};