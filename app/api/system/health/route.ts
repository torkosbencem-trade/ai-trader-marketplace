import { NextResponse } from "next/server";
import { apiSystemHealth } from "../../../../lib/platform-api-data";

export async function GET() {
  return NextResponse.json({
    data: apiSystemHealth,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}