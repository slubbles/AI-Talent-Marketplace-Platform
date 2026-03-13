# Deployment Guide

This guide documents the intended Session 18 deployment path using the committed repo scaffolding.

## Target topology

- Web app: Vercel
- API: Render web service
- AI engine: Render web service
- Database: Render PostgreSQL or equivalent PostgreSQL 16 instance with pgvector
- Mobile app: Expo EAS preview and production builds

## Files that support deployment

- [vercel.json](../vercel.json)
- [render.yaml](../render.yaml)
- [apps/mobile/eas.json](../apps/mobile/eas.json)
- [docker-compose.yml](../docker-compose.yml) for self-hosted local parity

## Environment variables

Baseline values are documented in [.env.example](../.env.example).

Preflight validation command:

```bash
npm run deploy:check -- all .env
```

`npm run deploy:check` now enforces OpenRouter platform policy for API/AI target validation as well:

- `OPENROUTER_BASE_URL` must be `https://openrouter.ai/api/v1`
- `OPENROUTER_EMBEDDING_MODEL` must be `text-embedding-3-small`

The preflight validator also treats localhost URLs, template database URLs, and `*.example.com` values as placeholders to prevent accidental rollout with non-production values.

Deployment readiness status (web/api/ai/mobile):

```bash
npm run deploy:status
```

Guided remediation report (grouped by web/api/ai/mobile target and hosting surface):

```bash
npm run deploy:remediate
```

JSON mode for CI/automation:

```bash
npm run deploy:remediate:json
```

This report now also includes cross-target mismatch checks and duplicate-key conflict diagnostics across split env files.
It also checks Expo EAS preview/production GraphQL URL alignment and placeholder status from `apps/mobile/eas.json`.
It warns/fails when private production env files are tracked by git.
It now enforces platform policy checks for API and AI envs:

- `OPENROUTER_BASE_URL` must be `https://openrouter.ai/api/v1`
- `OPENROUTER_EMBEDDING_MODEL` must be `text-embedding-3-small`

`npm run deploy:status` and `npm run deploy:verify` now enforce the same OpenRouter policy expectations for consistency across readiness and hosted verification.

The readiness report now also checks cross-target consistency when non-placeholder values are present:

- web GraphQL URL vs API GraphQL URL
- mobile GraphQL URL vs API mobile GraphQL URL
- API CORS allowlist includes the web origin
- API vs AI OpenRouter alignment (`OPENROUTER_BASE_URL`, `OPENROUTER_MODEL`, `OPENROUTER_EMBEDDING_MODEL`)

Create missing private deployment env files from tracked templates:

```bash
npm run deploy:prepare
```

Post-deploy verification command:

```bash
npm run deploy:verify -- .env.production.web .env.production.api .env.production.ai
```

When duplicate keys appear across those files, verification fails early if values conflict.
Placeholder failures now report `KEY@env-file` entries so you can fix exact files quickly.

Mobile hosted verification command:

```bash
npm run deploy:verify:mobile -- .env.production.mobile
```

Unified hosted verification command:

```bash
npm run deploy:verify:all
```

This command now runs a remediation gate (`deploy:remediate`) before hosted endpoint checks, so unresolved env/profile issues are surfaced first.

This command first checks that these private local files exist:

- `.env.production.web`
- `.env.production.api`
- `.env.production.ai`
- `.env.production.mobile`

If any are missing, it stops immediately with a clear actionable error.
It also fails if any of these private env files are tracked by git, to prevent accidental secret commits.

Typical flow:

1. `npm run deploy:prepare`
2. Fill real values into `.env.production.web`, `.env.production.api`, `.env.production.ai`, and `.env.production.mobile`
3. `npm run deploy:verify:all`

Target-specific examples:

```bash
npm run deploy:check -- web .env.production
npm run deploy:check -- api .env.render
npm run deploy:check -- ai .env.render
npm run deploy:check -- mobile .env.expo
```

### Shared core

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `OPENROUTER_API_KEY`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_MODEL`
- `OPENROUTER_EMBEDDING_MODEL`
- `AI_ENGINE_URL`

### Web

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_GRAPHQL_API_URL`

