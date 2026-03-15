QA Testing Guide — AI Talent Marketplace Platform
=================================================

Live URL: https://ai-talent-marketplace-platform-web-mu.vercel.app
Backend API: https://atm-api-2hwg.onrender.com/graphql
AI Engine: https://atm-ai-engine.onrender.com

Note: Backend is on free tier. First request after inactivity takes 30-60 seconds to wake up. Be patient on the first click.


LOGIN CREDENTIALS
-----------------

Recruiter account (web dashboard):
  Email: recruiter@marketplace.example
  Password: Password1!

Admin account (admin console):
  Email: admin@marketplace.example
  Password: Password1!

Headhunter account (concierge features):
  Email: headhunter@marketplace.example
  Password: Password1!

Talent account (mobile app):
  Email: amina.khaled.talent@example.com
  Password: Password1!


========================================================================
PART 1 — LANDING PAGE & AUTHENTICATION (SOW: Talent Registration)
========================================================================

Route: /

1. Open the live URL
2. You should see the marketing homepage with:
   - "Hire the Right Talent. Fast." hero section
   - Platform stats: 4.2 hrs avg time, 93% match accuracy, 2,300+ profiles
   - Feature showcase cards
   - "Get Started" and "Sign In" buttons
3. Check that the design looks professional, dark theme, lime-green accent color
4. Click "Sign In" — should go to /login

Route: /login

5. You should see a login form with email and password fields
6. Try logging in with WRONG credentials — should show an error message
7. Try logging in with: recruiter@marketplace.example / Password1!
8. Should redirect to /dashboard
9. Check there's a "Forgot password?" link

Route: /register

10. Go back to /register (or click Get Started from homepage)
11. You should see a registration form with:
    - First name, last name
    - Email
    - Password with strength indicator
    - Confirm password
    - Role selection
