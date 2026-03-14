# UI Context — AI Talent Marketplace Platform

> Complete map of every UI page, its route, what backend data it uses, and what components it needs.
> Use this as the single source of truth when beautifying or extending the frontend.

---

## Web Application — Route Map

**Framework:** Next.js 14 (App Router), deployed at root `/`
**Auth:** NextAuth.js with JWT — session checked server-side via `getSession()`
**Data:** GraphQL via `graphQLRequest()` helper hitting API at `process.env.NEXT_PUBLIC_GRAPHQL_URL` (default `http://localhost:4000/graphql`)

### Public Pages (No Auth)

| Route | File | Description | Backend Queries |
|-------|------|-------------|-----------------|
| `/` | `app/page.tsx` | Landing page — hero, features, CTA | None (static) |
| `/login` | `app/login/page.tsx` | Email/password login + LinkedIn stub | `login` mutation |
| `/register` | `app/register/page.tsx` | Registration with role selection | `register` mutation |
| `/forgot-password` | `app/forgot-password/page.tsx` | Password reset request | `forgotPassword` mutation |
| `/reset-password` | `app/reset-password/page.tsx` | New password entry | `resetPassword` mutation |

### Recruiter Dashboard (`/dashboard/*`)

**Layout:** `app/dashboard/layout.tsx` → uses `DashboardShell` component
**Auth Guard:** Requires `RECRUITER` or `ADMIN` role, active account

| Route | File | Description | Backend Queries/Mutations |
|-------|------|-------------|--------------------------|
| `/dashboard` | `app/dashboard/page.tsx` | Recruiter overview — KPIs, recent activity, roles needing attention | `recruiterDashboard` query |
| `/dashboard/roles` | `app/dashboard/roles/page.tsx` | List all demands/roles | `myDemands` query |
| `/dashboard/roles/new` | `app/dashboard/roles/new/page.tsx` | Create new demand | `createDemand` mutation, `skills` query, `companies` query |
| `/dashboard/roles/[id]` | `app/dashboard/roles/[id]/page.tsx` | View/edit demand detail | `demand(id)` query, `updateDemand` mutation |
| `/dashboard/shortlists` | `app/dashboard/shortlists/page.tsx` | AI-generated talent shortlists per demand | `myDemands` query, `shortlist(demandId)` query, `generateShortlist` mutation |
| `/dashboard/search` | `app/dashboard/search/page.tsx` | Smart talent search workbench | `smartTalentSearch` query, `skills` query |
| `/dashboard/interviews` | `app/dashboard/interviews/page.tsx` | Interview management | `myDemands` query, `shortlist(demandId)` query (with interviews) |
| `/dashboard/interviews/[demandId]/[interviewId]` | `app/dashboard/interviews/[demandId]/[interviewId]/page.tsx` | Interview detail | `shortlist(demandId)` + filter by interview |
| `/dashboard/offers` | `app/dashboard/offers/page.tsx` | Offer management | `myDemands` query, `shortlist(demandId)` (with offers) |
| `/dashboard/offers/[demandId]/[offerId]` | `app/dashboard/offers/[demandId]/[offerId]/page.tsx` | Offer detail | `shortlist(demandId)` + filter by offer |
| `/dashboard/contracts` | `app/dashboard/contracts/page.tsx` | Contract & onboarding tracking | `myDemands` query, `shortlist(demandId)` (offers with ACCEPTED status) |
| `/dashboard/analytics` | `app/dashboard/analytics/page.tsx` | Recruiter hiring metrics | `recruiterAnalytics` query |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | Profile & workspace settings | `me` query |

### Admin Console (`/admin/*`)

**Layout:** `app/(admin)/admin/layout.tsx` → uses `AdminShell` component
**Auth Guard:** Requires `ADMIN` role

