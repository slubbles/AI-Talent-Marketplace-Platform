FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/db/prisma packages/db/prisma
RUN npm ci --ignore-scripts
RUN npx prisma generate --schema packages/db/prisma/schema.prisma

# Build
FROM deps AS builder
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api
RUN npm run build --workspace @atm/shared
RUN npm run build --workspace @atm/api

# Production
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/packages/db/node_modules packages/db/node_modules
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/package.json apps/api/package.json
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/shared/package.json packages/shared/package.json
COPY --from=builder /app/packages/db packages/db
COPY --from=deps /app/package.json package.json

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
