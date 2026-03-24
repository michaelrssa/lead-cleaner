# Project Conventions

Patterns derived from the existing `hvs-app` project (Vite + React + Supabase + Tailwind + Vercel), adapted for **Next.js 14 App Router with TypeScript**.

---

## Supabase Client Initialisation

| Context | Function | File |
|---------|----------|------|
| Browser (Client Components) | `createSupabaseBrowser()` | `lib/supabase.ts` |
| Server (API routes, Server Actions) | `createSupabaseServer()` | `lib/supabase.ts` |

- **Browser client** uses `@supabase/ssr` `createBrowserClient` with `NEXT_PUBLIC_*` env vars
- **Server client** uses `@supabase/supabase-js` `createClient` with the `SUPABASE_SERVICE_ROLE_KEY`
- Both include env-var guards that warn or throw if credentials are missing
- Adapted from hvs-app's single-client pattern (`src/lib/supabase.js`)

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | Server only | Claude API access |

- `NEXT_PUBLIC_` prefix exposes variables to the browser (replaces `VITE_` prefix from hvs-app)
- Server-only keys must **never** use the `NEXT_PUBLIC_` prefix
- Placeholders live in `.env.local` (gitignored)

## Folder Structure & Naming

```
/app                  → Pages and API routes (Next.js App Router)
  /api/jobs/*         → REST-style API route handlers
  /[page]/page.tsx    → Page components
/components           → Shared React components (PascalCase .tsx)
/lib                  → Utilities, clients, helpers (camelCase .ts)
/types                → TypeScript type definitions
```

- **Folders**: lowercase, kebab-case where needed
- **Components**: PascalCase (e.g., `FileUploader.tsx`)
- **Utilities/hooks**: camelCase (e.g., `costCalculator.ts`, `useJobStatus.ts`)
- **API routes**: `route.ts` inside descriptive folder paths

## Styling

- **Tailwind CSS** for all styling
- Use `@layer components` in `globals.css` for reusable component classes (buttons, cards, inputs)
- Custom colour palette to be defined in `tailwind.config.ts` (hvs-app uses a branded `hvs` namespace)

## UI Patterns Worth Carrying Over

From hvs-app, these patterns are worth replicating:

1. **Button variants** via Tailwind `@layer components`: `.btn-primary`, `.btn-secondary`, `.btn-ghost`
2. **Inline editable fields**: click-to-edit text, dropdowns, dates
3. **Data tables**: styled via `.data-table` component class
4. **Form inputs**: consistent `.input` / `.select` classes with focus ring
5. **Layout pattern**: sidebar for admin, simple header for public pages

## Data Fetching

- Server-side: use `createSupabaseServer()` in API route handlers
- Client-side: use `createSupabaseBrowser()` with React state or a data-fetching library
- hvs-app uses `@tanstack/react-query` for caching — consider adding if needed

## File Processing

- **CSV**: `papaparse` for parsing (same as hvs-app)
- **Excel**: `xlsx` for `.xlsx` file support
- **Anthropic**: `@anthropic-ai/sdk` for Claude API calls (server-only via `lib/anthropic.ts`)
