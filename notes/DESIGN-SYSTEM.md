# Design System — AI Talent Marketplace Platform

> Reference for anyone styling or beautifying the UI (web or mobile).
> All tokens, patterns, and components documented below are **already implemented** in the codebase.

---

## Web Application (Next.js 14 + Tailwind CSS + shadcn/ui)

### Theme: Dark-First

The entire web app uses a **pure dark theme** — no light mode toggle. Background is true black (#000000), cards are near-black (#0A0A0A), and the primary accent is a distinctive **lime/neon yellow (#EFFE5E)**.

### Color Palette

| Token | HSL | Hex Approx | Usage |
|-------|-----|-----------|-------|
| `--background` | `0 0% 0%` | `#000000` | Page background |
| `--foreground` | `0 0% 100%` | `#FFFFFF` | Primary text |
| `--card` | `0 0% 4%` | `#0A0A0A` | Card/panel backgrounds |
| `--primary` | `65 99% 69%` | `#EFFE5E` | Primary accent (buttons, highlights, brand) |
| `--primary-foreground` | `0 0% 0%` | `#000000` | Text on primary buttons |
| `--secondary` | `0 0% 10%` | `#1A1A1A` | Secondary backgrounds |
| `--muted` | `0 0% 10%` | `#1A1A1A` | Muted/subtle backgrounds |
| `--muted-foreground` | `240 5% 65%` | `#A1A1AA` | Secondary text, descriptions |
| `--accent` | `0 0% 13%` | `#212121` | Hover states, active items |
| `--destructive` | `0 84% 60%` | `#EF4444` | Errors, cancel actions |
| `--border` | `240 6% 16%` | `#27272A` | All borders and dividers |
| `--input` | `240 6% 16%` | `#27272A` | Input field borders |
| `--ring` | `65 99% 69%` | `#EFFE5E` | Focus rings |

#### Semantic Colors

| Token | HSL | Hex Approx | Usage |
|-------|-----|-----------|-------|
| `--color-success` | `142 71% 45%` | `#22C55E` | Verified, accepted, active |
| `--color-warning` | `38 92% 50%` | `#F59E0B` | Pending, attention needed |
| `--color-info` | `217 91% 60%` | `#3B82F6` | Informational badges, links |

#### Surface System

| Token | Hex Approx | Usage |
|-------|-----------|-------|
| `surface-DEFAULT` | `#0A0A0A` | Cards, panels |
| `surface-alt` | `#1A1A1A` | Nested elements inside cards |
| `surface-high` | `#212121` | Hover states, highlighted rows |

### Shadows

| Name | CSS | Usage |
|------|-----|-------|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.4)` | Subtle depth |
| `shadow-md` | `0 4px 16px rgba(0,0,0,0.5)` | Cards, dropdowns |
| `shadow-lg` | `0 12px 40px rgba(0,0,0,0.7)` | Modals, overlays |
| `shadow-glow` | `0 0 24px rgba(239,254,94,0.15)` | Primary accent glow effect |

### Typography

- **Font:** `'Inter', system-ui, -apple-system, sans-serif`
- **Headings:** `font-extrabold` (800 weight)
- **Body:** Default weight (400)
- **Labels/Captions:** `text-sm` or `text-xs`
- **Muted text:** Uses `text-[#A1A1AA]` or `text-muted-foreground`
- **Secondary text:** Uses `text-[#71717A]` or `text-text-secondary`

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | `6px` | Small elements, tags |
| `rounded-md` / `rounded` | `10px` | Cards, inputs, buttons |
| `rounded-lg` | `14px` | Large cards, modals |
| `rounded-2xl` | `16px` | Hero sections, large panels |
| `rounded-full` | `9999px` | Avatars, pills |

### Button Variants

All buttons use the shadcn `Button` component with these variants:

| Variant | Look | Usage |
|---------|------|-------|
| `default` | Lime bg (#EFFE5E), black text | Primary CTAs |
| `destructive` | Red bg | Delete, cancel |
| `outline` | Transparent + border | Secondary actions |
| `secondary` | Dark bg (#1A1A1A) | Tertiary actions |
| `ghost` | No bg, hover shows subtle fill | Nav items, minimal actions |
| `link` | Underline on hover | Inline links |
| `hero` | Lime bg, larger size | Landing page CTAs |
| `hero-outline` | Border only, larger | Landing page secondary CTAs |

### Component Library (shadcn/ui)

Available components in `apps/web/components/ui/`:

| Component | File | Notes |
|-----------|------|-------|
| Button | `button.tsx` | Custom variants above |
| Input | `input.tsx` | Dark styled, `#27272A` border |
| Label | `label.tsx` | Standard form label |
| Select | `select.tsx` | Radix-based dropdown |
| Switch | `switch.tsx` | Toggle switch |
| Textarea | `textarea.tsx` | Multi-line input |

### Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| DashboardShell | `components/dashboard-shell.tsx` | Recruiter sidebar + header layout |
| AdminShell | `components/admin-shell.tsx` | Admin sidebar + header layout |
| CommandPalette | `components/command-palette.tsx` | Cmd+K search/navigation |
| NotificationPanel | `components/notification-panel.tsx` | Side panel for notifications |
| PageTransition | `components/page-transition.tsx` | Framer Motion page wrapper |

### UI Patterns

**Cards:**
```tsx
<div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
  {/* content */}
</div>
```

**Stat Cards (KPI):**
```tsx
<div className="bg-[#0A0A0A] border border-[#27272A] rounded-xl p-5">
  <div className="text-xs text-[#A1A1AA] uppercase tracking-wider">Label</div>
  <div className="text-2xl font-extrabold text-white mt-1">42</div>
</div>
```

**Icon Accent Boxes:**
```tsx
<div className="w-10 h-10 rounded-xl bg-[rgba(239,254,94,0.1)] flex items-center justify-center">
  <Icon className="h-5 w-5 text-[#EFFE5E]" />
</div>
```

**Status Badges:**
```tsx
// Active/success → green
<span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400">Active</span>
// Pending → yellow
<span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400">Pending</span>
// Error → red
<span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400">Cancelled</span>
```

**Section Headers:**
```tsx
<div>
  <h1 className="text-2xl font-extrabold">Page Title</h1>
  <p className="text-text-secondary text-sm mt-1">Subtitle description.</p>
</div>
```

**Tables:**
- Header row: `bg-[#0A0A0A]`, `text-xs uppercase text-[#A1A1AA]`
- Body rows: transparent bg, `border-b border-[#27272A]`, hover `bg-[#0A0A0A]/50`
- Cell text: `text-sm text-white` for primary, `text-[#A1A1AA]` for secondary

**Empty States:**
```tsx
<div className="flex items-center justify-center min-h-[400px]">
  <div className="text-center space-y-4 max-w-md">
    <div className="mx-auto w-16 h-16 rounded-2xl bg-[rgba(239,254,94,0.1)] border border-[#27272A] flex items-center justify-center">
      <Icon className="h-8 w-8 text-[#EFFE5E]" />
    </div>
    <h2 className="text-xl font-bold">Title</h2>
    <p className="text-[#A1A1AA] text-sm">Description text.</p>
  </div>
</div>
```

### Animation

- **Library:** Framer Motion
- **Page transitions:** `PageTransition` component wraps page content with fade + slide
- **Hover effects:** Scale transforms (`hover:scale-[1.02]`), glow borders (`hover:border-[#EFFE5E]/30`)
- **Loading states:** Pulse animations, skeleton loaders with `bg-[#27272A] animate-pulse`

#### Framer Motion Patterns

**PageTransition (staggered children):**
```tsx
// components/page-transition.tsx
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <motion.div variants={itemVariants}>...</motion.div>
</motion.div>
```

**FadeIn (individual element):**
```tsx
<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
```

**AnimatePresence (modals, panels):**
```tsx
// Used by NotificationPanel, CommandPalette — for elements that mount/unmount
<AnimatePresence>
  {isOpen && (
    <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
```

**Form entrance (sequential):**
```tsx
// Login, Register pages — each field slides up in sequence
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.3 }}>
```

**Analytics stagger (chart cards):**
```tsx
// Analytics pages — cards animate in with stagger
{cards.map((card, i) => (
  <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}>
))}
```

**Tailwind utility animations:**
```
animate-pulse    → skeleton loaders, loading placeholders
animate-spin     → loading spinners (Loader2 icon)
transition-all   → hover state transitions (borders, backgrounds)
hover:scale-[1.02] → card hover lift effect
```

### Charts (Recharts)

All charts use Recharts with a dark theme consistent with the design system.

#### Chart Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Sky | `#38bdf8` | Primary series (main metric) |
| Amber | `#f59e0b` | Secondary series, warnings |
| Emerald | `#34d399` | Success/growth metrics |
| Violet | `#a78bfa` | Tertiary series |
| Rose | `#fb7185` | Decline/negative metrics |
| Orange | `#f97316` | Quaternary series |

#### Chart Theming

```tsx
// Dark tooltip
<Tooltip
  contentStyle={{ backgroundColor: "#0A0A0A", border: "1px solid #27272A", borderRadius: "8px" }}
  labelStyle={{ color: "#FFFFFF", fontWeight: 600 }}
  itemStyle={{ color: "#A1A1AA" }}
/>

// Grid lines
<CartesianGrid strokeDasharray="3 3" stroke="#27272A" />

// Axes
<XAxis stroke="#71717A" tick={{ fill: "#71717A", fontSize: 12 }} />
<YAxis stroke="#71717A" tick={{ fill: "#71717A", fontSize: 12 }} />

// Area fills — use gradients
<defs>
  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
  </linearGradient>
</defs>
```

---

## Mobile Application (Expo SDK 50 + React Native 0.73)

### Theme: Dark Navy

Mobile uses a **deep navy dark theme** — distinct from the web's pure black. This gives it a softer, mobile-friendly feel.

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#020617` | Screen background (slate-950) |
| Header | `#082f49` | Navigation header (sky-950) |
| Text Primary | `#f8fafc` | Main text (slate-50) |
| Text Secondary | `#94a3b8` | Descriptions, labels (slate-400) |
| Accent | `#38bdf8` | Primary accent, CTAs (sky-400) |
| Accent Muted | `rgba(56,189,248,0.15)` | Accent backgrounds |
| Card | `#0f172a` | Card backgrounds (slate-900) |
| Card Elevated | `#1e293b` | Elevated surfaces (slate-800) |
| Border | `#1e293b` | Borders (slate-800) |
| Success | `#22c55e` | Active, verified |
| Warning | `#f59e0b` | Pending states |
| Error | `#ef4444` | Errors |

### Typography

- **Font:** System default (San Francisco on iOS, Roboto on Android)
- **Headings:** `fontWeight: "700"` (bold) or `"800"` (extrabold)
- **Body:** `fontWeight: "400"`, `fontSize: 14-16`
- **Captions:** `fontSize: 12`, `color: "#94a3b8"`

### Component Patterns (React Native StyleSheet)

**Screen Container:**
```tsx
<View style={{ flex: 1, backgroundColor: "#020617", padding: 16 }}>
```

**Card:**
```tsx
<View style={{
  backgroundColor: "#0f172a",
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: "#1e293b"
}}>
```

**Button (Primary):**
```tsx
<TouchableOpacity style={{
  backgroundColor: "#38bdf8",
  borderRadius: 10,
  paddingVertical: 14,
  alignItems: "center"
}}>
  <Text style={{ color: "#020617", fontWeight: "700", fontSize: 16 }}>Action</Text>
</TouchableOpacity>
```

**Badge:**
```tsx
<View style={{
  backgroundColor: "rgba(34,197,94,0.15)",
  borderRadius: 9999,
  paddingHorizontal: 10,
  paddingVertical: 4
}}>
  <Text style={{ color: "#22c55e", fontSize: 12, fontWeight: "600" }}>Active</Text>
</View>
```

### Providers / Context

| Provider | Purpose |
|----------|---------|
| `AuthProvider` | Login state, tokens, session |
| `MobileApolloProvider` | GraphQL client |
| `TalentProfileProvider` | Profile data context |
| `TalentWorkflowProvider` | Interview/offer workflow state |

### Navigation

- **Router:** Expo Router (file-based)
- **Auth guard:** Redirects to `/login` when no session
- **Stack navigator:** Dark headers (`#082f49`), light tint (`#f8fafc`)
- **Tab bar:** Bottom tabs for main screens (Home, Profile, Applications, Notifications)

---

## Shared Conventions

### Icons
- **Web:** Lucide React (`lucide-react`)
- **Mobile:** Lucide React Native or custom SVGs

### Data Fetching
- **Web:** Server-side `graphQLRequest()` in page components (RSC) + client-side for mutations
- **Mobile:** Apollo Client hooks (`useQuery`, `useMutation`) + raw `graphQLRequest()` helper

### Loading States
- Always show loading indicator during async operations
- Web: Pulse skeleton loaders
- Mobile: `ActivityIndicator` with accent color

### Error Handling
- Web: `error.tsx` boundary per route segment
- Mobile: Try/catch with user-facing alert
- Never show raw error messages to users

### Sidebar Navigation

**Recruiter Dashboard** (DashboardShell):
```
Workspace:  Dashboard, Roles, Shortlists, Search
Pipeline:   Interviews, Offers
Insights:   Analytics
```

**Admin Console** (AdminShell):
```
Overview:   Dashboard
Governance: Users, Verification, Approvals, Concierge
Platform:   Companies, Analytics, Billing, Mobility
```

---

## Email Templates (Transactional)

All emails share a branded HTML layout defined in `apps/api/src/services/email.ts`. The design mirrors the web dark theme for a cohesive experience.

### Email Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Body background | `#000000` | Email body (true black) |
| Card background | `#0A0A0A` | Main content card |
| Nested surface | `#1A1A1A` | Info boxes within card |
| Border | `#27272A` | Card border, dividers |
| Primary text | `#FFFFFF` | Headings, key info |
| Secondary text | `#A1A1AA` | Body paragraphs |
| Tertiary text | `#71717A` | Footer, labels |
| Accent / CTA | `#EFFE5E` | Button bg, highlights |
| CTA text | `#000000` | Black text on lime button |
| Success | `#22C55E` | Active/accepted badges |

### Email Structure

```
┌─ Body (#000000) ─────────────────────────┐
│                                           │
│  ┌─ Brand Header ──────────────────────┐  │
│  │  [A] AI Talent Marketplace          │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─ Card (#0A0A0A, border #27272A) ───┐  │
│  │  🎯 Icon Badge (lime/10 bg)        │  │
│  │  Heading (22px, 800, white)        │  │
│  │  Body text (14px, 400, #A1A1AA)    │  │
│  │  ─── divider (#27272A) ───         │  │
│  │  ┌─ Info Box (#1A1A1A) ─────────┐  │  │
│  │  │  Label: Value rows           │  │  │
│  │  └──────────────────────────────┘  │  │
│  │  [ CTA Button (#EFFE5E) ]         │  │
│  └────────────────────────────────────┘  │
│                                           │
│  Footer (12px, #71717A, centered)        │
│                                           │
└───────────────────────────────────────────┘
```

### Email Typography

- **Font stack:** `'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif`
- **Heading:** 22px, font-weight 800, #FFFFFF
- **Body:** 14px, font-weight 400, #A1A1AA, line-height 22px
- **Labels:** 13px, #71717A
- **Footer:** 12px, #71717A / 11px, #52525B

### Email Components

| Component | Pattern |
|-----------|---------|
| Icon Badge | 48px circle, `rgba(239,254,94,0.1)` bg, emoji centered, `#27272A` border |
| CTA Button | Lime `#EFFE5E` bg, 10px radius, 14px bold black text, 14px/32px padding |
| Info Row | Two-column table — left: label (#71717A), right: value (#FFFFFF bold) |
| Divider | 1px `#27272A` top border, 24px vertical margin |
| Info Box | `#1A1A1A` bg, 10px radius, 20px padding — for grouped data |
| Highlight | Inline `<span>` with `#EFFE5E` color, font-weight 600 |

### Available Email Templates

| Template | Recipient | Trigger |
|----------|-----------|---------|
| Welcome | All roles | Account creation |
| Interview Scheduled | Talent | Interview booked |
| Offer Received | Talent | Offer created |
| Match Alert | Talent | AI match found |
| Availability Update | Recruiter | Talent status change |