### API

- `CORS_ALLOWED_ORIGINS`
- `RESEND_API_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_URL`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`

### Mobile

- `EXPO_PUBLIC_GRAPHQL_API_URL`

## Recommended hosted env file split

- `.env.production.web` for Vercel web vars
- `.env.production.api` for Render API vars
- `.env.production.ai` for Render AI engine vars
- `.env.production.mobile` for Expo EAS vars

These private filled-in files should stay uncommitted. The repo ignores them while still keeping the `*.example` templates tracked.

Example templates are committed in the repo:

- [../.env.production.web.example](../.env.production.web.example)
- [../.env.production.api.example](../.env.production.api.example)
- [../.env.production.ai.example](../.env.production.ai.example)
- [../.env.production.mobile.example](../.env.production.mobile.example)

The validator script can be run against each file before copying values into the hosting platform UIs.
The committed example files intentionally fail validation until you replace placeholder secrets and example hostnames with real hosted values.

A step-by-step hosted rollout checklist is in [notes/ROLLOUT-CHECKLIST.md](./ROLLOUT-CHECKLIST.md).

## Vercel web deployment

1. Import the repository into Vercel.
2. Set the root directory to the repo root.
3. Use the committed `vercel.json` build settings.
4. Add web environment variables:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_GRAPHQL_API_URL`
5. Deploy.
6. Run `npm run deploy:check -- web .env.production.web` before copying values into Vercel.

Expected production command path:
- Build: `npm run build --workspace @atm/web`
- Start: managed by Vercel Next.js runtime

## Render API and AI engine deployment

1. Create a new Blueprint deployment from `render.yaml`.
2. Provision the Postgres database.
3. Fill in the synced env vars that are intentionally left blank in the blueprint.
4. Set `AI_ENGINE_URL` on the API service to the deployed Render AI engine URL.
5. Set `NEXT_PUBLIC_GRAPHQL_API_URL` and `EXPO_PUBLIC_GRAPHQL_API_URL` to the deployed API GraphQL URL.
6. Set `CORS_ALLOWED_ORIGINS` to the exact web and Expo origins that should be allowed.
7. Run `npm run deploy:check -- api .env.production.api` and `npm run deploy:check -- ai .env.production.ai` before copying values into Render.

Expected production command path:
- API build: `npm install && npm run db:generate --workspace @atm/db && npm run build --workspace @atm/api`
- API start: `npm run start --workspace @atm/api`
- AI engine build: `pip install -e .`
- AI engine start: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Database notes

- The deployment target must support PostgreSQL 16 and pgvector.
- After database provisioning, apply migrations before validating the live app:

```bash
npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

- Seed demo data if the live environment needs a demo-ready dataset:

```bash
npm run db:seed --workspace @atm/db
```

## Expo EAS deployment

Preview build:

```bash
cd apps/mobile
eas build --profile preview
```

Production build:

```bash
cd apps/mobile
eas build --profile production
```

Before building, replace the placeholder API URL in `apps/mobile/eas.json` with the real hosted GraphQL endpoint or set the profile env vars in Expo.

Run `npm run deploy:check -- mobile .env.production.mobile` before creating preview or production builds.

Then verify the mobile target and EAS profile URLs match and are reachable:

```bash
npm run deploy:verify:mobile -- .env.production.mobile
```

For one-shot verification of hosted web/API/AI plus mobile endpoint alignment:

```bash
npm run deploy:verify:all
```

## Live verification checklist

Automated baseline check:

```bash
npm run deploy:verify -- .env.production.web .env.production.api .env.production.ai
```

After deployment, verify the core loop in order:

1. Talent mobile registration and profile creation
2. Resume upload and AI parsing
3. Recruiter login and demand creation
4. Demand approval
5. Shortlist generation
6. Talent sees match and responds
7. Recruiter schedules interview
8. Talent accepts interview
9. Recruiter sends offer
10. Talent accepts offer
11. Admin verifies talent and reviews analytics

## Self-hosted fallback

For a non-cloud demo environment, the repo can still run with Docker Compose for Postgres and local service processes for web, API, and AI engine.