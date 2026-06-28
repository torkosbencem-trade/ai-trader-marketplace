---
name: run-ai-trader-marketplace
description: Build, launch, screenshot, and smoke-test the StrataOS (ai-trader-marketplace) Next.js web app and its red-team backtest CLI. Use when asked to run, start, build, serve, screenshot, or verify the StrataOS / ai-trader-marketplace app, check its public routes and parked-route redirects, or drive the red-flag analysis engine / CLI.
---

# Run: ai-trader-marketplace (StrataOS)

A **Next.js 16 / React 19** web app (public marketing/stress-test site) plus a
**Node CLI** for the red-flag analysis engine. The web app is driven headless by
`.claude/skills/run-ai-trader-marketplace/driver.mjs`, which launches
`next start`, asserts the public route matrix (including the redirects that
**park** the old marketplace routes), and captures screenshots via headless
Chromium (Edge/Chrome). The analysis engine is a pure library exercised by a tsx
CLI and a Vitest suite.

All paths below are **relative to the repo root** (the unit). The driver lives
inside the skill at `.claude/skills/run-ai-trader-marketplace/driver.mjs`.

## Prerequisites

- Node 18+ (verified on **v24.16.0**, npm 11).
- A Chromium browser for screenshots. On Windows the driver auto-detects Edge and
  Chrome at their standard `Program Files` paths — no `chromium-cli` needed.

```bash
npm install
```

## Build

```bash
npm run build
```

`next start` (used by the driver) **requires** a prior build — the driver errors
with "No .next build found" otherwise.

## Run — agent path (driver)

One command launches the server on port 3100, asserts every public route, writes
two screenshots, and tears the server down:

```bash
node .claude/skills/run-ai-trader-marketplace/driver.mjs e2e
```

Verified output (this is the real run):

```
Server ready.
Route assertions against http://localhost:3100
------------------------------------------------------------
PASS  /                    200
PASS  /stress-test         200
PASS  /parked              200
PASS  /login               200
PASS  /auth                200
PASS  /marketplace         307 -> /parked
PASS  /admin/risk          307 -> /parked
PASS  /portfolio           307 -> /parked
PASS  /pricing             307 -> /parked
PASS  /demo                307 -> /parked
PASS  /no-such-page-xyz    404
------------------------------------------------------------
11/11 passed
shot  http://localhost:3100/        -> .../screenshots/landing.png
shot  http://localhost:3100/parked  -> .../screenshots/parked.png
Server stopped.
```

Screenshots land in `.claude/skills/run-ai-trader-marketplace/screenshots/`.

Sub-commands (against a server you already started):

```bash
node .claude/skills/run-ai-trader-marketplace/driver.mjs smoke http://localhost:3000
node .claude/skills/run-ai-trader-marketplace/driver.mjs shot http://localhost:3000/ out.png
```

## Direct invocation — the analysis engine

Most engine work touches `lib/red-flags/*`; drive it without the web app via the
CLI (writes a text/markdown/json report to `./red-team-output/`) and the unit
tests:

```bash
npx tsx scripts/red-team-review.ts sample-backtest.csv --name "Sample Momentum v1"
npm test
```

## Run — human path

```bash
npm run start
```

Serves the production build on http://localhost:3000. Open it in a browser; this
path is for eyeballing, not automation. (`npm run dev` is the hot-reload variant.)
Stop with Ctrl-C.

## Gotchas

- **Old routes are parked, not deleted.** `next.config.ts` 307-redirects the old
  marketplace/admin/allocation/execution/portfolio/pricing/demo surfaces to
  `/parked`. The driver asserts this — a visit to `/marketplace` is *supposed* to
  land on `/parked`, not render a marketplace.
- **Driver uses port 3100**, not 3000, so it won't collide with a dev server you
  left running. Override with `PORT=<n>`.
- **No `chromium-cli` on Windows.** The driver shells out to Edge/Chrome directly
  with `--headless=new --screenshot=...` and a throwaway `--user-data-dir` (a real
  profile is often locked and the screenshot silently fails). If your browser is
  elsewhere, edit the `BROWSERS` array in `driver.mjs`.
- **Windows process tree.** `next start` spawns workers; the driver tears them
  down with `taskkill /pid <pid> /T /F`. A bare `kill` would orphan the port.
- **`scripts/` is excluded from the Next build** (see `tsconfig.json`), so the tsx
  CLI is never bundled into the web app.
- **`BUILD_EXIT=-1` in PowerShell** when you pipe `npm run build` through
  `Select-String` is a shell artifact (the pipeline eats the exit code); look for
  "✓ Compiled successfully", not the exit var.

## Troubleshooting

- `No .next build found. Run npm run build first.` → run `npm run build`.
- `No headless Chromium (Edge/Chrome) found.` → install Edge/Chrome, or add your
  binary path to the `BROWSERS` array in `driver.mjs`.
- `Server never became ready` → the build is stale or the port is taken; rebuild
  and/or set `PORT` to a free port.
