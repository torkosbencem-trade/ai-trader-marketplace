import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";

type UserRole = "investor" | "creator" | "admin";
type ProfileStatus = "pending" | "active" | "restricted" | "suspended";
type ProfilePlan = "free_demo" | "investor_pro" | "creator_pro" | "trader_pro" | "institution";
type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled";
type RiskProfile = "not_set" | "conservative" | "balanced" | "aggressive" | "professional";

const publicRoles: UserRole[] = ["investor", "creator"];

const validStatuses: ProfileStatus[] = [
  "pending",
  "active",
  "restricted",
  "suspended",
];

const validPlans: ProfilePlan[] = [
  "free_demo",
  "investor_pro",
  "creator_pro",
  "trader_pro",
  "institution",
];

const validSubscriptionStatuses: SubscriptionStatus[] = [
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled",
];

const validRiskProfiles: RiskProfile[] = [
  "not_set",
  "conservative",
  "balanced",
  "aggressive",
  "professional",
];

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.toLowerCase());
}

function normalizeRequestedRole(value: unknown): UserRole {
  return publicRoles.includes(value as UserRole) ? (value as UserRole) : "investor";
}

function resolveRole(email: string | null | undefined, requestedRole: unknown): UserRole {
  if (isAdminEmail(email)) {
    return "admin";
  }

  return normalizeRequestedRole(requestedRole);
}

function normalizeStatus(value: unknown, fallback: ProfileStatus): ProfileStatus {
  return validStatuses.includes(value as ProfileStatus)
    ? (value as ProfileStatus)
    : fallback;
}

function normalizePlan(value: unknown, role: UserRole, fallback: ProfilePlan): ProfilePlan {
  if (validPlans.includes(value as ProfilePlan)) {
    return value as ProfilePlan;
  }

  if (fallback) {
    return fallback;
  }

  if (role === "creator") {
    return "creator_pro";
  }

  if (role === "admin") {
    return "institution";
  }

  return "free_demo";
}

function normalizeSubscriptionStatus(
  value: unknown,
  fallback: SubscriptionStatus
): SubscriptionStatus {
  return validSubscriptionStatuses.includes(value as SubscriptionStatus)
    ? (value as SubscriptionStatus)
    : fallback;
}

function normalizeRiskProfile(value: unknown, fallback: RiskProfile): RiskProfile {
  return validRiskProfiles.includes(value as RiskProfile)
    ? (value as RiskProfile)
    : fallback;
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing bearer token.",
        },
        {
          status: 401,
        }
      );
    }

    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid auth session.",
        },
        {
          status: 401,
        }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data ?? null,
      meta: {
        userId: user.id,
        email: user.email,
        adminEmailMatched: isAdminEmail(user.email),
        source: "profiles",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Profile lookup failed.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing bearer token.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid auth session.",
        },
        {
          status: 401,
        }
      );
    }

    const { data: existingProfile, error: existingError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const role = resolveRole(
      user.email,
      body.role ?? existingProfile?.role ?? user.user_metadata?.role
    );

    const displayName =
      typeof body.displayName === "string" && body.displayName.trim()
        ? body.displayName.trim()
        : typeof existingProfile?.display_name === "string" && existingProfile.display_name
        ? existingProfile.display_name
        : typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : user.email ?? "AI Trader User";

    const status = normalizeStatus(body.status, existingProfile?.status ?? "active");
    const plan = normalizePlan(body.plan, role, existingProfile?.plan ?? (role === "admin" ? "institution" : "free_demo"));
    const subscriptionStatus = normalizeSubscriptionStatus(
      body.subscriptionStatus,
      existingProfile?.subscription_status ?? "none"
    );
    const riskProfile = normalizeRiskProfile(
      body.riskProfile,
      existingProfile?.risk_profile ?? "not_set"
    );

    const onboardingCompleted =
      typeof body.onboardingCompleted === "boolean"
        ? body.onboardingCompleted
        : Boolean(existingProfile?.onboarding_completed ?? false);

    const verificationLevel =
      typeof body.verificationLevel === "number" &&
      Number.isFinite(body.verificationLevel)
        ? Math.max(0, Math.min(5, Math.floor(body.verificationLevel)))
        : typeof existingProfile?.verification_level === "number"
        ? existingProfile.verification_level
        : role === "admin"
        ? 5
        : 0;

    const now = new Date().toISOString();

    const row = {
      id: user.id,
      email: user.email ?? body.email ?? existingProfile?.email ?? "unknown",
      role,
      display_name: displayName,
      status,
      plan,
      subscription_status: subscriptionStatus,
      risk_profile: riskProfile,
      onboarding_completed: onboardingCompleted,
      verification_level: verificationLevel,
      last_seen_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(row, {
        onConflict: "id",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Profile synced successfully.",
      data,
      meta: {
        adminEmailMatched: isAdminEmail(user.email),
        requestedRole: body.role ?? null,
        assignedRole: role,
        assignedPlan: plan,
        riskProfile,
        onboardingCompleted,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Profile sync failed.",
      },
      {
        status: 500,
      }
    );
  }
}