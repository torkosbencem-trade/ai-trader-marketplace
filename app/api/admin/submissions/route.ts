import { NextResponse } from "next/server";
import { apiSubmissions } from "../../../../lib/platform-api-data";
import { requireAdminRequest } from "../../../../lib/server-admin-guard";

export async function GET(request: Request) {
  const admin = await requireAdminRequest(request);

  if (!admin.ok) {
    return NextResponse.json(
      {
        success: false,
        error: admin.error,
      },
      {
        status: admin.status,
      }
    );
  }

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
      adminSource: admin.adminSource,
      timestamp: new Date().toISOString(),
    },
  });
}