| Route | File | Description | Backend Queries/Mutations |
|-------|------|-------------|--------------------------|
| `/admin` | `app/(admin)/admin/page.tsx` | Admin overview — platform KPIs, pending items | `adminDashboard` query |
| `/admin/users` | `app/(admin)/admin/users/page.tsx` | User management, role assignment | `users` query, `updateUserAdmin` mutation |
| `/admin/verification` | `app/(admin)/admin/verification/page.tsx` | Talent profile verification queue | `talentProfiles(verificationStatus: PENDING)`, `verifyTalent`/`rejectTalent` mutations |
| `/admin/approvals` | `app/(admin)/admin/approvals/page.tsx` | Demand approval queue | `demands(approvalStatus: PENDING)`, `updateDemandApproval` mutation |
| `/admin/companies` | `app/(admin)/admin/companies/page.tsx` | Company directory | `companies` query, `createCompany`/`updateCompany`/`deleteCompany` mutations |
| `/admin/analytics` | `app/(admin)/admin/analytics/page.tsx` | Platform-wide analytics — forecasting, supply/demand, pricing trends | `adminAnalytics` query |
| `/admin/billing` | `app/(admin)/admin/billing/page.tsx` | Revenue models & pricing display | Static (no backend yet — Stripe Phase 2) |
| `/admin/concierge` | `app/(admin)/admin/concierge/page.tsx` | Headhunter assignments & external candidates | `headhunterAssignments` query, `externalCandidateSubmissions` query |
| `/admin/mobility` | `app/(admin)/admin/mobility/page.tsx` | Talent mobility — visa tracking, relocation support | `talentProfiles` query (visa/location data) |

---

## Web Application — Component Map

### Shell / Layout Components

| Component | File | Renders |
|-----------|------|---------|
| `DashboardShell` | `components/dashboard-shell.tsx` | Recruiter sidebar nav + top header bar |
| `AdminShell` | `components/admin-shell.tsx` | Admin sidebar nav + top header bar |
| `CommandPalette` | `components/command-palette.tsx` | Cmd+K global search overlay |
| `NotificationPanel` | `components/notification-panel.tsx` | Notifications slide-out panel |
| `PageTransition` | `components/page-transition.tsx` | Framer Motion page wrapper |

### shadcn/ui Primitives (`components/ui/`)

| Component | Purpose |
|-----------|---------|
| `Button` | All buttons (8 variants: default, destructive, outline, secondary, ghost, link, hero, hero-outline) |
| `Input` | Text fields |
| `Label` | Form labels |
| `Select` | Dropdowns (Radix-based: SelectTrigger, SelectContent, SelectItem, SelectValue) |
| `Switch` | Toggles |
| `Textarea` | Multi-line text |

### Page-Specific Components

| Component | File | Used By |
|-----------|------|---------|
| `AnalyticsDashboard` | `app/dashboard/analytics/analytics-dashboard.tsx` | Recruiter analytics page |
| `AnalyticsOverview` | `app/(admin)/admin/analytics/analytics-overview.tsx` | Admin analytics page |
| `DemandForm` | `app/dashboard/roles/demand-form.tsx` | Create/edit role pages |
| `RoleDetailClient` | `app/dashboard/roles/[id]/role-detail-client.tsx` | Role detail page |
| `SearchWorkbench` | `app/dashboard/search/search-workbench.tsx` | Smart search page |
| `ShortlistWorkbench` | `app/dashboard/shortlists/shortlist-workbench.tsx` | Shortlists page |
| `CandidateProfileModal` | `app/dashboard/shortlists/candidate-profile-modal.tsx` | Talent profile overlay |
| `SettingsClient` | `app/dashboard/settings/settings-client.tsx` | Settings page |
| `UsersAdminClient` | `app/(admin)/admin/users/users-admin-client.tsx` | User management page |
| `VerificationAdminClient` | `app/(admin)/admin/verification/verification-admin-client.tsx` | Verification queue |
| `ApprovalsAdminClient` | `app/(admin)/admin/approvals/approvals-admin-client.tsx` | Approval queue |
| `CompaniesAdminClient` | `app/(admin)/admin/companies/companies-admin-client.tsx` | Company management |
| `ConciergeAdminClient` | `app/(admin)/admin/concierge/concierge-admin-client.tsx` | Concierge management |

