"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Claim = {
  id: string;
  org_acknowledged: boolean;
  created_at: string;
  engineer_id: string;
  agreed_metric?: string;
  findings: {
    id: string;
    title: string;
    category: string;
    description: string;
    estimated_earnings: string;
    estimated_impact: string;
    file: string;
    difficulty: string;
    status: string;
  };
  profiles: {
    id: string;
    name: string;
  };
};

type Finding = {
  id: string;
  title: string;
  category: string;
  status: string;
  estimated_earnings: string;
  difficulty: string;
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

function platformCut(earnings: string) {
  const num = parseInt(earnings.replace(/\D/g, "")) || 0;
  const engineerCut = Math.round(num * 0.8);
  const platformFee = Math.round(num * 0.2);
  return { engineerCut, platformFee };
}

export default function OrgDashboard() {
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .limit(1);

        const profile = profiles?.[0] ?? null;
        if (!profile) { setLoading(false); return; }
        if (profile.role !== "org") { router.push("/dashboard"); return; }

        const { data: orgs } = await supabase
          .from("orgs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const orgRow = orgs?.[0] ?? null;
        if (!orgRow) { setLoading(false); return; }
        setOrg(orgRow);

        const { data: findingsData } = await supabase
          .from("findings")
          .select("*")
          .eq("org_id", orgRow.id)
          .order("created_at", { ascending: false });

        setFindings(findingsData ?? []);

        const ids = (findingsData ?? []).map((f: any) => f.id);
        if (ids.length > 0) {
          const { data: claimsData } = await supabase
            .from("claims")
            .select(`
              id,
              org_acknowledged,
              created_at,
              engineer_id,
              agreed_metric,
              findings (
                id, title, category, description,
                estimated_earnings, estimated_impact,
                file, difficulty, status
              ),
              profiles (
                id, name
              )
            `)
            .in("finding_id", ids)
            .order("created_at", { ascending: false });

          setClaims((claimsData as any) ?? []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleAcknowledge(claimId: string) {
    setAcknowledging(claimId);
    setError("");
    try {
      const { error: ackError } = await supabase
        .from("claims")
        .update({ org_acknowledged: true })
        .eq("id", claimId);
      if (ackError) throw ackError;
      setClaims((prev) =>
        prev.map((c) => c.id === claimId ? { ...c, org_acknowledged: true } : c)
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAcknowledging(null);
    }
  }

  async function handleResolve(claimId: string, findingId: string) {
    setResolving(claimId);
    setError("");
    try {
      const { error: resolveError } = await supabase
        .from("findings")
        .update({ status: "resolved" })
        .eq("id", findingId);
      if (resolveError) throw resolveError;

      setFindings((prev) =>
        prev.map((f) => f.id === findingId ? { ...f, status: "resolved" } : f)
      );
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? { ...c, findings: { ...c.findings, status: "resolved" } }
            : c
        )
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResolving(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading dashboard...</p>
      </main>
    );
  }

  if (!org) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold mb-2">No repo connected yet</h2>
          <p className="text-gray-400 text-sm mb-8">
            Connect your repository to start finding inefficiencies your team never knew existed.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={handleLogout} className="text-gray-500 text-sm underline">Log out</button>
            <Link href="/org/onboard" className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl text-sm font-semibold transition">
              Connect Repository →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const openFindings = findings.filter((f) => f.status === "open");
  const claimedFindings = findings.filter((f) => f.status === "claimed");
  const resolvedFindings = findings.filter((f) => f.status === "resolved");
  const pendingClaims = claims.filter((c) => !c.org_acknowledged);
  const acknowledgedClaims = claims.filter((c) => c.org_acknowledged && c.findings.status !== "resolved");
  const resolvedClaims = claims.filter((c) => c.findings.status === "resolved");

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">Code<span className="text-violet-400">Value</span></h1>
            <p className="text-gray-400 text-sm">{org.name} — Org Dashboard</p>
            <p className="text-gray-600 text-xs font-mono mt-1">{org.repo_url}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/org/onboard" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm transition">
              + Connect Repo
            </Link>
            <button onClick={handleLogout} className="bg-gray-800 hover:bg-red-900 px-4 py-2 rounded-xl text-sm transition text-gray-400 hover:text-red-300">
              Log out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-300 mb-6">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-violet-400">{openFindings.length}</div>
            <div className="text-gray-400 text-xs mt-1">Open Findings</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{claimedFindings.length}</div>
            <div className="text-gray-400 text-xs mt-1">In Progress</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{resolvedFindings.length}</div>
            <div className="text-gray-400 text-xs mt-1">Resolved</div>
          </div>
        </div>

        {/* Pending Acknowledgements */}
        {pendingClaims.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-3 text-yellow-400">⏳ Pending Acknowledgement ({pendingClaims.length})</h2>
            <p className="text-gray-500 text-sm mb-4">
              An engineer has claimed a finding. Acknowledge to unlock full details and begin work. By acknowledging, you agree to compensate the engineer based on verified impact.
            </p>
            <div className="space-y-4">
              {pendingClaims.map((c) => {
                const { engineerCut, platformFee } = platformCut(c.findings.estimated_earnings);
                return (
                  <div key={c.id} className="bg-gray-900 border border-yellow-700 rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[c.findings.category] ?? "bg-gray-700 text-gray-300"}`}>
                            {c.findings.category}
                          </span>
                          <span className={`text-xs ${DIFFICULTY_COLORS[c.findings.difficulty] ?? "text-gray-400"}`}>
                            {c.findings.difficulty}
                          </span>
                        </div>
                        <h3 className="text-white font-semibold">{c.findings.title}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-violet-400 font-bold">{c.findings.estimated_earnings}/mo</div>
                        <div className="text-gray-500 text-xs">Engineer: ${engineerCut} · Platform: ${platformFee}</div>
                      </div>
                    </div>

                    {/* Staged reveal — blurred */}
                    <div className="relative mb-4">
                      <div className="bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 blur-sm select-none">
                        {c.findings.description}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
                          🔒 Acknowledge to reveal full details
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Link href={`/profile/${c.profiles?.id}`} className="text-violet-400 text-sm underline">
                        View Engineer: {c.profiles?.name}
                      </Link>
                      <button
                        onClick={() => handleAcknowledge(c.id)}
                        disabled={acknowledging === c.id}
                        className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-medium transition"
                      >
                        {acknowledging === c.id ? "Acknowledging..." : "Acknowledge Claim"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acknowledged & In Progress */}
        {acknowledgedClaims.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-3 text-green-400">✓ Acknowledged & In Progress ({acknowledgedClaims.length})</h2>
            <div className="space-y-4">
              {acknowledgedClaims.map((c) => {
                const { engineerCut, platformFee } = platformCut(c.findings.estimated_earnings);
                return (
                  <div key={c.id} className="bg-gray-900 border border-green-800 rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[c.findings.category] ?? "bg-gray-700 text-gray-300"}`}>
                          {c.findings.category}
                        </span>
                        <h3 className="text-white font-semibold mt-1">{c.findings.title}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-violet-400 font-bold">{c.findings.estimated_earnings}/mo</div>
                        <div className="text-gray-500 text-xs">Engineer: ${engineerCut} · Platform: ${platformFee}</div>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{c.findings.description}</p>
                    <div className="bg-gray-800 rounded-xl px-4 py-2 text-sm text-gray-300 mb-3">
                      📈 <span className="text-white font-medium">Impact:</span> {c.findings.estimated_impact}
                    </div>
                    {c.agreed_metric && (
                      <div className="bg-gray-800 rounded-xl px-4 py-2 text-sm text-gray-300 mb-3">
                        📊 <span className="text-white font-medium">Agreed metric:</span> {c.agreed_metric}
                      </div>
                    )}
                    <p className="text-gray-600 text-xs font-mono mb-4">{c.findings.file}</p>
                    <div className="flex items-center justify-between">
                      <Link href={`/profile/${c.profiles?.id}`} className="text-violet-400 text-sm underline">
                        Engineer: {c.profiles?.name} →
                      </Link>
                      <button
                        onClick={() => handleResolve(c.id, c.findings.id)}
                        disabled={resolving === c.id}
                        className="bg-green-700 hover:bg-green-600 disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-medium transition"
                      >
                        {resolving === c.id ? "Resolving..." : "✓ Mark as Resolved"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolved */}
        {resolvedClaims.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-3 text-violet-400">💰 Resolved & Paying ({resolvedClaims.length})</h2>
            <div className="space-y-3">
              {resolvedClaims.map((c) => {
                const { engineerCut, platformFee } = platformCut(c.findings.estimated_earnings);
                return (
                  <div key={c.id} className="bg-gray-900 border border-violet-800 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[c.findings.category] ?? "bg-gray-700 text-gray-300"}`}>
                        {c.findings.category}
                      </span>
                      <h3 className="text-white font-medium mt-1">{c.findings.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">Engineer: {c.profiles?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-violet-400 font-bold">{c.findings.estimated_earnings}/mo</div>
                      <div className="text-gray-500 text-xs">Eng: ${engineerCut} · Platform: ${platformFee}</div>
                      <span className="text-xs text-green-400">● Active</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Findings */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">All Findings</h2>
          {findings.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-500 text-sm text-center">
              No findings yet. Connect a repo to generate findings.
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((f) => (
                <div key={f.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[f.category] ?? "bg-gray-700 text-gray-300"}`}>
                        {f.category}
                      </span>
                      <span className={`text-xs ${DIFFICULTY_COLORS[f.difficulty] ?? "text-gray-400"}`}>
                        {f.difficulty}
                      </span>
                    </div>
                    <h3 className="text-white font-medium">{f.title}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-violet-400 font-bold">{f.estimated_earnings}/mo</div>
                    <div className={`text-xs mt-0.5 ${
                      f.status === "open" ? "text-gray-500" :
                      f.status === "claimed" ? "text-yellow-400" :
                      "text-green-400"
                    }`}>
                      {f.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
