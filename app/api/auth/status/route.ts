import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      anonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      adminEmailsConfigured: Boolean(process.env.ADMIN_EMAILS),
      storageProvider: process.env.STORAGE_PROVIDER ?? "file-store",
      authMode: "supabase-client-auth-phase-1",
      profileRoles: "admin-email-whitelist",
      routeProtection: "not-enabled-yet",
      middlewareEnabled: false,
      timestamp: new Date().toISOString(),
    },
  });
}