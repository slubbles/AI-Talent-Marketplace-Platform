"use client";

import { gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createApolloClient } from "../../../lib/apollo-client";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type CompanyOption = {
  id: string;
  name: string;
  industry: string;
  size: string;
};

type SkillOption = {
  id: string;
  name: string;
  displayName: string;
  category: string;
};

type RoleSuggestion = {
  title: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  niceToHaves: string[];
  recommendedSkills: string[];
  salaryBand: {
    min: number;
    max: number;
    currency: string;
    rationale: string;
  };
  experienceLevel: string;
  enhancedDescription: string;
  generationMode: string;
};

type DemandRecord = {
  id: string;
  title: string;
  description: string;
  aiGeneratedDescription: string | null;
  experienceLevel: string;
  location: string;
  remotePolicy: string;
  startDate: string | null;
  contractDuration: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  projectRequirements: string | null;
  status: string;
  company: CompanyOption;
  requiredSkills: Array<{
    id: string;
    isRequired: boolean;
    minimumYears: number | null;
    skill: SkillOption;
  }>;
};

type DemandFormProps = {
  accessToken: string;
  companies: CompanyOption[];
  initialDemand?: DemandRecord;
  mode: "create" | "edit";
};

const generateRoleDescriptionMutation = gql`
  mutation GenerateRoleDescription($input: GenerateRoleDescriptionInput!) {
    generateRoleDescription(input: $input) {
      title
      summary
      responsibilities
      requirements
      niceToHaves
      recommendedSkills
      salaryBand {
        min
        max
        currency
        rationale
      }
      experienceLevel
      enhancedDescription
      generationMode
    }
  }
`;

const createDemandMutation = gql`
  mutation CreateDemand($input: CreateDemandInput!) {
    createDemand(input: $input) {
      id
      title
      status
    }
  }
`;

const updateDemandMutation = gql`
  mutation UpdateDemand($id: ID!, $input: UpdateDemandInput!) {
    updateDemand(id: $id, input: $input) {
      id
      title
      status
    }
  }
`;

const generateShortlistMutation = gql`
  mutation GenerateShortlist($input: GenerateShortlistInput!) {
    generateShortlist(input: $input) {
      id
    }
  }
`;

const searchSkillsQuery = gql`
  query SearchSkills($search: String, $pagination: PaginationInput) {
    skills(search: $search, pagination: $pagination) {
      edges {
        node {
          id
          name
          displayName
          category
        }
      }
    }
  }
`;

const demandStatuses = ["DRAFT", "ACTIVE", "PAUSED"] as const;
const seniorityLevels = ["JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"] as const;
const remotePolicies = ["REMOTE", "HYBRID", "ONSITE"] as const;

const toDateInput = (value: string | null | undefined) => (value ? value.slice(0, 10) : "");

