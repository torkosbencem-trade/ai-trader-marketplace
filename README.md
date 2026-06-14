# AI Trader Marketplace

AI Trader Marketplace is a local full-stack trading strategy validation cockpit.

The current system is designed for:

* discovering and reviewing AI trading strategies
* displaying live-style marketplace signals
* running controlled validation/test runs
* monitoring shadow-live simulated trades
* submitting protected dry-run execution attempts
* logging execution audit events
* checking backend and frontend safety before any future testnet work

## Current safety status

The project is currently locked to a dry-run validation phase.

```txt
Real orders: disabled
Execution mode: DRY_RUN_ONLY
Binance mainnet execution: disabled
real_order_sent: must remain false
```

Do not enable real-order execution without a separate audited execution layer, testnet-only credentials, and explicit safety review.

## Project folders

```txt
Frontend:
C:\ai-trader-marketplace

Backend:
C:\trading-bot
```

## Main local URLs

```txt
Frontend:
http://localhost:3000

Backend health:
http://127.0.0.1:8000/health
```

## Environment files

Frontend local environment file:

```txt
C:\ai-trader-marketplace\.env.local
```

Recommended backend-only mode:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=false
```

Frontend example file:

```txt
C:\ai-trader-marketplace\.env.example
```

Backend example file:

```txt
C:\trading-bot\.env.example
```

Backend safety defaults:

```env
ALLOW_REAL_ORDERS=false
DRY_RUN_ONLY=true
EXCHANGE_MODE=DRY_RUN_ONLY
BINANCE_TESTNET_ENABLED=false
BINANCE_BASE_URL=
BINANCE_API_KEY=
BINANCE_API_SECRET=
MAX_ORDER_USDT=25
MAX_RISK_PERCENT=1
EMERGENCY_STOP=false
```

Never commit real `.env` files or API secrets.

## Start full stack

Starts the backend and frontend in separate PowerShell windows.

```powershell
cd C:\ai-trader-marketplace
.\start-full-stack.ps1
```

## Stop full stack

Stops processes running on the default frontend and backend ports.

```powershell
cd C:\ai-trader-marketplace
.\stop-full-stack.ps1
```

Default checked ports:

```txt
3000
8000
```

Dry-run mode:

```powershell
.\stop-full-stack.ps1 -DryRun
```

## Restart full stack

Stops existing services and starts the full-stack system again.

```powershell
cd C:\ai-trader-marketplace
.\restart-full-stack.ps1
```

Restart and run project checks:

```powershell
.\restart-full-stack.ps1 -Check -WaitSeconds 20
```

## Developer console

Interactive local development menu.

```powershell
cd C:\ai-trader-marketplace
.\dev-console.ps1
```

Useful menu options:

```txt
1. Start full stack
2. Stop full stack
3. Restart full stack
4. Restart full stack + project check
5. Run project check
6. Run project check env-only
7. Run frontend/backend smoke test only
8. Run backend safety suite
9. Run backend safety suite env-only
10. Open project URLs
```

## Manual backend start

```powershell
cd C:\trading-bot
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

## Manual frontend start

```powershell
cd C:\ai-trader-marketplace
npm run dev
```

## Full-stack smoke test

Checks backend JSON endpoints and frontend routes.

```powershell
cd C:\ai-trader-marketplace
.\check-full-stack.ps1
```

Expected successful result:

```txt
Failed: 0
[OK] Full-stack smoke test passed.
```

## Project-level check

Runs the backend safety suite and the full-stack smoke test.

```powershell
cd C:\ai-trader-marketplace
.\check-project.ps1
```

Backend env/static-only check without running the full stack:

```powershell
.\check-project.ps1 -EnvOnly
```

## Frontend routes

