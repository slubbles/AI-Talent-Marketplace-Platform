const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Pre-hash the demo password so login actually works
const DEMO_PASSWORD = "Password1!";
const DEMO_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

const skills = [
  ["python", "Python", "TECHNICAL"],
  ["typescript", "TypeScript", "TECHNICAL"],
  ["javascript", "JavaScript", "TECHNICAL"],
  ["react", "React", "TECHNICAL"],
  ["next-js", "Next.js", "TECHNICAL"],
  ["node-js", "Node.js", "TECHNICAL"],
  ["graphql", "GraphQL", "TECHNICAL"],
  ["apollo-graphql", "Apollo GraphQL", "TECHNICAL"],
  ["postgresql", "PostgreSQL", "TECHNICAL"],
  ["prisma", "Prisma", "TOOL"],
  ["fastapi", "FastAPI", "TECHNICAL"],
  ["django", "Django", "TECHNICAL"],
  ["flask", "Flask", "TECHNICAL"],
  ["machine-learning", "Machine Learning", "DOMAIN"],
  ["deep-learning", "Deep Learning", "DOMAIN"],
  ["nlp", "Natural Language Processing", "DOMAIN"],
  ["llm-prompting", "LLM Prompting", "DOMAIN"],
  ["computer-vision", "Computer Vision", "DOMAIN"],
  ["data-analysis", "Data Analysis", "DOMAIN"],
  ["data-engineering", "Data Engineering", "DOMAIN"],
  ["airflow", "Apache Airflow", "TOOL"],
  ["dbt", "dbt", "TOOL"],
  ["snowflake", "Snowflake", "TOOL"],
  ["aws", "AWS", "TOOL"],
  ["azure", "Azure", "TOOL"],
  ["gcp", "Google Cloud", "TOOL"],
  ["docker", "Docker", "TOOL"],
  ["kubernetes", "Kubernetes", "TOOL"],
  ["terraform", "Terraform", "TOOL"],
  ["ci-cd", "CI/CD", "TOOL"],
  ["redis", "Redis", "TOOL"],
  ["celery", "Celery", "TOOL"],
  ["react-native", "React Native", "TECHNICAL"],
  ["expo", "Expo", "TOOL"],
  ["ios", "iOS", "TECHNICAL"],
  ["android", "Android", "TECHNICAL"],
  ["product-design", "Product Design", "DOMAIN"],
  ["ux-research", "UX Research", "DOMAIN"],
  ["figma", "Figma", "TOOL"],
  ["project-management", "Project Management", "SOFT"],
  ["stakeholder-management", "Stakeholder Management", "SOFT"],
  ["communication", "Communication", "SOFT"],
  ["leadership", "Leadership", "SOFT"],
  ["agile", "Agile Delivery", "DOMAIN"],
  ["scrum", "Scrum", "DOMAIN"],
  ["salesforce", "Salesforce", "TOOL"],
  ["hubspot", "HubSpot", "TOOL"],
  ["seo", "SEO", "DOMAIN"],
  ["performance-marketing", "Performance Marketing", "DOMAIN"],
  ["copywriting", "Copywriting", "SOFT"],
  ["content-strategy", "Content Strategy", "DOMAIN"],
  ["qa-automation", "QA Automation", "TECHNICAL"],
  ["playwright", "Playwright", "TOOL"],
  ["cypress", "Cypress", "TOOL"],
  ["java", "Java", "TECHNICAL"],
  ["spring-boot", "Spring Boot", "TECHNICAL"],
  ["php", "PHP", "TECHNICAL"],
  ["laravel", "Laravel", "TECHNICAL"]
];

const companySeeds = [
  {
    name: "HelioStack",
    industry: "AI SaaS",
    size: "STARTUP",
    website: "https://heliostack.example"
  },
  {
    name: "Northstar Health",
    industry: "HealthTech",
    size: "SMB",
    website: "https://northstarhealth.example"
  },
  {
    name: "Atlas Commerce Group",
    industry: "E-commerce",
    size: "ENTERPRISE",
    website: "https://atlascommerce.example"
  },
  {
    name: "Cinder Finance",
    industry: "FinTech",
    size: "SMB",
    website: "https://cinderfinance.example"
  },
  {
    name: "BlueHarbor Logistics",
    industry: "Logistics",
    size: "ENTERPRISE",
    website: "https://blueharbor.example"
  }
];

