# Demo Script

This script is designed for a concise end-to-end walkthrough of the platform without improvising the story live.

## Goal

Show that the platform already covers the full marketplace loop across recruiter, admin, talent mobile, GraphQL API, and AI services.

## Recommended setup

- Start local web, API, and AI engine services.
- Use the seeded data set.
- Keep the mobile app running in Expo on a device or emulator.
- Keep one recruiter account, one admin account, and one talent account prepared in advance.

## Demo flow

### 1. Open on the landing page

Message:
- This is one product with three operating surfaces: recruiter web, admin web, and talent mobile, backed by a GraphQL API and a dedicated AI engine.

Show:
- landing page summary
- links into recruiter and admin surfaces

### 2. Recruiter creates or reviews demand

Message:
- Recruiters can author roles, use AI assistance to improve role briefs, and move from demand creation into shortlist generation.

Show:
- recruiter dashboard
- roles list or post-role flow
- one approved demand with required skills and budget range

### 3. Admin governance controls

Message:
- The admin console is separate from recruiter workflows and handles verification, approvals, and platform oversight.

Show:
- admin overview
- talent verification queue
- role approvals queue
- analytics or company oversight

### 4. Talent mobile onboarding

Message:
- On the talent side, onboarding is mobile-first: register, upload resume, let AI draft the profile, then complete verification docs.

Show:
- mobile registration
- resume upload screen
- profile review editor
- verification document upload area

### 5. Talent workflow after onboarding

Message:
- Once approved, the same mobile app becomes the talent operating surface for matches, interviews, offers, and notifications.

Show:
- match feed
- role detail with score breakdown and AI explanation
- applications tab
- interviews tab
- offers tab
- notifications tab

### 6. Integration proof

Message:
- This is not static UI. The repo includes smoke validation for health, CORS, RBAC, talent profile creation, recruiter demand creation, and the recruiter-admin-talent flow.

Show:
- `npm run smoke:session18`
- API health endpoint
- AI engine health endpoint

### 7. Close on architecture and readiness

Message:
- The stack is already split for practical deployment: Vercel for web, Render for API and AI engine, Expo EAS for mobile, PostgreSQL plus pgvector for semantic ranking.

Show:
- deployment guide
- architecture and ADR notes

## Talk track shortcuts

If time is short, compress the demo into three proof points:

1. Cross-surface workflow exists: recruiter, admin, and mobile talent experiences are all implemented.
2. AI is embedded into the loop: parsing, role assistance, matching, and score explanations are already wired in.
3. The system is validated locally: typecheck passes, AI tests pass, and Session 18 smoke checks cover the main operational path.

## Common questions

### What is intentionally deferred?

Answer:
- Payments, real LinkedIn integration, SMS and OTP, video interview vendors, e-signatures, custom ML ranking, and multi-language support are Phase 2 or Phase 3 items.

### What is still blocking release?

Answer:
- Hosted environment setup and live deployment verification are still pending. Local integration coverage is already in place.

### Why separate Node and Python services?

Answer:
- GraphQL owns platform workflows and RBAC. FastAPI owns parsing, embeddings, and AI-oriented logic where the Python ecosystem is stronger.