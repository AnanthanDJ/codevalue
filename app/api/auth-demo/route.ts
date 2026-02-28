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

    // Upsert profile — if exists keep it, if new create it
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile && name) {
      await supabaseAdmin.from("profiles").insert({ id: user.id, role, name });
    }

    // Generate magic link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });

    if (linkError) throw linkError;

    return NextResponse.json({ magicLink: linkData.properties?.action_link });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
