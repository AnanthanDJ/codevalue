"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"engineer" | "org">("engineer");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 async function handleContinue() {
  setLoading(true);
  setError("");
  try {
    const res = await fetch("/api/auth-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role, name }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    // Set session directly in the client
    const { createBrowserClient } = await import("@supabase/ssr");
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.setSession({
      access_token: json.access_token,
      refresh_token: json.refresh_token,
    });

    window.location.href = json.redirect;
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Code<span className="text-violet-400">Value</span></h1>
          <p className="text-gray-400">Enter your email to continue</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Name (for new accounts)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or org name"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex rounded-xl overflow-hidden border border-gray-700">
            <button
              onClick={() => setRole("engineer")}
              className={`flex-1 py-3 text-sm font-medium transition ${role === "engineer" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Engineer
            </button>
            <button
              onClick={() => setRole("org")}
              className={`flex-1 py-3 text-sm font-medium transition ${role === "org" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Organisation
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleContinue}
            disabled={loading || !email}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold transition"
          >
            {loading ? "Please wait..." : "Continue →"}
          </button>
        </div>
      </div>
    </main>
  );
}
