# Demo Auth and Role Access

The platform now includes a local demo authentication layer.

Current roles:

- investor
- creator
- admin

Current implementation:

- localStorage stores the demo session.
- cookies store the active role for Next.js middleware.
- middleware protects selected routes by role.

Protected routes:

- /admin → admin
- /allocation-requests → admin
- /execution → admin
- /system → admin
- /strategy-builder → creator or admin
- /portfolio → investor or admin
- /allocation/[id] → investor or admin

Production replacement:

Use Supabase Auth, Auth.js, Clerk, or another secure identity provider.

Required production features:

1. Server-side sessions
2. Passwordless or password-based login
3. Role-based authorization in database
4. Protected API routes
5. Audit log actor identity from real user session
6. Organization / workspace support