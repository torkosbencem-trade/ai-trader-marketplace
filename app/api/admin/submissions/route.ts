import { NextResponse } from "next/server";
import { apiSubmissions } from "../../../../lib/platform-api-data";

export async function GET() {
  const pending = apiSubmissions.filter((item) => item.status === "Pending").length;
  const approved = apiSubmissions.filter((item) => item.status === "Approved").length;
  const rejected = apiSubmissions.filter((item) => item.status === "Rejected").length;

  return NextResponse.json({
    data: apiSubmissions,
    meta: {
      count: apiSubmissions.length,
      pending,
      approved,
      rejected,
      source: "mock-api",
      timestamp: new Date().toISOString(),
    },
  });
}