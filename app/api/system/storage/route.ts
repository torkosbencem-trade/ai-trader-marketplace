import { NextResponse } from "next/server";
import { getRepositoryStatus } from "../../../../lib/platform-repository";

export async function GET() {
  const status = await getRepositoryStatus();

  return NextResponse.json({
    data: status,
    meta: {
      workflow: "storage-readiness",
      source: "repository-layer",
      timestamp: new Date().toISOString(),
    },
  });
}