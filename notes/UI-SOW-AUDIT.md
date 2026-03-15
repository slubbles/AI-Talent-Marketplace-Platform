# UI-SOW Audit — Userflow Completeness per Module

> Maps every SOW module (3.1–3.16, Section 4, 6, 7) to current UI implementation.
> Flags gaps, missing UI elements, and improvements needed per userflow.
> Use this as the definitive Gemini handoff for UI improvements.

---

## Audit Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented — UI matches SOW requirement |
| ⚠️ | Partially implemented — works but needs UI polish or missing sub-feature |
| ❌ | Missing or stub — no UI for this SOW requirement |
| 🎨 | Cosmetic-only improvement needed (functionality works, visuals need polish) |

---

## Module 3.1 — Talent Registration & Profile System

**SOW Userflow:** Talent signs up → uploads resume → AI parses it → profile is auto-created → talent reviews and edits profile

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Email signup with name/password | — | `(auth)/register.tsx` | ✅ | First/last name + email + password |
| LinkedIn OAuth integration | `/login`, `/register` | `(auth)/login.tsx` | ⚠️ | "Coming Soon" stub buttons exist — Phase 2 |
| Resume upload + AI parsing | — | `onboarding/resume.tsx` | ✅ | File picker → upload → AI parse pipeline works |
| Auto-generated profile from parse | — | `onboarding/profile-review.tsx` | ✅ | AI fills skills, headline, summary, experience |
| Profile edit (skills, certs, pricing, availability, portfolio) | — | `(app)/profile.tsx` | ✅ | ProfileEditor component handles all fields |
| Identity verification display | — | `(app)/profile.tsx` | ⚠️ | Verification status shown but no document upload UI |
| Profile completeness indicator | — | `(app)/index.tsx` | ⚠️ | Onboarding prompt shown when profile incomplete, but no percentage bar |
| Visa eligibility field | — | `(app)/profile.tsx` | ⚠️ | Location exists but no dedicated visa eligibility field in profile editor |

**Gemini TODO:**
1. Add a profile completeness progress bar on mobile home screen (not just a prompt)
2. Add visa/work authorization field to ProfileEditor if missing
3. Polish onboarding flow transitions (resume → profile-review → home) with smoother animations

---

## Module 3.2 — AI Talent Matching Engine

**SOW Userflow:** Recruiter posts demand → AI generates embeddings → matches talent by score → shortlist auto-created

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| AI matching on demand creation | `/dashboard/shortlists` | — | ✅ | "Generate Shortlist" button triggers AI matching |
| NLP skill extraction | — | `onboarding/resume.tsx` | ✅ | AI engine extracts skills from resume |
| Embedding similarity search | Backend | Backend | ✅ | pgvector cosine similarity — no UI needed |
| Match score display | `/dashboard/shortlists` | `(app)/matches/[id].tsx` | ✅ | Percentage score shown on both surfaces |
| Score breakdown (7 factors) | — | `(app)/matches/[id].tsx` | ✅ | All 7 weights: skill, experience, availability, pricing, location, culture, feedback |
| Score breakdown on recruiter side | `/dashboard/shortlists` | — | ⚠️ | Shows overall score but NOT the 7-factor breakdown on web shortlists |
| Availability alerts | `/dashboard/shortlists` | `(app)/index.tsx` | ⚠️ | Availability badge shown, but no proactive alert/notification for changes |
| Pricing estimates | `/dashboard/shortlists` | — | ✅ | Rate range shown on candidate cards |
| Demand alerts for talent | — | `(app)/notifications.tsx` | ✅ | Notifications include new match alerts |

**Gemini TODO:**
1. **Add 7-factor score breakdown to web shortlist candidate cards** — currently only shows overall %, mobile has the full breakdown. Add an expandable section or tooltip showing: Skill Match, Experience, Availability, Pricing, Location, Culture, Feedback
2. Improve shortlist candidate cards with better visual hierarchy (score prominence, skill chips)

---

## Module 3.3 — Demand Management System

