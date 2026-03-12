# Project Foundation — AI Talent Marketplace Platform

> This document is the source of truth for all technical and product decisions.
> Every choice during development references back to this file.
> Last updated: March 12, 2026

---

## 1. What This Product IS

An AI-powered platform that solves one core problem:
**Connecting enterprise talent demand with global talent supply — faster and smarter than manual recruiting.**

The platform has three user types and three interfaces:

| User | Interface | Core Job |
|------|-----------|----------|
| Talent / Consultant | Mobile App (React Native) | Register, get matched, get hired |
| Recruiter / Hiring Manager | Web Dashboard (Next.js) | Post roles, find talent, manage hiring |
| Platform Admin | Web Console (Next.js) | Oversee operations, verify talent, view analytics |

The differentiator is **AI matching** — not keyword search, but semantic understanding of skills, career trajectories, and fit.

---

## 2. What This Product is NOT

- Not a general-purpose job board (no public listings, no "apply" button spam)
- Not an ATS replacement (we don't manage internal HR workflows)
- Not a freelancer marketplace (this is enterprise talent for portfolio companies)
- Not a payment processing platform (contracts and invoicing are Phase 2+)

---

## 3. The Core Loop (This Must Work Perfectly)

```
Talent registers → AI parses resume → Profile auto-generated
                                              ↓
Recruiter posts role → AI generates description → AI matches talent
                                              ↓
                         Ranked shortlist with scores and explanations
                                              ↓
                    Recruiter reviews → Interviews → Hires
```

**If this loop doesn't work end-to-end, nothing else matters.**
Everything we build serves this loop. Every feature decision asks: "Does this make the core loop better?"

---

## 4. Architecture Decisions (LOCKED)

These are not up for debate during the build. We revisit only if something is technically impossible.

### 4.1 Monorepo Structure

```
ai-talent-marketplace/
├── apps/
│   ├── web/                 # Next.js 14 — Recruiter dashboard + Admin
│   │   ├── app/
│   │   │   ├── (recruiter)/ # Recruiter routes (role posting, shortlists, search)
│   │   │   ├── (admin)/     # Admin routes (user mgmt, verification, analytics)
│   │   │   └── (auth)/      # Login, register, forgot password
│   │   └── ...
│   ├── mobile/              # Expo / React Native — Talent app
│   │   ├── app/             # Expo Router (file-based routing)
│   │   └── ...
│   └── api/                 # Node.js — GraphQL API server
│       ├── src/
│       │   ├── schema/      # GraphQL type definitions
│       │   ├── resolvers/   # GraphQL resolvers
│       │   ├── services/    # Business logic layer
│       │   ├── middleware/  # Auth, rate limiting, logging
│       │   └── utils/
│       └── ...
├── packages/
│   ├── shared/              # Shared types, constants, validation schemas
│   ├── ui/                  # Shared UI components (web only, for recruiter + admin)
│   └── db/                  # Prisma schema, migrations, seed data
├── services/
│   └── ai-engine/           # Python — AI/ML pipeline
│       ├── app/
│       │   ├── parsing/     # Resume parsing (PDF → structured JSON)
│       │   ├── embeddings/  # Skill/profile embedding generation
│       │   ├── matching/    # Vector similarity + composite scoring
│       │   ├── assistant/   # Role description AI assistant
│       │   └── api/         # FastAPI endpoints
│       └── ...
├── docker-compose.yml
├── turbo.json
├── package.json
├── FOUNDATION.md            # This file
└── README.md
```

### 4.2 Tech Stack (Exact Choices)

| Layer | Choice | Why |
|-------|--------|-----|
| **Monorepo** | Turborepo | Fast builds, shared deps, caching |
| **Web Frontend** | Next.js 14 (App Router) | Server components, fast, SEO for public pages |
| **UI Library** | shadcn/ui + Tailwind CSS | Professional look, no vendor lock-in, fast to build |
| **Mobile** | Expo SDK 50 + React Native | Cross-platform, OTA updates, Expo Router |
| **API** | Node.js + Apollo Server (GraphQL) | Type-safe, single endpoint, great for multiple clients |
| **AI Engine** | Python + FastAPI | Best ML ecosystem, fast API, async support |
| **ORM** | Prisma | Type-safe queries, migrations, works with pgvector |
| **Database** | PostgreSQL 16 + pgvector | One DB for everything including vector search |
| **Auth** | NextAuth.js (web) + JWT (API) | Proven, supports OAuth providers, RBAC |
| **Email** | Resend | Simple API, good deliverability, cheap |
| **File Storage** | AWS S3 / Cloudflare R2 | Resume PDFs, profile photos |
| **LLM** | OpenAI API (GPT-4o) | Resume parsing, job descriptions, skill extraction |
| **Embeddings** | OpenAI text-embedding-3-small | 1536 dimensions, good quality/cost ratio |
| **Containerization** | Docker + Docker Compose | One-command local setup |
| **Web Hosting** | Vercel | Zero-config Next.js deployment |
| **API/DB Hosting** | Railway or Render | PostgreSQL + Node.js + Python in one place |

### 4.3 What We're NOT Using (and Why)

| Skipped | Why |
|---------|-----|
| ElasticSearch | pgvector covers our search needs for MVP; ES adds infra complexity |
| Flutter | SOW says "Flutter / React Native" — we pick React Native (Expo) to share JS/TS across the stack |
| Custom ML models | OpenAI API handles parsing/matching/ranking for MVP; custom models are Phase 3 |
| Microservices | Monolith-ish with a separate AI service. Two services, not twelve |
| Redis | Not needed at MVP scale; PostgreSQL handles our caching needs |
| Kubernetes | Docker Compose for dev, simple cloud hosting for MVP |

---

## 5. Data Model (Source of Truth)

These are the core entities. Everything else derives from them.

### 5.1 Users & Auth

```
User
├── id (uuid)
├── email (unique)
├── passwordHash
├── role: TALENT | RECRUITER | ADMIN
├── emailVerified (boolean)
├── createdAt
└── updatedAt
```

### 5.2 Talent Profile

```
TalentProfile
├── id (uuid)
├── userId (FK → User)
├── firstName, lastName
├── headline
├── summary
├── avatarUrl
├── resumeUrl (S3 path)
├── resumeParsedData (JSON — raw LLM extraction)
├── skills → TalentSkill[] (many-to-many via join table)
├── experience → Experience[] (one-to-many)
├── certifications → Certification[] (one-to-many)
├── education → Education[] (one-to-many)
├── industries (string[])
├── seniorityLevel: JUNIOR | MID | SENIOR | LEAD | EXECUTIVE
├── careerTrajectory (string — e.g. "IC → Lead → Manager")
├── availability: IMMEDIATE | TWO_WEEKS | ONE_MONTH | THREE_MONTHS | NOT_AVAILABLE
├── availableFrom (date, nullable)
├── hourlyRateMin, hourlyRateMax (decimal)
├── currency (string, default "USD")
├── locationPreferences (string[] — e.g. ["Remote", "Dubai", "Amsterdam"])
├── workVisaEligibility (string[] — e.g. ["UAE", "EU", "US"])
├── portfolioUrls (string[])
├── verificationStatus: PENDING | VERIFIED | REJECTED
├── profileEmbedding (vector(1536)) ← pgvector
├── profileCompleteness (int, 0-100)
├── createdAt, updatedAt
```

### 5.3 Skills

```
Skill
├── id (uuid)
├── name (unique, normalized — e.g. "python", "machine-learning")
├── displayName (e.g. "Python", "Machine Learning")
├── category: TECHNICAL | SOFT | DOMAIN | TOOL
└── embedding (vector(1536)) ← pgvector

TalentSkill (join table)
├── talentProfileId (FK)
├── skillId (FK)
├── proficiency: BEGINNER | INTERMEDIATE | ADVANCED | EXPERT
└── yearsOfExperience (int)
```

### 5.4 Demand (Role/Job Request)

```
Demand
├── id (uuid)
├── recruiterId (FK → User)
├── companyId (FK → Company)
├── title
├── description (recruiter's raw input)
├── aiGeneratedDescription (LLM-enhanced version)
├── requiredSkills → DemandSkill[] (many-to-many)
├── experienceLevel: JUNIOR | MID | SENIOR | LEAD | EXECUTIVE
├── location (string)
├── remotePolicy: ONSITE | HYBRID | REMOTE
├── startDate (date)
├── contractDuration (string — e.g. "6 months")
├── budgetMin, budgetMax (decimal)
├── currency
├── projectRequirements (text)
├── status: DRAFT | ACTIVE | PAUSED | FILLED | CANCELLED
├── demandEmbedding (vector(1536)) ← pgvector
├── createdAt, updatedAt
```

### 5.5 Shortlist & Matching

```
Shortlist
├── id (uuid)
├── demandId (FK → Demand)
├── talentProfileId (FK → TalentProfile)
├── matchScore (decimal, 0-100)
├── scoreBreakdown (JSON)
│   ├── skillMatch (0-100)
│   ├── experienceFit (0-100)
│   ├── availabilityFit (0-100)
│   ├── pricingFit (0-100)
│   └── locationFit (0-100)
├── aiExplanation (text — "Why this match")
├── status: AI_SUGGESTED | RECRUITER_REVIEWED | SHORTLISTED | REJECTED
├── talentStatus: PENDING | INTERESTED | DECLINED
├── createdAt
```

### 5.6 Interview & Hiring Pipeline

```
Interview
├── id (uuid)
├── shortlistId (FK → Shortlist)
├── scheduledAt (datetime)
├── duration (int, minutes)
├── meetingUrl (string, nullable)
├── status: SCHEDULED | COMPLETED | CANCELLED | NO_SHOW
├── feedback (text, nullable)
├── rating (int, 1-5, nullable)
└── createdAt

Offer
├── id (uuid)
├── interviewId (FK → Interview)
├── demandId (FK → Demand)
├── talentProfileId (FK → TalentProfile)
├── hourlyRate (decimal)
├── startDate (date)
├── endDate (date)
├── terms (text)
├── status: DRAFT | SENT | ACCEPTED | DECLINED | WITHDRAWN
└── createdAt
```

### 5.7 Company

```
Company
├── id (uuid)
├── name
├── industry
├── size: STARTUP | SMB | ENTERPRISE
├── logoUrl
├── website
└── createdAt
```

### 5.8 Analytics Events

```
AnalyticsEvent
├── id (uuid)
├── eventType: PROFILE_VIEW | SHORTLIST_GENERATED | INTERVIEW_SCHEDULED | OFFER_SENT | HIRE_COMPLETED
├── actorId (FK → User)
├── targetId (uuid — polymorphic reference)
├── metadata (JSON)
└── createdAt
```

---

## 6. API Design Principles

1. **GraphQL only** — no REST endpoints (except AI engine internal API)
2. **Every mutation returns the updated object** — clients always have fresh data
3. **Cursor-based pagination** on all lists
4. **Role-based field visibility** — talents can't see other talents' pricing; recruiters can't see admin data
5. **AI engine is internal** — Node.js API calls Python FastAPI; clients never talk to AI engine directly
6. **All writes go through service layer** — resolvers are thin, services hold business logic

---

## 7. Auth & Roles (RBAC)

| Role | Can Do |
|------|--------|
| **TALENT** | Create/edit own profile, view matched roles, express interest, manage interviews, view own analytics |
| **RECRUITER** | Create demands, view shortlists, search talent, manage interviews, make offers, view hiring analytics |
| **ADMIN** | Everything above + manage users, verify talent, view platform-wide analytics, manage companies |

Auth flow:
- **Web**: NextAuth.js → session-based with JWT for API calls
- **Mobile**: Email/password → JWT stored in secure storage
- **API**: JWT verification middleware on every request
- **LinkedIn OAuth**: Available as registration option (stubbed for MVP, full integration Phase 2)

---

## 8. AI Engine Contract

The Python AI engine exposes these internal endpoints (called only by the Node.js API):

```
POST /parse-resume
  Input: { resumeUrl: string } or { resumeText: string }
  Output: { skills[], experience[], certifications[], education[], 
            industries[], seniorityLevel, careerTrajectory, summary }

POST /generate-embedding
  Input: { text: string, type: "profile" | "demand" | "skill" }
  Output: { embedding: float[1536] }

POST /match-candidates
  Input: { demandId: string, limit: number }
  Output: { matches: [{ talentProfileId, score, breakdown, explanation }] }

POST /generate-role-description
  Input: { rawDescription: string, requiredSkills: string[] }
  Output: { title, description, suggestedSkills[], salaryRange, experienceLevel }

POST /semantic-search
  Input: { query: string, filters: object, limit: number }
  Output: { results: [{ talentProfileId, relevanceScore }] }
```

---

## 9. What "Done" Looks Like for Each Deliverable

### Talent Mobile Application ✓ means:
- [ ] Talent can register (email/password)
- [ ] Talent can upload resume (PDF)
- [ ] Profile auto-populated from AI parsing
- [ ] Talent can edit profile, skills, availability, pricing
- [ ] Talent sees matched role feed (sorted by match score)
- [ ] Talent can express interest in a role
- [ ] Talent receives push notifications for new matches
- [ ] Talent can view interview schedule
- [ ] Talent can view/respond to offers

### Recruiter Web Platform ✓ means:
- [ ] Recruiter can register/login
- [ ] Recruiter can post a demand (role)
- [ ] AI generates enhanced role description
- [ ] Recruiter sees AI-ranked shortlist per role
- [ ] Each candidate shows match score + breakdown + explanation
- [ ] Recruiter can search talent pool (semantic + filters)
- [ ] Recruiter can move candidates through pipeline (review → interview → offer)
- [ ] Recruiter can schedule interviews
- [ ] Recruiter can send offers
- [ ] Recruiter dashboard shows key metrics

### Admin Dashboard ✓ means:
- [ ] Admin can view/manage all users
- [ ] Admin can verify/reject talent profiles
- [ ] Admin can view all demands across companies
- [ ] Admin sees platform analytics (talent pool size, hiring velocity, skill demand, revenue)
- [ ] Admin can manage companies

### AI Matching Engine ✓ means:
- [ ] Resume parsing extracts structured data from PDF
- [ ] Skill extraction and normalization works
- [ ] Profile embeddings are generated and stored
- [ ] Demand embeddings are generated and stored
- [ ] Vector similarity search returns relevant candidates
- [ ] Composite scoring weights multiple factors
- [ ] Match explanations are generated
- [ ] Role description assistant generates enhanced JDs
- [ ] Semantic search works across talent pool

### Analytics Platform ✓ means:
- [ ] Talent pool growth over time
- [ ] Skill distribution chart
- [ ] Hiring velocity (time from demand → hire)
- [ ] Open roles by company/status
- [ ] Supply-demand gap visualization
- [ ] Placement metrics

### API Integrations ✓ means:
- [ ] GraphQL API serves all client needs
- [ ] Auth (JWT + RBAC) on all endpoints
- [ ] AI engine integration (Node ↔ Python)
- [ ] Email notifications (Resend)
- [ ] File upload (S3/R2)
- [ ] LinkedIn OAuth stub (ready for real keys)

### Documentation ✓ means:
- [ ] README with setup instructions (clone → docker compose up → working)
- [ ] Architecture decision records
- [ ] API documentation (auto-generated from GraphQL schema)
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Phase 2/3 roadmap

---

## 10. Development Order (Why This Sequence)

```
Week 1: Foundation + AI Engine (the hard parts first)
  Day 1-2:  Monorepo scaffold, DB schema, Docker setup, seed data
  Day 3-4:  AI engine — resume parsing, embeddings, matching
  Day 5-6:  GraphQL API — auth, talent CRUD, demand CRUD, matching endpoints
  Day 7:    API integration tests, seed realistic data

Week 2: User-Facing Applications (make it visible)
  Day 8-9:  Recruiter dashboard — role posting, shortlists, search
  Day 10-11: Talent mobile app — registration, profile, job feed
  Day 12-13: Admin console — user management, verification, analytics
  Day 14:    Interview/offer pipeline UI

Week 3: Polish + Extras + Deploy (make it impressive)
  Day 15:   Analytics dashboards (charts, metrics)
  Day 16:   Notifications (email + push)
  Day 17:   End-to-end testing, bug fixes
  Day 18:   Documentation, deployment to live URL
  Day 19:   Final polish, demo walkthrough recording
```

**Why this order:**
- AI engine first because everything depends on it. If matching doesn't work, the UI is just empty pages.
- API second because both web and mobile consume it.
- Recruiter dashboard before mobile because it demonstrates the most business value.
- Admin last because it's the least complex (mostly CRUD with charts).
- Polish/deploy at the end because a live demo URL is worth 10x a localhost video.

---

## 11. Non-Negotiable Quality Standards

1. **TypeScript everywhere** (Node.js, Next.js, React Native) — no `any` types
2. **Prisma migrations** for every schema change — no raw SQL DDL
3. **Environment variables** for all secrets — nothing hardcoded
4. **Error boundaries** on every page — no white screens
5. **Loading states** on every async operation — no frozen UIs
6. **Mobile-responsive** recruiter dashboard — it must look decent on tablet
7. **Seed data** that tells a story — not "test123" but realistic talent profiles and demands
8. **.env.example** always up to date — anyone should be able to clone and run

---

## 12. Explicitly Out of Scope (Phase 2/3)

These are documented so nobody asks "why didn't you build this?" — the answer is "it's planned for Phase 2."

| Feature | Phase | Why Later |
|---------|-------|-----------|
| Real LinkedIn API integration | Phase 2 | Requires LinkedIn partner approval + API keys |
| Payment processing / invoicing | Phase 2 | Needs Stripe integration + legal review |
| Video interview integration | Phase 2 | Zoom/Teams API + scheduling complexity |
| Custom ML model training | Phase 3 | Needs real interaction data first |
| Demand forecasting engine | Phase 3 | Requires historical hiring data that doesn't exist yet |
| Visa/relocation service integration | Phase 3 | Requires third-party service partnerships |
| SMS notifications | Phase 2 | Twilio integration, not critical for MVP |
| E-signatures on contracts | Phase 2 | DocuSign/HelloSign integration |
| Multi-language support | Phase 3 | i18n setup + translation |
| Native iOS/Android builds | Phase 2 | Expo Go + EAS builds cover testing; App Store submission is Phase 2 |

---

## 13. How We Work Together

- **I scaffold, you review.** I generate code in bulk; you verify it makes sense.
- **Commit often.** After each major feature, we commit with a clear message.
- **One thing at a time.** We finish a module before starting the next.
- **If something breaks, we fix it immediately.** No "we'll come back to it."
- **This document is alive.** If we discover a better approach, we update FOUNDATION.md.

---

*This foundation was written on March 12, 2026. It will be updated as we build.*
