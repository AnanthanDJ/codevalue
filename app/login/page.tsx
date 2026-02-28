"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"engineer" | "org">("engineer");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/onboard?role=${role}`,
      },
    });
    if (!error) setSent(true);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            Code<span className="text-violet-400">Value</span>
          </h1>
          <p className="text-gray-400">Sign in to get started</p>
        </div>

        {sent ? (
          <div className="bg-gray-900 border border-violet-700 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-gray-400 text-sm">
              We sent a magic link to <span className="text-white">{email}</span>
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
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

            <label className="block text-sm text-gray-400 mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />

            <button
              onClick={handleLogin}
              disabled={loading || !email}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold transition"
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
