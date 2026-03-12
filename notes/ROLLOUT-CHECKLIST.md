# Hosted Rollout Checklist

This checklist is the shortest path from local-complete Session 18 work to a verified hosted rollout.

## 1. Prepare environment values

- copy `.env.production.web.example` to a private working file
- copy `.env.production.api.example` to a private working file
- copy `.env.production.ai.example` to a private working file
- copy `.env.production.mobile.example` to a private working file
- replace every placeholder secret and every example hostname
- keep the filled-in copies local only; they are ignored by git

Expected behavior:
- the committed `*.example` files should fail `npm run deploy:check`
- your private filled-in copies should pass once real values are in place

Validation commands:

```bash
npm run deploy:check -- web .env.production.web
npm run deploy:check -- api .env.production.api
npm run deploy:check -- ai .env.production.ai
npm run deploy:check -- mobile .env.production.mobile
```

## 2. Deploy web on Vercel

- import the repo
- confirm the repo root is used
- confirm the build command comes from `vercel.json`
- add the web env values
- deploy
- confirm the landing page loads
- confirm recruiter login and admin login redirect correctly

## 3. Deploy API and AI on Render

- create the Blueprint from `render.yaml`
- provision Postgres
- add API env values
- add AI env values
- deploy both services
- apply Prisma migrations against the hosted database
- optionally seed demo data

## 4. Wire cross-service URLs

- set `AI_ENGINE_URL` in the API env to the hosted AI service
- set `NEXT_PUBLIC_GRAPHQL_API_URL` in web and API-facing env files to the hosted GraphQL endpoint
- set `EXPO_PUBLIC_GRAPHQL_API_URL` in mobile env to the hosted GraphQL endpoint
- make sure `CORS_ALLOWED_ORIGINS` includes the real web URL and any Expo origin used for preview

## 5. Verify health probes

- open hosted API `/healthz`
- open hosted AI `/health`
- confirm GraphQL responds at `/graphql`
- run `npm run deploy:verify -- .env.production.api`

## 6. Verify auth and RBAC

- recruiter can sign in and reach `/dashboard`
- admin can sign in and reach `/admin`
- non-admin cannot reach admin routes
- unauthenticated users redirect to login

## 7. Verify core marketplace loop

1. talent registers
2. talent uploads resume
3. recruiter creates a demand
4. admin approves demand
5. shortlist is generated
6. talent sees a match and responds
7. recruiter schedules interview
8. talent accepts interview
9. recruiter sends offer
10. talent accepts offer

## 8. Verify mobile build readiness

- update Expo env values
- run preview build
- verify mobile login and GraphQL connectivity against hosted API

## 9. Record outcomes

- capture deployed URLs
- capture any platform-specific settings that were required
- note any remaining defects or follow-up items in `PROGRESS.md`