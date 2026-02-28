"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"engineer" | "org">("engineer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignUp() {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Signup failed");

      await fetch("/api/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.user.id, role, name }),
      });

      window.location.href = role === "org" ? "/org/onboard" : "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      window.location.href = profile?.role === "org" ? "/org/dashboard" : "/dashboard";
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
          <p className="text-gray-400">Talent allocation without recruitment</p>
        </div>

        <div className="flex rounded-xl overflow-hidden border border-gray-700 mb-6">
          <button
            onClick={() => { setTab("signin"); setError(""); }}
            className={`flex-1 py-3 text-sm font-medium transition ${tab === "signin" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("signup"); setError(""); }}
            className={`flex-1 py-3 text-sm font-medium transition ${tab === "signup" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Sign Up
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-4">
          {tab === "signup" && (
            <>
              <div className="flex rounded-xl overflow-hidden border border-gray-700">
                <button
                  onClick={() => setRole("engineer")}
                  className={`flex-1 py-2.5 text-sm font-medium transition ${role === "engineer" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}
                >
                  Engineer
                </button>
                <button
                  onClick={() => setRole("org")}
                  className={`flex-1 py-2.5 text-sm font-medium transition ${role === "org" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}
                >
                  Organisation
                </button>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {role === "org" ? "Organisation name" : "Your name"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === "org" ? "Acme Inc." : "Alice Chen"}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </>
          )}

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
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (tab === "signin" ? handleSignIn() : handleSignUp())}
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={tab === "signin" ? handleSignIn : handleSignUp}
            disabled={loading || !email || !password || (tab === "signup" && !name)}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold transition"
          >
            {loading ? "Please wait..." : tab === "signin" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </main>
  );
}