**SOW Userflow:** Recruiter creates demand → defines skills, role, experience, location, dates, pricing → submits for matching

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Create demand form | `/dashboard/roles/new` | — | ✅ | Full DemandForm with all fields |
| Skills multi-select | `demand-form.tsx` | — | ✅ | Search + add skills, debounced API |
| Role description field | `demand-form.tsx` | — | ✅ | Raw description + AI-enhanced description |
| Experience level selector | `demand-form.tsx` | — | ✅ | JUNIOR/MID/SENIOR/LEAD/EXECUTIVE |
| Location + remote policy | `demand-form.tsx` | — | ✅ | Text field + REMOTE/HYBRID/ONSITE dropdown |
| Start date + duration | `demand-form.tsx` | — | ✅ | Date picker + duration field |
| Budget range | `demand-form.tsx` | — | ✅ | Min/max + currency selector |
| Project requirements | `demand-form.tsx` | — | ✅ | Textarea for additional requirements |
| Demand status management | `/dashboard/roles` | — | ✅ | Status tabs: ALL/DRAFT/ACTIVE/PAUSED/FILLED/CANCELLED |
| Edit existing demand | `/dashboard/roles/[id]` | — | ✅ | DemandForm in "edit" mode |

**Gemini TODO:**
1. Improve DemandForm layout — currently long single-column. Consider multi-step wizard or card-based sections
2. Add field validation indicators (green checkmark when valid, red when invalid)
3. Skills multi-select could use a chip/tag design with remove X buttons

---

## Module 3.4 — AI Role Description Assistant

**SOW Userflow:** Recruiter types rough description → clicks "AI Enhance" → gets structured JD with recommendations

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| LLM role generation button | `demand-form.tsx` | — | ✅ | Sparkles ✨ "Enhance with AI" button |
| Generated title suggestion | `demand-form.tsx` | — | ✅ | Populates title if empty |
| Responsibilities list | `demand-form.tsx` | — | ✅ | Shown in side panel |
| Requirements list | `demand-form.tsx` | — | ✅ | Auto-fills project requirements |
| Nice-to-haves | `demand-form.tsx` | — | ✅ | Shown in side panel |
| Recommended skills | `demand-form.tsx` | — | ✅ | Shown as list in side panel |
| Salary band suggestion | `demand-form.tsx` | — | ✅ | Min/max/currency/rationale shown |
| Experience level calibration | `demand-form.tsx` | — | ✅ | Auto-sets experience level |
| Enhanced description | `demand-form.tsx` | — | ✅ | Populates AI-generated description field |
| Apply suggestion button | `demand-form.tsx` | — | ✅ | "Apply this suggestion" button in side panel |

**Gemini TODO:**
1. 🎨 AI suggestion side panel could use better visual treatment — clear card separation, animated reveal
2. 🎨 Add loading skeleton for AI generation (currently just spinner text)

---

## Module 3.5 — Talent Shortlisting System

**SOW Userflow:** Demand posted → AI auto-generates shortlist → recruiter reviews candidates with scores → approves/rejects

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Automatic shortlist generation | `/dashboard/shortlists` | — | ✅ | "Generate AI Shortlist" button per demand |
| AI-ranked candidate list | `/dashboard/shortlists` | — | ✅ | Candidates sorted by match score |
| Candidate cards with skills/experience | `/dashboard/shortlists` | — | ✅ | Shows skills, certifications, experience |
| Match score per candidate | `/dashboard/shortlists` | — | ✅ | Percentage badge on each card |
| Approve/reject candidates | `/dashboard/shortlists` | — | ✅ | Status update buttons |
| Candidate profile modal/detail | `/dashboard/shortlists` | — | ✅ | CandidateProfileModal component exists |
| Pricing compatibility | `/dashboard/shortlists` | — | ✅ | Rate range shown |
| Previous feedback display | `/dashboard/shortlists` | — | ⚠️ | Past placement feedback not shown on cards |

**Gemini TODO:**
1. **Add score breakdown tooltip/expandable on each candidate card** (mirrors mobile match detail)
2. Improve candidate card layout — currently dense, could benefit from sections (skills | experience | availability | pricing)
3. Add a compare-candidates feature or side-by-side view toggle

---

## Module 3.6 — Smart Talent Search

