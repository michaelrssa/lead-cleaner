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
- Dark zinc/slate UI theme for internal business tool

### Working Features (full flow tested end-to-end)
1. **File Upload** (`app/page.tsx`) — Drag-drop or click to upload CSV/XLSX, preview first 5 rows
2. **File Parsing** (`lib/fileParser.ts`) — CSV via papaparse, XLSX via xlsx lib, handles merged cells, empty rows, whitespace
3. **Column Mapping** (`app/map/page.tsx`) — Map columns to target fields (First Name, Last Name, Email, etc.), auto-suggest from header names, ignore columns
4. **Cost Estimation** (`app/review/page.tsx`) — Real cost calculator based on Claude token pricing, model strategy selector (Haiku/Sonnet), budget cap input
5. **AI Cleaning Pipeline** (`lib/cleaningPipeline.ts`):
   - Pre-scan: sends 10 sample rows to identify patterns (e.g. abbreviated names)
   - Batch processing: cleans rows in groups of 25
   - ALL columns sent as context (including ignored ones) — only mapped fields output
   - Strips markdown fences from Claude JSON responses
   - Budget cap enforcement, cancellation support
6. **Progress Tracking** (`app/progress/page.tsx`) — Polls every 2s, progress bar, cost tracking, error display, retry button, cancel button
7. **Results & Export** (`app/results/page.tsx`) — Cleaned data table, CSV download, error count

### API Routes (all wired up)
- `POST /api/jobs/create` — Creates job, inserts rows, fires pipeline
- `GET /api/jobs/status?jobId=` — Returns job status for polling
- `GET /api/jobs/results?jobId=` — Returns all lead rows for a job
- `POST /api/jobs/cancel` — Cancels a running job
- `POST /api/jobs/submit` — Placeholder (not yet used)

### Supabase Schema (4 tables, all migrations applied)
- `cleaning_jobs` — Job metadata, status, costs, budget, error_message
- `lead_rows` — Raw + cleaned data per row, per job
- `api_usage_log` — Per-call token/cost tracking
- `monthly_spend` — Monthly budget caps
- RLS enabled on all tables, indexes on key columns
- Realtime enabled on cleaning_jobs
- Migrations: 001 (initial), 002 (lead_rows), 003 (error_message)

### Lib Modules
- `lib/supabase.ts` — Browser + server Supabase clients
- `lib/anthropic.ts` — Server-only Anthropic client
- `lib/fileParser.ts` — CSV/XLSX parsing with header cleaning
- `lib/autoMapper.ts` — Pattern-based column name auto-suggestion
- `lib/costCalculator.ts` — Token cost estimation (Haiku + Sonnet pricing)
- `lib/promptBuilder.ts` — System prompts for pre-scan and batch cleaning
- `lib/cleaningPipeline.ts` — Full cleaning pipeline with pre-scan, batching, cost tracking

### Git History
1. `7ac4100` — Initial commit from Create Next App
2. `231c751` — initial scaffold: lead cleaner app
3. `58b8a59` — feat: supabase schema and typed client
4. `6419fa2` — feat: file upload, parsing and column mapping
5. `ce433c0` — feat: review page with cost estimation
6. `dd776b8` — feat: AI cleaning pipeline with pre-scan and batch processing
7. `e89f391` — fix: error display, retry button, and JSON parsing

## Known Issues / Refinements Needed

### Bugs to Fix
- Supabase typed client dropped (using untyped) — `@supabase/supabase-js` v2.100 requires `Relationships` key in generic shape, needs proper typed generation
- No validation that localStorage data hasn't expired or been cleared between pages

### Features to Build
1. **Settings page** (`/settings`) — Configure budget caps, model strategy, monthly limits (currently placeholder)
2. **Monthly spend tracking** — Increment `monthly_spend` table on each job, enforce monthly cap
3. **XLSX export** — Currently only CSV download, add Excel export option
4. **Job history** — List of past jobs with status, cost, ability to re-view results
5. **Better error handling per row** — Show which specific rows errored and why
6. **Comparison view** — Side-by-side raw vs cleaned data
7. **Bulk file support** — Handle larger files (1000+ rows) with progress chunking
8. **Authentication** — User accounts if this becomes multi-user

### UX Improvements
- Loading states between page transitions
- Confirmation dialog before submitting expensive jobs
- Toast notifications for success/error
- Mobile responsive layout
- Show pre-scan findings to user before cleaning starts

### Infrastructure
- No authentication (single user for now)
- No Vercel deployment yet
- No CI/CD pipeline
- No tests
- gh CLI not installed (pushes done via token-in-URL)

## Key Decisions Made
- **Model strategy default**: `haiku_primary` — Haiku for cost efficiency
- **Budget default**: $20/month cap
- **Batch size**: 25 rows per API call
- **Pre-scan**: 10 sample rows analysed before cleaning
- **Context columns**: ALL columns (including ignored) sent to Claude for inference
- **RLS approach**: Service-role-only policies (no user auth)
- **Untyped Supabase client**: Dropped Database generic due to type resolution issues
- **Dark theme**: zinc/slate Tailwind palette for internal business tool
- **localStorage for state**: Parsed data and mapping stored in localStorage between pages

## Data File
- `MS Leads Jan23 to Aug25.xlsx` (1MB) is in the working directory but gitignored
- Successfully tested with 15-row subset — cleaning pipeline works end-to-end
