# Execution Guide — AI Talent Marketplace Platform

> Master task list extracted from SOW. Every objective mapped to a concrete task.
> One session = one module. Check off as we go.
> Reference: [SOW](../maingoalandreference/AI%20Talent%20Marketplace%20Platform%20(SOW).md) | [FOUNDATION](FOUNDATION.md)

---

## What We're Building (Full Picture)

| # | Deliverable | Interface | Built With |
|---|-------------|-----------|------------|
| 1 | **GraphQL API + Database** | Backend | Node.js, Apollo, Prisma, PostgreSQL + pgvector |
| 2 | **AI Engine** | Backend service | Python, FastAPI, OpenAI API |
| 3 | **Recruiter Web Dashboard** | Web UI | Next.js 14, shadcn/ui, Tailwind |
| 4 | **Admin Console** | Web UI (same app, admin routes) | Next.js 14, shadcn/ui, Tailwind |
| 5 | **Talent Mobile App** | Mobile | Expo / React Native |
| 6 | **Analytics Platform** | Embedded in Web UI | Recharts / charts in dashboard |
| 7 | **Documentation** | Markdown + auto-generated | ADRs, API docs, deploy guide |

---

## Session Map (19 Sessions → 19 Days)

Each session is a self-contained unit. Output of each session is committed and pushed.

---

### SESSION 1 — Monorepo Scaffold + Dev Environment
**SOW Reference:** §2 Platform Architecture, §8 Technology Stack
**Goal:** Anyone can clone, run one command, and have everything running.

- [x] Initialize Turborepo monorepo
- [x] Create `apps/web` — Next.js 14 (App Router) with TypeScript
- [x] Create `apps/mobile` — Expo SDK 50 with Expo Router
- [x] Create `apps/api` — Node.js with Apollo Server (GraphQL)
- [x] Create `services/ai-engine` — Python with FastAPI
- [x] Create `packages/shared` — shared TypeScript types + validation (Zod)
- [x] Create `packages/db` — Prisma schema (empty, ready for models)
- [x] Create `packages/ui` — shadcn/ui component library scaffold
- [x] `docker-compose.yml` — PostgreSQL 16 (with pgvector), API, AI engine
- [x] `.env.example` with all required variables documented
- [x] `turbo.json` with build/dev/lint pipeline
- [x] Verify: `docker compose up` → all services healthy
- [x] Verify: `npm run dev` → web on :3000, API on :4000, AI on :8000

**Commit:** `feat: monorepo scaffold with all apps and services`

---

### SESSION 2 — Database Schema + Migrations
**SOW Reference:** §3.1 Profile Data Structure, §3.3 Demand Creation, §3.8 Hiring Workflow
**Goal:** Complete database schema reflecting every entity in the SOW.

- [ ] Enable pgvector extension in PostgreSQL
- [ ] `User` model — id, email, passwordHash, role (TALENT/RECRUITER/ADMIN), emailVerified
- [ ] `TalentProfile` model — all fields from SOW §3.1 (personal details, skills, certifications, career trajectory, availability, pricing, location prefs, visa eligibility, portfolio, verification status, culturalValues (JSON — work style, communication prefs, team dynamics), profileEmbedding vector(1536))
- [ ] `Skill` model — id, name, displayName, category, embedding vector(1536)
- [ ] `TalentSkill` join table — proficiency, yearsOfExperience
- [ ] `Experience` model — role, company, startDate, endDate, description
- [ ] `Certification` model — name, issuer, dateObtained, expiryDate
- [ ] `Education` model — institution, degree, field, startDate, endDate
- [ ] `Company` model — name, industry, size, logo, website
- [ ] `Demand` model — all fields from SOW §3.3 (title, description, aiGeneratedDescription, skills, experience level, location, remotePolicy, dates, budget, status, demandEmbedding vector(1536))
- [ ] `DemandSkill` join table — required proficiency
- [ ] `Shortlist` model — demandId, talentProfileId, matchScore, scoreBreakdown (JSON), aiExplanation, status
- [ ] `Interview` model — shortlistId, scheduledAt, duration, meetingUrl, status, feedback, rating
- [ ] `Offer` model — interviewId, demandId, talentProfileId, rate, dates, terms, status
- [ ] `AnalyticsEvent` model — eventType, actorId, targetId, metadata (JSON)
- [ ] `Notification` model — userId, type, title, body, read, metadata
- [ ] `PlacementFeedback` model — placementId, talentProfileId, recruiterId, rating (1-5), feedback text, skills demonstrated, completedSuccessfully, createdAt
- [ ] Run `prisma migrate dev` — verify clean migration
- [ ] Seed script with realistic data: 20 talent profiles, 5 companies, 10 demands, skills taxonomy (50+ skills)
- [ ] Verify: seed runs, data queryable