const demandTemplates = [
  {
    title: "Senior AI Engineer",
    description: "Build resume parsing and ranking pipelines for an AI talent platform.",
    aiGeneratedDescription: "Lead LLM-assisted extraction and talent matching capabilities for a multi-tenant hiring platform.",
    experienceLevel: "SENIOR",
    location: "Remote",
    remotePolicy: "REMOTE",
    contractDuration: "12 months",
    budgetMin: 65,
    budgetMax: 95,
    projectRequirements: "FastAPI, embeddings, and production ML service experience.",
    skills: ["python", "fastapi", "machine-learning", "nlp", "docker"]
  },
  {
    title: "Full Stack Product Engineer",
    description: "Own recruiter dashboard features across web and API layers.",
    aiGeneratedDescription: "Ship product features in Next.js, GraphQL, and PostgreSQL with strong UX instincts.",
    experienceLevel: "SENIOR",
    location: "Dubai",
    remotePolicy: "HYBRID",
    contractDuration: "6 months",
    budgetMin: 45,
    budgetMax: 70,
    projectRequirements: "Next.js, GraphQL, Prisma, and B2B SaaS product delivery.",
    skills: ["typescript", "react", "next-js", "graphql", "prisma"]
  },
  {
    title: "Mobile App Engineer",
    description: "Build the talent mobile onboarding and interview experience.",
    aiGeneratedDescription: "Deliver polished React Native screens for onboarding, matches, and notifications.",
    experienceLevel: "MID",
    location: "Amsterdam",
    remotePolicy: "REMOTE",
    contractDuration: "4 months",
    budgetMin: 35,
    budgetMax: 55,
    projectRequirements: "Expo, TypeScript, mobile state management, and API integration.",
    skills: ["react-native", "expo", "typescript", "graphql", "communication"]
  },
  {
    title: "Data Platform Engineer",
    description: "Stand up analytics pipelines for recruiter and admin insights.",
    aiGeneratedDescription: "Build event ingestion and transformation pipelines across product and hiring data.",
    experienceLevel: "SENIOR",
    location: "London",
    remotePolicy: "HYBRID",
    contractDuration: "9 months",
    budgetMin: 55,
    budgetMax: 80,
    projectRequirements: "Airflow, dbt, SQL, and warehouse design.",
    skills: ["data-engineering", "airflow", "dbt", "postgresql", "snowflake"]
  },
  {
    title: "QA Automation Lead",
    description: "Establish confidence across recruiter web and talent mobile apps.",
    aiGeneratedDescription: "Own end-to-end testing, release quality gates, and platform reliability workflows.",
    experienceLevel: "LEAD",
    location: "Remote",
    remotePolicy: "REMOTE",
    contractDuration: "6 months",
    budgetMin: 40,
    budgetMax: 60,
    projectRequirements: "Playwright, Cypress, mobile testing, and CI/CD.",
    skills: ["qa-automation", "playwright", "cypress", "ci-cd", "leadership"]
  },
  {
    title: "Product Designer",
    description: "Design the recruiter journey from demand creation to offer acceptance.",
    aiGeneratedDescription: "Shape a clear enterprise UX for AI-assisted talent workflows.",
    experienceLevel: "MID",
    location: "Berlin",
    remotePolicy: "REMOTE",
    contractDuration: "5 months",
    budgetMin: 30,
    budgetMax: 45,
    projectRequirements: "Figma systems thinking, UX research, and B2B SaaS case studies.",
    skills: ["product-design", "ux-research", "figma", "communication", "stakeholder-management"]
  },
  {
    title: "Cloud Infrastructure Engineer",
    description: "Improve deployment, observability, and container infrastructure.",
    aiGeneratedDescription: "Design scalable cloud environments with IaC and strong reliability practices.",
    experienceLevel: "SENIOR",
    location: "Toronto",
    remotePolicy: "REMOTE",
    contractDuration: "8 months",
    budgetMin: 60,
    budgetMax: 90,
    projectRequirements: "AWS, Docker, Kubernetes, Terraform, and platform automation.",
    skills: ["aws", "docker", "kubernetes", "terraform", "ci-cd"]
  },
  {
    title: "Growth Marketing Manager",
    description: "Own demand generation for a talent marketplace launch.",
    aiGeneratedDescription: "Blend performance marketing, content, and analytics to drive qualified pipeline.",
    experienceLevel: "MID",
    location: "Remote",
    remotePolicy: "REMOTE",
    contractDuration: "3 months",
    budgetMin: 25,
    budgetMax: 40,
    projectRequirements: "SEO, paid acquisition, content strategy, and reporting.",
    skills: ["performance-marketing", "seo", "content-strategy", "copywriting", "data-analysis"]
  },
  {
    title: "Salesforce Solutions Consultant",
    description: "Improve CRM workflows for recruiter operations.",
    aiGeneratedDescription: "Configure scalable CRM processes and dashboards that support recruiting teams.",
    experienceLevel: "SENIOR",
    location: "Austin",
    remotePolicy: "HYBRID",
    contractDuration: "6 months",
    budgetMin: 50,
    budgetMax: 75,
    projectRequirements: "Salesforce architecture, stakeholder alignment, and process design.",
    skills: ["salesforce", "project-management", "stakeholder-management", "communication", "leadership"]
  },
  {
    title: "Backend Platform Engineer",
    description: "Build high-trust APIs and asynchronous workflows for hiring operations.",
    aiGeneratedDescription: "Develop resilient backend services for shortlists, interviews, notifications, and offers.",
    experienceLevel: "SENIOR",
    location: "Singapore",
    remotePolicy: "REMOTE",
    contractDuration: "10 months",
    budgetMin: 55,
    budgetMax: 85,
    projectRequirements: "Node.js, GraphQL, Redis, PostgreSQL, and queue-based workflows.",
    skills: ["node-js", "graphql", "redis", "postgresql", "docker"]
  }
];

