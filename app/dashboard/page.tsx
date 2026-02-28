"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Finding = {
  id: string;
  title: string;
  category: string;
  description: string;
  estimated_impact: string;
  estimated_earnings: string;
  file: string;
  difficulty: string;
  status: string;
  orgs: { name: string; repo_url: string };
};

const CATEGORY_COLORS: Record<string, string> = {
  Performance: "bg-blue-100 text-blue-700",
  Automation: "bg-purple-100 text-purple-700",
  Security: "bg-red-100 text-red-700",
  "Code Quality": "bg-green-100 text-green-700",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

export default function DashboardPage() {
  const router = useRouter();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!prof) { router.push("/login"); return; }
      if (prof.role === "org") { router.push("/org/dashboard"); return; }
      setProfile(prof);

      // Load existing claims by this engineer
      const { data: myClaims } = await supabase
        .from("claims")
        .select("finding_id")
        .eq("engineer_id", user.id);

      if (myClaims) setClaimedIds(myClaims.map((c) => c.finding_id));

      // Load all open findings with org info
      const { data: openFindings } = await supabase
        .from("findings")
        .select("*, orgs(name, repo_url)")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      setFindings(openFindings ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
  await supabase.auth.signOut();
  router.push("/");
}


  async function handleClaim(findingId: string) {
    setClaiming(findingId);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: claimError } = await supabase.from("claims").insert({
        finding_id: findingId,
        engineer_id: user.id,
        org_acknowledged: false,
      });

      if (claimError) throw claimError;

      await supabase
        .from("findings")
        .update({ status: "claimed" })
        .eq("id", findingId);

      setClaimedIds((prev) => [...prev, findingId]);
      setFindings((prev) =>
        prev.map((f) => f.id === findingId ? { ...f, status: "claimed" } : f)
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClaiming(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading opportunities...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">
              Code<span className="text-violet-400">Value</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Welcome back, {profile?.name}
            </p>
          </div>
          <Link
            href={`/profile/${profile?.id}`}
            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm transition"
          >
            My Profile →
          </Link>
          <button
    onClick={handleLogout}
    className="bg-gray-800 hover:bg-red-900 px-4 py-2 rounded-xl text-sm transition text-gray-400 hover:text-red-300"
  >
    Log out
  </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-300 mb-6">
            {error}
          </div>
        )}

        {/* Findings */}
        {findings.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
            <div className="text-5xl mb-4">🔍</div>
            <p>No open opportunities right now.</p>
            <p className="text-sm mt-1">Check back soon as orgs onboard.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-200">
              {findings.filter(f => f.status === "open").length} Open Opportunities
            </h2>
            {findings.map((f) => {
              const isClaimed = claimedIds.includes(f.id);
              return (
                <div
                  key={f.id}
                  className={`bg-gray-900 border rounded-2xl p-6 transition ${
                    isClaimed ? "border-violet-700 opacity-75" : "border-gray-800 hover:border-violet-700"
                  }`}
                >
                  {/* Org badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                      🏢 {f.orgs?.name ?? "Unknown Org"}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[f.category] ?? "bg-gray-700 text-gray-300"}`}>
                      {f.category}
                    </span>
                    <span className={`text-xs font-medium ${DIFFICULTY_COLORS[f.difficulty] ?? "text-gray-400"}`}>
                      {f.difficulty}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-white font-semibold text-lg">{f.title}</h3>
                    <div className="text-right shrink-0">
                      <div className="text-violet-400 font-bold text-lg">{f.estimated_earnings}</div>
                      <div className="text-gray-500 text-xs">/ month</div>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mb-3">{f.description}</p>

                  <div className="bg-gray-800 rounded-xl px-4 py-2 text-sm text-gray-300 mb-4">
                    📈 <span className="text-white font-medium">Impact:</span> {f.estimated_impact}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs font-mono truncate max-w-xs">{f.file}</span>
                    {isClaimed ? (
                      <span className="text-violet-400 text-sm font-semibold">✓ Claimed — Awaiting Org</span>
                    ) : (
                      <button
                        onClick={() => handleClaim(f.id)}
                        disabled={claiming === f.id}
                        className="bg-violet-700 hover:bg-violet-600 disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-medium transition"
                      >
                        {claiming === f.id ? "Claiming..." : "Claim This"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
