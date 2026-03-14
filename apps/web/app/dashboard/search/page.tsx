import { redirect } from "next/navigation";
import { graphQLRequest } from "../../../lib/graphql";
import { SearchWorkbench } from "./search-workbench";
import type { TalentSearchResult } from "../shortlists/types";

import { getSession } from "../../../lib/session";
const talentSearchQuery = `#graphql
  query TalentSearchPage($query: String!, $filters: SmartTalentSearchFiltersInput, $after: String) {
    smartTalentSearch(query: $query, filters: $filters, pagination: { first: 12, after: $after }) {
      edges {
        node {
          id
          relevanceScore
          headline
          summary
          talentProfile {
            id
            firstName
            lastName
            headline
            summary
            seniorityLevel
            industries
            careerTrajectory
            availability
            availableFrom
            hourlyRateMin
            hourlyRateMax
            currency
            locationPreferences
            workVisaEligibility
            portfolioUrls
            verificationStatus
            skills {
              id
              proficiency
              yearsOfExperience
              skill {
                id
                name
                displayName
                category
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
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

const recommendationSeedQuery = `#graphql
  query SearchRecommendationSeeds {
    myDemands(pagination: { first: 4 }) {
      edges {
        node {
          id
          title
          location
          company {
            id
            name
            industry
          }
          requiredSkills {
            id
            skill {
              displayName
            }
          }
        }
      }
    }
  }
`;

type SearchPageProps = {
  searchParams?: {
    after?: string | string[];
    availability?: string | string[];
    industry?: string | string[];
    location?: string | string[];
    maxRate?: string | string[];
    minRate?: string | string[];
    q?: string | string[];
    seniorityLevel?: string | string[];
    skillMode?: string | string[];
    skills?: string | string[];
    trajectory?: string | string[];
  };
};

type SearchFilters = {
  skills: string[];
  skillMode: "AND" | "OR";
  industry: string;
  seniorityLevel: string;
  availability: string;
  location: string;
  minHourlyRate: string;
  maxHourlyRate: string;
};

const getParamValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await getSession();

  if (!session?.accessToken) {
    redirect("/login");
  }

  const query = getParamValue(searchParams?.q);
  const trajectory = getParamValue(searchParams?.trajectory);
  const semanticQuery = [query.trim(), trajectory.trim() ? `Career progression: ${trajectory.trim()}` : ""].filter(Boolean).join(". ");
  const filters: SearchFilters = {
    skills: getParamValue(searchParams?.skills)
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
    skillMode: getParamValue(searchParams?.skillMode) === "OR" ? "OR" : "AND",
    industry: getParamValue(searchParams?.industry),
    seniorityLevel: getParamValue(searchParams?.seniorityLevel),
    availability: getParamValue(searchParams?.availability),
    location: getParamValue(searchParams?.location),
    minHourlyRate: getParamValue(searchParams?.minRate),
    maxHourlyRate: getParamValue(searchParams?.maxRate)
  };
  const after = getParamValue(searchParams?.after);

  const [recommendationSeeds, searchResult] = await Promise.all([
    graphQLRequest<{
      myDemands: {
        edges: Array<{
          node: {
            id: string;
            title: string;
            location: string;
            company: { id: string; name: string; industry: string };
            requiredSkills: Array<{ id: string; skill: { displayName: string } }>;
          };
        }>;
      };
    }>(recommendationSeedQuery, undefined, session.accessToken),
    semanticQuery
      ? graphQLRequest<{
          smartTalentSearch: {
            edges: Array<{ node: TalentSearchResult }>;
            pageInfo: { endCursor: string | null; hasNextPage: boolean };
          };
        }>(
          talentSearchQuery,
          {
            query: semanticQuery,
            filters: {
              skills: filters.skills,
              skillMode: filters.skillMode,
              industry: filters.industry || undefined,
              seniorityLevel: filters.seniorityLevel || undefined,
              availability: filters.availability || undefined,
              location: filters.location || undefined,
              minHourlyRate: filters.minHourlyRate ? Number(filters.minHourlyRate) : undefined,
              maxHourlyRate: filters.maxHourlyRate ? Number(filters.maxHourlyRate) : undefined
            },
            after: after || undefined
          },
          session.accessToken
        )
      : Promise.resolve({ smartTalentSearch: { edges: [], pageInfo: { endCursor: null, hasNextPage: false } } })
  ]);

  const recommendationRoles = recommendationSeeds.myDemands.edges.map((edge) => edge.node).slice(0, 2);
  const recommendations = await Promise.all(
    recommendationRoles.map(async (role) => {
      const prompt = `${role.title}${role.company.industry ? ` in ${role.company.industry}` : ""}${role.requiredSkills.length > 0 ? `. Skills: ${role.requiredSkills.slice(0, 4).map((skill) => skill.skill.displayName).join(", ")}` : ""}${role.location ? `. Location: ${role.location}` : ""}`;
      const data = await graphQLRequest<{
        smartTalentSearch: {
          edges: Array<{ node: TalentSearchResult }>;
        };
      }>(talentSearchQuery, { query: prompt, filters: undefined, after: undefined }, session.accessToken);

      return {
        roleId: role.id,
        roleTitle: role.title,
        prompt,
        results: data.smartTalentSearch.edges.map((edge) => edge.node).slice(0, 3)
      };
    })
  );

  return (
    <SearchWorkbench
      accessToken={session.accessToken}
      initialAfter={after}
      initialFilters={filters}
      initialQuery={query}
      initialTrajectory={trajectory}
      pageInfo={searchResult.smartTalentSearch.pageInfo}
      recommendations={recommendations}
      results={searchResult.smartTalentSearch.edges.map((edge) => edge.node)}
    />
  );
}