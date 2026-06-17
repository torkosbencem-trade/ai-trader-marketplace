import { NextResponse } from "next/server";
import {
  updateAllocationRequestStatus,
  type ReviewStatus,
} from "../../../../lib/platform-repository";
import { requireAdminRequest } from "../../../../lib/server-admin-guard";

function isValidStatus(value: unknown): value is ReviewStatus {
  return value === "Pending" || value === "Approved" || value === "Rejected";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
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

    const reviewer = admin.email ?? body.reviewer ?? "admin";

    const updated = await updateAllocationRequestStatus(
      id,
      body.status,
      reviewer,
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
        source: "repository",
        adminSource: admin.adminSource,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Invalid allocation review payload.",
      },
      {
        status: 400,
      }
    );
  }
}