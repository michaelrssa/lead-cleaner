
## Deployment & Git (set up 2026-07-04)

- **GitHub:** `michaelrssa/lead-cleaner` (account: **michaelrssa**)
- **Vercel:** none — this project has no Vercel deployment
- **Primary branch:** `main`
- Dependency updates arrive as weekly grouped Dependabot PRs (minor/patch only — majors are ignored by config and handled deliberately).
- **Note:** Repo is lead-cleaner. Vercel project was intentionally deleted — no deployment.
- To connect/reconnect Vercel: `vercel git connect --yes` from this folder (Vercel CLI must be logged into the **michaelrssa** account; the Vercel GitHub App needs repo access on that GitHub account).

- **overrides.postcss is "$postcss"** (reference to the direct dep) — do NOT change it to a literal version: postcss is also a direct dependency and a literal override makes `npm ci` fail on Vercel (builds pass locally with `npm install`, then production deploys fail). Verify lockfile changes with a real `npm ci` in a clean clone before pushing.