```txt
/
Marketplace homepage

/dashboard
Control center and system status

/signals
Signal review page

/live-signals
Alias route to /signals

/performance
Performance intelligence and validation metrics

/test-runs
Controlled strategy validation runs

/shadow-live
Simulated live monitoring

/execution
Protected dry-run order testing

/execution-audit
Dry-run execution audit log

/system
Backend health and safety status

/subscription
Access tiers and upgrade UI

/strategies/[slug]
Strategy detail page
```

## Backend endpoints

Main backend endpoints currently used by the frontend:

```txt
GET  /health
GET  /stats

GET  /marketplace/strategies
GET  /marketplace/signals
GET  /marketplace/performance

GET  /test-runs
GET  /test-runs/performance
POST /test-runs/start
POST /test-runs/end

GET  /shadow-live/trades
GET  /shadow-live/logs
GET  /shadow-live/performance
GET  /shadow-live/config
POST /shadow-live/config
POST /shadow-live/evaluate

GET  /execution/status
POST /execution/dry-run-order
GET  /execution/audit

POST /tv-webhook
POST /webhook
POST /close_trade
```

## Backend demo data

Run from the backend folder:

```powershell
cd C:\trading-bot
.\.venv\Scripts\Activate.ps1
```

Seed demo data:

```powershell
python seed_demo_data.py
```

Repair missing demo tables:

```powershell
python repair_demo_tables.py
```

Audit backend endpoints:

```powershell
python check_backend_endpoints.py
```

## Backend safety scripts

Run from the backend folder:

```powershell
cd C:\trading-bot
.\.venv\Scripts\Activate.ps1
```

### Safety preflight

Checks environment and backend runtime safety.

```powershell
python safety_preflight.py
```

Env-only mode:

```powershell
python safety_preflight.py --env-only
```

### Execution safety audit

Checks that the dry-run order endpoint:

* accepts safe dry-run orders
* blocks oversized orders
* blocks invalid sides
* blocks missing symbols
* never returns `real_order_sent=true`

```powershell
python check_execution_safety.py
```

### Static safety code audit

Scans backend code for dangerous live/mainnet/real-order patterns.

```powershell
python static_safety_code_audit.py
```

Public Binance market-data URLs may appear as warnings, but real-order/mainnet execution patterns should never pass as safe.

### Backend safety suite

Runs the backend safety checks together.

```powershell
python run_safety_suite.py
```

Env/static-only mode:

```powershell
python run_safety_suite.py --env-only
```

Expected successful result:

```txt
[OK] Backend safety suite passed.
```

## Execution safety architecture

Current execution safety modules:

```txt
execution_safety_gate.py
Central order safety validation module.

execution_audit_log.py
SQLite audit logger for accepted and blocked dry-run order attempts.

check_execution_safety.py
Endpoint-level execution safety test.

safety_preflight.py
Runtime and environment safety preflight.

static_safety_code_audit.py
Static scan for dangerous real-order/mainnet patterns.

run_safety_suite.py
Runs the backend safety checks together.
```

Dry-run order flow:

```txt
Frontend Execution page
        ↓
POST /execution/dry-run-order
        ↓
execution_safety_gate.py
        ↓
accepted or blocked decision
        ↓
execution_audit_log.py
        ↓
GET /execution/audit
        ↓
Frontend Execution Audit page
```

Hard safety expectation:

```txt
real_order_sent=false
```

## Important frontend files

```txt
app/page.tsx
Marketplace homepage

app/dashboard/page.tsx
Control center

app/signals/page.tsx
Signals page

app/performance/page.tsx
Performance page

app/test-runs/page.tsx
Test runs page

app/shadow-live/page.tsx
Shadow Live page

app/execution/page.tsx
Dry-run execution page

app/execution-audit/page.tsx
Execution audit page

app/system/page.tsx
System health page

app/subscription/page.tsx
Subscription page

app/strategies/[slug]/page.tsx
Strategy detail page

components/AppShell.tsx
Main responsive navigation shell

components/ui/PremiumUI.tsx
Shared premium UI components

lib/api.ts
Frontend API layer

lib/demo-data.ts
Demo fallback data

lib/marketplace-utils.ts
Shared normalization and formatting utilities

app/globals.css
Global premium styling
```

