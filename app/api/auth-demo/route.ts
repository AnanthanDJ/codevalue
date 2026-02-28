import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, role, name } = await req.json();

    // Get or create auth user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let user = users.find((u) => u.email === email);

    if (!user) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (error) throw error;
      user = data.user;
    }

    if (!user) throw new Error("Could not create user");

    // Upsert profile
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (!existingProfile && name) {
      await supabaseAdmin.from("profiles").insert({ id: user.id, role, name });
    }

    // Create session directly
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      user_id: user.id,  
    });

    if (sessionError) throw sessionError;

    const profileRole = existingProfile?.role ?? role;
    const redirect = profileRole === "org" ? "/org/dashboard" : "/dashboard";

    return NextResponse.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      redirect,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
