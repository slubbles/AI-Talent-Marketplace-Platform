import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const graphQlUrl = process.env.GRAPHQL_API_URL ?? process.env.NEXT_PUBLIC_GRAPHQL_API_URL ?? "http://127.0.0.1:4000/graphql";
const aiEngineUrl = process.env.AI_ENGINE_URL ?? "http://127.0.0.1:8000";
const apiHealthUrl = new URL("/healthz", graphQlUrl).toString();
const aiHealthUrl = new URL("/health", aiEngineUrl).toString();
const allowedOrigin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const deniedOrigin = "http://blocked.example";
const smokeAdminEmail = process.env.SMOKE_ADMIN_EMAIL;
const smokeAdminPassword = process.env.SMOKE_ADMIN_PASSWORD;
const smokeLocalAdminBootstrap = process.env.SMOKE_LOCAL_ADMIN_BOOTSTRAP === "true";
const prisma = new PrismaClient();

const registerMutation = `#graphql
  mutation SmokeRegister($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        role
      }
      tokens {
        accessToken
      }
    }
  }
`;

const loginMutation = `#graphql
  mutation SmokeLogin($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        role
      }
      tokens {
        accessToken
      }
    }
  }
`;

const createTalentProfileMutation = `#graphql
  mutation SmokeCreateTalentProfile($input: CreateTalentProfileInput!) {
    createTalentProfile(input: $input) {
      id
      verificationStatus
    }
  }
`;

const createCompanyMutation = `#graphql
  mutation SmokeCreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
      id
      name
    }
  }
`;

const createDemandMutation = `#graphql
  mutation SmokeCreateDemand($input: CreateDemandInput!) {
    createDemand(input: $input) {
      id
      status
      approvalStatus
    }
  }
`;

const updateDemandApprovalMutation = `#graphql
  mutation SmokeApproveDemand($input: UpdateDemandApprovalInput!) {
    updateDemandApproval(input: $input) {
      id
      status
      approvalStatus
    }
  }
`;

const verifyTalentMutation = `#graphql
  mutation SmokeVerifyTalent($profileId: ID!, $notes: String) {
    verifyTalent(profileId: $profileId, notes: $notes) {
      id
      verificationStatus
    }
  }
`;

const generateShortlistMutation = `#graphql
  mutation SmokeGenerateShortlist($input: GenerateShortlistInput!) {
    generateShortlist(input: $input) {
      id
      talentProfileId
      talentStatus
    }
  }
`;

const respondToMatchMutation = `#graphql
  mutation SmokeRespondToMatch($input: RespondToMatchInput!) {
    respondToMatch(input: $input) {
      id
      talentStatus
    }
  }
`;

const scheduleInterviewMutation = `#graphql
  mutation SmokeScheduleInterview($input: ScheduleInterviewInput!) {
    scheduleInterview(input: $input) {
      id
      status
      talentResponseStatus
    }
  }
`;

const respondToInterviewMutation = `#graphql
  mutation SmokeRespondToInterview($input: RespondToInterviewInput!) {
    respondToInterview(input: $input) {
      id
      status
      talentResponseStatus
    }
  }
`;

const createOfferMutation = `#graphql
  mutation SmokeCreateOffer($input: CreateOfferInput!) {
    createOffer(input: $input) {
      id
      status
    }
  }
`;

const acceptOfferMutation = `#graphql
  mutation SmokeAcceptOffer($id: ID!) {
    acceptOffer(id: $id) {
      id
      status
    }
  }
`;

const recruiterDashboardQuery = `#graphql
  query SmokeRecruiterDashboard {
    recruiterDashboard {
      activeRolesCount
    }
  }
`;

const myMatchesQuery = `#graphql
  query SmokeMyMatches {
    myMatches {
      id
    }
  }
`;

const myProfileQuery = `#graphql
  query SmokeMyProfile {
    myProfile {
      id
      verificationStatus
    }
  }
`;

const skillsQuery = `#graphql
  query SmokeSkills($search: String!) {
    skills(search: $search, pagination: { first: 5 }) {
      edges {
        node {
          id
          displayName
        }
      }
    }
  }
`;

const requestJson = async (url, init = {}) => {
  const response = await fetch(url, init);
  const bodyText = await response.text();

  try {
    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      body: JSON.parse(bodyText)
    };
  } catch {
    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      body: bodyText
    };
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const graphQlRequest = async (query, variables, accessToken) => {
  const response = await requestJson(graphQlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });

  return response.body;
};

const expectNoGraphQlErrors = (payload, message) => {
  const errorMessage = payload?.errors?.[0]?.message;
  assert(!errorMessage, `${message}. ${errorMessage}`);
};

const requireData = (payload, fieldName, message) => {
  expectNoGraphQlErrors(payload, message);
  const data = payload?.data?.[fieldName];
  assert(data, `${message}. Missing ${fieldName} data.`);
  return data;
};

const expectGraphQlErrorCode = (payload, expectedCode, message) => {
  const code = payload?.errors?.[0]?.extensions?.code;
  assert(code === expectedCode, `${message}. Expected ${expectedCode}, received ${code ?? "none"}.`);
};

