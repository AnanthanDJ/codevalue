"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function GoPage() {
  const router = useRouter();

  useEffect(() => {
    async function go() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile) { router.push("/onboard"); return; }

      if (profile.role === "org") {
        const { data: org } = await supabase
          .from("orgs")
          .select("id")
          .eq("user_id", user.id)
          .single();

        router.push(org ? "/org/dashboard" : "/org/onboard");
      } else {
        router.push("/dashboard");
      }
    }
    go();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-500 animate-pulse">Redirecting...</p>
    </main>
  );
}
