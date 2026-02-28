import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, role, name } = await req.json();

    if (!email || !role || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let user = existingUsers?.users.find((u) => u.email === email);

    // Create auth user if doesn't exist
    if (!user) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createError) throw createError;
      user = newUser.user;
    }

    if (!user) throw new Error("Failed to create user");

    // Now create profile — user is guaranteed to exist in auth.users
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: user.id,
      role,
      name,
    });

    if (profileError) throw profileError;

    // Generate magic link for immediate sign in
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (linkError) throw linkError;

    return NextResponse.json({ success: true, magicLink: linkData.properties?.action_link });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
