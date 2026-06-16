import { NextResponse } from "next/server";
import { apiPortfolio } from "../../../lib/platform-api-data";

export async function GET() {
  return NextResponse.json({
    data: apiPortfolio,
    meta: {
      source: "mock-api",
      timestamp: new Date().toISOString(),
    },
  });
}