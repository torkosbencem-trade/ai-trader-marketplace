import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      score: 75,
      status: "demo-ready",
      productionTradingReady: false,
      checks: [
        {
          label: "Next.js app",
          status: true,
          detail: "Application structure is available.",
        },
        {
          label: "Demo workflow",
          status: true,
          detail: "Strategy, marketplace, allocation, execution and portfolio flow are working locally.",
        },
        {
          label: "File-store",
          status: true,
          detail: "Local JSON storage is active for MVP demo.",
        },
        {
          label: "Production database",
          status: false,
          detail: "Supabase, Neon or PostgreSQL is still required.",
        },
        {
          label: "Production auth",
          status: false,
          detail: "Secure authentication is still required before real users.",
        },
        {
          label: "Live broker execution",
          status: false,
          detail: "Live broker trading is not connected and should remain blocked.",
        },
      ],
      warnings: [
        "This is an online demo preparation layer, not a live trading system.",
        "Do not use local JSON file-store for production persistence.",
        "Do not connect live broker execution before database, auth, security and compliance are complete."
      ],
      timestamp: new Date().toISOString(),
    },
  });
}