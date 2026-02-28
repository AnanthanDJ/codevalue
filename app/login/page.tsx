"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"engineer" | "org">("engineer");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    setLoading(true);
    setError("");
    try {
      // Check if user exists in profiles
      const { data: { user }, error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (signInError) throw new Error("No account found with this email. Please sign up first.");

      // Poll for session since email confirm is off
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          clearInterval(interval);
          router.push("/go");
        }
        if (attempts > 10) clearInterval(interval);
      }, 500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    setLoading(true);
    setError("");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-12), // random password, magic link only
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Signup failed");

      // Create profile immediately
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        role,
        name,
      });

      if (profileError && profileError.code !== "23505") throw profileError;

      // Sign them in
      await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      // Wait for session
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          clearInterval(interval);
          router.push(role === "org" ? "/org/onboard" : "/dashboard");
        }
        if (attempts > 10) clearInterval(interval);
      }, 500);

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
          <h1 className="text-4xl font-bold mb-2">
            Code<span className="text-violet-400">Value</span>
          </h1>
          <p className="text-gray-400">Talent allocation without recruitment</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-700 mb-6">
          <button
            onClick={() => { setTab("signin"); setError(""); }}
            className={`flex-1 py-3 text-sm font-medium transition ${
              tab === "signin" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("signup"); setError(""); }}
            className={`flex-1 py-3 text-sm font-medium transition ${
              tab === "signup" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-4">

          {/* Sign Up extras */}
          {tab === "signup" && (
            <>
              <div className="flex rounded-xl overflow-hidden border border-gray-700">
                <button
                  onClick={() => setRole("engineer")}
                  className={`flex-1 py-3 text-sm font-medium transition ${
                    role === "engineer" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Engineer
                </button>
                <button
                  onClick={() => setRole("org")}
                  className={`flex-1 py-3 text-sm font-medium transition ${
                    role === "org" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
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
            <label className="block text-sm text-gray-400 mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (tab === "signin" ? handleSignIn() : handleSignUp())}
              placeholder="you@example.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={tab === "signin" ? handleSignIn : handleSignUp}
            disabled={loading || !email || (tab === "signup" && !name)}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold transition"
          >
            {loading ? "Please wait..." : tab === "signin" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </main>
  );
}
