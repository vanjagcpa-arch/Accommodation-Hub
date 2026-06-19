# AccomHub — Accommodation Operations Platform

A production-quality web application for student accommodation and property operations businesses.

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL)

## Features
- Property & Building Management
- Tenant & Occupancy Tracking
- Maintenance Job Management
- Student Applications
- Electricity Account Tracking
- Agent Portal
- Role-Based Access Control
- Audit Logging
- Integration-ready (Reapit, ListOnce, MYOB, Ezidebit)

## Setup

### 1. Clone and install
```bash
npm install
```

### 2. Supabase setup
1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and anon key
3. Run the migrations **in order**:
   1. `supabase/migrations/001_initial_schema.sql`
   2. `supabase/migrations/002_maintenance_module.sql` (Repairs & Maintenance module)
4. Optionally run the seeds **in order**: `supabase/seed.sql` then `supabase/seed_maintenance.sql`

> The Repairs & Maintenance pages (`/maintenance`, `/maintenance/new`, `/maintenance/[id]`)
> read and write live Supabase data. Until a real project URL/anon key are set in
> `.env.local` and the migrations are run, those pages render a "couldn't load" notice
> instead of data.

### 3. Environment variables
```bash
cp .env.example .env.local
# Fill in your Supabase credentials
```

### 4. Run locally
```bash
npm run dev
```

## Database Schema
See `supabase/migrations/001_initial_schema.sql` for the full schema.

## Roles
- **Super Admin** — full access to everything
- **Admin** — full access to all records
- **Internal Property Manager** — assigned buildings/properties only
- **External Manager** — assigned buildings/properties only
- **Referral Agent** — available stock for permitted buildings + own applications
- **Maintenance Staff** — assigned maintenance jobs only
- **Read Only** — view access only

## Module Overview

| Module | Path | Description |
|--------|------|-------------|
| Dashboard | `/dashboard` | Stats overview, recent activity, quick actions |
| Buildings | `/buildings` | Building list, occupancy rates, manager assignments |
| Properties | `/properties` | All properties with filtering by status, building, type |
| Availability | `/availability` | Card view of available/coming-soon properties |
| Applications | `/applications` | Tenant applications with status workflow |
| Maintenance | `/maintenance` | Job tracking, priorities, assignments, comments |
| Electricity | `/electricity` | Account tracking, consent management, Ezidebit CSV export |
| Agents | `/agents` | Agent management with building permissions |
| Tenants | `/tenants` | Tenant profiles with university and contact data |
| Reporting | `/reporting` | Occupancy, maintenance, and application analytics |
| Integrations | `/integrations` | Reapit, ListOnce, MYOB, Ezidebit configuration |
| Settings | `/settings` | Users, roles, companies, notifications |

## API Routes

All routes return mock data until Supabase credentials are configured.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/buildings` | GET, POST | Buildings CRUD |
| `/api/properties` | GET, POST | Properties CRUD with filters |
| `/api/maintenance` | GET, POST | Maintenance jobs |
| `/api/applications` | GET, POST | Tenant applications |
| `/api/tenants` | GET, POST | Tenant records |
| `/api/electricity` | GET | Electricity accounts + CSV export (`?format=ezidebit_csv`) |

## Next Steps
- [ ] Wire up Supabase real-time queries to replace mock data
- [ ] Build agent portal (restricted login view)
- [ ] Add file upload for maintenance photos (Supabase Storage)
- [ ] Build Ezidebit CSV export with real charge data
- [ ] Add Reapit webhook integration
- [ ] Add email notifications
- [ ] Build recurring maintenance job scheduler
- [ ] Add occupancy/lease management module
- [ ] Mobile-responsive maintenance staff view
