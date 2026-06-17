import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import {
  getRiskCompatibility,
  normalizeUserRiskProfile,
} from "../../../../lib/risk-compatibility";
import { resolveStrategyRisk } from "../../../../lib/strategy-risk-resolver";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const strategyId = url.searchParams.get("strategyId");

    if (!strategyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing strategyId.",
        },
        {
          status: 400,
        }
      );
    }

    const resolvedStrategy = await resolveStrategyRisk(strategyId);

    if (!resolvedStrategy) {
      return NextResponse.json(
        {
          success: false,
          error: "Strategy not found or not approved.",
        },
        {
          status: 404,
        }
      );
    }

    const token = getBearerToken(request);
    let profile = null;
    let userRiskProfile = "not_set";

    if (token) {
      const supabase = createSupabaseServerClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(token);

      if (!userError && user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id,email,role,risk_profile,onboarding_completed,verification_level")
          .eq("id", user.id)
          .maybeSingle();

        profile = profileData;
        userRiskProfile = normalizeUserRiskProfile(profileData?.risk_profile);
      }
    }

    const compatibility = getRiskCompatibility(
      userRiskProfile,
      resolvedStrategy.risk
    );

    return NextResponse.json({
      success: true,
      data: {
        strategy: resolvedStrategy,
        profile,
        compatibility,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Risk compatibility check failed.",
      },
      {
        status: 500,
      }
    );
  }
}