import { NextResponse } from "next/server";
import { listAuditEvents } from "../../../lib/platform-repository";

export async function GET() {
  const events = await listAuditEvents();

  return NextResponse.json({
    data: events,
    meta: {
      count: events.length,
      source: "file-store",
      timestamp: new Date().toISOString(),
    },
  });
}