**SOW Userflow:** Recruiter searches by skills, industry, experience → sees results with AI recommendations → can seed from any profile

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Semantic text search | `/dashboard/search` | — | ✅ | Uses AI embeddings for semantic matching |
| Skill filter | `/dashboard/search` | — | ✅ | Skills dropdown filter |
| Industry filter | `/dashboard/search` | — | ✅ | Industry dropdown |
| Seniority filter | `/dashboard/search` | — | ✅ | Experience level dropdown |
| Location filter | `/dashboard/search` | — | ✅ | Location text field |
| Rate range filter | `/dashboard/search` | — | ✅ | Min/max rate inputs |
| Boolean filters | `/dashboard/search` | — | ✅ | Applied as combined filters |
| AI recommendation seeds | `/dashboard/search` | — | ✅ | "Find Similar" button per result |
| Pagination | `/dashboard/search` | — | ✅ | Previous/Next page controls |
| Result cards with details | `/dashboard/search` | — | ✅ | Shows name, headline, skills, score, rate |

**Gemini TODO:**
1. 🎨 Search results cards need more visual hierarchy — larger skill chips, clearer score display
2. 🎨 Add filter count badge on search bar
3. 🎨 Glow effects on search bar already exist; enhance results with subtle entrance animations

---

## Module 3.7 — Concierge Talent Acquisition

**SOW Userflow:** Hard-to-fill role flagged → admin assigns headhunter → headhunter submits external candidates → review/approve

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Hard-to-fill flag on demands | `/admin/approvals` | — | ✅ | Toggle for hard-to-fill flag |
| Headhunter assignment management | `/admin/concierge` | — | ✅ | Assignment table with headhunter + demand |
| External candidate submissions | `/admin/concierge` | — | ✅ | Submission tracking: SUBMITTED/REVIEWED/SHORTLISTED/REJECTED |
| Manual sourcing notes | `/admin/concierge` | — | ✅ | Notes fields on assignments |
| Headhunter workload summary | `/admin/concierge` | — | ✅ | Active assignments count per headhunter |

**Gemini TODO:**
1. 🎨 Concierge page could benefit from a Kanban-style board view (submitted → reviewed → shortlisted)
2. 🎨 Improve assignment cards with headhunter avatar/initials and status progress indicator

---

## Module 3.8 — Interview & Hiring Workflow

**SOW Userflow:** Match → review shortlist → schedule interview → conduct → select candidate → generate offer → sign contract

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Interview scheduling | `/dashboard/interviews` | — | ✅ | Schedule interview from shortlist |
| Interview list with status filters | `/dashboard/interviews` | — | ✅ | ALL/SCHEDULED/COMPLETED/CANCELLED/NO_SHOW tabs |
| Interview detail view | `/dashboard/interviews/[d]/[i]` | — | ✅ | Full detail: candidate, time, notes, meeting URL |
| Interview feedback/rating | `/dashboard/interviews/[d]/[i]` | — | ✅ | Rating + feedback submission |
| Talent interview response | — | `(app)/interviews.tsx` | ✅ | Accept/decline with reason |
| Candidate tracking through pipeline | `/dashboard/roles/[id]` | — | ✅ | Role detail shows shortlist → interview → offer history |
| Offer creation | `/dashboard/offers` | — | ✅ | Create offer with rate, dates, terms |
| Offer management | `/dashboard/offers` | — | ✅ | DRAFT/SENT/ACCEPTED/DECLINED/WITHDRAWN |
| Offer detail view | `/dashboard/offers/[d]/[o]` | — | ✅ | Full offer terms, candidate info, demand summary |
| Talent offer response | — | `(app)/offers.tsx` | ✅ | Accept/decline offers |
| Digital contracts | `/dashboard/contracts` | — | ✅ | Contract pipeline tracking |
| Contract stages | `/dashboard/contracts` | — | ✅ | OFFER_ACCEPTED → CONTRACT_SENT → SIGNED → ONBOARDING → COMPLETED |

**Gemini TODO:**
1. 🎨 Interview detail page — improve layout with better section cards (candidate profile card, schedule card, feedback card)
2. 🎨 Offer detail page — add timeline visualization showing offer stages
3. 🎨 Contracts page — improve the pipeline visualization, currently card-based but could use a Kanban/stage view