const talentTemplates = [
  {
    firstName: "Amina",
    lastName: "Khaled",
    headline: "Senior AI Engineer",
    summary: "Builds LLM-powered ranking and extraction systems for hiring and commerce workflows.",
    industries: ["AI SaaS", "FinTech"],
    seniorityLevel: "SENIOR",
    availability: "IMMEDIATE",
    rateMin: 70,
    rateMax: 90,
    locations: ["Remote", "Dubai"],
    visas: ["UAE", "EU"],
    skills: ["python", "fastapi", "machine-learning", "nlp", "docker"],
    values: { workStyle: "async-first", communication: "concise", team: "small cross-functional" }
  },
  {
    firstName: "Jonas",
    lastName: "Vermeer",
    headline: "Full Stack Product Engineer",
    summary: "Ships polished web products with strong backend ownership and clear product sense.",
    industries: ["B2B SaaS", "Marketplaces"],
    seniorityLevel: "SENIOR",
    availability: "TWO_WEEKS",
    rateMin: 55,
    rateMax: 75,
    locations: ["Amsterdam", "Remote"],
    visas: ["EU"],
    skills: ["typescript", "react", "next-js", "graphql", "prisma"],
    values: { workStyle: "collaborative", communication: "direct", team: "product-led" }
  },
  {
    firstName: "Priya",
    lastName: "Menon",
    headline: "Mobile App Engineer",
    summary: "Builds fast, stable React Native apps with strong onboarding and retention UX.",
    industries: ["Consumer", "HealthTech"],
    seniorityLevel: "MID",
    availability: "ONE_MONTH",
    rateMin: 42,
    rateMax: 58,
    locations: ["Bengaluru", "Remote"],
    visas: ["India"],
    skills: ["react-native", "expo", "typescript", "graphql", "communication"],
    values: { workStyle: "proactive", communication: "warm", team: "mobile-first" }
  },
  {
    firstName: "Mateo",
    lastName: "Silva",
    headline: "Data Platform Engineer",
    summary: "Designs warehouses and analytics pipelines for fast-moving SaaS teams.",
    industries: ["E-commerce", "FinTech"],
    seniorityLevel: "SENIOR",
    availability: "IMMEDIATE",
    rateMin: 60,
    rateMax: 82,
    locations: ["Sao Paulo", "Remote"],
    visas: ["Brazil", "US"],
    skills: ["data-engineering", "airflow", "dbt", "postgresql", "snowflake"],
    values: { workStyle: "systems-thinking", communication: "structured", team: "platform" }
  },
  {
    firstName: "Leila",
    lastName: "Haddad",
    headline: "Product Designer",
    summary: "Turns complex operations workflows into calm, high-trust interfaces.",
    industries: ["B2B SaaS", "Recruitment"],
    seniorityLevel: "MID",
    availability: "TWO_WEEKS",
    rateMin: 38,
    rateMax: 50,
    locations: ["Paris", "Remote"],
    visas: ["EU"],
    skills: ["product-design", "ux-research", "figma", "communication", "stakeholder-management"],
    values: { workStyle: "user-centric", communication: "clear", team: "research-informed" }
  }
];

