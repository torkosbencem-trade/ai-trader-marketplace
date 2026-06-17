import { NextResponse } from "next/server";
import { listStrategySubmissions } from "../../../../lib/platform-repository";
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

  const submissions = await listStrategySubmissions();

  const pending = submissions.filter((item) => item.status === "Pending").length;
  const approved = submissions.filter((item) => item.status === "Approved").length;
  const rejected = submissions.filter((item) => item.status === "Rejected").length;

  return NextResponse.json({
    data: submissions,
    meta: {
      count: submissions.length,
      pending,
      approved,
      rejected,
      source: "repository",
      adminSource: admin.adminSource,
      timestamp: new Date().toISOString(),
    },
  });
}