---

## Module 3.9 — Talent Mobility Services

**SOW Userflow:** Talent needs relocation → admin tracks visa status → accommodation/onboarding assistance

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Visa tracking dashboard | `/admin/mobility` | — | ✅ | Status cards: APPROVED/PENDING/IN_REVIEW/REJECTED |
| Accommodation support tracking | `/admin/mobility` | — | ⚠️ | Mentioned in UI but limited detail fields |
| Relocation pipeline | `/admin/mobility` | — | ✅ | Stage-based tracking |
| Onboarding assistance | `/dashboard/contracts` | — | ✅ | ONBOARDING stage in contract pipeline |
| Services offered overview | `/admin/mobility` | — | ✅ | Services list displayed |

**Gemini TODO:**
1. 🎨 Mobility page uses mock data — improve visual treatment to look like real data
2. Add country flags/icons next to visa destination fields
3. Timeline visualization for each mobility case (application → review → approved → relocated)

---

## Module 3.10 — Talent Demand Forecasting Engine

**SOW Userflow:** Platform analyzes trends → predicts demand gaps → displays forecast charts

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Demand trend analysis | `/admin/analytics` | — | ✅ | Demand trends line chart |
| Supply gap prediction | `/admin/analytics` | — | ✅ | Supply/demand gap visualization |
| Workforce planning metrics | `/admin/analytics` | — | ✅ | Utilization and capacity charts |
| Market skill demand analysis | `/admin/analytics` | — | ✅ | Skill distribution charts |
| Forecast visualization | `/admin/analytics` | — | ✅ | Projected demand line with trend |

**Gemini TODO:**
1. 🎨 Improve chart layouts — add more descriptive titles and insight callouts
2. 🎨 Add data-driven insight cards below charts ("Demand for AI Engineers up 34% this quarter")

---

## Module 3.11 — Talent Supply Management

**SOW Userflow:** Admin monitors talent pool → tracks availability → manages redeployment pipeline

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Talent pool metrics | `/admin` | — | ✅ | Total talent, verified count, pending |
| Skill distribution | `/admin/analytics` | — | ✅ | Skill category breakdown chart |
| Availability tracking | `/admin/analytics` | — | ✅ | Supply metrics tracked |
| Talent lifecycle view | `/admin/users` + `/admin/verification` | — | ✅ | User table with active/verified status |
| Talent redeployment | `/admin/analytics` | — | ⚠️ | Redeployment not explicitly surfaced as separate view |

**Gemini TODO:**
1. 🎨 Consider adding a "Talent Pool" card on admin dashboard showing availability breakdown (Immediate / 2 weeks / 1 month / Unavailable)

---

## Module 3.12 — Governance & Oversight Dashboard

**SOW Userflow:** Admin monitors demand across companies → resource utilization → cost analytics → hiring efficiency

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Demand monitoring across companies | `/admin` + `/admin/companies` | — | ✅ | Per-company demand count and status |
| Resource utilization tracking | `/admin/analytics` | — | ✅ | Utilization chart with capacity |
| Talent cost analytics | `/admin/analytics` | — | ✅ | Pricing trends chart |
| Hiring efficiency metrics | `/admin/analytics` | — | ✅ | Time-to-hire, pipeline conversion |
| Company-level metrics | `/admin/companies` | — | ✅ | Active demands, placements per company |

**Gemini TODO:**
1. 🎨 Admin dashboard KPI cards — improve visual weight and add trend arrows (↑ 12% vs last month)
2. 🎨 Company page — add mini sparkline charts per company row

---

## Module 3.13 — Reporting & Analytics

**SOW Userflow:** Recruiter and admin view analytics dashboards with talent, demand, and financial metrics

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Talent analytics (utilization, skill dist, velocity) | `/admin/analytics` | — | ✅ | Multiple charts |
| Demand analytics (open roles, timelines, gaps) | `/admin/analytics` + `/dashboard/analytics` | — | ✅ | Charts on both dashboards |
| Financial analytics (cost, revenue, pricing) | `/admin/analytics` + `/admin/billing` | — | ✅ | Pricing trends + revenue overview |
| Recruiter hiring analytics | `/dashboard/analytics` | — | ✅ | Bar charts, line charts, funnel, stat cards |
| Export/download reports | — | — | ❌ | No export/download functionality in any analytics page |

