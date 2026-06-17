import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase-server";

export type AdminProfile = {
  id: string;
  email: string | null;
  role: string | null;
  status: string | null;
};

export type AdminGuardResult =
  | {
      ok: true;
      user: User;
      profile: AdminProfile | null;
      email: string | null;
      adminSource: "email-whitelist" | "profile-role";
    }
  | {
      ok: false;
      status: 401 | 403 | 500;
      error: string;
    };

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

export async function requireAdminRequest(
  request: Request
): Promise<AdminGuardResult> {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return {
        ok: false,
        status: 401,
        error: "Missing bearer token.",
      };
    }

    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return {
        ok: false,
        status: 401,
        error: "Invalid auth session.",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,email,role,status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (profile?.status === "suspended" || profile?.status === "restricted") {
      return {
        ok: false,
        status: 403,
        error: "Admin access denied: profile is not active.",
      };
    }

    if (isAdminEmail(user.email)) {
      return {
        ok: true,
        user,
        profile,
        email: user.email ?? null,
        adminSource: "email-whitelist",
      };
    }

    if (profile?.role === "admin") {
      return {
        ok: true,
        user,
        profile,
        email: user.email ?? profile.email ?? null,
        adminSource: "profile-role",
      };
    }

    return {
      ok: false,
      status: 403,
      error: "Admin access required.",
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error:
        error instanceof Error
          ? error.message
          : "Admin authorization check failed.",
    };
  }
}