import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role") ?? "engineer";

  if (code) {
    const supabase = await createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);

    // Check if profile already exists
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      // Existing user — skip onboarding
      if (profile) {
        return NextResponse.redirect(new URL("/go", req.url));
      }
    }

    // New user — go through onboarding
    return NextResponse.redirect(new URL(`/onboard?role=${role}`, req.url));
  }

  return NextResponse.redirect(new URL("/login", req.url));
}