const uniqueEmail = (prefix) => `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;

const registerUser = async (role) => {
  const payload = await graphQlRequest(registerMutation, {
    input: {
      email: uniqueEmail(role.toLowerCase()),
      password: "StrongPass123!",
      role
    }
  });

  const accessToken = payload?.data?.register?.tokens?.accessToken;
  assert(accessToken, `Missing access token for registered ${role.toLowerCase()} user.`);
  return accessToken;
};

const loginUser = async (email, password) => {
  const payload = await graphQlRequest(loginMutation, {
    input: {
      email,
      password
    }
  });

  return requireData(payload, "login", `Could not log in ${email}`).tokens.accessToken;
};

const ensureAdminCredentials = async () => {
  if (smokeAdminEmail && smokeAdminPassword) {
    return {
      email: smokeAdminEmail,
      password: smokeAdminPassword,
      source: "env"
    };
  }

  if (!smokeLocalAdminBootstrap) {
    return null;
  }

  const password = "StrongPass123!";
  const email = uniqueEmail("admin");
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
      isActive: true
    }
  });

  return {
    email,
    password,
    source: "local-bootstrap"
  };
};

const getSkillCatalog = async (accessToken) => {
  const searches = ["typescript", "graphql", "react"];
  const skills = [];

  for (const search of searches) {
    const payload = await graphQlRequest(skillsQuery, { search }, accessToken);
    const edges = requireData(payload, "skills", `Could not query skills for ${search}`).edges;
    const match = edges[0]?.node;

    if (match) {
      skills.push(match);
    }
  }

  assert(skills.length > 0, "Could not resolve any seeded skills for the smoke scenario.");
  return skills;
};

const createTalentProfile = async (talentToken, skills) => {
  const payload = await graphQlRequest(createTalentProfileMutation, {
    input: {
      firstName: "Smoke",
      lastName: "Talent",
      headline: "Senior platform engineer",
      summary: "Talent created by the Session 18 smoke flow.",
      industries: ["Software"],
      seniorityLevel: "SENIOR",
      availability: "IMMEDIATE",
      currency: "USD",
      locationPreferences: ["Remote"],
      workVisaEligibility: ["US"],
      identityDocumentUrls: [],
      portfolioUrls: [],
      profileCompleteness: 78,
      skills: skills.map((skill, index) => ({
        skillId: skill.id,
        proficiency: index === 0 ? "EXPERT" : "ADVANCED",
        yearsOfExperience: index === 0 ? 8 : 5
      })),
      experiences: [],
      certifications: [],
      educationEntries: []
    }
  }, talentToken);

  return requireData(payload, "createTalentProfile", "Could not create talent profile");
};

const createCompany = async (recruiterToken) => {
  const payload = await graphQlRequest(createCompanyMutation, {
    input: {
      name: `Smoke Company ${Date.now()}`,
      industry: "Software",
      size: "STARTUP",
      website: "https://example.com"
    }
  }, recruiterToken);

  return requireData(payload, "createCompany", "Could not create company");
};

const createDemand = async (recruiterToken, companyId, skills) => {
  const payload = await graphQlRequest(createDemandMutation, {
    input: {
      companyId,
      title: "Staff Platform Engineer",
      description: "Own platform reliability, developer tooling, and cloud architecture.",
      experienceLevel: "SENIOR",
      location: "Remote",
      remotePolicy: "REMOTE",
      budgetMin: 120,
      budgetMax: 165,
      currency: "USD",
      status: "ACTIVE",
      requiredSkills: skills.map((skill, index) => ({
        skillId: skill.id,
        isRequired: true,
        minimumYears: index === 0 ? 5 : 3
      }))
    }
  }, recruiterToken);

  return requireData(payload, "createDemand", "Could not create demand");
};

const main = async () => {
  const checks = [
    "ai-health",
    "api-health",
    "cors-allowlist",
    "talent-forbidden-recruiter-dashboard",
    "recruiter-forbidden-my-matches"
  ];
  const skipped = [];

  console.log("1. Checking local health endpoints...");
  const aiHealth = await requestJson(aiHealthUrl);
  const apiHealth = await requestJson(apiHealthUrl);
  assert(aiHealth.ok && aiHealth.body?.status === "ok", "AI engine health check failed.");
  assert(apiHealth.ok && apiHealth.body?.status === "ok", "API health check failed.");

  console.log("2. Checking CORS allowlist behavior...");
  const allowedCors = await fetch(graphQlUrl, {
    method: "OPTIONS",
    headers: {
      Origin: allowedOrigin,
      "Access-Control-Request-Method": "POST"
    }
  });
  assert(allowedCors.headers.get("access-control-allow-origin") === allowedOrigin, "Allowed origin was not echoed by CORS policy.");

  const deniedCors = await fetch(graphQlUrl, {
    method: "OPTIONS",
    headers: {
      Origin: deniedOrigin,
      "Access-Control-Request-Method": "POST"
    }
  });
  assert(!deniedCors.ok || deniedCors.headers.get("access-control-allow-origin") !== deniedOrigin, "Denied origin incorrectly passed CORS policy.");

  console.log("3. Registering temporary talent and recruiter accounts...");
  const talentToken = await registerUser("TALENT");
  const recruiterToken = await registerUser("RECRUITER");

  console.log("4. Verifying RBAC boundaries...");
  const talentOnRecruiterDashboard = await graphQlRequest(recruiterDashboardQuery, undefined, talentToken);
  expectGraphQlErrorCode(talentOnRecruiterDashboard, "FORBIDDEN", "Talent token unexpectedly accessed recruiter dashboard");

  const recruiterOnMyMatches = await graphQlRequest(myMatchesQuery, undefined, recruiterToken);
  expectGraphQlErrorCode(recruiterOnMyMatches, "FORBIDDEN", "Recruiter token unexpectedly accessed talent matches");

  console.log("5. Creating smoke talent profile and recruiter demand...");
  const skillCatalog = await getSkillCatalog(recruiterToken);
  const talentProfile = await createTalentProfile(talentToken, skillCatalog);
  const company = await createCompany(recruiterToken);
  const demand = await createDemand(recruiterToken, company.id, skillCatalog);
  checks.push("skills-query", "talent-profile-create", "company-create", "demand-create");

  const adminCredentials = await ensureAdminCredentials();

  if (adminCredentials) {
    console.log("6. Running optional admin-backed approval and workflow flow...");
    const adminToken = await loginUser(adminCredentials.email, adminCredentials.password);
    checks.push(`admin-login:${adminCredentials.source}`);

    const verifyTalentPayload = await graphQlRequest(verifyTalentMutation, {
      profileId: talentProfile.id,
      notes: "Verified by Session 18 smoke flow"
    }, adminToken);
    requireData(verifyTalentPayload, "verifyTalent", "Could not verify talent profile");
    checks.push("talent-verify");

    const approveDemandPayload = await graphQlRequest(updateDemandApprovalMutation, {
      input: {
        demandId: demand.id,
        approvalStatus: "APPROVED",
        approvalNotes: "Approved by Session 18 smoke flow"
      }
    }, adminToken);
    requireData(approveDemandPayload, "updateDemandApproval", "Could not approve smoke demand");
    checks.push("demand-approve");

    const shortlistPayload = await graphQlRequest(generateShortlistMutation, {
      input: {
        demandId: demand.id,
        limit: 5
      }
    }, recruiterToken);
    const shortlist = requireData(shortlistPayload, "generateShortlist", "Could not generate shortlist")
      .find((entry) => entry.talentProfileId === talentProfile.id);

    if (!shortlist) {
      skipped.push("matching-flow: no shortlist entry returned for smoke talent profile");
    } else {
      checks.push("shortlist-generate");

      const respondToMatchPayload = await graphQlRequest(respondToMatchMutation, {
        input: {
          shortlistId: shortlist.id,
          talentStatus: "INTERESTED"
        }
      }, talentToken);
      requireData(respondToMatchPayload, "respondToMatch", "Could not express interest in smoke shortlist");
      checks.push("match-interest");

      const scheduledAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const interviewPayload = await graphQlRequest(scheduleInterviewMutation, {
        input: {
          shortlistId: shortlist.id,
          scheduledAt,
          duration: 60,
          meetingUrl: "https://example.com/meet/smoke"
        }
      }, recruiterToken);
      const interview = requireData(interviewPayload, "scheduleInterview", "Could not schedule smoke interview");
      checks.push("interview-schedule");

      const respondToInterviewPayload = await graphQlRequest(respondToInterviewMutation, {
        input: {
          interviewId: interview.id,
          talentResponseStatus: "ACCEPTED"
        }
      }, talentToken);
      requireData(respondToInterviewPayload, "respondToInterview", "Could not accept smoke interview");
      checks.push("interview-accept");

      const offerPayload = await graphQlRequest(createOfferMutation, {
        input: {
          interviewId: interview.id,
          demandId: demand.id,
          talentProfileId: talentProfile.id,
          hourlyRate: 145,
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          terms: "Smoke offer terms for Session 18 verification.",
          status: "SENT"
        }
      }, recruiterToken);
      const offer = requireData(offerPayload, "createOffer", "Could not create smoke offer");
      checks.push("offer-create");

      const acceptOfferPayload = await graphQlRequest(acceptOfferMutation, {
        id: offer.id
      }, talentToken);
      requireData(acceptOfferPayload, "acceptOffer", "Could not accept smoke offer");
      checks.push("offer-accept");

      const profileAfterFlow = await graphQlRequest(myProfileQuery, undefined, talentToken);
      requireData(profileAfterFlow, "myProfile", "Could not re-read smoke talent profile after workflow");
      checks.push("profile-readback");
    }
  } else {
    skipped.push("advanced recruiter-admin-talent flow: set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD or enable SMOKE_LOCAL_ADMIN_BOOTSTRAP=true");
  }

  console.log("Session 18 smoke checks passed.");
  console.log(JSON.stringify({
    apiHealthUrl,
    aiHealthUrl,
    allowedOrigin,
    deniedOrigin,
    checks,
    skipped
  }, null, 2));
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (process.exitCode && process.exitCode !== 0) {
      process.exit(process.exitCode);
    }
  });