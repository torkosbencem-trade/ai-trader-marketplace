# AI Trader Marketplace

AI Trader Marketplace is an MVP prototype for a systematic trading strategy marketplace.

Current working workflow:

1. Strategy creator uploads CSV or JSON backtest evidence.
2. Parser extracts performance metrics.
3. Admin reviews and approves strategy submissions.
4. Approved strategies appear in the marketplace.
5. Investor requests allocation access.
6. Admin approves allocation requests.
7. Execution Center prepares deployment packages.
8. Portfolio page shows saved deployments.
9. Audit log records operational actions.
10. Storage readiness prepares the app for database migration.

Working modules:

- Landing page
- Demo Control Center
- Production Readiness
- Deployment Console
- Marketplace
- Strategy report pages
- Strategy Builder
- CSV/JSON parser
- Admin Review
- Allocation Requests
- Execution Center
- Portfolio
- Audit Log
- Storage Readiness
- Repository layer

Important limitation:

This is not a live trading system.

The current MVP must not execute live trades, connect to real broker accounts, handle real capital, or be used as a regulated financial product.

Production requires:

- PostgreSQL / Supabase / Neon database
- production authentication
- role-based API authorization
- broker sandbox integration first
- monitoring and error tracking
- legal, compliance and risk documentation

Local development:

npm install
npm run dev

Build check:

npm run build

Key pages:

/demo
/readiness
/deploy
/marketplace
/strategy-builder
/admin
/allocation-requests
/execution
/portfolio
/system/audit
/system/storage