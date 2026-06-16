# Security and Production Notes

Current MVP security state:

- Demo auth is not production-grade.
- Middleware role protection is currently disabled for UI stability.
- File-store is used for local MVP storage.
- No real broker API is connected.
- No live trading is enabled.

Before real users:

1. Add production authentication.
2. Store users and roles in database.
3. Protect API routes server-side.
4. Add database persistence.
5. Add audit retention rules.
6. Add rate limiting.
7. Add monitoring and error tracking.
8. Add legal and compliance documentation.
9. Start broker integration in sandbox mode only.

Before live trading:

1. Complete legal review.
2. Complete compliance review.
3. Add broker sandbox testing.
4. Add real-time risk controls.
5. Add kill switch.
6. Add account-level drawdown limits.
7. Add incident response process.
8. Add secure secret management.