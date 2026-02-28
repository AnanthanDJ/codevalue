"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OnboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<"engineer" | "org">("engineer");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      role,
      name,
    });

    router.push(role === "org" ? "/org/onboard" : "/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-1">Welcome aboard</h2>
        <p className="text-gray-400 text-sm mb-6">Tell us who you are</p>

        {/* Role selector */}
        <div className="flex rounded-xl overflow-hidden border border-gray-700 mb-6">
          <button
            onClick={() => setRole("engineer")}
            className={`flex-1 py-3 text-sm font-medium transition ${
              role === "engineer"
                ? "bg-violet-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            I'm an Engineer
          </button>
          <button
            onClick={() => setRole("org")}
            className={`flex-1 py-3 text-sm font-medium transition ${
              role === "org"
                ? "bg-violet-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            I'm an Organisation
          </button>
        </div>

        <label className="block text-sm text-gray-400 mb-2">
          {role === "org" ? "Organisation name" : "Your name"}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={role === "org" ? "Acme Inc." : "Alice Chen"}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !name}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold transition"
        >
          {loading ? "Setting up..." : "Continue"}
        </button>
      </div>
    </main>
  );
}
