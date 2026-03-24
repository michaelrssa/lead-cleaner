# Lead Cleaner — Project Status

**Repo**: https://github.com/michaelrssa/lead-cleaner
**Stack**: Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · Claude API
**Supabase project ref**: rqifcklnzgafjqrnakqu
**GitHub user**: michaelrssa
**Working directory**: /Users/michaelmarshall/Desktop/Lead Cleaning App

## Completed (as of 2026-03-24)

### Scaffold
- Next.js 14 App Router with TypeScript, Tailwind CSS, ESLint
- Folder structure: `app/`, `components/`, `lib/`, `types/`, `supabase/migrations/`
- `.env.local` populated with all 4 keys (Anthropic, Supabase URL, anon key, service role key)
- `.gitignore` covers .env*.local, node_modules, .xlsx, .claude/
- `CONVENTIONS.md` documents patterns adapted from hvs-app

### Pages (placeholder stubs)
- `/` (home) — `app/page.tsx`
- `/map` — `app/map/page.tsx`
- `/review` — `app/review/page.tsx`
- `/progress` — `app/progress/page.tsx`
- `/results` — `app/results/page.tsx`
- `/settings` — `app/settings/page.tsx`

### API Routes (placeholder stubs)
- `POST /api/jobs/create` — `app/api/jobs/create/route.ts`
- `POST /api/jobs/submit` — `app/api/jobs/submit/route.ts`
- `GET /api/jobs/status` — `app/api/jobs/status/route.ts`
- `GET /api/jobs/results` — `app/api/jobs/results/route.ts`
- `POST /api/jobs/cancel` — `app/api/jobs/cancel/route.ts`

### Supabase Schema (migration applied)
- `cleaning_jobs` — main job table with status, costs, batch tracking
- `api_usage_log` — per-call token/cost tracking, FK to cleaning_jobs
- `monthly_spend` — monthly budget caps and spend totals
- RLS enabled on all tables (service-role full access policies)
- Indexes on `cleaning_jobs.status` and `api_usage_log.job_id`
- Realtime enabled on `cleaning_jobs`
- Migration file: `supabase/migrations/001_initial_schema.sql`

### Typed Client
- `lib/supabase.ts` — `createSupabaseBrowser()` and `createSupabaseServer()` with `Database` generic
- `lib/anthropic.ts` — server-only Anthropic client
- `lib/costCalculator.ts` — placeholder cost estimator
- `types/index.ts` — `CleaningJob`, `ApiUsageLog`, `MonthlySpend`, `Database` types

### Dependencies
- @supabase/supabase-js, @supabase/ssr
- @anthropic-ai/sdk
- papaparse, @types/papaparse, xlsx

### Git History
1. `231c751` — initial scaffold: lead cleaner app
2. `58b8a59` — feat: supabase schema and typed client

## Not Yet Built

### Core Features (in likely build order)
1. **File upload + parsing** — Home page UI to upload CSV/XLSX, parse with papaparse/xlsx, preview rows
2. **Column mapping** — Map page UI to match uploaded columns to expected fields
3. **Cost estimation** — Calculate estimated API cost before submitting, enforce budget caps
4. **Job creation API** — Wire up POST /api/jobs/create to insert into cleaning_jobs
5. **AI cleaning pipeline** — Anthropic batch API integration, prompt engineering for lead cleaning
6. **Job submission + processing** — Submit jobs, track progress via api_usage_log
7. **Realtime progress** — Subscribe to cleaning_jobs changes on /progress page
8. **Results display + export** — Show cleaned data, download as CSV/XLSX
9. **Settings page** — Configure budget caps, model strategy, monthly limits
10. **Job cancellation** — Cancel in-progress jobs

### Infrastructure (not yet set up)
- No authentication (no user accounts yet)
- Supabase MCP not connected
- Vercel MCP not connected
- gh CLI not installed (pushes done via token-in-URL)
- No CI/CD pipeline
- No tests

## Key Decisions Made
- **Model strategy default**: `haiku_primary` — use Haiku as primary model for cost efficiency
- **Budget default**: $20/month cap in monthly_spend table
- **RLS approach**: Service-role-only policies (no user auth yet, all access server-side)
- **Supabase client pattern**: Two functions (browser + server) following hvs-app conventions
- **No src/ directory**: Files at project root per Next.js convention

## Data File
- `MS Leads Jan23 to Aug25.xlsx` (1MB) is in the working directory but gitignored
