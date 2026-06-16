import { NextResponse } from "next/server";
import { apiStrategies } from "../../../lib/platform-api-data";

export async function GET() {
  return NextResponse.json({
    data: apiStrategies,
    meta: {
      count: apiStrategies.length,
      source: "mock-api",
      timestamp: new Date().toISOString(),
    },
  });
}