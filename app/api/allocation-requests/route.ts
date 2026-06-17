import { NextResponse } from "next/server";
import {
  addAllocationRequest,
  listAllocationRequests,
} from "../../../lib/platform-repository";
import { getStrategy } from "../../../lib/strategies";
import { createSupabaseServerClient } from "../../../lib/supabase-server";
import {
  getRiskCompatibility,
  normalizeStrategyRiskLevel,
  normalizeUserRiskProfile,
} from "../../../lib/risk-compatibility";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

async function getUserRiskProfile(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      profile: null,
      riskProfile: "not_set",
    };
  }

  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return {
      profile: null,
      riskProfile: "not_set",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,role,risk_profile,onboarding_completed,verification_level")
    .eq("id", user.id)
    .maybeSingle();

  return {
    profile,
    riskProfile: normalizeUserRiskProfile(profile?.risk_profile),
  };
}

export async function GET() {
  const requests = await listAllocationRequests();

  return NextResponse.json({
    data: requests,
    meta: {
      count: requests.length,
      pending: requests.filter((request) => request.status === "Pending").length,
      approved: requests.filter((request) => request.status === "Approved").length,
      rejected: requests.filter((request) => request.status === "Rejected").length,
      source: "repository",
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

    const strategy = getStrategy(body.strategyId);
    const strategyRiskLevel = normalizeStrategyRiskLevel(strategy?.risk);
    const { profile, riskProfile } = await getUserRiskProfile(request);

    const compatibility = getRiskCompatibility(riskProfile, strategyRiskLevel);

    if (compatibility.tone === "danger") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Allocation request blocked by Risk Firewall: strategy risk is not aligned with your risk profile.",
          data: {
            compatibility,
            profile,
            strategy: strategy
              ? {
                  id: strategy.id,
                  name: strategy.name,
                  risk: strategyRiskLevel,
                }
              : null,
          },
        },
        {
          status: 403,
        }
      );
    }

    const warningNote =
      compatibility.tone === "warn"
        ? `[Risk Compatibility Warning: ${compatibility.label}] ${compatibility.allocationGuidance}`
        : null;

    const userNotes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    const notes = [warningNote, userNotes].filter(Boolean).join("\n\n") || null;

    const allocationRequest = await addAllocationRequest({
      strategyId: body.strategyId,
      strategyName: body.strategyName,
      investorEmail: body.investorEmail,
      requestedCapital,
      riskAcknowledgement: body.riskAcknowledgement,
      timeHorizon: body.timeHorizon ?? "6-12 months",
      notes,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          compatibility.tone === "warn"
            ? "Allocation request submitted with risk compatibility warning."
            : "Allocation access request submitted for review.",
        data: allocationRequest,
        meta: {
          workflow: "allocation-request",
          source: "repository",
          riskCompatibility: compatibility,
          profile,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Invalid allocation request payload.",
      },
      {
        status: 400,
      }
    );
  }
}