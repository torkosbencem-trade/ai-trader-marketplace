import { NextResponse } from "next/server";
import {
  updateStoredSubmissionStatus,
  type ReviewStatus,
} from "../../../../../lib/platform-repository";

function isValidStatus(value: unknown): value is ReviewStatus {
  return value === "Pending" || value === "Approved" || value === "Rejected";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!isValidStatus(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status. Use Pending, Approved or Rejected.",
        },
        {
          status: 400,
        }
      );
    }

    const updated = await updateStoredSubmissionStatus(
      id,
      body.status,
      body.reviewer ?? "demo-admin",
      body.reason ?? null
    );

    return NextResponse.json({
      success: true,
      message: `Submission ${id} updated to ${body.status}.`,
      data: {
        id,
        status: body.status,
        reviewer: body.reviewer ?? "demo-admin",
        reason: body.reason ?? null,
        persisted: Boolean(updated),
        updatedAt: new Date().toISOString(),
      },
      meta: {
        workflow: "admin-review",
        source: "file-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid admin review payload.",
      },
      {
        status: 400,
      }
    );
  }
}