12. Try typing a weak password — strength indicator should show red/weak
13. Try mismatching passwords — should show validation error
14. Do NOT submit (we don't want to create a random account)

Route: /forgot-password

15. Navigate to /forgot-password
16. Should show an email input field
17. Type any email and submit — should show a confirmation message

Route: /reset-password

18. Navigate to /reset-password
19. Should show password and confirm password fields


========================================================================
PART 2 — RECRUITER DASHBOARD (SOW: Demand Management, Analytics)
========================================================================

Login as: recruiter@marketplace.example / Password1!

Route: /dashboard

1. You should see the main recruiter dashboard with:
   - Welcome message with the recruiter's name
   - Key stats: Active Roles, Talent Pool Size, Interviews This Week, Avg Time to Shortlist
   - Recent activity feed
   - Roles needing attention
2. Check that numbers are populated from seed data (not all zeros)
3. Navigation sidebar should show: Dashboard, Roles, Search, Shortlists, Interviews, Offers, Contracts, Analytics, Settings


========================================================================
PART 3 — ROLE/DEMAND MANAGEMENT (SOW: Demand Management + AI Assistant)
========================================================================

Route: /dashboard/roles

1. Should show a list of existing roles/demands from seed data
2. Each role should show: title, status, location, experience level
3. There should be a "New Role" or "+" button to create a new demand

Route: /dashboard/roles/new

4. Click the new role button
5. You should see a demand creation form with:
   - Title field
   - Description (large text area)
   - Company dropdown
   - Experience level dropdown (Junior, Mid, Senior, Lead, Executive)
   - Location field
   - Remote policy dropdown
   - Start date
   - Contract duration
   - Budget min/max with currency
   - Required skills (multi-select, searchable)
   - Project requirements text area
6. There should be an AI "Generate Role Description" button
7. Click the AI generate button after filling in a title like "Senior React Developer"
8. The AI should return:
   - Enhanced title
   - Summary
   - Responsibilities list
   - Requirements list
   - Nice-to-haves
   - Recommended skills
   - Salary band suggestion
9. You can accept the AI suggestions or modify them
10. Submit the form to create the demand

Route: /dashboard/roles/[id] (click any existing role)

11. Click on an existing role from the roles list
12. Should show full role details:
    - Role title, description, status
    - Required skills with proficiency levels
    - Shortlisted candidates with match scores
    - Interview pipeline
    - AI match scoring breakdown


========================================================================
PART 4 — AI TALENT SEARCH (SOW: Smart Talent Search + AI Matching)
========================================================================

Route: /dashboard/search

1. Should show the search workbench with filters on the left and results on the right
2. Available filters:
   - Natural language search box (type something like "Python developer with AWS experience")
   - Skill filters with autocomplete
   - Skill match mode toggle: AND / OR / WEIGHTED
   - Industry filter dropdown
   - Seniority level dropdown
   - Availability filter
   - Location filter
   - Hourly rate range (min/max)
3. Type a search query and hit search
4. Results should show talent cards with:
   - Name, headline, summary
   - Match score (color coded: green 80+, amber 60-80, red below 60)
   - Skills with years of experience
   - Hourly rate
   - Location
   - Availability status
   - Verification badge
5. Click on a talent card for expanded details
6. Pagination should work if there are many results
7. Try different filter combinations to verify they narrow results
8. AI recommendations should appear suggesting search improvements


========================================================================
PART 5 — SHORTLISTING (SOW: Talent Shortlisting System)
========================================================================

Route: /dashboard/shortlists

1. Should show shortlists organized by demand/role
2. Each shortlist entry shows:
   - Demand title
   - Number of shortlisted candidates
   - Match scores for each candidate
   - Candidate names and key info
3. From the search page, there should be an option to add candidates to a shortlist
4. Shortlisted candidates should be rankable/reorderable
5. Status tracking per candidate (shortlisted, contacted, interviewing, etc.)


========================================================================
PART 6 — INTERVIEW & HIRING PIPELINE (SOW: Interview & Hiring Workflow)
========================================================================

Route: /dashboard/interviews

1. Should show the interview pipeline view
2. Organized by demand — each demand shows its interview queue
3. Pipeline stages visible: Scheduled, In Progress, Completed, Decision Made
4. Each interview entry shows:
   - Candidate name
   - Demand/role title
   - Interview date/time
   - Status
   - Feedback & rating (if completed)
5. Click into an individual interview for details

Route: /dashboard/interviews/[demandId]/[interviewId]

6. Should show full interview detail page with:
   - Candidate information
   - Interview schedule
   - Feedback form
   - Rating system
   - Notes section
   - Status update controls


========================================================================
PART 7 — OFFERS (SOW: Interview & Hiring Workflow — Offer Generation)
========================================================================

Route: /dashboard/offers

1. Should show all offers across demands
2. Each offer shows: candidate, role, status, salary/rate details

Route: /dashboard/offers/[demandId]/[offerId]

3. Should show full offer details:
   - Candidate info
   - Role details
   - Compensation breakdown
   - Offer status (draft, sent, accepted, rejected, expired)
   - Action buttons (send, revoke, etc.)


========================================================================
PART 8 — CONTRACTS & ONBOARDING (SOW: Contracting & Onboarding)
========================================================================

Route: /dashboard/contracts

1. Should show the post-offer contract pipeline
2. Contract stages: Contract Sent, Contract Signed, Onboarding, Completed
3. Each contract shows:
   - Candidate and role
   - Contract status
   - Key dates
4. This demonstrates the contracting and onboarding workflow per SOW


========================================================================
PART 9 — RECRUITER ANALYTICS (SOW: Reporting & Analytics)
========================================================================

Route: /dashboard/analytics

1. Should show comprehensive recruiter analytics dashboard with charts:
   - Hiring velocity (time-to-hire trends)
   - Open roles by status (bar/pie chart)
   - Top requested skills
   - Pipeline conversion rates
   - Cost per hire metrics
2. Charts should render with seed data (not empty)
3. Check that the visual design is clean and readable


========================================================================
PART 10 — RECRUITER SETTINGS
========================================================================

Route: /dashboard/settings

1. Should show account settings page
2. Profile management options
3. Notification preferences with toggle switches
4. Check toggle switches work (click on/off)


========================================================================
PART 11 — ADMIN CONSOLE (SOW: Governance & Oversight)
========================================================================

Log out and log back in as: admin@marketplace.example / Password1!
Or navigate directly to /admin

Route: /admin

1. Should show the admin dashboard with platform-wide metrics:
   - Total users count
   - Users by role breakdown (Talent, Recruiter, Admin, Headhunter)
   - Total talent in pool
   - Verified vs pending talent
   - Active demands
   - Pending approvals count
   - Placements this month
   - Placement fees
2. Pending verification profiles list (up to 5 shown)
3. Company metrics table
4. Navigation should show: Dashboard, Users, Verification, Approvals, Companies, Analytics, Billing, Concierge, Mobility


========================================================================
PART 12 — USER MANAGEMENT (SOW: Governance)
========================================================================

Route: /admin/users

1. Should show a paginated list of all platform users
2. Each user row shows:
   - Email address
   - Role
   - Email verified status
   - Active/inactive status
   - Created date
   - Last updated date
3. Should be able to filter or search users


========================================================================
PART 13 — TALENT VERIFICATION (SOW: Talent Registration — Verification)
========================================================================

Route: /admin/verification

1. Should show a queue of pending talent profiles awaiting verification
2. Each profile shows:
   - Name, headline, email
   - Summary/bio
   - Skills with years of experience
   - Industries
   - Career trajectory
   - Resume (downloadable link)
   - Identity documents
   - Certifications (name, issuer, credential URL)
   - Location preferences
   - Visa eligibility countries
3. Action buttons: Approve, Request Info, Reject
4. This is how admin verifies talent per SOW requirement


========================================================================
PART 14 — DEMAND APPROVALS (SOW: Governance — Demand Monitoring)
========================================================================

Route: /admin/approvals

1. Should show pending demands waiting for admin approval
2. Each demand shows:
   - Title
   - Status and approval status
   - Location, remote policy
   - Experience level
   - Required skills
   - Company name and industry
   - Created date
3. Actions: Approve, Reject with notes, Mark as hard-to-fill


========================================================================
PART 15 — COMPANY MANAGEMENT (SOW: Governance)
========================================================================

Route: /admin/companies

1. Should show list of registered companies
2. Each company shows:
   - Company name
   - Assigned recruiter
   - Industry
   - Company size (Startup, SMB, Enterprise)
   - Logo
   - Website
3. Company metrics overlay:
   - Active demands
   - Pending approvals
   - Hard-to-fill count
   - Placements


========================================================================
PART 16 — PLATFORM ANALYTICS (SOW: Reporting & Analytics + Demand Forecast)
========================================================================

Route: /admin/analytics

1. This is the comprehensive analytics page. Should show:
   - Talent Pool Growth chart (total, verified, pending, new profiles over time)
   - Skill Distribution bar chart (top skills by popularity)
   - Supply-Demand Gap heatmap (demand count vs supply count per skill)
   - Hiring Timelines table (avg days to hire per company)
   - Demand Monitoring table (active demands, approvals, hard-to-fill per company)
   - Resource Utilization KPIs (placed talent, available, utilization rate %)
   - Revenue Metrics trend (placement fees over time, accepted offers)
   - Talent Pricing Trends (average hourly rate per skill)
   - Demand Forecast projections (current vs projected demand, supply gap)
2. All charts should render with data from the seed database
3. This covers: Reporting & Analytics, Demand Forecasting, Talent Supply Management, and Governance SOW modules


========================================================================
PART 17 — BILLING (SOW: Platform Administration)
========================================================================

Route: /admin/billing

1. Should show platform billing overview
2. Revenue tracking and pricing management
3. Note: Stripe integration is Phase 2 — this shows the billing UI structure


========================================================================
PART 18 — CONCIERGE SERVICE (SOW: Concierge Talent Acquisition)
========================================================================

Route: /admin/concierge

1. Should show the headhunter/concierge management desk with:
   - Active headhunters list (email, role, status)
   - Hard-to-fill demands list (demands flagged as difficult)
   - Headhunter assignments (which headhunter is assigned to which demand)
   - External candidate submissions (candidates sourced externally)
2. External candidates show: name, headline, status (Submitted/Reviewed/Shortlisted/Rejected)
3. This is the concierge talent acquisition module per SOW


========================================================================
PART 19 — TALENT MOBILITY (SOW: Talent Mobility Services)
========================================================================

Route: /admin/mobility

1. Should show talent mobility and relocation services interface
2. Visa assistance tracking
3. Relocation support management
4. Note: Full integration (visa APIs, accommodation) is Phase 2 — this shows the structure


========================================================================
DESIGN & UX CHECKLIST (check across all pages)
========================================================================

1. Dark theme is consistent across all pages (black background, white text)
2. Lime-green (#EFFE5E) accent color used for primary buttons and highlights
3. Sidebar navigation is present and working on all dashboard/admin pages
4. Pages are responsive (try resizing browser window)
5. Loading states appear when data is being fetched (no blank white screens)
6. Error states show meaningful messages (not raw errors)
7. Tables and lists are readable with proper spacing
8. Charts render correctly with legends and labels
9. Buttons have hover effects
10. Forms have proper validation messages
11. Navigation between pages is smooth (no full page reloads)
12. Command palette works (Ctrl+K or Cmd+K from dashboard)


========================================================================
SOW MODULE MAPPING — WHERE TO FIND EACH DELIVERABLE
========================================================================

SOW Module 1 — Talent Registration & Profile System
  Test at: /register, /admin/verification, /admin/users

SOW Module 2 — AI Talent Matching Engine
  Test at: /dashboard/search (match scores, AI scoring breakdown)

SOW Module 3 — Demand Management System
  Test at: /dashboard/roles, /dashboard/roles/new, /dashboard/roles/[id]

SOW Module 4 — AI Role Description Assistant
  Test at: /dashboard/roles/new (click "Generate with AI" button)

SOW Module 5 — Talent Shortlisting System
  Test at: /dashboard/shortlists

SOW Module 6 — Smart Talent Search
  Test at: /dashboard/search (filters, semantic search, pagination)

SOW Module 7 — Concierge Talent Acquisition
  Test at: /admin/concierge

SOW Module 8 — Interview & Hiring Workflow
  Test at: /dashboard/interviews, /dashboard/offers

SOW Module 9 — Talent Mobility Services
  Test at: /admin/mobility

SOW Module 10 — Demand Forecasting Engine
  Test at: /admin/analytics (demand forecast section)

SOW Module 11 — Talent Supply Management
  Test at: /admin/analytics (talent pool growth, resource utilization)

SOW Module 12 — Governance & Oversight
  Test at: /admin (full admin console), /admin/approvals, /admin/companies

SOW Module 13 — Reporting & Analytics
  Test at: /dashboard/analytics (recruiter), /admin/analytics (platform-wide)

SOW Module 14 — Contracting & Onboarding
  Test at: /dashboard/contracts

SOW Module 15 — Billing & Pricing
  Test at: /admin/billing

SOW Module 16 — User & Company Management
  Test at: /admin/users, /admin/companies


========================================================================
KNOWN BEHAVIORS (not bugs)
========================================================================

- First page load after inactivity takes 30-60 seconds (free tier backend cold start)
- Subsequent requests are fast
- AI features (search, role generation) require the AI engine to be awake
- Some placeholder data comes from database seeding — this is intentional demo data
- LinkedIn OAuth and Stripe are Phase 2 items (buttons may be visible but not functional)
- Mobile app is tested separately via Expo Go (not deployed to app stores — Phase 2)
