from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


SeniorityLevel = Literal["JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"]
SkillProficiency = Literal["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]
ParserMode = Literal["heuristic", "llm", "hybrid"]
SourceType = Literal["file", "url", "text"]
EmbeddingType = Literal["profile", "demand", "skill"]
RoleDescriptionMode = Literal["heuristic", "llm"]


class ParsedSkill(BaseModel):
    name: str
    display_name: str
    proficiency: SkillProficiency


class ParsedExperience(BaseModel):
    role: str
    company: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None


class ParsedCertification(BaseModel):
    name: str
    issuer: str | None = None
    issue_date: str | None = None


class ParsedEducation(BaseModel):
    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    start_date: str | None = None
    end_date: str | None = None


class ParsedResume(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    headline: str | None = None
    summary: str | None = None
    skills: list[ParsedSkill] = Field(default_factory=list)
    experience: list[ParsedExperience] = Field(default_factory=list)
    certifications: list[ParsedCertification] = Field(default_factory=list)
    education: list[ParsedEducation] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    seniority_level: SeniorityLevel = "JUNIOR"
    career_trajectory: str | None = None
    parser_mode: ParserMode = "heuristic"
    source_type: SourceType = "text"
    extracted_text_preview: str | None = None


class EmbeddingRequest(BaseModel):
    text: str
    type: EmbeddingType
    entity_id: str | None = None


class EmbeddingResponse(BaseModel):
    embedding: list[float]
    dimensions: int
    provider: str
    type: EmbeddingType
    entity_id: str | None = None


class ScoreBreakdown(BaseModel):
    skill_match: float
    experience_fit: float
    availability_fit: float
    pricing_fit: float
    location_fit: float
    cultural_fit: float
    feedback_score: float


class MatchCandidate(BaseModel):
    talent_profile_id: str
    match_score: float
    breakdown: ScoreBreakdown
    explanation: str


class MatchCandidatesRequest(BaseModel):
    demand_id: str
    limit: int = Field(default=10, ge=1, le=50)


class MatchCandidatesResponse(BaseModel):
    demand_id: str
    matches: list[MatchCandidate]


class SemanticSearchRequest(BaseModel):
    query: str
    filters: dict[str, object] = Field(default_factory=dict)
    limit: int = Field(default=10, ge=1, le=50)


class SemanticSearchResult(BaseModel):
    talent_profile_id: str
    relevance_score: float
    headline: str | None = None
    summary: str | None = None


class SemanticSearchResponse(BaseModel):
    query: str
    results: list[SemanticSearchResult]


class RoleDescriptionRequest(BaseModel):
    raw_description: str
    skills: list[str] = Field(default_factory=list)
    location: str | None = None
    company_name: str | None = None
    company_industry: str | None = None


class SalaryBandSuggestion(BaseModel):
    min: int
    max: int
    currency: str = "USD"
    rationale: str


class RoleDescriptionResponse(BaseModel):
    title: str
    summary: str
    responsibilities: list[str]
    requirements: list[str]
    nice_to_haves: list[str]
    recommended_skills: list[str]
    salary_band: SalaryBandSuggestion
    experience_level: SeniorityLevel
    enhanced_description: str
    generation_mode: RoleDescriptionMode