### Charts (Recharts)

Used in analytics pages. Dark-themed tooltips with custom styling:
- `AreaChart`, `BarChart`, `LineChart`, `PieChart`, `RadarChart`
- Custom dark tooltip: `bg-[#0A0A0A] border-[#27272A] text-white`

---

## Mobile Application — Screen Map

**Framework:** Expo SDK 50 + React Native 0.73 + Expo Router
**Auth:** JWT tokens stored in AsyncStorage via `AuthProvider`
**Data:** GraphQL via `graphQLRequest()` helper + Apollo Client

### Auth Screens (`(auth)/`)

| Screen | File | Description | Backend |
|--------|------|-------------|---------|
| Login | `app/(auth)/login.tsx` | Email/password login | `login` mutation |
| Register | `app/(auth)/register.tsx` | Account creation | `register` mutation |
| Forgot Password | `app/(auth)/forgot-password.tsx` | Password reset | `forgotPassword` mutation |

### App Screens (`(app)/`)

| Screen | File | Description | Backend |
|--------|------|-------------|---------|
| Home | `app/(app)/index.tsx` | Dashboard — match count, upcoming interviews, recent offers | `myMatches`, `myProfile` queries |
| Profile | `app/(app)/profile.tsx` | View/edit talent profile | `myProfile` query, `updateTalentProfile` mutation |
| Applications | `app/(app)/applications.tsx` | Job matches and applications | `myMatches` query |
| Notifications | `app/(app)/notifications.tsx` | Notification center | `notifications` query, `markNotificationRead` mutation |
| Interviews | `app/(app)/interviews.tsx` | Scheduled interviews | `myMatches` (with interview data) |
| Offers | `app/(app)/offers.tsx` | Received offers | `myMatches` (with offer data) |
| Match Detail | `app/(app)/matches/[id].tsx` | Full match detail | `myMatches` filtered by ID |

### Onboarding Screens (`(app)/onboarding/`)

| Screen | File | Description |
|--------|------|-------------|
| Profile Review | `app/(app)/onboarding/profile-review.tsx` | Complete profile before matching |
| Resume Upload | `app/(app)/onboarding/resume.tsx` | Upload/parse resume |

### Mobile Components

| Component | File | Purpose |
|-----------|------|---------|
| `MatchCard` | `app/(app)/components/match-card.tsx` | Job match card with score |
| `ProfileEditor` | `app/(app)/components/profile-editor.tsx` | Profile form component |

### Mobile Providers

| Provider | File | Purpose |
|----------|------|---------|
| `AuthProvider` | `app/providers/auth-provider.tsx` | Authentication state |
| `MobileApolloProvider` | `app/providers/apollo-provider.tsx` | GraphQL client |
| `TalentProfileProvider` | `app/providers/talent-profile-provider.tsx` | Profile context |
| `TalentWorkflowProvider` | `app/providers/talent-workflow-provider.tsx` | Workflow state |

---

## Backend API — Available Operations

### Queries (21)

