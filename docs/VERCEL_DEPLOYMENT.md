AI Trader Marketplace - Vercel Deployment Notes

This project can be deployed as a controlled online demo.

Current state:
- Full local MVP workflow works.
- File-store is still active.
- Production database is not connected yet.
- Production authentication is not connected yet.
- Live trading is blocked.

Recommended local commands:
npm install
npm run dev
npm run build

Recommended Vercel commands:
npm install -g vercel
vercel login
vercel
vercel --prod

Important:
Do not connect real broker accounts or handle real capital before database, auth, compliance, security and monitoring are complete.