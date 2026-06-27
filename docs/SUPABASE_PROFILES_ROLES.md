# Supabase Profiles and Roles

The project now includes a platform profile layer.

Database table:

profiles

Columns:

- id
- email
- role
- display_name
- created_at
- updated_at

Role values:

- investor
- creator
- admin

Routes:

- /profile
- /api/auth/profile

Security note:

This phase uses a server API route and Supabase service role on the server to upsert and read profiles after validating the user bearer token with Supabase Auth.

Route protection is still not enabled yet.