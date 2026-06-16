# Supabase Auth Phase 1

This project now includes a Supabase Auth test layer.

Routes:

- /auth
- /api/auth/status

Current features:

- Supabase signup
- Supabase email/password signin
- Session detection
- Signout
- Role metadata stored at signup

Important:

Route protection is not enabled yet. Middleware previously caused UI instability, so this phase only validates auth.

Required environment variables:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STORAGE_PROVIDER=database

Production next steps:

1. Add server-side session client.
2. Add profile/roles table.
3. Add protected API routes.
4. Reintroduce middleware carefully.
5. Add organization/workspace support.