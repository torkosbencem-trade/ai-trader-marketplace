# Database Migration Plan

The current platform uses local JSON file-store for fast MVP development.

Current file-store collections:

- data/strategy-submissions.json
- data/allocation-requests.json
- data/deployments.json
- data/audit-log.json

Recommended production tables:

1. users
2. strategy_submissions
3. allocation_requests
4. deployments
5. audit_events
6. subscriptions
7. broker_connections

Recommended provider:

- Supabase PostgreSQL for fastest MVP
- Neon PostgreSQL for lightweight serverless Postgres
- Managed PostgreSQL for later production hardening

Next steps:

1. Add database schema.
2. Add repository database adapter.
3. Move API routes from file-store adapter to database adapter.
4. Add authentication.
5. Add role-based authorization.
6. Add production audit/event retention policy.