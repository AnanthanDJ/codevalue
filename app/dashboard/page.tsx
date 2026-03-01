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
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [claimStatuses, setClaimStatuses] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [submissionNotes, setSubmissionNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .limit(1);

      const prof = profiles?.[0] ?? null;
      if (!prof) { router.push("/login"); return; }
      if (prof.role === "org") { router.push("/org/dashboard"); return; }
      setProfile(prof);

      const { data: myClaims } = await supabase
        .from("claims")
        .select("finding_id, status")
        .eq("engineer_id", user.id);

      if (myClaims) {
        setClaimedIds(myClaims.map((c: any) => c.finding_id));
        const statusMap: Record<string, string> = {};
        myClaims.forEach((c: any) => { statusMap[c.finding_id] = c.status; });
        setClaimStatuses(statusMap);
      }

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
    const metric = metrics[findingId];
    if (!metric?.trim()) {
      setError("Please describe the metric you will measure before claiming.");
      return;
    }
    setClaiming(findingId);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: claimError } = await supabase.from("claims").insert({
        finding_id: findingId,
        engineer_id: user.id,
        org_acknowledged: false,
        agreed_metric: metric.trim(),
        status: "pending",
      });

      if (claimError) throw claimError;

      await supabase
        .from("findings")
        .update({ status: "claimed" })
        .eq("id", findingId);

      setClaimedIds((prev) => [...prev, findingId]);
      setClaimStatuses((prev) => ({ ...prev, [findingId]: "pending" }));
      setFindings((prev) =>
        prev.map((f) => f.id === findingId ? { ...f, status: "claimed" } : f)
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClaiming(null);
    }
  }

  async function handleSubmit(findingId: string) {
    const notes = submissionNotes[findingId];
    if (!notes?.trim()) {
      setError("Please describe what you fixed before submitting.");
      return;
    }
    setSubmitting(findingId);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("claims")
        .update({ status: "submitted", submission_notes: notes.trim() })
        .eq("finding_id", findingId)
        .eq("engineer_id", user.id);

      if (error) throw error;
      setClaimStatuses(prev => ({ ...prev, [findingId]: "submitted" }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(null);
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

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Code<span className="text-violet-400">Value</span></h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back, {profile?.name}</p>
          </div>
          <div className="flex items-center gap-3">
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
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-300 mb-6">
            {error}
          </div>
        )}

        {findings.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-lg font-semibold text-white mb-2">No open opportunities yet</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Organisations are being onboarded. The moment a repo is scanned, findings will appear here automatically — no job posting needed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-200">
              {findings.filter(f => f.status === "open").length} Open Opportunities
            </h2>
            {findings.map((f) => {
              const isClaimed = claimedIds.includes(f.id);
              const claimStatus = claimStatuses[f.id];
              return (
                <div
                  key={f.id}
                  className={`bg-gray-900 border rounded-2xl p-6 transition ${
                    isClaimed ? "border-violet-700" : "border-gray-800 hover:border-violet-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
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
                      <div className="text-gray-400 text-xs">Est. impact</div>
                      <div className="text-violet-400 font-bold text-sm">{f.estimated_earnings}/mo</div>
                      <div className="text-gray-600 text-xs">Actual pay set by org audit</div>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mb-3">{f.description}</p>

                  <div className="bg-gray-800 rounded-xl px-4 py-2 text-sm text-gray-300 mb-4">
                    📈 <span className="text-white font-medium">Impact:</span> {f.estimated_impact}
                  </div>

                  {/* Not yet claimed */}
                  {!isClaimed && (
                    <>
                      <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-1">
                          What metric will you measure to prove impact? <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={metrics[f.id] ?? ""}
                          onChange={(e) => setMetrics(prev => ({ ...prev, [f.id]: e.target.value }))}
                          placeholder="e.g. API response time drops from 800ms to under 200ms"
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs font-mono truncate max-w-xs">{f.file}</span>
                        <button
                          onClick={() => handleClaim(f.id)}
                          disabled={claiming === f.id}
                          className="bg-violet-700 hover:bg-violet-600 disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-medium transition"
                        >
                          {claiming === f.id ? "Claiming..." : "Claim This"}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Claimed — awaiting org acknowledgement */}
                  {isClaimed && claimStatus === "pending" && (
                    <div className="border-t border-gray-800 pt-4 space-y-3">
                      <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full">
                        ⏳ Awaiting Org Acknowledgement
                      </span>
                      <p className="text-gray-500 text-xs">
                        Once the org acknowledges your claim, you can begin work and submit your fix.
                      </p>
                    </div>
                  )}

                  {/* Acknowledged — ready to submit fix */}
                  {isClaimed && claimStatus === "acknowledged" && (
                    <div className="border-t border-gray-800 pt-4 space-y-3">
                      <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">
                        ✓ Org Acknowledged — Submit your fix when ready
                      </span>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Describe what you fixed <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={submissionNotes[f.id] ?? ""}
                          onChange={(e) => setSubmissionNotes(prev => ({ ...prev, [f.id]: e.target.value }))}
                          placeholder="e.g. Replaced N+1 query with a single JOIN, reducing DB calls from 200 to 1 per request. PR #42 merged."
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                          rows={3}
                        />
                      </div>
                      <button
                        onClick={() => handleSubmit(f.id)}
                        disabled={submitting === f.id}
                        className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-medium transition"
                      >
                        {submitting === f.id ? "Submitting..." : "Submit Fix for Audit →"}
                      </button>
                    </div>
                  )}

                  {/* Submitted — awaiting audit */}
                  {isClaimed && claimStatus === "submitted" && (
                    <div className="border-t border-gray-800 pt-4">
                      <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                        📋 Fix Submitted — Awaiting Org Audit
                      </span>
                      <p className="text-gray-500 text-xs mt-2">
                        The org will audit your fix and declare the verified monthly savings. Your revenue share will be calculated from their declared amount.
                      </p>
                    </div>
                  )}

                  {/* Verified — earning */}
                  {isClaimed && claimStatus === "verified" && (
                    <div className="border-t border-gray-800 pt-4">
                      <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">
                        ✓ Verified — Check your profile for earnings
                      </span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