**Commit:** `feat: complete database schema with pgvector + seed data`

---

### SESSION 3 — Authentication System
**SOW Reference:** §3.1 Talent Registration, §7 Security & Compliance
**Goal:** Users can register, login, and access role-appropriate resources.

- [ ] Auth service in `apps/api` — register (email + password), login, refresh token
- [ ] Password hashing with bcrypt
- [ ] JWT generation (access token + refresh token)
- [ ] RBAC middleware — TALENT, RECRUITER, ADMIN role checks
- [ ] GraphQL mutations: `register`, `login`, `refreshToken`, `forgotPassword`, `resetPassword`
- [ ] GraphQL queries: `me` (current user)
- [ ] NextAuth.js setup in `apps/web` — credentials provider + JWT strategy
- [ ] Web auth pages: Login, Register (recruiter), Forgot Password
- [ ] Mobile auth screens: Login, Register (talent), Forgot Password
- [ ] Protected route wrappers (web + mobile)
- [ ] LinkedIn OAuth stub (config ready, mock provider for MVP)
- [ ] Input validation on all auth endpoints (Zod)
- [ ] Rate limiting on login/register endpoints
- [ ] Phone/OTP authentication — **Phase 2** (documented in roadmap; MVP uses email + password)

**Commit:** `feat: authentication system with RBAC (web + mobile + API)`

---

