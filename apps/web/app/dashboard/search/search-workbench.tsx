"use client";

import { gql } from "@apollo/client";
import { availabilityWindows, seniorityLevels, smartSearchSkillModes, type SmartSearchSkillMode } from "@atm/shared";
import { useEffect, useMemo, useState } from "react";
import { CandidateProfileModal } from "../candidate-profile-modal";
import { createApolloClient } from "../../../lib/apollo-client";
import type { TalentSearchResult } from "../shortlists/types";

type SearchFiltersState = {
  skills: string[];
  skillMode: SmartSearchSkillMode;
  industry: string;
  seniorityLevel: string;
  availability: string;
  location: string;
  minHourlyRate: string;
  maxHourlyRate: string;
};

type SearchRecommendation = {
  roleId: string;
  roleTitle: string;
  prompt: string;
  results: TalentSearchResult[];
};

type SkillOption = {
  id: string;
  displayName: string;
  category: string;
};

type SearchWorkbenchProps = {
  accessToken: string;
  initialQuery: string;
  initialTrajectory: string;
  initialAfter: string;
  initialFilters: SearchFiltersState;
  pageInfo: {
    endCursor: string | null;
    hasNextPage: boolean;
  };
  recommendations: SearchRecommendation[];
  results: TalentSearchResult[];
};

type SkillsQueryResult = {
  skills: {
    edges: Array<{
      node: SkillOption;
    }>;
  };
};

const skillsQuery = gql`
  query SearchSkills($search: String) {
    skills(search: $search, pagination: { first: 8 }) {
      edges {
        node {
          id
          displayName
          category
        }
      }
    }
  }
`;

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatRate = (minimum: number | null | undefined, maximum: number | null | undefined, currency: string) => {
  if (minimum == null || maximum == null) {
    return "Not shared";
  }

  return `${currency} ${minimum} - ${maximum}/hr`;
};

const scoreTone = (score: number) => {
  if (score >= 80) {
    return "is-strong";
  }

  if (score >= 60) {
    return "is-medium";
  }

  return "is-weak";
};

const buildSearchParams = (state: {
  after?: string;
  filters: SearchFiltersState;
  query: string;
  trajectory: string;
}) => {
  const params = new URLSearchParams();

  if (state.query.trim()) {
    params.set("q", state.query.trim());
  }

  if (state.trajectory.trim()) {
    params.set("trajectory", state.trajectory.trim());
  }

  if (state.filters.skills.length > 0) {
    params.set("skills", state.filters.skills.join(","));
  }

  if (state.filters.skillMode !== "AND") {
    params.set("skillMode", state.filters.skillMode);
  }

  if (state.filters.industry.trim()) {
    params.set("industry", state.filters.industry.trim());
  }

  if (state.filters.seniorityLevel) {
    params.set("seniorityLevel", state.filters.seniorityLevel);
  }

  if (state.filters.availability) {
    params.set("availability", state.filters.availability);
  }

  if (state.filters.location.trim()) {
    params.set("location", state.filters.location.trim());
  }

  if (state.filters.minHourlyRate.trim()) {
    params.set("minRate", state.filters.minHourlyRate.trim());
  }

  if (state.filters.maxHourlyRate.trim()) {
    params.set("maxRate", state.filters.maxHourlyRate.trim());
  }

  if (state.after) {
    params.set("after", state.after);
  }

  return params.toString();
};

const topSkillsForResult = (result: TalentSearchResult, selectedSkills: string[]) => {
  const selected = new Set(selectedSkills.map((skill) => skill.toLowerCase()));
  const sorted = [...result.talentProfile.skills].sort((left, right) => right.yearsOfExperience - left.yearsOfExperience);
  const matched = sorted.filter((skill) => selected.has(skill.skill.displayName.toLowerCase()) || selected.has(skill.skill.name.toLowerCase()));

  if (matched.length > 0) {
    return matched.slice(0, 5).map((skill) => skill.skill.displayName);
  }

  return sorted.slice(0, 5).map((skill) => skill.skill.displayName);
};

