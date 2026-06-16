# Production Readiness Notes

Current platform state:

- Full MVP workflow works locally.
- Strategy Builder parses uploaded CSV/JSON backtest evidence.
- Admin can review strategy submissions.
- Approved strategies appear in Marketplace.
- Investors can request allocation access.
- Admin can approve allocation requests.
- Execution Center prepares deployment packages.
- Portfolio page shows saved deployments.
- Audit log records operational actions.
- Repository layer prepares the app for database migration.

Current demo-only limitations:

- Local JSON file-store is still active.
- Authentication is not production-grade.
- Role middleware is currently disabled for stability.
- No real broker API is connected.
- No real trading execution exists.
- No real capital should be handled.
- No compliance/legal layer is implemented.
- No production monitoring is configured.

Recommended next steps:

1. Prepare Vercel deployment.
2. Add Supabase or Neon PostgreSQL.
3. Replace file-store adapter with database adapter.
4. Add production authentication.
5. Add role-based API protection.
6. Add legal/compliance disclaimers.
7. Add broker sandbox integration.
8. Build mobile investor MVP after stable backend.