export function DemandForm({ accessToken, companies, initialDemand, mode }: DemandFormProps) {
  const router = useRouter();
  const client = useMemo(() => createApolloClient(accessToken), [accessToken]);
  const [title, setTitle] = useState(initialDemand?.title ?? "");
  const [rawDescription, setRawDescription] = useState(initialDemand?.description ?? "");
  const [aiGeneratedDescription, setAiGeneratedDescription] = useState(initialDemand?.aiGeneratedDescription ?? "");
  const [experienceLevel, setExperienceLevel] = useState(initialDemand?.experienceLevel ?? "MID");
  const [location, setLocation] = useState(initialDemand?.location ?? "Remote");
  const [remotePolicy, setRemotePolicy] = useState(initialDemand?.remotePolicy ?? "REMOTE");
  const [startDate, setStartDate] = useState(toDateInput(initialDemand?.startDate));
  const [contractDuration, setContractDuration] = useState(initialDemand?.contractDuration ?? "6 months");
  const [budgetMin, setBudgetMin] = useState(initialDemand?.budgetMin?.toString() ?? "");
  const [budgetMax, setBudgetMax] = useState(initialDemand?.budgetMax?.toString() ?? "");
  const [currency, setCurrency] = useState(initialDemand?.currency ?? "USD");
  const [projectRequirements, setProjectRequirements] = useState(initialDemand?.projectRequirements ?? "");
  const [status, setStatus] = useState(initialDemand?.status ?? "ACTIVE");
  const [companyId, setCompanyId] = useState(initialDemand?.company.id ?? companies[0]?.id ?? "");
  const [selectedSkills, setSelectedSkills] = useState<SkillOption[]>(
    initialDemand?.requiredSkills.map((item) => item.skill) ?? []
  );
  const [skillSearch, setSkillSearch] = useState("");
  const [skillResults, setSkillResults] = useState<SkillOption[]>([]);
  const [isSearchingSkills, setIsSearchingSkills] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<RoleSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedCompany = companies.find((company) => company.id === companyId) ?? null;

  useEffect(() => {
    if (!skillSearch.trim()) {
      setSkillResults([]);
      return;
    }

    let isCurrent = true;
    setIsSearchingSkills(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await client.query<{
          skills: { edges: Array<{ node: SkillOption }> };
        }>({
          query: searchSkillsQuery,
          variables: {
            search: skillSearch,
            pagination: { first: 8 }
          }
        });

        if (!isCurrent) {
          return;
        }

        const nextResults = (result.data?.skills.edges ?? [])
          .map((edge) => edge.node)
          .filter((skill) => !selectedSkills.some((selected) => selected.id === skill.id));
        setSkillResults(nextResults);
      } catch {
        if (isCurrent) {
          setSkillResults([]);
        }
      } finally {
        if (isCurrent) {
          setIsSearchingSkills(false);
        }
      }
    }, 250);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [client, selectedSkills, skillSearch]);

  const applySuggestion = (nextSuggestion: RoleSuggestion) => {
    setTitle((current) => current || nextSuggestion.title);
    setAiGeneratedDescription(nextSuggestion.enhancedDescription);
    setProjectRequirements(nextSuggestion.requirements.join("\n"));
    setExperienceLevel(nextSuggestion.experienceLevel);
  };

  const onGenerate = async () => {
    if (!rawDescription.trim()) {
      setError("Enter a raw role description before requesting AI enhancement.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const result = await client.mutate<{
        generateRoleDescription: RoleSuggestion;
      }>({
        mutation: generateRoleDescriptionMutation,
        variables: {
          input: {
            rawDescription,
            skills: selectedSkills.map((skill) => skill.displayName),
            location,
            companyName: selectedCompany?.name,
            companyIndustry: selectedCompany?.industry
          }
        }
      });

      const nextSuggestion = result.data?.generateRoleDescription;
      if (!nextSuggestion) {
        throw new Error("The AI assistant did not return a role description.");
      }

      setSuggestion(nextSuggestion);
      applySuggestion(nextSuggestion);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not generate AI role description.");
    } finally {
      setIsGenerating(false);
    }
  };

  const addSkill = (skill: SkillOption) => {
    setSelectedSkills((current) => [...current, skill]);
    setSkillSearch("");
    setSkillResults([]);
  };

  const removeSkill = (skillId: string) => {
    setSelectedSkills((current) => current.filter((skill) => skill.id !== skillId));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const input = {
      companyId,
      title,
      description: rawDescription,
      aiGeneratedDescription: aiGeneratedDescription || undefined,
      experienceLevel,
      location,
      remotePolicy,
      startDate: startDate || undefined,
      contractDuration: contractDuration || undefined,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      currency,
      projectRequirements: projectRequirements || undefined,
      status,
      requiredSkills: selectedSkills.map((skill) => ({
        skillId: skill.id,
        isRequired: true
      }))
    };

    try {
      if (mode === "create") {
        const result = await client.mutate<{
          createDemand: { id: string };
        }>({
          mutation: createDemandMutation,
          variables: { input }
        });

        const demandId = result.data?.createDemand.id;
        if (!demandId) {
          throw new Error("Demand creation did not return an ID.");
        }

        await client.mutate({
          mutation: generateShortlistMutation,
          variables: {
            input: {
              demandId,
              limit: 10
            }
          }
        });

        window.location.href = `/dashboard/roles/${demandId}`;
        router.refresh();
        return;
      }

      await client.mutate({
        mutation: updateDemandMutation,
        variables: {
          id: initialDemand?.id,
          input
        }
      });

      setSuccessMessage("Role updated successfully.");
      router.refresh();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not save the role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{mode === "create" ? "Create New Role" : "Edit Role"}</h1>

      <div className="flex gap-8">
        {/* Left: Form */}
        <form className="flex-[3] space-y-8" onSubmit={onSubmit}>
          {/* Section 1 — Role Basics */}
          <div>
            <h3 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wide mb-3">Role Basics</h3>
            <div className="space-y-4">
              <div>
                <Label>Role Title</Label>
                <Input placeholder="e.g. Senior Frontend Engineer" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.industry}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Experience Level</Label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {seniorityLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input placeholder="e.g. San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} required />
                </div>
                <div>
                  <Label>Remote Policy</Label>
                  <Select value={remotePolicy} onValueChange={setRemotePolicy}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {remotePolicies.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {demandStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2 — Skills & Requirements */}
          <div>
            <h3 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wide mb-3">Skills & Requirements</h3>
            <div className="space-y-4">
              <div>
                <Label>Required Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedSkills.map((s) => (
                    <span key={s.id} className="flex items-center gap-1 px-2 py-1 bg-[#1A1A1A] border border-primary rounded text-xs text-white">
                      {s.displayName}
                      <button type="button" onClick={() => removeSkill(s.id)}>
                        <X className="h-3 w-3 text-[#52525B] hover:text-white" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <Input
                    placeholder="Search skills like FastAPI, GraphQL, or Product Design"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                  />
                  {isSearchingSkills && <p className="text-xs text-[#52525B] mt-1">Searching skills…</p>}
                  {skillResults.length > 0 && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-[#0A0A0A] border border-[#27272A] rounded-md shadow-md max-h-48 overflow-y-auto">
                      {skillResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#222222] transition-colors flex justify-between"
                          onClick={() => addSkill(s)}
                        >
                          <strong>{s.displayName}</strong>
                          <span className="text-[#52525B]">{s.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label>Raw Description</Label>
                <Textarea placeholder="Describe what you need in your own words. AI will use this to generate a polished description." rows={5} className="bg-[#1A1A1A]" value={rawDescription} onChange={(e) => setRawDescription(e.target.value)} required />
              </div>
              <div>
                <Label>AI-Enhanced Description</Label>
                <Textarea rows={5} className="bg-[#1A1A1A]" value={aiGeneratedDescription} onChange={(e) => setAiGeneratedDescription(e.target.value)} />
              </div>
              <div>
                <Label>Project Requirements</Label>
                <Textarea placeholder="Key qualifications and responsibilities..." rows={5} className="bg-[#1A1A1A]" value={projectRequirements} onChange={(e) => setProjectRequirements(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 3 — Timeline & Budget */}
          <div>
            <h3 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wide mb-3">Timeline & Budget</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>Contract Duration</Label>
                  <Input placeholder="e.g. 6 months" value={contractDuration} onChange={(e) => setContractDuration(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Budget Min</Label>
                  <Input type="number" min="0" placeholder="100" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
                </div>
                <div>
                  <Label>Budget Max</Label>
                  <Input type="number" min="0" placeholder="180" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
                </div>
              </div>
            </div>
          </div>

          {/* Error / Success */}
          {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2">{error}</p>}
          {successMessage && <p className="text-sm text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2">{successMessage}</p>}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-[#27272A]">
            <Button type="button" variant="ghost" disabled={isGenerating} onClick={onGenerate}>
              <Sparkles className="h-4 w-4" /> {isGenerating ? "Generating…" : "AI Enhance"}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : mode === "create" ? "Create Role & Shortlist" : "Save Changes"}
            </Button>
          </div>
        </form>

        {/* Right: AI Panel */}
        <div className="flex-[2]">
          <div className="sticky top-6 bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
            {suggestion ? (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">{suggestion.title}</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{suggestion.summary}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1A1A1A] rounded-md p-3">
                    <span className="text-xs text-[#52525B]">Recommended level</span>
                    <p className="text-sm font-semibold">{suggestion.experienceLevel}</p>
                  </div>
                  <div className="bg-[#1A1A1A] rounded-md p-3">
                    <span className="text-xs text-[#52525B]">Suggested band</span>
                    <p className="text-sm font-semibold">{suggestion.salaryBand.currency} {suggestion.salaryBand.min}k–{suggestion.salaryBand.max}k</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Responsibilities</h4>
                  <ul className="text-sm text-[#A1A1AA] space-y-1 list-disc list-inside">
                    {suggestion.responsibilities.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Requirements</h4>
                  <ul className="text-sm text-[#A1A1AA] space-y-1 list-disc list-inside">
                    {suggestion.requirements.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Nice to Have</h4>
                  <ul className="text-sm text-[#A1A1AA] space-y-1 list-disc list-inside">
                    {suggestion.niceToHaves.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Suggested Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.recommendedSkills.map((skill) => (
                      <span key={skill} className="px-2 py-1 bg-[#1A1A1A] border border-[#27272A] rounded text-xs text-[#A1A1AA]">{skill}</span>
                    ))}
                  </div>
                  <p className="text-xs text-[#52525B] mt-2">{suggestion.salaryBand.rationale}</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-[#52525B] mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI Role Assistant</h3>
                <p className="text-sm text-[#A1A1AA] mb-4">
                  Fill in the role details and click &apos;AI Enhance&apos; to generate a polished job description, recommended seniority, and salary band.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}