export function SearchWorkbench({
  accessToken,
  initialAfter,
  initialFilters,
  initialQuery,
  initialTrajectory,
  pageInfo,
  recommendations,
  results
}: SearchWorkbenchProps) {
  const client = useMemo(() => createApolloClient(accessToken), [accessToken]);
  const [query, setQuery] = useState(initialQuery);
  const [trajectory, setTrajectory] = useState(initialTrajectory);
  const [filters, setFilters] = useState<SearchFiltersState>(initialFilters);
  const [skillSearch, setSkillSearch] = useState("");
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>([]);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);

  const activeCandidate = results.find((result) => result.id === activeCandidateId)?.talentProfile ?? null;

  useEffect(() => {
    if (skillSearch.trim().length < 2) {
      setSkillOptions([]);
      return;
    }

    let isActive = true;
    const timer = window.setTimeout(async () => {
      try {
        const result = await client.query<SkillsQueryResult>({
          query: skillsQuery,
          variables: { search: skillSearch.trim() }
        });

        if (!isActive) {
          return;
        }

        setSkillOptions((result.data?.skills.edges ?? []).map((edge) => edge.node));
      } catch {
        if (isActive) {
          setSkillOptions([]);
        }
      }
    }, 200);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [client, skillSearch]);

  const navigateToSearch = (after?: string, nextQuery?: string) => {
    const params = buildSearchParams({
      after,
      filters,
      query: nextQuery ?? query,
      trajectory
    });

    window.location.href = params ? `/dashboard/search?${params}` : "/dashboard/search";
  };

  const addSkill = (skillName: string) => {
    setFilters((current) => ({
      ...current,
      skills: current.skills.includes(skillName) ? current.skills : [...current.skills, skillName]
    }));
    setSkillSearch("");
    setSkillOptions([]);
  };

  const removeSkill = (skillName: string) => {
    setFilters((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillName)
    }));
  };

  return (
    <div className="search-layout">
      <section className="dashboard-panel-card search-sidebar">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">Talent search</span>
            <h3>Semantic search workspace</h3>
          </div>
        </div>

        <div className="search-form-grid">
          <label className="demand-form-field-wide">
            <span>Search prompt</span>
            <textarea
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g., ML engineer with fintech experience, available immediately"
              rows={4}
              value={query}
            />
          </label>

          <label className="demand-form-field-wide">
            <span>Career progression / trajectory</span>
            <input
              onChange={(event) => setTrajectory(event.target.value)}
              placeholder="e.g., moved from startup IC to platform lead"
              type="text"
              value={trajectory}
            />
          </label>

          <label className="demand-form-field-wide">
            <span>Skills</span>
            <input
              onChange={(event) => setSkillSearch(event.target.value)}
              placeholder="Search and add skills"
              type="text"
              value={skillSearch}
            />
          </label>

          {skillOptions.length > 0 ? (
            <div className="skill-result-list">
              {skillOptions.map((skill) => (
                <button className="skill-result-item" key={skill.id} onClick={() => addSkill(skill.displayName)} type="button">
                  <strong>{skill.displayName}</strong>
                  <span>{skill.category}</span>
                </button>
              ))}
            </div>
          ) : null}

          {filters.skills.length > 0 ? (
            <div className="selected-skill-list">
              {filters.skills.map((skill) => (
                <button className="selected-skill-chip" key={skill} onClick={() => removeSkill(skill)} type="button">
                  {skill}
                </button>
              ))}
            </div>
          ) : null}

          <label>
            <span>Skill match mode</span>
            <select
              onChange={(event) => setFilters((current) => ({ ...current, skillMode: event.target.value as SmartSearchSkillMode }))}
              value={filters.skillMode}
            >
              {smartSearchSkillModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Industry</span>
            <input onChange={(event) => setFilters((current) => ({ ...current, industry: event.target.value }))} type="text" value={filters.industry} />
          </label>

          <label>
            <span>Experience level</span>
            <select
              onChange={(event) => setFilters((current) => ({ ...current, seniorityLevel: event.target.value }))}
              value={filters.seniorityLevel}
            >
              <option value="">All levels</option>
              {seniorityLevels.map((level) => (
                <option key={level} value={level}>
                  {formatEnumLabel(level)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Availability</span>
            <select
              onChange={(event) => setFilters((current) => ({ ...current, availability: event.target.value }))}
              value={filters.availability}
            >
              <option value="">Any time</option>
              {availabilityWindows.map((windowValue) => (
                <option key={windowValue} value={windowValue}>
                  {formatEnumLabel(windowValue)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Location</span>
            <input onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))} type="text" value={filters.location} />
          </label>

          <label>
            <span>Min hourly rate</span>
            <input onChange={(event) => setFilters((current) => ({ ...current, minHourlyRate: event.target.value }))} type="number" value={filters.minHourlyRate} />
          </label>

          <label>
            <span>Max hourly rate</span>
            <input onChange={(event) => setFilters((current) => ({ ...current, maxHourlyRate: event.target.value }))} type="number" value={filters.maxHourlyRate} />
          </label>
        </div>

        <div className="dashboard-actions">
          <button onClick={() => navigateToSearch()} type="button">Search talent</button>
          <button
            className="secondary-button"
            onClick={() => {
              setQuery("");
              setTrajectory("");
              setFilters({
                skills: [],
                skillMode: "AND",
                industry: "",
                seniorityLevel: "",
                availability: "",
                location: "",
                minHourlyRate: "",
                maxHourlyRate: ""
              });
              window.location.href = "/dashboard/search";
            }}
            type="button"
          >
            Reset filters
          </button>
        </div>
      </section>

      <div className="search-results-column">
        <section className="dashboard-panel-card search-results-panel">
          <div className="dashboard-section-heading">
            <div>
              <span className="eyebrow">Results</span>
              <h3>{query.trim() || trajectory.trim() ? "Semantic search results" : "Start with a recruiter search prompt"}</h3>
            </div>
            <div className="search-pagination-actions">
              {initialAfter ? (
                <button className="secondary-button" onClick={() => navigateToSearch(undefined)} type="button">
                  First page
                </button>
              ) : null}
              {pageInfo.hasNextPage && pageInfo.endCursor ? (
                <button className="secondary-button" onClick={() => navigateToSearch(pageInfo.endCursor ?? undefined)} type="button">
                  Next page
                </button>
              ) : null}
            </div>
          </div>

          {!query.trim() && !trajectory.trim() ? (
            <p className="dashboard-empty-state">Search prompts and recommendations appear here once you run a talent query.</p>
          ) : results.length === 0 ? (
            <p className="dashboard-empty-state">No profiles matched the current semantic search and filter combination.</p>
          ) : (
            <div className="search-result-grid">
              {results.map((result) => {
                const topSkills = topSkillsForResult(result, filters.skills);

                return (
                  <article className="search-result-card" key={result.id}>
                    <div className="shortlist-card-top">
                      <span className={`shortlist-score-pill ${scoreTone(result.relevanceScore)}`}>{result.relevanceScore.toFixed(0)}</span>
                      <span className="dashboard-status-pill">{formatEnumLabel(result.talentProfile.seniorityLevel ?? "MID")}</span>
                    </div>
                    <div>
                      <h4>
                        {result.talentProfile.firstName} {result.talentProfile.lastName}
                      </h4>
                      <p>{result.headline ?? result.talentProfile.headline}</p>
                    </div>
                    <p>{result.summary ?? result.talentProfile.summary}</p>
                    <div className="shortlist-meta-grid">
                      <div>
                        <span>Availability</span>
                        <strong>{formatEnumLabel(result.talentProfile.availability)}</strong>
                      </div>
                      <div>
                        <span>Rate</span>
                        <strong>{formatRate(result.talentProfile.hourlyRateMin, result.talentProfile.hourlyRateMax, result.talentProfile.currency)}</strong>
                      </div>
                      <div>
                        <span>Locations</span>
                        <strong>{result.talentProfile.locationPreferences.slice(0, 2).join(", ") || "Flexible"}</strong>
                      </div>
                    </div>
                    {result.talentProfile.industries && result.talentProfile.industries.length > 0 ? (
                      <div className="selected-skill-list">
                        {result.talentProfile.industries.slice(0, 3).map((industry) => (
                          <span className="selected-skill-chip is-static" key={`${result.id}-${industry}`}>
                            {industry}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="selected-skill-list">
                      {topSkills.map((skill) => (
                        <span className="selected-skill-chip is-static" key={`${result.id}-${skill}`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="dashboard-actions">
                      <button className="secondary-button" onClick={() => setActiveCandidateId(result.id)} type="button">
                        Open profile
                      </button>
                      <a className="secondary-link" href="/dashboard/shortlists">
                        Review shortlists
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="dashboard-panel-card recommendation-panel">
          <div className="dashboard-section-heading">
            <div>
              <span className="eyebrow">AI recommendations</span>
              <h3>Based on your recent roles</h3>
            </div>
          </div>

          {recommendations.length === 0 ? (
            <p className="dashboard-empty-state">Create or update recruiter roles to seed AI recommendations here.</p>
          ) : (
            <div className="recommendation-grid">
              {recommendations.map((recommendation) => (
                <article className="recommendation-card" key={recommendation.roleId}>
                  <div className="role-list-card-header">
                    <div>
                      <h4>{recommendation.roleTitle}</h4>
                      <p>{recommendation.prompt}</p>
                    </div>
                    <button className="secondary-button" onClick={() => navigateToSearch(undefined, recommendation.prompt)} type="button">
                      Explore matches
                    </button>
                  </div>
                  <div className="search-recommendation-list">
                    {recommendation.results.length === 0 ? (
                      <p className="dashboard-empty-state">No recommendation candidates surfaced yet.</p>
                    ) : (
                      recommendation.results.slice(0, 3).map((result) => (
                        <button className="recommendation-result" key={result.id} onClick={() => setActiveCandidateId(result.id)} type="button">
                          <strong>
                            {result.talentProfile.firstName} {result.talentProfile.lastName}
                          </strong>
                          <span>{result.talentProfile.headline}</span>
                        </button>
                      ))
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {activeCandidate ? <CandidateProfileModal candidate={activeCandidate} onClose={() => setActiveCandidateId(null)} /> : null}
    </div>
  );
}