**Gemini TODO:**
1. **Add "Export CSV" or "Download Report" button to analytics pages** — even if it's a client-side CSV export of the displayed data
2. 🎨 Improve chart responsiveness and add better legends

---

## Module 3.14 — Pricing & Monetization System

**SOW Userflow:** Platform displays pricing tiers → subscription, hard-to-fill fee, placement commission → transaction history

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Subscription model display | `/admin/billing` | — | ✅ | 3 tiers: Starter/Professional/Enterprise |
| Hard-to-fill role fee | `/admin/billing` | — | ✅ | Premium pricing model card |
| Placement commission (10%) | `/admin/billing` | — | ✅ | Commission model card |
| Revenue KPIs | `/admin/billing` | — | ✅ | Total revenue, MRR, active subs, avg placement |
| Transaction history table | `/admin/billing` | — | ✅ | Table with company, type, amount, date, status |
| Revenue trend chart | `/admin/billing` | — | ✅ | Monthly revenue bar chart |

**Gemini TODO:**
1. 🎨 Pricing tier cards — add visual hierarchy (highlight "most popular" tier)
2. 🎨 Transaction table — add status badge colors

---

## Module 3.15 — Notification System

**SOW Userflow:** System triggers notifications → talent sees alerts for matches, interviews, offers → email + push + in-app

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| In-app notifications (web) | `notification-panel.tsx` | — | ✅ | Side panel with notification list |
| In-app notifications (mobile) | — | `(app)/notifications.tsx` | ✅ | Full notification screen |
| New match alerts | — | `(app)/notifications.tsx` | ✅ | Match notifications |
| Interview request alerts | — | `(app)/notifications.tsx` | ✅ | Interview notifications |
| Offer alerts | — | `(app)/notifications.tsx` | ✅ | Offer notifications |
| Unread indicator | `notification-panel.tsx` | `(app)/notifications.tsx` | ✅ | Bell icon badge + unread highlight |
| Mark as read | `notification-panel.tsx` | `(app)/notifications.tsx` | ✅ | Individual + bulk mark read |
| Email notifications | Backend (Resend) | — | ✅ | 5 branded email templates |
| Push notifications | — | — | ⚠️ | Not implemented (requires Expo push tokens) — Phase 2 |
| SMS notifications | — | — | ❌ | Explicitly Phase 2 (Twilio) |

**Gemini TODO:**
1. 🎨 Web notification panel — improve card design with icon per notification type (match icon, interview icon, offer icon)
2. 🎨 Mobile notifications — add category filter tabs (All / Matches / Interviews / Offers)

---

## Module 3.16 — Contracting & Onboarding System

**SOW Userflow:** Offer accepted → contract generated → talent onboarded → compliance tracked

| Requirement | Web | Mobile | Status | Notes |
|-------------|-----|--------|--------|-------|
| Digital contracts | `/dashboard/contracts` | — | ✅ | Contract pipeline with stages |
| Contract stages tracking | `/dashboard/contracts` | — | ✅ | OFFER_ACCEPTED → CONTRACT_SENT → SIGNED → ONBOARDING → COMPLETED |
| Onboarding workflow | `/dashboard/contracts` | — | ✅ | ONBOARDING stage visible |
| Compliance documentation | `/dashboard/contracts` | — | ⚠️ | Contract details shown but no document attachment UI |
| E-signature integration | — | — | ❌ | Phase 2 (DocuSign) |

**Gemini TODO:**
1. 🎨 Contract pipeline — add a visual stage progress bar per contract (dot indicators showing current stage)
2. 🎨 Add "Download Contract" button (even if placeholder) for UI completeness

---

## Section 4 — Admin Platform

