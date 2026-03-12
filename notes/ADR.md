# Architecture Decision Records

This file captures the major locked decisions behind the platform so future changes have context.

## ADR 001: Turborepo monorepo

Decision:
- Use a single monorepo for web, mobile, API, AI engine, shared contracts, and database schema.

Why:
- Shared TypeScript contracts reduce client-server drift.
- Prisma schema, migrations, and seed data stay versioned beside the services that depend on them.
- One dependency graph makes cross-surface feature work faster, which matters for the recruiter, admin, and talent workflow loop.

Tradeoff:
- Install size is larger and local workspaces are more coupled.

## ADR 002: pgvector over ElasticSearch

Decision:
- Use PostgreSQL 16 with pgvector for semantic search and ranking.

Why:
- Matching, operational data, analytics inputs, and application state stay in one database.
- MVP complexity stays low compared with a second operational search cluster.
- The ranking logic only needs vector similarity plus business-rule weighting, which pgvector supports well enough.

Tradeoff:
- Dedicated search engines offer more specialized indexing and retrieval features at higher scale.

## ADR 003: OpenRouter over direct OpenAI integration

Decision:
- Use OpenRouter-compatible configuration for LLM and embedding calls.

Why:
- It matches the available credits and project constraints.
- The platform keeps an OpenAI-compatible surface while avoiding a provider lock to raw OpenAI credentials.

Tradeoff:
- Provider routing and quota behavior sit behind an additional abstraction layer.

## ADR 004: One Next.js app for recruiter and admin

Decision:
- Keep recruiter and admin experiences in one Next.js 14 app with separate route groups.

Why:
- Shared auth, shared GraphQL client patterns, and shared UI shell reduce duplication.
- Admin and recruiter workflows rely on overlapping platform data and benefit from one deployment artifact.

Tradeoff:
- RBAC boundaries must stay explicit because both roles live in one web app.

## ADR 005: Expo over Flutter

Decision:
- Build the talent application with Expo Router and React Native.

Why:
- The team already uses TypeScript across web and API.
- Shared validation contracts and mobile GraphQL integration are easier in the same language ecosystem.
- Expo reduces the cost of preview builds and mobile iteration for an MVP.

Tradeoff:
- Native escape hatches are more constrained than a fully custom native setup.

## ADR 006: Separate internal AI engine service

Decision:
- Keep AI parsing, matching, and role-assistant logic in a dedicated FastAPI service behind the Node GraphQL API.

Why:
- Python has the right libraries for parsing, embeddings, and ranking work.
- The client surfaces never need direct access to the AI engine.
- Operational boundaries are clear: GraphQL owns business workflows, FastAPI owns AI tasks.

Tradeoff:
- Cross-service configuration and deployment are slightly more complex than a pure Node stack.