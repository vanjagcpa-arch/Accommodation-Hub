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
3. Run the migration: `supabase/migrations/001_initial_schema.sql`
4. Optionally run the seed: `supabase/seed.sql`

### 3. Environment variables
```bash
cp .env.example .env.local
# Fill in your Supabase credentials
```

### 4. Run locally
```bash
npm run dev
```

## Roles
- **Super Admin** — full access to everything
- **Admin** — full access to all records
- **Internal Property Manager** — assigned buildings/properties only
- **External Manager** — assigned buildings/properties only
- **Referral Agent** — available stock for permitted buildings + own applications
- **Maintenance Staff** — assigned maintenance jobs only
- **Read Only** — view access only

## Next Steps
- [ ] Wire up Supabase real-time queries to replace mock data
- [ ] Build agent portal (restricted login view)
- [ ] Add file upload for maintenance photos (Supabase Storage)
- [ ] Build Ezidebit CSV export with real charge data
- [ ] Add Reapit webhook integration
- [ ] Add email notifications
- [ ] Build recurring maintenance job scheduler
