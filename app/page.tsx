"use client";

import { useState } from "react";
import { Finding } from "@/lib/store";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  Performance: "bg-blue-100 text-blue-700",
  Automation: "bg-purple-100 text-purple-700",
  Security: "bg-red-100 text-red-700",
  "Code Quality": "bg-green-100 text-green-700",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-green-600",
  Medium: "text-yellow-600",
  Hard: "text-red-600",
};

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [claiming, setClaiminng] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);

  async function handleScan() {
    setLoading(true);
    setError("");
    setFindings([]);

    try {
      const scanRes = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      const scanData = await scanRes.json();
      if (scanData.error) throw new Error(scanData.error);

      await fetch("/api/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findings: scanData.findings }),
      });

      setFindings(scanData.findings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim(findingId: string) {
    setClaiminng(findingId);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId, engineerId: "alice" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClaimedIds((prev) => [...prev, findingId]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClaiminng(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Code<span className="text-violet-400">Value</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Engineers don't apply for work — they find broken things, fix them, and earn from the value they create.
          </p>
          <Link href="/profile/alice" className="text-violet-400 text-sm underline mt-2 inline-block">
            View Engineer Profile →
          </Link>
        </div>

        {/* Scan Input */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-800">
          <label className="block text-sm text-gray-400 mb-2">Public GitHub Repository URL</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={handleScan}
              disabled={loading || !repoUrl}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-6 py-3 rounded-xl text-sm font-semibold transition"
            >
              {loading ? "Scanning..." : "Scan Repo"}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-4 animate-pulse">⚙️</div>
            <p>Scanning codebase for inefficiencies...</p>
          </div>
        )}

        {/* Findings */}
        {findings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              {findings.length} Opportunities Found
            </h2>
            {findings.map((f) => {
              const isClaimed = claimedIds.includes(f.id);
              return (
                <div
                  key={f.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-violet-700 transition"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[f.category] ?? "bg-gray-700 text-gray-300"}`}>
                          {f.category}
                        </span>
                        <span className={`text-xs font-medium ${DIFFICULTY_COLORS[f.difficulty] ?? "text-gray-400"}`}>
                          {f.difficulty}
                        </span>
                      </div>
                      <h3 className="text-white font-semibold text-lg">{f.title}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-violet-400 font-bold text-lg">{f.estimatedEarnings}</div>
                      <div className="text-gray-500 text-xs">/ month</div>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mb-3">{f.description}</p>

                  <div className="bg-gray-800 rounded-xl px-4 py-2 text-sm text-gray-300 mb-4">
                    📈 <span className="text-white font-medium">Impact:</span> {f.estimatedImpact}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs font-mono">{f.file}</span>
                    {isClaimed ? (
                      <span className="text-green-400 text-sm font-semibold">✓ Claimed</span>
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
