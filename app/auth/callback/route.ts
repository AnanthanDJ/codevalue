import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      // Existing user
      if (profile) {
        return NextResponse.redirect(new URL("/go", req.url));
      }

      // New user
      return NextResponse.redirect(new URL("/onboard", req.url));
    }
  }

  return NextResponse.redirect(new URL("/login", req.url));
}
