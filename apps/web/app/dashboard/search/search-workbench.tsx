"use client";

import { gql } from "@apollo/client";
import { availabilityWindows, seniorityLevels, smartSearchSkillModes, type SmartSearchSkillMode } from "@atm/shared";
import { useEffect, useMemo, useState } from "react";
import { CandidateProfileModal } from "../candidate-profile-modal";
import { createApolloClient } from "../../../lib/apollo-client";
import type { TalentSearchResult } from "../shortlists/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, X, Sparkles } from "lucide-react";

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
  if (score >= 80) return "text-primary bg-[#1a1c00]";
  if (score >= 60) return "text-amber-400 bg-amber-950";
  return "text-red-400 bg-red-950";
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
    <div>
      {/* Search Bar */}
      <div className="relative flex items-center bg-[#1A1A1A] border border-[#27272A] rounded-lg h-[52px] px-4 focus-within:border-[#EFFE5E] focus-within:shadow-[0_0_24px_rgba(239,254,94,0.15)] transition-all mb-1">
        <Sparkles className="h-5 w-5 text-[#EFFE5E] shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && navigateToSearch()}
          placeholder="e.g. Senior ML engineer with fintech experience, available immediately"
          className="flex-1 bg-transparent border-none outline-none text-white text-sm px-3 placeholder:text-[#52525B]"
        />
        <Button onClick={() => navigateToSearch()} size="sm">Run Search</Button>
      </div>
      <p className="text-xs text-[#52525B] mb-6">Describe what you need in plain language. AI understands context, skills, and intent.</p>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        <div className="w-64 shrink-0">
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wide">Refine Results</h3>

            <div>
              <Label className="text-xs text-[#52525B]">Career Trajectory</Label>
              <Input placeholder="e.g., startup IC to platform lead" value={trajectory} onChange={(e) => setTrajectory(e.target.value)} />
            </div>

            <div>
              <Label className="text-xs text-[#52525B]">Skills</Label>
              <Input placeholder="Search skills..." value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} />
              {skillOptions.length > 0 && (
                <div className="mt-1 bg-[#0A0A0A] border border-[#27272A] rounded-md max-h-36 overflow-y-auto">
                  {skillOptions.map((skill) => (
                    <button key={skill.id} onClick={() => addSkill(skill.displayName)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#222222] flex justify-between">
                      <strong>{skill.displayName}</strong>
                      <span className="text-[#52525B]">{skill.category}</span>
                    </button>
                  ))}
                </div>
              )}
              {filters.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 border border-primary text-primary text-xs px-2 py-0.5 rounded-full">
                      {skill}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-[#52525B]">Skill Match Mode</Label>
              <Select value={filters.skillMode} onValueChange={(v) => setFilters((c) => ({ ...c, skillMode: v as SmartSearchSkillMode }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {smartSearchSkillModes.map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-[#52525B]">Industry</Label>
              <Input value={filters.industry} onChange={(e) => setFilters((c) => ({ ...c, industry: e.target.value }))} />
            </div>

            <div>
              <Label className="text-xs text-[#52525B]">Experience Level</Label>
              <Select value={filters.seniorityLevel || "__all__"} onValueChange={(v) => setFilters((c) => ({ ...c, seniorityLevel: v === "__all__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="All levels" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All levels</SelectItem>
                  {seniorityLevels.map((l) => <SelectItem key={l} value={l}>{formatEnumLabel(l)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-[#52525B]">Availability</Label>
              <Select value={filters.availability || "__any__"} onValueChange={(v) => setFilters((c) => ({ ...c, availability: v === "__any__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Any time" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any__">Any time</SelectItem>
                  {availabilityWindows.map((w) => <SelectItem key={w} value={w}>{formatEnumLabel(w)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-[#52525B]">Location</Label>
              <Input value={filters.location} onChange={(e) => setFilters((c) => ({ ...c, location: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-[#52525B]">Min Rate</Label>
                <Input type="number" value={filters.minHourlyRate} onChange={(e) => setFilters((c) => ({ ...c, minHourlyRate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-[#52525B]">Max Rate</Label>
                <Input type="number" value={filters.maxHourlyRate} onChange={(e) => setFilters((c) => ({ ...c, maxHourlyRate: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#27272A]">
              <Button size="sm" onClick={() => navigateToSearch()} className="flex-1">Search</Button>
              <Button size="sm" variant="ghost" onClick={() => {
                setQuery(""); setTrajectory("");
                setFilters({ skills: [], skillMode: "AND", industry: "", seniorityLevel: "", availability: "", location: "", minHourlyRate: "", maxHourlyRate: "" });
                window.location.href = "/dashboard/search";
              }}>Reset</Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{query.trim() || trajectory.trim() ? "Search Results" : "Start with a search prompt"}</h2>
              <div className="flex gap-2">
                {initialAfter && <Button variant="ghost" size="sm" onClick={() => navigateToSearch(undefined)}>First Page</Button>}
                {pageInfo.hasNextPage && pageInfo.endCursor && <Button variant="ghost" size="sm" onClick={() => navigateToSearch(pageInfo.endCursor ?? undefined)}>Next Page</Button>}
              </div>
            </div>

            {!query.trim() && !trajectory.trim() ? (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-[rgba(239,254,94,0.08)] border border-[#27272A] flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-[#EFFE5E]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Talent Search</h3>
                <p className="text-[#A1A1AA] text-sm max-w-md mx-auto">Describe the talent you need in plain language. Our AI understands skills, context, and intent to surface the best matches.</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#A1A1AA] text-sm">No profiles matched this query. Try broadening your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((result) => {
                  const topSkills = topSkillsForResult(result, filters.skills);
                  return (
                    <article key={result.id} className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4 space-y-3 hover:border-[#3a3a3a] transition-colors">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${scoreTone(result.relevanceScore)}`}>{result.relevanceScore.toFixed(0)}</span>
                        <span className="text-xs px-2 py-0.5 bg-[#1A1A1A] border border-[#27272A] rounded text-[#A1A1AA]">{formatEnumLabel(result.talentProfile.seniorityLevel ?? "MID")}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{result.talentProfile.firstName} {result.talentProfile.lastName}</h4>
                        <p className="text-xs text-[#A1A1AA]">{result.headline ?? result.talentProfile.headline}</p>
                      </div>
                      <p className="text-xs text-[#A1A1AA] line-clamp-2">{result.summary ?? result.talentProfile.summary}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><span className="text-[#52525B]">Availability</span><p className="font-medium">{formatEnumLabel(result.talentProfile.availability)}</p></div>
                        <div><span className="text-[#52525B]">Rate</span><p className="font-medium">{formatRate(result.talentProfile.hourlyRateMin, result.talentProfile.hourlyRateMax, result.talentProfile.currency)}</p></div>
                        <div><span className="text-[#52525B]">Locations</span><p className="font-medium">{result.talentProfile.locationPreferences.slice(0, 2).join(", ") || "Flexible"}</p></div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {topSkills.map((skill) => (
                          <span key={`${result.id}-${skill}`} className="px-2 py-0.5 bg-[#1A1A1A] border border-[#27272A] rounded text-xs text-[#A1A1AA]">{skill}</span>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-[#27272A]">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveCandidateId(result.id)}>Open Profile</Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div>
            <h2 className="font-semibold mb-3">
              <Sparkles className="h-4 w-4 inline mr-1 text-[#52525B]" />
              AI Recommendations Based on Your Roles
            </h2>
            {recommendations.length === 0 ? (
              <p className="text-[#A1A1AA] text-sm">No recommendation seeds yet. Create roles to see AI-curated talent.</p>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.roleId} className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{rec.roleTitle}</h4>
                        <p className="text-xs text-[#52525B]">{rec.prompt}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigateToSearch(undefined, rec.prompt)}>Explore</Button>
                    </div>
                    {rec.results.length === 0 ? (
                      <p className="text-xs text-[#52525B]">No candidates surfaced for this role seed.</p>
                    ) : (
                      <div className="flex gap-2">
                        {rec.results.slice(0, 3).map((r) => (
                          <button key={r.id} onClick={() => setActiveCandidateId(r.id)} className="flex-1 bg-[#1A1A1A] border border-[#27272A] rounded-md p-2 text-left hover:bg-[#222222] transition-colors">
                            <p className="text-xs font-medium">{r.talentProfile.firstName} {r.talentProfile.lastName}</p>
                            <p className="text-xs text-[#52525B]">{r.talentProfile.headline}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeCandidate ? <CandidateProfileModal candidate={activeCandidate} onClose={() => setActiveCandidateId(null)} /> : null}
    </div>
  );
}