### SESSION 4 — AI Engine: Resume Parsing
**SOW Reference:** §3.1 Automated Profile Creation, §6 AI Capabilities (#5 Skill Extraction)
**Goal:** Upload a PDF resume → get structured profile data back.

- [ ] FastAPI project structure in `services/ai-engine`
- [ ] PDF text extraction (pdf-parse / PyPDF2 / pdfplumber)
- [ ] LLM prompt for resume parsing → structured JSON output:
  - Personal details (name, email, phone, location)
  - Skills (with proficiency estimation)
  - Experience entries (role, company, dates, description)
  - Certifications (name, issuer, date)
  - Education (institution, degree, field, dates)
  - Industry tags
  - Seniority level classification
  - Career trajectory summary
- [ ] Skill normalization (map variations → canonical names: "JS" → "JavaScript")
- [ ] `POST /parse-resume` endpoint — accepts file upload or URL
- [ ] Error handling for bad PDFs, empty content, LLM failures
- [ ] Unit tests with 3 sample resumes (junior, mid, senior)
- [ ] Response time target: < 10 seconds per resume

**Commit:** `feat: AI resume parsing pipeline (PDF → structured JSON)`

---

### SESSION 5 — AI Engine: Embeddings + Matching
**SOW Reference:** §3.2 AI Talent Matching Engine, §6 AI Capabilities (#2, #3)
**Goal:** Generate embeddings from profiles/demands and match them with scored results.

- [ ] Embedding generation service — OpenAI text-embedding-3-small
- [ ] Profile embedding: concatenate skills + experience + trajectory → single embedding
- [ ] Demand embedding: concatenate title + description + required skills → single embedding
- [ ] Store embeddings in pgvector column
- [ ] `POST /generate-embedding` endpoint
- [ ] Vector similarity search — cosine distance query via pgvector
- [ ] Composite scoring algorithm:
  - Skill match (35%) — vector similarity on skill sets
  - Experience fit (20%) — seniority level alignment
  - Availability (10%) — timeline compatibility
  - Pricing fit (10%) — budget vs. rate overlap
  - Location match (10%) — location/remote alignment
  - Cultural values fit (10%) — work style + communication alignment (SOW §3.2)
  - Past placement feedback (5%) — historical ratings from previous engagements
- [ ] Match explanation generator — LLM generates "Why this match" text
- [ ] `POST /match-candidates` endpoint — input: demandId, output: ranked list with scores + breakdown + explanations
- [ ] `POST /semantic-search` endpoint — free-text query against talent pool
- [ ] Test with seeded data: verify top match makes sense

**Commit:** `feat: AI matching engine with embeddings, scoring, and explanations`

---

### SESSION 6 — AI Engine: Role Description Assistant
**SOW Reference:** §3.4 AI Role Description Assistant, §6 AI Capabilities (#1)
**Goal:** Recruiter types rough role needs → AI generates polished job description.

- [ ] LLM prompt for role description generation:
  - Input: raw description + optional skills
  - Output: structured job description (title, responsibilities, requirements, nice-to-haves)
- [ ] Skill recommendation — suggest skills recruiter may have missed
- [ ] Salary band suggestion — based on role + skills + location
- [ ] Experience level calibration — recommend seniority level
- [ ] `POST /generate-role-description` endpoint
- [ ] Test with 5 varied role inputs (engineer, designer, PM, data scientist, executive)

**Commit:** `feat: AI role description assistant with skill/salary suggestions`

---

### SESSION 7 — GraphQL API: Core CRUD
**SOW Reference:** §3.1, §3.3, §3.11 Talent Supply Management, §4 Admin Platform
**Goal:** All core data operations available through GraphQL.

- [ ] GraphQL schema types: User, TalentProfile, Skill, Experience, Certification, Education, Company, Demand, Shortlist, Interview, Offer, Notification
- [ ] **Talent Queries:** `talentProfile(id)`, `talentProfiles(filters, pagination)`, `myProfile`
- [ ] **Talent Mutations:** `createTalentProfile`, `updateTalentProfile`, `uploadResume`, `updateAvailability`, `updatePricing`
- [ ] **Demand Queries:** `demand(id)`, `demands(filters, pagination)`, `myDemands`
- [ ] **Demand Mutations:** `createDemand`, `updateDemand`, `pauseDemand`, `cancelDemand`, `fillDemand`
- [ ] **Shortlist Queries:** `shortlist(demandId)`, `myMatches` (talent-side)
- [ ] **Shortlist Mutations:** `generateShortlist` (triggers AI), `reviewCandidate`, `rejectCandidate`
- [ ] **Interview Mutations:** `scheduleInterview`, `updateInterview`, `cancelInterview`, `submitFeedback`
- [ ] **Offer Mutations:** `createOffer`, `updateOffer`, `acceptOffer`, `declineOffer`
- [ ] **Skill Queries:** `skills(search)`, `skillCategories`
- [ ] **Company Queries/Mutations:** CRUD for companies
- [ ] **User Queries (admin):** `users(filters)`, `verifyTalent`, `rejectTalent`
- [ ] Cursor-based pagination on all list queries
- [ ] Field-level RBAC (talents can't see other talents' pricing, etc.)
- [ ] Integration with AI engine (HTTP calls to FastAPI from resolvers)
- [ ] Service layer for all business logic (resolvers stay thin)

**Commit:** `feat: complete GraphQL API with CRUD for all entities`

---

### SESSION 8 — GraphQL API: Search + Notifications + File Upload
**SOW Reference:** §3.6 Smart Talent Search, §3.15 Notification System, §5 Integrations
**Goal:** Search, notifications, and file handling operational.

- [ ] **Smart Search resolver:** accepts free-text query → calls AI engine `/semantic-search` → returns results with filters (skills, industry, experience, availability, pricing, location)
- [ ] **Boolean filters** on talent search (AND/OR skill combinations)
- [ ] **Notification system:**
  - `notifications(userId)` query
  - `markNotificationRead` mutation
  - Auto-create notifications on: new match, interview request, offer received, availability alert
- [ ] **File upload:**
  - Resume upload to S3/R2 → returns URL
  - Triggers AI parsing pipeline automatically
  - Avatar/photo upload
- [ ] **Email integration (Resend):**
  - Welcome email on registration
  - Interview scheduled notification
  - Offer received notification
  - Match alert email
- [ ] **Notification queries:** `notifications`, `unreadCount`

**Commit:** `feat: search, notifications, file upload, and email integration`

---

### SESSION 9 — Web UI: Layout + Recruiter Dashboard Home
**SOW Reference:** §2 Recruiter/Hiring Manager Web Dashboard, §3.12 Governance Dashboard
**Goal:** Recruiter logs in and sees a professional dashboard with real data.

- [ ] App layout: sidebar navigation + top bar + main content area
- [ ] shadcn/ui component setup (Button, Card, Input, Table, Dialog, Badge, etc.)
- [ ] Sidebar nav: Dashboard, Post Role, My Roles, Talent Search, Shortlists, Interviews, Offers, Analytics
- [ ] **Dashboard page:**
  - Active Roles count card
  - Total Candidates in Pool card
  - Interviews This Week card
  - Average Time-to-Shortlist card
  - Recent activity feed (last 10 actions)
  - Roles needing attention (stale, unfilled)
- [ ] GraphQL client setup (Apollo Client or urql)
- [ ] Auth-gated routing (redirect to login if not recruiter)
- [ ] Responsive layout (desktop + tablet)
- [ ] Dark mode support (optional but impressive)

**Commit:** `feat: recruiter web dashboard layout and home page`

---

### SESSION 10 — Web UI: Demand Management (Post Role + My Roles)
**SOW Reference:** §3.3 Demand Management, §3.4 AI Role Description Assistant
**Goal:** Recruiter can create, edit, manage, and AI-enhance role postings.

- [ ] **Post Role page:**
  - Form: title, raw description, required skills (multi-select/tags), experience level, location, remote policy, start date, duration, budget range
  - "AI Enhance" button → calls role description assistant → shows AI-generated version side-by-side
  - Recruiter can accept AI version, edit it, or keep original
  - Skill suggestions appear as recruiter types
  - Salary band suggestion shown
  - Submit → creates demand + triggers shortlist generation
- [ ] **My Roles page:**
  - Table/list of all demands with status badges (Draft, Active, Paused, Filled, Cancelled)
  - Filter by status
  - Click row → role detail page
- [ ] **Role Detail page:**
  - Role info display
  - Status controls (pause, activate, cancel, mark filled)
  - Tab: Shortlist (linked to Session 11)
  - Tab: Interviews
  - Tab: Offers
  - Edit role button → opens form with pre-filled data

**Commit:** `feat: demand management — post role with AI assistant + manage roles`

---

### SESSION 11 — Web UI: Shortlisting + Candidate View
**SOW Reference:** §3.5 Talent Shortlisting System, §3.2 Matching Outputs
**Goal:** Recruiter sees AI-ranked candidates with scores and explanations.

- [ ] **Shortlist tab on Role Detail:**
  - List of matched candidates ranked by score
  - Each card shows: name, headline, match score (with color: green/yellow/red), top matching skills, availability, hourly rate
  - "Why this match" expandable section (AI explanation)
  - Score breakdown visualization (radar chart or bar: skill/experience/availability/pricing/location)
- [ ] **Candidate Profile modal/page:**
  - Full profile: summary, skills with proficiency, experience timeline, certifications, education
  - Career trajectory visualization
  - Availability + pricing
  - Location + visa info
  - Portfolio links
  - Actions: "Request Interview", "Reject", "Save for Later"
- [ ] **Shortlist actions:**
  - Bulk actions: shortlist multiple, reject multiple
  - Filter shortlist by score range, availability, pricing
  - Sort by score, availability, rate
- [ ] "Regenerate Shortlist" button — re-runs AI matching

**Commit:** `feat: AI shortlisting UI with match scores, breakdowns, and candidate profiles`

---

### SESSION 12 — Web UI: Smart Talent Search
**SOW Reference:** §3.6 Smart Talent Search
**Goal:** Recruiter can search the entire talent pool with semantic and filter-based search.

- [ ] **Search page:**
  - Search bar with placeholder: "e.g., ML engineer with fintech experience, available immediately"
  - Semantic search (free text → AI engine)
  - Filter sidebar:
    - Skills (multi-select with search)
    - Industry
    - Experience level
    - Career progression / trajectory
    - Availability
    - Hourly rate range (slider)
    - Location / remote preference
  - Results list: talent cards with key info + relevance score
  - Click → candidate profile (same component from Session 11)
- [ ] **AI recommendations:** "Based on your recent roles, you might be interested in these candidates"
- [ ] Search result pagination
- [ ] Save search (optional, nice-to-have)

**Commit:** `feat: semantic talent search with filters and AI recommendations`

---

### SESSION 13 — Web UI: Interview + Hiring Pipeline
**SOW Reference:** §3.8 Interview & Hiring Workflow
**Goal:** Full hiring pipeline from shortlist through offer.

- [ ] **Interview scheduling:**
  - Select candidate → pick date/time/duration
  - Optional meeting URL field
  - Interview confirmation email sent to both parties
- [ ] **Interviews page:**
  - Calendar view or list view of all scheduled interviews
  - Status badges: Scheduled, Completed, Cancelled, No-Show
  - Click → interview detail
- [ ] **Interview detail:**
  - Candidate info
  - Role info
  - Feedback form (rating 1-5 + text feedback)
  - Actions: Complete, Cancel, Reschedule
- [ ] **Offer management:**
  - Create offer: hourly rate, start/end date, terms
  - Send offer → candidate notified
  - Track status: Draft, Sent, Accepted, Declined, Withdrawn
- [ ] **Digital contract generation (SOW §3.16):**
  - On accepted offer → generate PDF contract from template (role, rate, dates, terms)
  - Recruiter + talent can download signed contract PDF
  - Contract stored in Cloudflare R2
- [ ] **Onboarding checklist (SOW §3.16):**
  - On accepted offer → auto-create onboarding checklist (welcome email, access provisioning, orientation schedule)
  - Recruiter tracks onboarding progress per hire
  - Basic checklist UI with checkable items
- [ ] **Pipeline view (Kanban-style, optional):**
  - Columns: AI Suggested → Reviewed → Interview → Offer → Hired
  - Drag and drop candidates between stages

**Commit:** `feat: interview scheduling and offer management pipeline`

---

### SESSION 14 — Web UI: Admin Console
**SOW Reference:** §4 Admin Platform, §3.12 Governance & Oversight Dashboard
**Goal:** Admins can manage the platform, verify talent, and see governance data.

- [ ] Separate admin route group `(admin)/` with admin-only auth guard
- [ ] **Admin Dashboard:**
  - Total users (talent, recruiters, admins)
  - Total talent in pool + verified vs. pending
  - Active demands across all companies
  - Placements this month
  - Revenue metrics (placement fees)
- [ ] **User Management:**
  - Table of all users with role, status, joined date
  - Filter by role, status
  - View/edit user details
  - Deactivate / reactivate user
- [ ] **Talent Verification Queue:**
  - List of talents with PENDING verification status
  - Click → see full profile + uploaded identity documents + certifications
  - Verify identity documents against profile data
  - Approve / Reject buttons with reason field
- [ ] **Company Management:**
  - List of portfolio companies
  - Add/edit company
  - View company's demands and hiring metrics
- [ ] **Role Approvals:** (if workflow requires admin approval before demands go live)
  - Queue of demands pending approval
  - Approve / Request Changes
- [ ] **Concierge / Headhunter Management (SOW §3.7):**
  - Headhunter role type + RBAC permissions
  - Headhunter candidate submission form (submit external candidates for a demand)
  - Admin can assign roles to headhunters for sourcing
  - Submission tracking: submitted → reviewed → shortlisted / rejected
  - Ability to flag roles as "hard-to-fill" for concierge service

**Commit:** `feat: admin console — user management, verification, governance`

---

### SESSION 15 — Web UI: Analytics Platform
**SOW Reference:** §3.10 Demand Forecasting, §3.13 Reporting & Analytics, §3.14 Pricing
**Goal:** Rich analytics dashboards for recruiters and admins.

- [ ] **Recruiter Analytics (visible to recruiters for their company):**
  - Hiring velocity chart (time from demand posted → hire, over time)
  - Open roles by status (pie/donut chart)
  - Top skills requested (bar chart)
  - Candidate pipeline conversion (funnel: matches → shortlisted → interviewed → hired)
  - Average cost per hire
- [ ] **Admin / Platform Analytics (admin-only):**
  - Talent pool growth over time (line chart)
  - Skill distribution across pool (treemap or bar chart)
  - Supply-demand gap — skills in high demand vs. low supply (grouped bar)
  - Hiring timelines across companies (box plot or bar)
  - Demand monitoring across portfolio companies (table with sparklines)
  - Resource utilization — % of talent currently placed vs. available
  - Revenue: placement fees collected, subscription revenue
  - Talent pricing trends over time (line chart by skill category)
- [ ] **Demand Forecasting (simplified for MVP):**
  - Trend lines on skill demand (extrapolated from recent data)
  - "Supply gap prediction" — skills with growing demand but flat/declining supply
- [ ] Charts built with Recharts (or Tremor / shadcn charts)

**Commit:** `feat: analytics platform — hiring metrics, talent analytics, demand forecasting`

---

### SESSION 16 — Mobile App: Talent Registration + Profile
**SOW Reference:** §3.1 Talent Registration & Profile System
**Goal:** Talent downloads app, registers, uploads resume, gets auto-generated profile.

- [ ] Expo Router file-based navigation setup
- [ ] **Onboarding screens:** Welcome → Sign Up → Upload Resume → Profile Review
- [ ] **Registration screen:** email, password, first/last name
- [ ] **Resume upload screen:**
  - Pick file (PDF) from device
  - Upload to API → triggers AI parsing
  - Loading state: "AI is analyzing your resume..."
  - Show extracted data for review
- [ ] **Profile review/edit screen:**
  - Auto-populated fields from AI parsing
  - Edit: headline, summary, skills (add/remove), experience, certifications, education
  - Set availability, hourly rate, location preferences, visa eligibility
  - Profile completeness indicator (progress bar)
- [ ] **Identity document upload (SOW §3.1):**
  - Upload government ID / passport photo for verification
  - Upload certifications or professional documents
  - Status indicator: Pending Review / Verified / Rejected
  - Documents stored securely in Cloudflare R2
- [ ] **Profile screen (after onboarding):**
  - View own profile as others see it
  - Edit button → edit mode
  - Verification status badge
- [ ] UI components: themed inputs, cards, buttons, headers (React Native Paper or custom)
- [ ] Auth token stored in SecureStore
- [ ] GraphQL client setup (Apollo Client for RN)

**Commit:** `feat: mobile app — talent registration, resume upload, AI profile generation`

---

### SESSION 17 — Mobile App: Job Feed + Matching + Interviews
**SOW Reference:** §3.2 Matching Outputs, §3.5 Shortlisting, §3.8 Interview Workflow, §3.15 Notifications
**Goal:** Talent sees matched roles, can express interest, and manage interviews.

- [ ] **Home / Match Feed:**
  - List of matched roles sorted by match score
  - Each card: role title, company, match score badge, key matching skills, rate range, location
  - Pull-to-refresh
  - Tap card → Role Detail screen
- [ ] **Role Detail screen:**
  - Full description
  - Match score breakdown (skill, experience, availability, pricing, location)
  - "Why you matched" AI explanation
  - "Express Interest" button → updates shortlist status
  - "Not Interested" → dismiss
- [ ] **My Applications screen:**
  - Tabs: Interested / Shortlisted / Interview / Offer
  - Track status of each application
- [ ] **Interviews screen:**
  - Upcoming interviews list
  - Interview detail: role, company, date/time, meeting link
  - Accept / Decline interview
- [ ] **Offers screen:**
  - View offer details (rate, dates, terms)
  - Accept / Decline offer
- [ ] **Push notifications setup (Expo Notifications):**
  - New match notification
  - Interview request notification
  - Offer received notification
- [ ] **Talent availability quick-toggle:** immediately / 2 weeks / 1 month / not available

**Commit:** `feat: mobile app — job feed, matching, interviews, offers, notifications`

---

### SESSION 18 — Integration, Testing + Deploy
**SOW Reference:** §5 Integrations, §7 Security & Compliance, §9 Expected Deliverables
**Goal:** Everything works end-to-end. Deployed to a live URL.

- [ ] **End-to-end flow test:**
  1. Talent registers on mobile → uploads resume → profile auto-generated
  2. Recruiter registers on web → posts role → AI generates description
  3. AI matches talent → shortlist appears on recruiter dashboard
  4. Recruiter reviews candidate → schedules interview
  5. Talent sees interview on mobile → accepts
  6. Recruiter sends offer → talent accepts
  7. Admin verifies talent, views analytics
- [ ] **Security hardening:**
  - All env vars in `.env` (none hardcoded)
  - JWT expiry configured
  - CORS configured properly
  - Rate limiting on auth endpoints
  - Input sanitization on all user inputs
  - SQL injection prevention (Prisma handles this)
  - RBAC tested: talents can't access recruiter routes and vice versa
- [ ] **Bug fixes** from testing
- [ ] **Deployment:**
  - Web → Vercel (connect GitHub repo)
  - API → Railway or Render
  - AI Engine → Railway or Render
  - Database → Railway PostgreSQL (with pgvector)
  - Environment variables configured in all platforms
  - SSL/HTTPS on all endpoints
- [ ] **Verify live deployment:** all flows work on deployed URLs
- [ ] Mobile app → configure to point to live API
- [ ] Expo build for testing (EAS Build or Expo Go)

**Commit:** `feat: deployment to production + security hardening`

---

### SESSION 19 — Documentation + Final Polish
**SOW Reference:** §9 Documentation deliverable
**Goal:** Professional documentation. Demo-ready.

- [ ] **README.md** — project overview, tech stack, architecture diagram, setup instructions (clone → env → docker compose up → seed → run)
- [ ] **Architecture Decision Records:**
  - Why Turborepo monorepo
  - Why pgvector over ElasticSearch
  - Why OpenAI API over custom ML models
  - Why one Next.js app for recruiter + admin
  - Why Expo over Flutter
- [ ] **API Documentation:**
  - Auto-generated GraphQL schema docs (GraphQL Playground / Apollo Studio)
  - AI Engine endpoint docs (FastAPI auto-generates OpenAPI/Swagger)
- [ ] **Database Schema Documentation:**
  - ERD diagram (auto-generated from Prisma schema)
  - Entity descriptions
- [ ] **Deployment Guide:**
  - Environment variables reference
  - Step-by-step deploy to Vercel + Railway
  - Docker compose for self-hosted
- [ ] **Phase 2/3 Roadmap:**
  - Detailed feature list for Phase 2 (LinkedIn real API, payments, video interviews, SMS, e-signatures)
  - Phase 3 vision (custom ML models, demand forecasting, visa services, multi-language)
  - Estimated effort per phase
- [ ] **Final polish:**
  - Consistent UI spacing/fonts across all pages
  - Loading skeletons on all data-fetching pages
  - Empty states ("No roles posted yet" illustrations)
  - Error boundary pages (404, 500)
  - Favicon + app icon + meta tags
- [ ] **Seed data review:** ensure demo data tells a compelling story
- [ ] Final commit, push, verify GitHub repo looks professional

**Commit:** `docs: complete project documentation + final polish`

---

## SOW Coverage Matrix

Every SOW section mapped to a session. Nothing missed.

| SOW Section | Description | Session(s) | Status |
|-------------|-------------|------------|--------|
| §1 | Project Overview | FOUNDATION.md | ✅ Covered |
| §2 | Platform Architecture | Session 1 | ⬜ |
| §3.1 | Talent Registration & Profile | Sessions 2, 3, 4, 16 | ⬜ |
| §3.2 | AI Talent Matching Engine | Session 5 | ⬜ |
| §3.3 | Demand Management System | Sessions 2, 7, 10 | ⬜ |
| §3.4 | AI Role Description Assistant | Session 6 | ⬜ |
| §3.5 | Talent Shortlisting System | Sessions 5, 7, 11 | ⬜ |
| §3.6 | Smart Talent Search | Sessions 5, 8, 12 | ⬜ |
| §3.7 | Concierge Talent Acquisition | Session 14 | ⬜ |
| §3.8 | Interview & Hiring Workflow | Sessions 7, 13, 17 | ⬜ |
| §3.9 | Talent Mobility Services | Session 14 (placeholder) | ⬜ Phase 2+ |
| §3.10 | Demand Forecasting Engine | Session 15 (simplified) | ⬜ |
| §3.11 | Talent Supply Management | Sessions 7, 14 | ⬜ |
| §3.12 | Governance & Oversight Dashboard | Session 14 | ⬜ |
| §3.13 | Reporting & Analytics | Session 15 | ⬜ |
| §3.14 | Pricing & Monetization | Session 15 (display only) | ⬜ Phase 2 for billing |
| §3.15 | Notification System | Sessions 8, 17 | ⬜ |
| §3.16 | Contracting & Onboarding | Sessions 13, 16 | ⬜ |
| §4 | Admin Platform | Session 14 | ⬜ |
| §5 | Integrations | Sessions 3, 8, 18 | ⬜ |
| §6 | AI Capabilities | Sessions 4, 5, 6 | ⬜ |
| §7 | Security & Compliance | Sessions 3, 18 | ⬜ |
| §8 | Technology Stack | Session 1 | ⬜ |
| §9 | Expected Deliverables | All sessions | ⬜ |

---

## Deliverable → Session Map

| Deliverable | Sessions | Complete When |
|-------------|----------|---------------|
| **AI Matching Engine** | 4, 5, 6 | Resume parsing + embeddings + matching + role assistant all working |
| **GraphQL API + Integrations** | 2, 3, 7, 8 | All CRUD + search + notifications + file upload + email |
| **Recruiter Web Platform** | 9, 10, 11, 12, 13 | Dashboard + demand mgmt + shortlists + search + hiring pipeline |
| **Admin Dashboard** | 14 | User mgmt + verification + governance |
| **Analytics Platform** | 15 | Recruiter + admin analytics dashboards |
| **Talent Mobile App** | 16, 17 | Registration + profile + job feed + interviews + offers |
| **Documentation** | 19 | README + ADRs + API docs + deploy guide + roadmap |
| **Deployment** | 18 | Live URL, all services running in cloud |

---

## Daily Commitment

```
Each day = 1 session
Each session ends with: working code + commit + push
No session depends on "we'll fix this later"
If a session runs long, finish it before moving on — don't skip ahead
```

---

*Created March 12, 2026. Updated as sessions complete.*
