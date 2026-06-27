# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ This is NOT the Next.js you know

This repo runs **Next.js 16.2.9 / React 19.2** with breaking changes from older versions — APIs, conventions, and file structure may differ from your training data. Before writing framework code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices. (`AGENTS.md` carries this same rule.)

## Commands

```bash
npm run dev     # start dev server (http://localhost:3000)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint (flat config: eslint.config.mjs)
```

There is **no test runner** configured. The app is TypeScript + Tailwind CSS v4 (via `@tailwindcss/postcss`). The path alias `@/*` maps to the repo root (see `tsconfig.json`).

## Big-picture architecture

This is an **App Router** app (`app/`) for an "AI trading marketplace" demo. There are two distinct data planes — don't confuse them:

### 1. External trading backend (client-facing read models)
`lib/api.ts` talks to an external trading engine at `NEXT_PUBLIC_API_BASE_URL` (default `http://127.0.0.1:8000`) for live signals, shadow-live trading, test runs, execution status, and promotion. Key behavior:
- Every read goes through `fetchOrDemo` / `fetchWithMethodsOrDemo`, which **fall back to canned data in `lib/demo-data.ts`** when the backend is unreachable or returns an empty payload. Controlled by `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK` (defaults on; set to `"false"` to surface real errors).
- Response shapes are deliberately loose (see the wide optional-field types like `Signal`). Helpers `normalizeArray` / `getStringValue` / `slugify` defend against the backend returning arrays vs. wrapped objects under varying key names. Preserve this tolerance when extending.

### 2. Platform repository (this app's own server state)
The marketplace workflow — strategy submissions, allocation requests, deployments, and an audit log — is persisted by **this app's own Next.js API routes** under `app/api/`, never the external backend.
- **`lib/platform-repository.ts` is the single entry point.** It picks a backend at import time: `database-store` (Supabase Postgres) when `STORAGE_PROVIDER=database` *and* Supabase server env is present, otherwise `server-store` (local JSON files in `./data/`). Both modules implement the same function surface; always go through `platform-repository`, not the stores directly.
- Mutations append to an immutable-ish audit log (`appendAuditEvent`, capped at 200 entries in the file store). Keep that pattern when adding workflow actions.
- The `data/` directory is created on demand by `server-store.ts`; it holds the dev/demo state.

### Auth & roles — two layers, mid-migration
- **`lib/auth-session.ts` (client demo auth):** roles `investor | creator | admin` stored in `localStorage` + cookies. `canAccessPath` defines route-access intent, but **route middleware is currently disabled** — treat client role checks as cosmetic, not security.
- **Server-side trust:** real authorization uses Supabase. `lib/server-admin-guard.ts` (`requireAdminRequest`) validates a `Bearer` token via Supabase Auth, then grants admin by **`ADMIN_EMAILS` whitelist** or a `profiles.role === "admin"` row. Admin role is never trusted from the frontend. Admin-protected API routes (e.g. `app/api/admin/**`, allocation/deployment reviews) call this guard first and return its `{status, error}` on failure — follow that exact shape for new protected routes.
- `app/api/auth/profile/route.ts` upserts the `profiles` table using the Supabase **service role** (`lib/supabase-server.ts`) after validating the user's bearer token; `lib/supabase-browser.ts` is the anon client.

### API route response convention
Routes return `NextResponse.json` with a consistent envelope: `{ success, data, meta }` (or `{ success: false, error }` with an HTTP status). `meta` typically carries `source` ("file-store" / "repository"), counts, and a `timestamp`. Match this when adding routes.

## Environment variables

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | External trading backend base URL |
| `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK` | `"false"` disables demo-data fallback in `lib/api.ts` |
| `STORAGE_PROVIDER` | `"database"` to use Supabase; anything else → JSON file store |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server/admin writes (never expose to client) |
| `ADMIN_EMAILS` | Comma-separated admin email whitelist |

`/api/auth/status` reports which of these are configured — useful for diagnosing environment issues.

## Conventions & gotchas

- **Stray non-source files exist** alongside live code: `*.before-terminal-v2.tsx`, `*.terminal-backup.tsx`, `lib/server-store.backup.typefix.ts.txt`. These are snapshots/backups, not active modules — don't treat them as the source of truth or import them.
- `lib/mock-data.ts`, `lib/demo-data.ts`, and `lib/platform-api-data.ts` are all sample/seed data with different consumers — check which one a page actually imports before editing.
- `docs/` holds the running design log (auth phases, DB migration, production-readiness, Vercel deployment). When changing auth, storage, or the migration path, update the relevant doc — they describe intended end-state, and several note features that are "not enabled yet."
