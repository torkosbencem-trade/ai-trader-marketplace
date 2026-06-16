import { NextResponse } from "next/server";
import {
  updateAllocationRequestStatus,
  type ReviewStatus,
} from "../../../../lib/platform-repository";

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

    const updated = await updateAllocationRequestStatus(
      id,
      body.status,
      body.reviewer ?? "execution-reviewer",
      body.reason ?? null
    );

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: "Allocation request not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Allocation request ${id} updated to ${body.status}.`,
      data: updated,
      meta: {
        workflow: "allocation-review",
        source: "file-store",
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid allocation review payload.",
      },
      {
        status: 400,
      }
    );
  }
}