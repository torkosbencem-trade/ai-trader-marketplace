import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";

type UserRole = "investor" | "creator" | "admin";

const publicRoles: UserRole[] = ["investor", "creator"];

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

    const role = resolveRole(user.email, body.role ?? user.user_metadata?.role);

    const displayName =
      typeof body.displayName === "string" && body.displayName.trim()
        ? body.displayName.trim()
        : typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : user.email ?? "AI Trader User";

    const row = {
      id: user.id,
      email: user.email ?? body.email ?? "unknown",
      role,
      display_name: displayName,
      updated_at: new Date().toISOString(),
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