| Requirement | Route | Status | Notes |
|-------------|-------|--------|-------|
| User management | `/admin/users` | ✅ | Table with role, status, verification, edit |
| Talent verification | `/admin/verification` | ✅ | Queue with approve/reject + skills display |
| Recruiter accounts | `/admin/users` (filtered) + `/admin/companies` | ✅ | Role-filtered view in user management |
| Role/demand approvals | `/admin/approvals` | ✅ | Pending queue with notes, approve/reject, hard-to-fill flag |
| Payment settings | `/admin/billing` | ✅ | Revenue models, pricing tiers, transactions |
| Headhunter integration | `/admin/concierge` | ✅ | Assignment management + submission tracking |

**Gemini TODO:**
1. 🎨 User management — add user avatar/initials column, improve role badge styling
2. 🎨 Verification page — add a "Verified" success animation when approving talent

---

## Section 6 — AI Capabilities

| Capability | UI Surface | Status | Notes |
|------------|-----------|--------|-------|
| Role description generator | `demand-form.tsx` AI panel | ✅ | Sparkles button → side panel with full suggestion |
| Talent matching engine | `/dashboard/shortlists` | ✅ | "Generate Shortlist" → AI-ranked list |
| Candidate ranking model | `/dashboard/shortlists` + `matches/[id].tsx` | ✅ | Score display on web + 7-factor breakdown on mobile |
| Demand forecasting | `/admin/analytics` | ✅ | Forecast charts with trend lines |
| Skill extraction | `onboarding/resume.tsx` | ✅ | AI parses resume → fills profile skills |
| Career trajectory analysis | `matches/[id].tsx` | ⚠️ | Experience match shown but not labeled as "career trajectory" |

**Gemini TODO:**
1. Label the experience factor as "Career Trajectory" in match detail to align with SOW language

---

## Section 7 — Security & Compliance

| Requirement | Implementation | Status | Notes |
|-------------|---------------|--------|-------|
| RBAC enforcement | Dashboard/Admin layout guards | ✅ | Role checks in layouts |
| Session management | NextAuth.js + JWT | ✅ | Server-side session validation |
| Secure authentication | Bcrypt hashing + JWT tokens | ✅ | No plaintext passwords |
| Data encryption | HTTPS + JWT | ✅ | All API calls encrypted in transit |
| Audit logs | — | ⚠️ | No UI for audit log viewing (admin) |
| Data privacy | — | ⚠️ | No explicit GDPR consent toggle or data export in UI |

**Gemini TODO (low priority):**
1. Consider adding an "Audit Log" section to admin (even read-only activity feed)
2. Consider adding GDPR consent checkbox to registration form

---

## Summary — Priority Actions for Gemini

### HIGH Priority (SOW Alignment)
1. **Web shortlist: Add 7-factor match score breakdown** — mobile has it, web doesn't
2. **Analytics: Add "Export CSV" button** — SOW mentions reporting, no export exists
3. **Contract pipeline: Add visual stage progress indicator** — stages exist but no visual progress bar

### MEDIUM Priority (UX Polish)
4. Mobile home: Add profile completeness progress bar
5. DemandForm: Multi-step wizard layout or card-based sections
6. Admin dashboard KPIs: Add trend arrows and sparklines
7. Notification panel: Icon per notification type
8. Shortlist candidate cards: Better visual hierarchy with sections

### LOW Priority (Cosmetic)
9. All analytics charts: Better titles, insight callouts, legends
10. Mobility page: Country flags, timeline visualization
11. Concierge page: Kanban-style view for submissions
12. Interview/Offer detail: Section card layout improvements
13. Billing page: Highlight "popular" tier, better transaction table
14. User management: Avatar/initials column
15. AI suggestion panel: Better card separation, loading skeleton

---

## Cross-Cutting UI Issues

| Issue | Pages Affected | Fix |
|-------|---------------|-----|
| Inconsistent card padding | Multiple | Standardize to `p-6` for feature cards, `p-5` for stat cards |
| Missing loading skeletons | Shortlists, Search, Interviews | Add shimmer skeleton placeholders while data loads |
| Empty states vary in quality | Multiple | Standardize all empty states with icon + heading + description |
| Table styles inconsistent | Users, Contracts, Billing | Unify header bg, row borders, hover states |
| Mobile screen transitions | All mobile screens | Add consistent enter/exit animations |
| Status badge inconsistency | Multiple | Some use pill badges, some inline text — standardize all to pill badges |
