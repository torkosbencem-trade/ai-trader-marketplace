# Admin Role Policy

Admin access is controlled by the server-side ADMIN_EMAILS environment variable.

Rules:

- Admin role cannot be trusted from the frontend.
- If a user email is listed in ADMIN_EMAILS, profile sync assigns admin.
- If a user email is not listed in ADMIN_EMAILS, requested admin role is ignored.
- Normal users can only become investor or creator.

Environment variable:

ADMIN_EMAILS=torkosbencem@gmail.com

Multiple admins can be comma-separated later:

ADMIN_EMAILS=owner@example.com,operator@example.com

Route protection is still not enabled yet. This phase protects role assignment, not page access.