| Query | Returns | Used By |
|-------|---------|---------|
| `healthcheck` | Status, DB ping | Monitoring |
| `me` | Current user | Settings, auth checks |
| `linkedInAuthProvider` | LinkedIn OAuth status | Login page |
| `recruiterDashboard` | KPIs, activity feed | Recruiter dashboard |
| `recruiterAnalytics` | Charts data (velocity, skills, pipeline) | Recruiter analytics |
| `adminDashboard` | Platform KPIs, verification queue | Admin dashboard |
| `adminAnalytics` | Forecasting, supply/demand, pricing trends | Admin analytics |
| `recruiterDashboardAccess` | Boolean | Route guards |
| `talentProfile(id)` | Single profile | Profile views |
| `talentProfiles(filters)` | Paginated profiles | Admin verification, search |
| `myProfile` | Own talent profile | Mobile profile screen |
| `demand(id)` | Single demand | Role detail |
| `demands(filters)` | Paginated demands | Admin approvals |
| `myDemands` | Recruiter's demands | Roles, interviews, offers pages |
| `shortlist(demandId)` | Matched candidates | Shortlists, interviews, offers |
| `myMatches` | Talent's matches | Mobile home, applications |
| `smartTalentSearch` | Search results (pgvector) | Smart search page |
| `skills` | Skill catalog | Role creation, search filters |
| `notifications` | User notifications | Notification panel/screen |
| `unreadCount` | Notification badge | Shell headers |
| `users` | All users (admin) | User management |
| `companies` | Company list | Company management, role creation |
| `headhunterAssignments` | Assignments | Concierge page |
| `externalCandidateSubmissions` | External candidates | Concierge page |

### Mutations (38)

**Auth:** `register`, `login`, `refreshToken`, `forgotPassword`, `resetPassword`
**Profile:** `createTalentProfile`, `updateTalentProfile`, `uploadResume`, `uploadAsset`, `storeGeneratedDocument`, `updateAvailability`, `updatePricing`
**Demands:** `createDemand`, `updateDemand`, `pauseDemand`, `cancelDemand`, `fillDemand`
**Matching:** `generateShortlist`, `shortlistCandidate`, `reviewCandidate`, `rejectCandidate`, `respondToMatch`
**Interviews:** `scheduleInterview`, `updateInterview`, `cancelInterview`, `submitFeedback`, `respondToInterview`
**Offers:** `createOffer`, `updateOffer`, `acceptOffer`, `declineOffer`
**Notifications:** `markNotificationRead`
**Companies:** `createCompany`, `updateCompany`, `deleteCompany`
**Admin:** `updateUserAdmin`, `verifyTalent`, `rejectTalent`, `updateDemandApproval`
**AI:** `generateRoleDescription`
**Headhunter:** `createHeadhunterAssignment`, `createExternalCandidateSubmission`, `updateExternalCandidateSubmissionStatus`

### Key Enums

```
UserRole: TALENT, RECRUITER, ADMIN, HEADHUNTER
DemandStatus: DRAFT, ACTIVE, PAUSED, FILLED, CANCELLED
ShortlistStatus: AI_SUGGESTED, RECRUITER_REVIEWED, SHORTLISTED, REJECTED
InterviewStatus: SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
OfferStatus: DRAFT, SENT, ACCEPTED, DECLINED, WITHDRAWN
VerificationStatus: PENDING, VERIFIED, REJECTED
AvailabilityWindow: IMMEDIATE, TWO_WEEKS, ONE_MONTH, THREE_MONTHS, NOT_AVAILABLE
SeniorityLevel: JUNIOR, MID, SENIOR, LEAD, EXECUTIVE
```

---

## Sidebar Navigation Reference

### Recruiter (DashboardShell)

```
Workspace
  ├── Dashboard      /dashboard
  ├── Roles          /dashboard/roles
  ├── Shortlists     /dashboard/shortlists
  └── Search         /dashboard/search

Pipeline
  ├── Interviews     /dashboard/interviews
  ├── Offers         /dashboard/offers
  └── Contracts      /dashboard/contracts    ← NEW

Insights
  └── Analytics      /dashboard/analytics
```

### Admin (AdminShell)

```
Overview
  └── Dashboard      /admin

Governance
  ├── Users          /admin/users
  ├── Verification   /admin/verification
  ├── Approvals      /admin/approvals
  └── Concierge      /admin/concierge

Platform
  ├── Companies      /admin/companies
  ├── Analytics      /admin/analytics
  ├── Billing        /admin/billing
  └── Mobility       /admin/mobility          ← NEW
```
