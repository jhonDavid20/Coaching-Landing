# SteadyVitality — Coaching Platform

A full-stack fitness coaching platform with coach and client dashboards, invite-based onboarding, and a coach marketplace.

## Features

- **Coach Dashboard** — overview stats, client list with drawer, client detail view, and profile/plans management
- **Client Dashboard** — personal profile, my-coach view, and coach marketplace
- **Invite Flow** — token-based coach onboarding with smart redirect handling (already signed up, already onboarded)
- **Coach Marketplace** — browse and connect with coaches; accurate coach-assignment state prevents duplicate connection requests
- **Role-based Access** — coach, client, and admin roles with server-side route protection
- **Internationalization** — next-intl with `[locale]` dynamic segments
- **SteadyVitality Design System** — green design tokens replacing the previous FitCoach dark theme

## Design tokens

| Token | Value | Usage |
|---|---|---|
| `--sv-sidebar` | `#162318` | Sidebar, dark buttons, avatar backgrounds |
| `--sv-green-500` | `#3a7d44` | Primary accent, progress bars, active states |
| `--background` | `#f6f8f5` | Page background |
| Border | `#d8e0d8` | Card and input borders |
| Muted text | `#617061` | Secondary text |
| Dark text | `#0f1f10` | Headings |
| Light green | `#ddf0df` | Badges, tag backgrounds |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **UI Components**: Radix UI primitives + custom components
- **Icons**: Lucide React
- **Auth**: httpOnly cookie-based JWT (`access_token` + `user_data`)
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see `API_BASE_URL` below)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/jhondavid20/coaching-landing.git
   cd coaching-landing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## Environment Variables

```env
# Backend API base URL
API_BASE_URL=http://localhost:3001

# Next.js public URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
src/
├── actions/              # Server actions (API calls)
│   ├── auth.ts           # Login, register, invite token validation
│   ├── marketplace.ts    # Coach marketplace + getMyCoach()
│   ├── coach.ts          # Coach-side actions
│   └── user.ts           # User profile + getFullUserProfile()
├── app/[locale]/
│   ├── invite/[token]/   # Coach invite flow (token validation + signup)
│   ├── onboarding/coach/ # Coach onboarding wizard
│   ├── dashboard/
│   │   ├── coach/        # Coach dashboard (overview, clients, profile)
│   │   ├── coaches/      # Client: find-a-coach marketplace
│   │   ├── my-coach/     # Client: current coach view
│   │   └── profile/      # Client profile
│   └── (auth)/           # Login / register pages
├── components/
│   ├── layout/           # Sidebar, navbar, conditional wrappers
│   └── ui/               # Shared UI primitives
└── lib/                  # Utilities, validators, helpers
```

## Key Behaviours

### Invite flow
- Valid unused token → signup form with locked email
- Token already used + active session → redirect to `/onboarding/coach`
- Token already used + no session → "Account already created" card with login button
- Genuinely invalid token → error state

### Coach assignment (source of truth)
`GET /api/users/me` returns `coachId` on the user record. `getMyCoach()` reads this field first; if set the user is shown as already having a coach and the "Request to connect" button is hidden. Falls back to `GET /api/clients/me/coach` if the primary check is inconclusive.

### Role-based middleware
- `requireAdmin` — composed from `requireRole('admin')`
- Login endpoint is role-agnostic
- `/me` strips sensitive fields before returning
- Invite routes are admin-only; the public `/validate` endpoint is left open
