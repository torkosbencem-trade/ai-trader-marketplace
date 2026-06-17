import { NextResponse } from "next/server";
import {
  updateStoredSubmissionStatus,
  type ReviewStatus,
} from "../../../../../lib/platform-repository";
import { requireAdminRequest } from "../../../../../lib/server-admin-guard";

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

    const updated = await updateStoredSubmissionStatus(
      id,
      body.status,
      reviewer,
      body.reason ?? null
    );

    return NextResponse.json({
      success: true,
      message: `Submission ${id} updated to ${body.status}.`,
      data: {
        id,
        status: body.status,
        reviewer,
        reason: body.reason ?? null,
        persisted: Boolean(updated),
        updatedAt: new Date().toISOString(),
      },
      meta: {
        workflow: "admin-review",
        source: "repository",
        adminSource: admin.adminSource,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Invalid admin review payload.",
      },
      {
        status: 400,
      }
    );
  }
}