const extraTalentNames = [
  ["Nadia", "Farouk"], ["Ethan", "Brooks"], ["Sara", "Ibrahim"], ["Daniel", "Kim"], ["Mila", "Petrova"],
  ["Youssef", "Mansour"], ["Noah", "Carter"], ["Hana", "Sato"], ["Lucas", "Moreau"], ["Fatima", "Rahman"],
  ["Ivy", "Nguyen"], ["Omar", "Saleh"], ["Chloe", "Martin"], ["Rafael", "Costa"], ["Layla", "Osman"]
];

function createDecimal(value) {
  return new Prisma.Decimal(value.toFixed(2));
}

function makeEmail(firstName, lastName, suffix = "talent") {
  return `${firstName}.${lastName}.${suffix}`.toLowerCase().replace(/[^a-z0-9.]/g, "") + "@example.com";
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function main() {
  await prisma.externalCandidateSubmission.deleteMany();
  await prisma.headhunterAssignment.deleteMany();
  await prisma.placementFeedback.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.shortlist.deleteMany();
  await prisma.demandSkill.deleteMany();
  await prisma.demand.deleteMany();
  await prisma.company.deleteMany();
  await prisma.education.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.talentSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.talentProfile.deleteMany();
  await prisma.user.deleteMany();

  const createdSkills = {};

  for (const [name, displayName, category] of skills) {
    const skill = await prisma.skill.create({
      data: { name, displayName, category }
    });
    createdSkills[name] = skill;
  }

  const recruiter = await prisma.user.create({
    data: {
      email: "recruiter@marketplace.example",
      passwordHash: DEMO_HASH,
      role: "RECRUITER",
      emailVerified: true
    }
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@marketplace.example",
      passwordHash: DEMO_HASH,
      role: "ADMIN",
      emailVerified: true
    }
  });

  const headhunter = await prisma.user.create({
    data: {
      email: "headhunter@marketplace.example",
      passwordHash: DEMO_HASH,
      role: "HEADHUNTER",
      emailVerified: true
    }
  });

  const companies = [];
  for (const companySeed of companySeeds) {
    companies.push(
      await prisma.company.create({
        data: {
          recruiterId: recruiter.id,
          ...companySeed
        }
      })
    );
  }

  const demandRecords = [];
  for (let index = 0; index < demandTemplates.length; index += 1) {
    const template = demandTemplates[index];
    const demand = await prisma.demand.create({
      data: {
        recruiterId: recruiter.id,
        companyId: companies[index % companies.length].id,
        title: template.title,
        description: template.description,
        aiGeneratedDescription: template.aiGeneratedDescription,
        experienceLevel: template.experienceLevel,
        location: template.location,
        remotePolicy: template.remotePolicy,
        startDate: addDays(new Date(), 14 + index * 3),
        contractDuration: template.contractDuration,
        budgetMin: createDecimal(template.budgetMin),
        budgetMax: createDecimal(template.budgetMax),
        projectRequirements: template.projectRequirements,
        status: index < 8 ? "ACTIVE" : "DRAFT",
        approvalStatus: index < 8 ? "APPROVED" : index === 8 ? "CHANGES_REQUESTED" : "PENDING",
        approvalNotes: index === 8 ? "Clarify timeline and tighten skill requirements before publishing." : null,
        approvedAt: index < 8 ? addDays(new Date(), -(14 - index)) : null,
        hardToFill: index === 0 || index === 6
      }
    });

    for (const skillName of template.skills) {
      await prisma.demandSkill.create({
        data: {
          demandId: demand.id,
          skillId: createdSkills[skillName].id,
          isRequired: true,
          minimumYears: 3
        }
      });
    }

    demandRecords.push({ demand, template });
  }

  const talentSeeds = [
    ...talentTemplates,
    ...extraTalentNames.map((namePair, index) => {
      const template = talentTemplates[index % talentTemplates.length];
      return {
        ...template,
        firstName: namePair[0],
        lastName: namePair[1],
        headline: `${template.headline} ${index % 2 === 0 ? "Consultant" : "Specialist"}`
      };
    })
  ];

  const talentProfiles = [];

  for (let index = 0; index < talentSeeds.length; index += 1) {
    const talentSeed = talentSeeds[index];
    const talentUser = await prisma.user.create({
      data: {
        email: makeEmail(talentSeed.firstName, talentSeed.lastName),
        passwordHash: DEMO_HASH,
        role: "TALENT",
        emailVerified: true
      }
    });

    const profile = await prisma.talentProfile.create({
      data: {
        userId: talentUser.id,
        firstName: talentSeed.firstName,
        lastName: talentSeed.lastName,
        headline: talentSeed.headline,
        summary: talentSeed.summary,
        resumeUrl: `resumes/${talentUser.id}.pdf`,
        resumeParsedData: {
          source: "seed",
          lastParsedAt: new Date().toISOString()
        },
        industries: talentSeed.industries,
        seniorityLevel: talentSeed.seniorityLevel,
        careerTrajectory: "IC to senior contributor with mentoring responsibility",
        availability: talentSeed.availability,
        availableFrom: addDays(new Date(), 7 + index),
        hourlyRateMin: createDecimal(talentSeed.rateMin),
        hourlyRateMax: createDecimal(talentSeed.rateMax),
        locationPreferences: talentSeed.locations,
        workVisaEligibility: talentSeed.visas,
        identityDocumentUrls: [],
        portfolioUrls: [`https://portfolio.example/${talentSeed.firstName.toLowerCase()}-${talentSeed.lastName.toLowerCase()}`],
        culturalValues: talentSeed.values,
        verificationStatus: index < 12 ? "VERIFIED" : "PENDING",
        verificationNotes: index < 12 ? "Seeded as verified talent for recruiter search coverage." : null,
        verifiedAt: index < 12 ? addDays(new Date(), -(10 - (index % 5))) : null,
        profileCompleteness: 82 + (index % 19)
      }
    });

    talentProfiles.push(profile);

    for (const skillName of talentSeed.skills) {
      await prisma.talentSkill.create({
        data: {
          talentProfileId: profile.id,
          skillId: createdSkills[skillName].id,
          proficiency: index % 3 === 0 ? "EXPERT" : "ADVANCED",
          yearsOfExperience: 3 + (index % 6)
        }
      });
    }

    await prisma.experience.create({
      data: {
        talentProfileId: profile.id,
        title: talentSeed.headline,
        companyName: `Company ${index + 1}`,
        location: talentSeed.locations[0],
        startDate: new Date("2020-01-01"),
        endDate: null,
        isCurrent: true,
        description: `${talentSeed.firstName} leads delivery across ${talentSeed.industries.join(", ")} engagements.`
      }
    });

    await prisma.certification.create({
      data: {
        talentProfileId: profile.id,
        name: `${talentSeed.skills[0]} Professional Certification`,
        issuer: "Global Skills Institute",
        issueDate: new Date("2023-05-01"),
        credentialUrl: `https://credentials.example/${profile.id}`
      }
    });

    await prisma.education.create({
      data: {
        talentProfileId: profile.id,
        institution: "Global University",
        degree: "Bachelor of Science",
        fieldOfStudy: talentSeed.skills[0],
        startDate: new Date("2014-09-01"),
        endDate: new Date("2018-06-30"),
        description: "Formal training relevant to the seeded specialization."
      }
    });
  }

  for (let index = 0; index < talentProfiles.length; index += 1) {
    const profile = talentProfiles[index];
    const { demand } = demandRecords[index % demandRecords.length];
    const shortlist = await prisma.shortlist.create({
      data: {
        demandId: demand.id,
        talentProfileId: profile.id,
        matchScore: createDecimal(78 + (index % 18)),
        scoreBreakdown: {
          skillMatch: 80 + (index % 10),
          experienceFit: 74 + (index % 12),
          availabilityFit: 85,
          pricingFit: 79,
          locationFit: 88,
          culturalFit: 82,
          feedbackScore: 76
        },
        aiExplanation: `${profile.firstName} aligns strongly with ${demand.title} based on skill overlap, seniority, and availability.`,
        status: index < 8 ? "SHORTLISTED" : "AI_SUGGESTED",
        talentStatus: index < 6 ? "INTERESTED" : "PENDING"
      }
    });

    if (index < 6) {
      const interview = await prisma.interview.create({
        data: {
          shortlistId: shortlist.id,
          scheduledAt: addDays(new Date(), 3 + index),
          duration: 45,
          meetingUrl: `https://meet.example/interview-${index + 1}`,
          status: index < 3 ? "COMPLETED" : "SCHEDULED",
          feedback: index < 3 ? "Strong structured thinking and communication." : null,
          rating: index < 3 ? 4 + (index % 2) : null
        }
      });

      if (index < 3) {
        await prisma.offer.create({
          data: {
            interviewId: interview.id,
            demandId: demand.id,
            talentProfileId: profile.id,
            hourlyRate: createDecimal(70 + index * 5),
            startDate: addDays(new Date(), 21 + index),
            endDate: addDays(new Date(), 180 + index * 30),
            terms: "Remote-first contract with async collaboration and weekly syncs.",
            status: index === 0 ? "ACCEPTED" : "SENT"
          }
        });
      }
    }
  }

  for (let index = 0; index < 8; index += 1) {
    await prisma.analyticsEvent.create({
      data: {
        eventType: index % 2 === 0 ? "SHORTLIST_GENERATED" : "PROFILE_VIEW",
        actorId: recruiter.id,
        targetId: talentProfiles[index].id,
        metadata: {
          source: "seed",
          index
        }
      }
    });
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.notification.create({
      data: {
        userId: index % 2 === 0 ? recruiter.id : talentProfiles[index].userId,
        type: index % 3 === 0 ? "MATCH_READY" : "INTERVIEW_UPDATE",
        title: index % 3 === 0 ? "New shortlist available" : "Interview update",
        body: index % 3 === 0
          ? "A refreshed AI shortlist is ready for review."
          : "Your interview details have been updated.",
        read: index < 4,
        metadata: {
          seeded: true,
          sequence: index
        }
      }
    });
  }

  for (let index = 0; index < 3; index += 1) {
    await prisma.placementFeedback.create({
      data: {
        talentProfileId: talentProfiles[index].id,
        recruiterId: recruiter.id,
        demandId: demandRecords[index].demand.id,
        rating: 4 + (index % 2),
        feedback: "Delivered quickly, communicated clearly, and handled ambiguity well.",
        skillsDemonstrated: ["communication", demandRecords[index].template.skills[0]],
        completedSuccessfully: true
      }
    });
  }

  const conciergeDemands = [demandRecords[0].demand, demandRecords[6].demand];
  for (const demand of conciergeDemands) {
    await prisma.headhunterAssignment.create({
      data: {
        demandId: demand.id,
        headhunterUserId: headhunter.id,
        assignedByAdminId: admin.id,
        notes: "Priority sourcing support requested by admin."
      }
    });
  }

  await prisma.externalCandidateSubmission.create({
    data: {
      demandId: conciergeDemands[0].id,
      headhunterUserId: headhunter.id,
      firstName: "Karim",
      lastName: "Nasser",
      email: "karim.nasser.external@example.com",
      headline: "Principal AI Consultant",
      summary: "External candidate sourced for a hard-to-fill AI engineering mandate.",
      location: "Remote",
      availability: "TWO_WEEKS",
      hourlyRate: createDecimal(110),
      notes: "Strong marketplace and ranking engine background.",
      status: "SUBMITTED"
    }
  });

  await prisma.externalCandidateSubmission.create({
    data: {
      demandId: conciergeDemands[1].id,
      headhunterUserId: headhunter.id,
      firstName: "Maya",
      lastName: "Roth",
      email: "maya.roth.external@example.com",
      headline: "Cloud Infrastructure Lead",
      summary: "External infrastructure specialist with Kubernetes and Terraform depth.",
      location: "Toronto",
      availability: "ONE_MONTH",
      hourlyRate: createDecimal(95),
      notes: "Already reviewed by concierge desk.",
      status: "REVIEWED",
      reviewNotes: "Worth moving into shortlist consideration.",
      reviewedAt: addDays(new Date(), -1)
    }
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: "SYSTEM",
      title: "Seed complete",
      body: "Database seed finished with marketplace demo data.",
      read: false,
      metadata: { seeded: true }
    }
  });

  console.log(
    `Seed complete: ${talentProfiles.length + 3} users, ${companies.length} companies, ${demandRecords.length} demands, ${talentProfiles.length} talent profiles, ${skills.length} skills.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });