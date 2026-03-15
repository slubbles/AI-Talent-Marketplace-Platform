# Copilot Instructions — AI Talent Marketplace Platform

> These instructions are automatically loaded into every Copilot conversation in this workspace.
> They keep the AI aligned with project decisions, standards, and workflow.

---

## Project Identity

- **What:** AI-powered Talent Marketplace Platform (web + mobile + AI engine)
- **Who:** Built for SaaS King Ventures
- **Goal:** Ship all 7 SOW deliverables to production quality.
- **Deadline:** March 31, 2026

## Source of Truth (Read These First)

1. **notes/FOUNDATION.md** — All architecture decisions, data model, tech stack, quality standards. LOCKED.
2. **notes/EXECUTION.md** — 19-session build plan. Every SOW objective mapped to a session.
3. **PROGRESS.md** — Live progress tracker. Update after every completed task.
4. **SOW** — `maingoalandreference/AI Talent Marketplace Platform (SOW).md` — Original requirements. Do NOT modify.
5. **.github/execution-continuation.md** — User-aligned execution protocol for continuing from current state to full-vision completion.

## Git Workflow

- **Branch:** `1st-execution` (all work goes here)
- **Remote:** `origin` → `https://github.com/slubbles/AI-Talent-Marketplace-Platform.git`
- **Identity:** user.name=`slubbles`, user.email=`slubbles@users.noreply.github.com`
- **Commit after every completed session** with the commit message specified in EXECUTION.md

## Tech Stack (LOCKED — Do Not Deviate)

| Layer | Choice |
|-------|--------|
| Monorepo | Turborepo |
| Web | Next.js 14 (App Router) + shadcn/ui + Tailwind CSS |
| Mobile | Expo SDK 50 + React Native + Expo Router |
| API | Node.js + Apollo Server (GraphQL) |
| AI Engine | Python + FastAPI |
| ORM | Prisma |
| Database | PostgreSQL 16 + pgvector |
| Auth | NextAuth.js (web) + JWT (API) |
| LLM | OpenRouter API (OpenAI-compatible, base URL: `https://openrouter.ai/api/v1`) |
| Embeddings | text-embedding-3-small (1536 dimensions) |
| Email | Resend |
| File Storage | Cloudflare R2 |
| Containers | Docker + Docker Compose |

## Critical Rules

1. **TypeScript everywhere** (Node.js, Next.js, React Native). No `any` types.
2. **Never hardcode secrets.** All API keys, DB URLs, passwords go in `.env`. Provide `.env.example`.
3. **Prisma migrations** for every schema change. No raw SQL DDL.
4. **OpenRouter, NOT raw OpenAI.** User has OpenRouter credits. Use `OPENROUTER_API_KEY` and base URL `https://openrouter.ai/api/v1`.
5. **pgvector for search.** No ElasticSearch. This is a locked architecture decision.
6. **One Next.js app** serves both recruiter and admin (route groups: `(recruiter)/` and `(admin)/`).
7. **AI engine is internal only.** Node.js API calls Python FastAPI. Clients never call AI engine directly.
8. **Commit messages** follow the format in EXECUTION.md for each session.
9. **Update PROGRESS.md** after completing each task — mark percentage and status.
10. **No over-engineering.** Build what's in EXECUTION.md. Don't add features, don't refactor beyond scope.

## RBAC Roles

| Role | Access |
|------|--------|
| TALENT | Own profile, matched roles, interviews, offers |
| RECRUITER | Demands, shortlists, talent search, hiring pipeline, company analytics |
| ADMIN | Everything + user management, verification, platform analytics |

## Scoring Algorithm Weights

| Factor | Weight |
|--------|--------|
| Skill match | 35% |
| Experience fit | 20% |
| Availability | 10% |
| Pricing fit | 10% |
| Location match | 10% |
| Cultural values fit | 10% |
| Past placement feedback | 5% |

## Phase 2/3 Items (DO NOT BUILD)

These are explicitly deferred. If encountered, document as "Phase 2" and move on:
- Phone/OTP auth (Twilio)
- Real LinkedIn API
- Stripe payments / billing
- Video conferencing API (Zoom/Teams)
- Custom ML models
- Full demand forecasting
- Visa/relocation services
- SMS notifications
- E-signatures (DocuSign)
- Multi-language / i18n
- Native App Store builds

## Progress Reporting

After every completed objective, update PROGRESS.md with:
- Session number and name
- Each task with status: ⬜ (0%) → 🔄 (in progress) → ✅ (100%)
- Overall session percentage
- Blockers (if any)
- Commit hash

Always tell the user the current overall progress percentage.

## Monorepo Structure

```
ai-talent-marketplace/
├── apps/
│   ├── web/          # Next.js 14 (recruiter + admin)
│   ├── mobile/       # Expo / React Native (talent)
│   └── api/          # Node.js + Apollo GraphQL
├── packages/
│   ├── shared/       # Shared types, validation (Zod)
│   ├── ui/           # shadcn/ui components
│   └── db/           # Prisma schema, migrations, seed
├── services/
│   └── ai-engine/    # Python + FastAPI
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Quality Checklist (Every Session)

- [ ] Code compiles with no TypeScript errors
- [ ] No hardcoded secrets
- [ ] Loading states on async operations
- [ ] Error handling (no white screens)
- [ ] Seed data is realistic (not "test123")
- [ ] Committed with correct message format
- [ ] PROGRESS.md updated
