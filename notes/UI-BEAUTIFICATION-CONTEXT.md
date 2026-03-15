# UI Beautification Context — Handoff Document

> Context document for UI beautification work on the AI Talent Marketplace Platform.

---

## Design System

| Token | Value |
|-------|-------|
| Background | #000000 (pure black) |
| Surface | #111111 |
| Card | #1A1A1A |
| Border | #2A2A2A |
| Accent | #EFFE5E (lime/electric yellow) |
| Text Primary | #FFFFFF |
| Text Secondary | #A1A1AA |
| Success | #22C55E |
| Error | #EF4444 |
| Warning | #F59E0B |

## Typography
- Font: Inter (Google Fonts)
- Headings: Bold, tracking-tight
- Body: Regular, text-sm / text-base

## Component Library
- shadcn/ui + Tailwind CSS
- Dark theme throughout
- Glassmorphism cards where appropriate
- Consistent 8px spacing grid

## Pages Completed (36 screens)
All pages under `apps/web/src/app/`:
- (auth): login, register, forgot-password
- (recruiter): dashboard, demands, talent-search, shortlists, interviews, offers, contracts, analytics, settings, billing
- (admin): dashboard, users, verification, analytics, settings
- (talent): profile, matches, interviews, offers, contracts, mobility, settings
- Shared: notifications, messages, help

## Key Patterns
- Sidebar navigation (collapsible)
- Stat cards with icon + value + trend
- Data tables with filters and search
- Form layouts with validation feedback
- Empty states with illustrations
- Loading skeletons for async content
- Toast notifications for actions

## SOW Alignment
All 16 SOW modules have corresponding UI:
1. User Authentication → auth pages
2. Talent Profiles → talent/profile
3. Smart Matching → talent-search + shortlists
4. Demand Management → demands CRUD
5. Interview Scheduling → interviews
6. Offer Management → offers
7. Analytics → recruiter/analytics + admin/analytics
8. Admin Panel → (admin) route group
9. Notifications → notifications page
10. Messaging → messages page
11. Contract Management → contracts
12. Talent Mobility → mobility
13. Billing → billing
14. Help/Support → help
15. Settings → settings per role
16. Verification → admin/verification
