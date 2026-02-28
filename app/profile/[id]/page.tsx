"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Engineer } from "@/lib/store";

export default function ProfilePage() {
  const { id } = useParams();
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setEngineer(d.engineer);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading profile...</p>
      </main>
    );
  }

  if (!engineer) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-red-400">Engineer not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link href="/" className="text-violet-400 text-sm underline mb-8 inline-block">
          ← Back to Scanner
        </Link>

        {/* Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-violet-700 flex items-center justify-center text-2xl font-bold">
              {engineer.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{engineer.name}</h1>
              <p className="text-gray-400 text-sm">Verified Outcome Engineer</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-violet-400">{engineer.claimed.length}</div>
              <div className="text-gray-400 text-xs mt-1">Active Claims</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{engineer.resolved.length}</div>
              <div className="text-gray-400 text-xs mt-1">Resolved</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {engineer.resolved.length > 0 ? engineer.totalEarnings : "$0"}
              </div>
              <div className="text-gray-400 text-xs mt-1">Total Earned</div>
            </div>
          </div>
        </div>

        {/* Active Claims */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-200">Active Claims</h2>
          {engineer.claimed.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-500 text-sm text-center">
              No active claims yet. Go scan a repo and claim a finding.
            </div>
          ) : (
            <div className="space-y-3">
              {engineer.claimed.map((f) => (
                <div key={f.id} className="bg-gray-900 border border-violet-800 rounded-2xl p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{f.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{f.file}</p>
                    </div>
                    <span className="text-violet-400 font-bold">{f.estimatedEarnings}/mo</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full">
                      In Progress
                    </span>
                    <span className="text-gray-500 text-xs">{f.estimatedImpact}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">Resolved & Earning</h2>
          {engineer.resolved.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-500 text-sm text-center">
              No resolved findings yet. This is where your verified impact will show.
            </div>
          ) : (
            <div className="space-y-3">
              {engineer.resolved.map((f) => (
                <div key={f.id} className="bg-gray-900 border border-green-800 rounded-2xl p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{f.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{f.file}</p>
                    </div>
                    <span className="text-green-400 font-bold">{f.estimatedEarnings}/mo</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">
                      ✓ Verified & Earning
                    </span>
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
