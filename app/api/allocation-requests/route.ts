import { NextResponse } from "next/server";
import {
  addAllocationRequest,
  listAllocationRequests,
} from "../../../lib/platform-repository";

export async function GET() {
  const requests = await listAllocationRequests();

  return NextResponse.json({
    data: requests,
    meta: {
      count: requests.length,
      pending: requests.filter((request) => request.status === "Pending").length,
      approved: requests.filter((request) => request.status === "Approved").length,
      rejected: requests.filter((request) => request.status === "Rejected").length,
      source: "file-store",
      timestamp: new Date().toISOString(),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.strategyId || !body.strategyName || !body.investorEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "strategyId, strategyName and investorEmail are required.",
        },
        {
          status: 400,
        }
      );
    }

    const requestedCapital = Number(body.requestedCapital ?? 0);

    if (!Number.isFinite(requestedCapital) || requestedCapital <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "requestedCapital must be a positive number.",
        },
        {
          status: 400,
        }
      );
    }

    if (body.riskAcknowledgement !== true) {
      return NextResponse.json(
        {
          success: false,
          error: "Risk acknowledgement is required.",
        },
        {
          status: 400,
        }
      );
    }

    const allocationRequest = await addAllocationRequest({
      strategyId: body.strategyId,
      strategyName: body.strategyName,
      investorEmail: body.investorEmail,
      requestedCapital,
      riskAcknowledgement: body.riskAcknowledgement,
      timeHorizon: body.timeHorizon ?? "6-12 months",
      notes: body.notes ?? null,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Allocation access request submitted for review.",
        data: allocationRequest,
        meta: {
          workflow: "allocation-request",
          source: "file-store",
        },
      },
      {
        status: 201,
      }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid allocation request payload.",
      },
      {
        status: 400,
      }
    );
  }
}