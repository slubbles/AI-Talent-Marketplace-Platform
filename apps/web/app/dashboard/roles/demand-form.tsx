"use client";

import { gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createApolloClient } from "../../../lib/apollo-client";

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
    <div className="demand-form-layout">
      <form className="dashboard-panel-card demand-form-card" onSubmit={onSubmit}>
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">{mode === "create" ? "Post role" : "Edit role"}</span>
            <h3>{mode === "create" ? "Create a recruiter demand" : "Update recruiter demand"}</h3>
          </div>
        </div>

        <div className="demand-form-grid">
          <label>
            <span>Company</span>
            <select value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} • {company.industry}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Role title</span>
            <input onChange={(event) => setTitle(event.target.value)} required value={title} />
          </label>

          <label className="demand-form-field-wide">
            <span>Raw description</span>
            <textarea onChange={(event) => setRawDescription(event.target.value)} required rows={7} value={rawDescription} />
          </label>

          <label className="demand-form-field-wide">
            <span>AI-enhanced description</span>
            <textarea onChange={(event) => setAiGeneratedDescription(event.target.value)} rows={7} value={aiGeneratedDescription} />
          </label>

          <label>
            <span>Experience level</span>
            <select onChange={(event) => setExperienceLevel(event.target.value)} value={experienceLevel}>
              {seniorityLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Location</span>
            <input onChange={(event) => setLocation(event.target.value)} required value={location} />
          </label>

          <label>
            <span>Remote policy</span>
            <select onChange={(event) => setRemotePolicy(event.target.value)} value={remotePolicy}>
              {remotePolicies.map((policy) => (
                <option key={policy} value={policy}>
                  {policy}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Status</span>
            <select onChange={(event) => setStatus(event.target.value)} value={status}>
              {demandStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Start date</span>
            <input onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
          </label>

          <label>
            <span>Contract duration</span>
            <input onChange={(event) => setContractDuration(event.target.value)} value={contractDuration} />
          </label>

          <label>
            <span>Budget min</span>
            <input min="0" onChange={(event) => setBudgetMin(event.target.value)} step="1" type="number" value={budgetMin} />
          </label>

          <label>
            <span>Budget max</span>
            <input min="0" onChange={(event) => setBudgetMax(event.target.value)} step="1" type="number" value={budgetMax} />
          </label>

          <label>
            <span>Currency</span>
            <input maxLength={3} onChange={(event) => setCurrency(event.target.value.toUpperCase())} value={currency} />
          </label>

          <label className="demand-form-field-wide">
            <span>Project requirements</span>
            <textarea onChange={(event) => setProjectRequirements(event.target.value)} rows={5} value={projectRequirements} />
          </label>

          <div className="demand-form-field-wide demand-skill-picker">
            <label>
              <span>Required skills</span>
              <input
                onChange={(event) => setSkillSearch(event.target.value)}
                placeholder="Search skills like FastAPI, GraphQL, or Product Design"
                value={skillSearch}
              />
            </label>
            {isSearchingSkills ? <span className="form-inline-note">Searching skills…</span> : null}
            {skillResults.length > 0 ? (
              <div className="skill-result-list">
                {skillResults.map((skill) => (
                  <button className="skill-result-item" key={skill.id} onClick={() => addSkill(skill)} type="button">
                    <strong>{skill.displayName}</strong>
                    <span>{skill.category}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <div className="selected-skill-list">
              {selectedSkills.map((skill) => (
                <button className="selected-skill-chip" key={skill.id} onClick={() => removeSkill(skill.id)} type="button">
                  {skill.displayName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {successMessage ? <p className="form-success">{successMessage}</p> : null}

        <div className="dashboard-actions">
          <button disabled={isGenerating} onClick={onGenerate} type="button">
            {isGenerating ? "Generating AI draft…" : "AI Enhance"}
          </button>
          <button className="secondary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Saving role…" : mode === "create" ? "Create role and shortlist" : "Save changes"}
          </button>
        </div>
      </form>

      <section className="dashboard-panel-card demand-ai-panel">
        <div className="dashboard-section-heading">
          <div>
            <span className="eyebrow">AI assistant</span>
            <h3>Role enhancement output</h3>
          </div>
        </div>

        {suggestion ? (
          <div className="demand-ai-content">
            <div className="demand-ai-block">
              <strong>{suggestion.title}</strong>
              <p>{suggestion.summary}</p>
            </div>
            <div className="demand-ai-meta-grid">
              <div>
                <span>Recommended level</span>
                <strong>{suggestion.experienceLevel}</strong>
              </div>
              <div>
                <span>Suggested band</span>
                <strong>
                  {suggestion.salaryBand.currency} {suggestion.salaryBand.min}k - {suggestion.salaryBand.max}k
                </strong>
              </div>
            </div>
            <div className="demand-ai-columns">
              <div>
                <h4>Responsibilities</h4>
                <ul>
                  {suggestion.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Requirements</h4>
                <ul>
                  {suggestion.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="demand-ai-block">
              <h4>Nice to have</h4>
              <ul>
                {suggestion.niceToHaves.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="demand-ai-block">
              <h4>Suggested skills</h4>
              <div className="selected-skill-list">
                {suggestion.recommendedSkills.map((skill) => (
                  <span className="selected-skill-chip is-static" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
              <p className="form-inline-note">{suggestion.salaryBand.rationale}</p>
            </div>
          </div>
        ) : (
          <p className="dashboard-empty-state">
            Use AI Enhance to generate a polished role draft, recommended seniority, and a salary band grounded in the selected company context.
          </p>
        )}
      </section>
    </div>
  );
}