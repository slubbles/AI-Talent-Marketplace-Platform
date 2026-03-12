# Case Study Narrative

## Project summary

AI Talent Marketplace Platform is a multi-surface recruiting product designed to connect recruiter demand with vetted, AI-ranked talent supply. The system spans a recruiter web console, an admin governance console, a talent mobile app, a GraphQL API, and a Python AI engine.

The product goal is straightforward: reduce the time between role creation and qualified shortlist generation while keeping governance, verification, and talent experience inside the same operating system.

## Problem

Recruiting workflows often fracture across tools:

- role intake lives in one system
- sourcing lives in another
- candidate notes and approvals move through spreadsheets or chat
- talent experience becomes an afterthought once the internal pipeline is optimized

That fragmentation slows execution and makes it harder to build a repeatable, defensible hiring engine.

## Approach

The platform was structured around one full-loop workflow:

1. Talent registers and uploads a resume.
2. AI parses the profile into structured marketplace data.
3. Recruiters create or refine role demand.
4. Matching logic ranks talent using semantic search plus business-rule weights.
5. Recruiters review shortlists, schedule interviews, and issue offers.
6. Admins govern approvals, verification, and platform health.
7. Talent continues through the process on mobile instead of dropping into email-only coordination.

## Product surfaces

### Recruiter web

The recruiter console supports:

- dashboard metrics and attention queues
- AI-assisted role authoring
- role management and status controls
- semantic talent search
- shortlist review and candidate comparison
- interview scheduling and feedback
- offer creation and onboarding tracking
- recruiter analytics

### Admin console

The admin console supports:

- user activation and role management
- talent verification workflows
- demand approval workflows
- company oversight
- concierge and headhunter operations
- platform analytics and demand monitoring

### Talent mobile app

The talent mobile app supports:

- registration and secure auth persistence
- resume upload and AI-assisted profile draft generation
- profile review and verification document upload
- live match feed
- match response actions
- interview response actions
- offer response actions
- in-app notifications and availability controls

## Technical design

The architecture deliberately balances speed and separation of concerns.

- Next.js 14 handles recruiter and admin web flows.
- Expo and React Native handle the mobile talent experience.
- Apollo GraphQL provides a shared API contract across clients.
- FastAPI isolates parsing, embeddings, matching, and role-assist logic.
- Prisma and PostgreSQL with pgvector keep transactional and semantic ranking data in one database.

This keeps the MVP operationally lean while still leaving room for service boundaries where they matter.

## AI role in the system

AI is applied as workflow infrastructure, not surface decoration.

- resume parsing converts uploaded resumes into structured profile data
- embeddings support semantic similarity for talent search and matching
- role-description assistance helps recruiters write stronger briefs
- score breakdowns and explanations make shortlist outcomes interpretable

The key product decision is that AI never replaces the workflow itself. It improves the throughput and quality of decisions already happening inside the marketplace.

## Validation and readiness

The repo has been hardened beyond static scaffolding.

- repo-wide typecheck passes locally
- AI engine tests pass locally
- API runs behind an explicit CORS allowlist with a health probe
- auth rate limiting covers login, register, and forgot-password flows
- smoke validation covers health, CORS, RBAC, talent profile creation, recruiter demand creation, and an optional admin-backed workflow path through shortlist, interview, and offer stages

That gives the product a stronger operational baseline than a typical prototype.

## Outcome so far

The implemented work already proves the core business case:

- one product can support recruiter execution, admin governance, and talent experience together
- AI can improve matching and authoring without forcing a black-box workflow
- the system is organized for practical deployment on Vercel, Render, Expo EAS, and PostgreSQL with pgvector

## What remains

The main gap is no longer product shape. It is deployment completion and external verification.

Remaining work is concentrated in:

- hosted environment configuration
- live URL verification
- final presentation polish
- external demo packaging

## Why this matters

The value of the project is not just that it implements recruiter features or AI endpoints in isolation. The value is that it assembles a coherent hiring operating system where the interfaces, data model, AI services, and governance workflows already reinforce one another.