"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Claim = {
  id: string;
  org_acknowledged: boolean;
  created_at: string;
  findings: {
    id: string;
    title: string;
    category: string;
    estimated_earnings: string;
    estimated_impact: string;
    file: string;
    status: string;
    orgs: { name: string };
  };
};

type Profile = {
  id: string;
  name: string;
  role: string;
  created_at: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Performance: "bg-blue-100 text-blue-700",
  Automation: "bg-purple-100 text-purple-700",
  Security: "bg-red-100 text-red-700",
  "Code Quality": "bg-green-100 text-green-700",
};

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === id) setIsOwner(true);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (!prof) { setLoading(false); return; }
      setProfile(prof);

      const { data: claimsData } = await supabase
        .from("claims")
        .select(`
          id,
          org_acknowledged,
          created_at,
          findings (
            id, title, category, estimated_earnings,
            estimated_impact, file, status,
            orgs ( name )
          )
        `)
        .eq("engineer_id", id)
        .order("created_at", { ascending: false });

      setClaims((claimsData as any) ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading profile...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-red-400">Profile not found.</p>
      </main>
    );
  }

  const activeClaims = claims.filter((c) => c.findings.status === "claimed");
  const resolved = claims.filter((c) => c.findings.status === "resolved");

  const totalEarnings = resolved.reduce((sum, c) => {
    const num = parseInt(c.findings.estimated_earnings.replace(/\D/g, "")) || 0;
    return sum + num;
  }, 0);

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-2xl mx-auto">

        <Link
          href={isOwner ? "/dashboard" : "/"}
          className="text-violet-400 text-sm underline mb-8 inline-block"
        >
          ← {isOwner ? "Back to Dashboard" : "Back"}
        </Link>

        {/* Profile header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-violet-700 flex items-center justify-center text-2xl font-bold shrink-0">
              {profile.name?.[0] ?? "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-gray-400 text-sm">Verified Outcome Engineer</p>
              <p className="text-gray-600 text-xs mt-0.5">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-violet-400">{activeClaims.length}</div>
              <div className="text-gray-400 text-xs mt-1">Active Claims</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{resolved.length}</div>
              <div className="text-gray-400 text-xs mt-1">Resolved</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {totalEarnings > 0 ? `$${totalEarnings}` : "$0"}
              </div>
              <div className="text-gray-400 text-xs mt-1">Monthly Earning</div>
            </div>
          </div>
        </div>

        {/* Active Claims */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-200">Active Claims</h2>
          {activeClaims.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-500 text-sm text-center">
              No active claims yet.
            </div>
          ) : (
            <div className="space-y-3">
              {activeClaims.map((c) => (
                <div key={c.id} className="bg-gray-900 border border-violet-800 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${CATEGORY_COLORS[c.findings.category] ?? "bg-gray-700 text-gray-300"}`}>
                        {c.findings.category}
                      </span>
                      <h3 className="font-semibold text-white mt-1">{c.findings.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">🏢 {c.findings.orgs?.name}</p>
                    </div>
                    <span className="text-violet-400 font-bold shrink-0">{c.findings.estimated_earnings}/mo</span>
                  </div>
                  <p className="text-gray-500 text-xs font-mono mb-3">{c.findings.file}</p>
                  <div className="flex items-center gap-2">
                    {c.org_acknowledged ? (
                      <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">
                        ✓ Org Acknowledged — In Progress
                      </span>
                    ) : (
                      <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full">
                        ⏳ Awaiting Org Acknowledgement
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">Resolved & Earning</h2>
          {resolved.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-500 text-sm text-center">
              No resolved findings yet. This is where your verified impact will show.
            </div>
          ) : (
            <div className="space-y-3">
              {resolved.map((c) => (
                <div key={c.id} className="bg-gray-900 border border-green-800 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${CATEGORY_COLORS[c.findings.category] ?? "bg-gray-700 text-gray-300"}`}>
                        {c.findings.category}
                      </span>
                      <h3 className="font-semibold text-white mt-1">{c.findings.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">🏢 {c.findings.orgs?.name}</p>
                    </div>
                    <span className="text-green-400 font-bold shrink-0">{c.findings.estimated_earnings}/mo</span>
                  </div>
                  <p className="text-gray-500 text-xs font-mono mb-3">{c.findings.file}</p>
                  <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">
                    ✓ Verified & Earning
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
