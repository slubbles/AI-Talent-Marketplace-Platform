# Continue After Sleep — Deployment Reference

> This file contains deployment context. NO secrets are stored here.
> All credentials must be set directly in Render / Vercel dashboards.

---

## Live URLs

| Service | URL |
|---------|-----|
| Web (Vercel) | https://ai-talent-marketplace-platform-web-mu.vercel.app |
| API (Render) | https://atm-api-2hwg.onrender.com |
| AI Engine (Render) | https://atm-ai-engine.onrender.com |
| PostgreSQL (Render) | Internal — atm-postgres |

---

## Environment Variables Needed (set in dashboards, NOT here)

### Render — atm-api
```
DATABASE_URL          → (set in Render dashboard — internal Postgres URL)
JWT_SECRET            → (set in Render dashboard — generate new)
OPENROUTER_API_KEY    → (set in Render dashboard — generate new at openrouter.ai/keys)
RESEND_API_KEY        → (set in Render dashboard — generate new at resend.com)
NEXTAUTH_SECRET       → (set in Render dashboard — generate new)
INTERNAL_API_KEY      → (set in Render dashboard — generate new)
AI_ENGINE_URL         → https://atm-ai-engine.onrender.com
CORS_ALLOWED_ORIGINS  → https://ai-talent-marketplace-platform-web-mu.vercel.app
NODE_ENV              → production
PORT                  → 4000
```

### Render — atm-ai-engine
```
DATABASE_URL          → (set in Render dashboard — external Postgres URL)
OPENROUTER_API_KEY    → (set in Render dashboard — same key as atm-api)
INTERNAL_API_KEY      → (set in Render dashboard — same key as atm-api)
```

### Vercel — web
```
NEXT_PUBLIC_API_URL       → https://atm-api-2hwg.onrender.com
NEXT_PUBLIC_GRAPHQL_URL   → https://atm-api-2hwg.onrender.com/graphql
NEXTAUTH_URL              → https://ai-talent-marketplace-platform-web-mu.vercel.app
NEXTAUTH_SECRET           → (set in Vercel dashboard — same as Render)
```

### Render — atm-postgres
```
Plan: Free
PostgreSQL 14
Extension: pgvector (created via build command)
```

---

## Credential Rotation Checklist

All credentials that were previously in this file have been ROTATED:
- [x] OpenRouter API key — old key disabled by OpenRouter, generate new one
- [ ] Resend API key — rotate at resend.com/api-keys
- [ ] JWT_SECRET — generate new: `openssl rand -base64 32`
- [ ] NEXTAUTH_SECRET — generate new: `openssl rand -base64 32`
- [ ] INTERNAL_API_KEY — generate new: `openssl rand -base64 32`
- [ ] R2 credentials — rotate in Cloudflare dashboard (if used)

---

## Test Accounts (seeded)

| Role | Email | Password |
|------|-------|----------|
| Recruiter | recruiter@marketplace.example | Password1! |
| Admin | admin@marketplace.example | Password1! |
| Headhunter | headhunter@marketplace.example | Password1! |
| Talent | amina.khaled.talent@example.com | Password1! |

---

## Build Commands Reference

### Render atm-api build command:
```
npm install && cd packages/db && npx prisma generate && npx prisma db push && node prisma/seed.js && cd ../../apps/api && npm run build
```

### Render atm-ai-engine build command:
```
pip install -r requirements.txt
```

### Vercel (Root Directory = apps/web):
```
installCommand: npm install --prefix=../..
buildCommand: npx next build
```

---

## Next Steps After Waking Up

1. Generate NEW OpenRouter API key at openrouter.ai/keys
2. Rotate ALL credentials listed in checklist above
3. Update Render + Vercel dashboards with new credentials
4. Test live site end-to-end
5. Send Karim the QA guide + live URL