## Important backend files

```txt
main.py
FastAPI backend

seed_demo_data.py
Seeds demo marketplace/test/shadow data

repair_demo_tables.py
Repairs missing SQLite demo tables

check_backend_endpoints.py
Backend endpoint audit

execution_safety_gate.py
Central execution safety gate

execution_audit_log.py
Execution order audit logger

safety_preflight.py
Runtime safety preflight

check_execution_safety.py
Dry-run execution endpoint audit

static_safety_code_audit.py
Static code safety audit

run_safety_suite.py
Backend safety suite runner
```

## Git checkpoints

Frontend commit example:

```powershell
cd C:\ai-trader-marketplace
git add .
git commit -m "Update project README"
```

Backend commit example:

```powershell
cd C:\trading-bot
git add .
git commit -m "Update backend safety tooling"
```

## Troubleshooting

### Frontend does not start

Clear the Next.js cache and restart:

```powershell
cd C:\ai-trader-marketplace
Remove-Item -Recurse -Force .next
npm run dev
```

### Backend does not start

Activate the backend virtual environment and start Uvicorn:

```powershell
cd C:\trading-bot
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

### Port already in use

Stop frontend/backend ports:

```powershell
cd C:\ai-trader-marketplace
.\stop-full-stack.ps1
```

### Full system check

With backend and frontend running:

```powershell
cd C:\ai-trader-marketplace
.\check-project.ps1
```

Without backend/frontend running:

```powershell
.\check-project.ps1 -EnvOnly
```

### Tailwind or CSS looks broken

Clear the Next.js cache:

```powershell
cd C:\ai-trader-marketplace
Remove-Item -Recurse -Force .next
npm run dev
```

### Audit log is empty

Submit a dry-run order:

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/execution/dry-run-order" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"symbol":"BTCUSDT","side":"BUY","notional_usdt":10,"source":"readme_test"}'
```

Then open:

```txt
http://localhost:3000/execution-audit
```

## Safety rule before future Binance Testnet work

Before any testnet preparation, run:

```powershell
cd C:\trading-bot
.\.venv\Scripts\Activate.ps1
python run_safety_suite.py
```

And from the frontend project:

```powershell
cd C:\ai-trader-marketplace
.\check-project.ps1
```

Both must pass before continuing.


## Execution Gateway Safety Architecture

The execution layer currently operates in protected dry-run mode only.

Accepted manual dry-run orders follow this path:

```txt
Frontend Execution UI
↓
POST /execution/dry-run-order
↓
execution_safety_gate.py
↓
execution_engine.py
↓
DryRunExchangeGateway
↓
execution_order_audit
```

Current safety guarantees:

```txt
DRY_RUN_ONLY=true
gateway=DRY_RUN_EXCHANGE_GATEWAY
real_order_sent=false
network_request_sent=false
binance_order_sent=false
audit_logging=true
```

Important backend endpoints:

```txt
GET  /execution/status
POST /execution/dry-run-order
GET  /execution/audit
GET  /execution/gateway-status
```

The `/execution/gateway-status` endpoint exists so the frontend System and Project Status pages can verify execution safety without submitting a new test order.

The backend safety suite validates:

```txt
safety_preflight.py
check_execution_safety.py
check_execution_gateway_status.py
static_safety_code_audit.py
```

Run the full backend safety suite with:

```powershell
cd C:\trading-bot
.\.venv\Scripts\Activate.ps1
python run_safety_suite.py --base-url http://127.0.0.1:8003
```

Frontend pages that display execution safety:

```txt
/execution
/execution-audit
/system
/project-status
```

Production rule: no Binance mainnet or real exchange order path may be enabled until the dry-run gateway, audit logging, static safety scan, and testnet-only execution layer are all validated separately.
